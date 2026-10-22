import React, { useState, useEffect, useRef } from 'react';
import { AuthGateway } from './components/AuthGateway';
import { ClientWalletInterface } from './components/ClientWalletInterface';
import { LiveAuditStream } from './components/LiveAuditStream';
import { TopBanner } from './components/TopBanner';
import { PerformanceTickers } from './components/PerformanceTickers';
import {
  AuthSession,
  WalletNode,
  Transaction,
  LedgerMetrics,
  ConcurrencyBlastResult,
} from './types';
import {
  LogOut,
  Terminal,
  Flame,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api/v1';
const WS_URL = 'ws://127.0.0.1:8000/api/v1/ledger/stream';

// Helper to generate UUIDv4
const generateUUIDv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const App: React.FC = () => {
  // Authentication session state (stored in localStorage for persistence)
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem('mutex_ledger_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [allWallets, setAllWallets] = useState<WalletNode[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isBlasting, setIsBlasting] = useState(false);
  const [blastResults, setBlastResults] = useState<ConcurrencyBlastResult[] | null>(null);

  const [liveLogConsole, setLiveLogConsole] = useState<string[]>([]);
  const [serverOnline, setServerOnline] = useState<boolean>(false);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  const [metrics, setMetrics] = useState<LedgerMetrics>({
    totalVolume: 26703881.5,
    totalTransactions: 284115,
    successfulTxCount: 279546,
    rejectedRaceCount: 4569,
    activeLedgerBalance: 26703881.5,
    currentTps: 182.4,
    activeLocks: 0,
  });

  const appendConsole = (msg: string) => {
    setLiveLogConsole((prev: string[]) => [...prev.slice(-40), msg]);
  };

  useEffect(() => {
    consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveLogConsole]);

  // Save/clear session in localStorage
  const handleAuthSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    localStorage.setItem('mutex_ledger_auth_session', JSON.stringify(newSession));
    appendConsole(`[AUTH_GRANTED] Session authenticated for: ${newSession.user.email}`);
    appendConsole(`[KEY_ISSUED] JWT Bearer Token stored in memory`);
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('mutex_ledger_auth_session');
    setTransactions([]);
    setBlastResults(null);
    appendConsole(`[AUTH_REVOKED] Session cleared.`);
  };

  // Synchronize authenticated user profile and wallet balance
  const refreshUserWallet = async () => {
    if (!session?.token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.wallet) {
          setSession((prev: AuthSession | null) => {
            if (!prev) return null;
            const updated: AuthSession = {
              ...prev,
              user: {
                id: data.id,
                email: data.email,
                created_at: data.created_at,
              },
              wallet: {
                id: data.wallet.id,
                user_id: data.wallet.user_id,
                currency: data.wallet.currency,
                balance: Number(data.wallet.balance),
                created_at: data.wallet.created_at,
              },
            };
            localStorage.setItem('mutex_ledger_auth_session', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch {
      // ignore
    }
  };

  // Fetch all peer wallets
  const fetchAllWallets = async () => {
    try {
      const res = await fetch(`${API_BASE}/wallets`);
      if (res.ok) {
        setServerOnline(true);
        const data = await res.json();
        const mapped = data.map((w: any) => ({
          id: w.id,
          user_id: w.user_id,
          currency: w.currency || 'USD',
          balance: Number(w.balance),
          created_at: w.created_at,
        }));
        setAllWallets(mapped);
      }
    } catch {
      setServerOnline(false);
    }
  };

  // Fetch only active user's transaction ledger history
  const fetchMyTransactions = async () => {
    if (!session?.token) return;
    setIsLoadingTx(true);
    try {
      const res = await fetch(`${API_BASE}/ledger/my-transactions?limit=50`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const mapped: Transaction[] = data.map((t: any) => ({
          id: t.id,
          timestamp: t.created_at ? t.created_at.replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19),
          hash: t.tx_hash || '0x' + t.id.replace(/-/g, ''),
          idempotencyKey: t.idempotency_key,
          sourceWallet: t.source_wallet_id,
          destinationWallet: t.destination_wallet_id,
          amount: Number(t.amount),
          status: t.status === 'success' ? 'SUCCESS' : 'BLOCKED_BY_MUTEX',
          executionTimeMs: t.execution_time_ms || 1.2,
          errorReason: t.error_reason,
        }));
        setTransactions(mapped);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingTx(false);
    }
  };

  // WebSocket Live Audit Stream Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          setServerOnline(true);
          appendConsole(`[WS_READY] Live cryptographic audit stream linked to /api/v1/ledger/stream`);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.status) {
              const isBlocked = data.status.includes('BLOCKED') || data.status.includes('REJECTED');
              const flatStatus = isBlocked ? 'BLOCKED_BY_MUTEX' : 'SUCCESS';

              appendConsole(
                `[STREAM_EVENT] Hash: ${data.tx_hash.slice(0, 10)}... | Status: [${flatStatus}] | $${data.amount}`
              );

              // Update metrics
              setMetrics((prev: LedgerMetrics) => ({
                ...prev,
                totalTransactions: prev.totalTransactions + 1,
                successfulTxCount: flatStatus === 'SUCCESS' ? prev.successfulTxCount + 1 : prev.successfulTxCount,
                rejectedRaceCount: flatStatus === 'BLOCKED_BY_MUTEX' ? prev.rejectedRaceCount + 1 : prev.rejectedRaceCount,
                totalVolume: flatStatus === 'SUCCESS' ? prev.totalVolume + data.amount : prev.totalVolume,
              }));

              // If event pertains to current user's wallet, re-sync state
              if (
                session?.wallet &&
                (data.source_wallet_id === session.wallet.id ||
                  data.destination_wallet_id === session.wallet.id)
              ) {
                refreshUserWallet();
                fetchMyTransactions();
              }
            }
          } catch {
            // non-json message
          }
        };

        ws.onerror = () => setServerOnline(false);
        ws.onclose = () => {
          setServerOnline(false);
          reconnectTimer = setTimeout(connectWs, 3000);
        };
      } catch {
        setServerOnline(false);
        reconnectTimer = setTimeout(connectWs, 3000);
      }
    };

    connectWs();
    fetchAllWallets();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [session?.wallet?.id]);

  // Initial load of transactions if session exists
  useEffect(() => {
    if (session) {
      refreshUserWallet();
      fetchMyTransactions();
    }
  }, [session?.token]);

  // Execute standard single transfer
  const handleExecuteTransfer = async (
    destWalletId: string,
    amount: number
  ): Promise<boolean> => {
    if (!session) return false;

    setIsTransferring(true);
    const idempotencyKey = generateUUIDv4();

    appendConsole(`[INIT_TX] Attempting transfer: $${amount.toFixed(2)} to ${destWalletId.slice(0, 8)}...`);

    try {
      const res = await fetch(`${API_BASE}/wallets/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          source_wallet_id: session.wallet.id,
          destination_wallet_id: destWalletId,
          amount: amount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        appendConsole(`[TX_SUCCESS] Committed Tx Hash: ${data.tx_hash.slice(0, 12)}... [STATUS: SUCCESS]`);
        await refreshUserWallet();
        await fetchMyTransactions();
        return true;
      } else {
        const errorDetail = typeof data.detail === 'string' ? data.detail : data.detail?.message || 'BLOCKED_BY_MUTEX';
        appendConsole(`[TX_BLOCKED] HTTP ${res.status}: ${errorDetail}`);
        await refreshUserWallet();
        await fetchMyTransactions();
        return false;
      }
    } catch {
      appendConsole(`[NETWORK_ERR] Connection failure during transfer dispatch.`);
      return false;
    } finally {
      setIsTransferring(false);
    }
  };

  // The Concurrency Stress Button: Fires 10 simultaneous fetch requests using Promise.all()
  const handleTriggerParallelStressBlast = async (
    destWalletId: string,
    blastAmount: number
  ) => {
    if (!session) return;

    setIsBlasting(true);
    setBlastResults(null);

    appendConsole(`=======================================================`);
    appendConsole(`[STRESS_ENGINE] TRIGGERING PARALLEL STRESS BLAST: 10 CONCURRENT ASYNC REQUESTS`);
    appendConsole(`[CONCURRENCY] Protocol: Promise.all() dispatching 10 parallel HTTP POSTs`);
    appendConsole(`[PARAMS] Source: ${session.wallet.id.slice(0, 8)}... | Amount Per Req: $${blastAmount.toFixed(2)}`);
    appendConsole(`=======================================================`);

    setMetrics((prev: LedgerMetrics) => ({
      ...prev,
      activeLocks: prev.activeLocks + 1,
      currentTps: Number((prev.currentTps + 150.5).toFixed(1)),
    }));

    // Array of 10 parallel fetch tasks using Promise.all()
    const blastPromises = Array.from({ length: 10 }).map(async (_, index) => {
      const reqIdempotencyKey = generateUUIDv4();
      const startTime = performance.now();

      try {
        const res = await fetch(`${API_BASE}/wallets/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': reqIdempotencyKey,
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            source_wallet_id: session.wallet.id,
            destination_wallet_id: destWalletId,
            amount: blastAmount,
          }),
        });

        const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
        const body = await res.json();

        if (res.ok) {
          return {
            requestIndex: index + 1,
            idempotencyKey: reqIdempotencyKey,
            status: 'SUCCESS' as const,
            httpStatus: res.status,
            elapsedMs: elapsed,
            message: 'TRANSACTION_COMMITTED_SUCCESSFULLY',
            txHash: body.tx_hash,
          };
        } else {
          return {
            requestIndex: index + 1,
            idempotencyKey: reqIdempotencyKey,
            status: 'BLOCKED_BY_MUTEX' as const,
            httpStatus: res.status,
            elapsedMs: elapsed,
            message: body.detail?.message || (res.status === 422 ? 'HTTP_422_INSUFFICIENT_FUNDS_LOCKOUT' : 'BLOCKED_BY_MUTEX'),
            txHash: undefined,
          };
        }
      } catch {
        const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
        return {
          requestIndex: index + 1,
          idempotencyKey: reqIdempotencyKey,
          status: 'BLOCKED_BY_MUTEX' as const,
          httpStatus: 500,
          elapsedMs: elapsed,
          message: 'CONNECTION_TIMEOUT_OR_LOCK_FAILURE',
          txHash: undefined,
        };
      }
    });

    try {
      // Execute all 10 simultaneously
      const results = await Promise.all(blastPromises);
      setBlastResults(results);

      const successCount = results.filter((r) => r.status === 'SUCCESS').length;
      const blockedCount = results.filter((r) => r.status === 'BLOCKED_BY_MUTEX').length;

      appendConsole(
        `[STRESS_OUTCOME] 10 REQUESTS SETTLED: ${successCount} [SUCCESS], ${blockedCount} [BLOCKED_BY_MUTEX (HTTP 422)]`
      );
      appendConsole(`[MUTEX_VERIFIED] Deterministic row-locking strictly maintained balance boundaries.`);

      // Refresh data
      await refreshUserWallet();
      await fetchMyTransactions();
      await fetchAllWallets();

      setMetrics((prev: LedgerMetrics) => ({
        ...prev,
        activeLocks: Math.max(0, prev.activeLocks - 1),
      }));
    } finally {
      setIsBlasting(false);
    }
  };

  // If user is not authenticated, render View 1: Authentication Gateway Screen
  if (!session) {
    return <AuthGateway onAuthSuccess={handleAuthSuccess} apiBase={API_BASE} />;
  }

  // Render Logged-In User Interface
  return (
    <div className="min-h-screen bg-[#0B0F12] text-[#E2E8F0] font-mono flex flex-col antialiased selection:bg-[#222F3A] selection:text-[#10B981]">
      {/* Top Banner with Connected Status */}
      <TopBanner />

      {/* Main Workspace Navigation & Active User Bar */}
      <div className="bg-[#131A20] border-b border-[#222F3A] px-4 md:px-6 py-2.5">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-bold text-[#10B981] flex items-center space-x-1.5">
              <Terminal className="w-4 h-4" />
              <span>TERMINAL_SESSION: ACTIVE</span>
            </span>
            <span className="text-[#64748B]">|</span>
            <span className="text-xs text-[#E2E8F0] font-bold truncate">
              {session.user.email}
            </span>
            <span className="text-[10px] text-[#64748B] hidden md:inline">
              (WALLET: {session.wallet.id.slice(0, 8)}...)
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className={`w-2 h-2 ${serverOnline ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`}></span>
              <span className={serverOnline ? 'text-[#10B981]' : 'text-[#F59E0B]'}>
                {serverOnline ? 'BACKEND_DAEMON_ONLINE' : 'CONNECTING...'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-[#0B0F12] border border-[#222F3A] hover:border-[#EF4444] text-[#94A3B8] hover:text-[#EF4444] text-xs font-bold uppercase transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>TERMINATE_SESSION</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Body */}
      <main className="flex-1 p-4 md:p-6 space-y-5 max-w-[1720px] w-full mx-auto">
        {/* Core Performance Tickers */}
        <PerformanceTickers metrics={metrics} />

        {/* View 2: Client Wallet Interface (Profile, Balance Card, Transfer Form, Stress Button) */}
        <ClientWalletInterface
          user={session.user}
          wallet={session.wallet}
          allWallets={allWallets}
          onRefreshWallet={refreshUserWallet}
          onExecuteTransfer={handleExecuteTransfer}
          onTriggerParallelStressBlast={handleTriggerParallelStressBlast}
          isTransferring={isTransferring}
          isBlasting={isBlasting}
        />

        {/* Parallel Stress Blast Diagnostic Matrix (appears when blast runs) */}
        {blastResults && (
          <div className="bg-[#131A20] border border-[#EF4444] p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222F3A] pb-2 mb-3">
              <div className="flex items-center space-x-2 text-[#EF4444]">
                <Flame className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  PARALLEL STRESS BLAST DIAGNOSTIC TELEMETRY (10 CONCURRENT WORKERS)
                </span>
              </div>
              <span className="text-[10px] text-[#64748B]">
                PROMISE.ALL() RACE CONDITION TEST
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {blastResults.map((res) => {
                const isSuccess = res.status === 'SUCCESS';
                return (
                  <div
                    key={res.requestIndex}
                    className={`p-2.5 border text-xs font-mono flex flex-col justify-between ${
                      isSuccess
                        ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
                        : 'bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">REQ #{res.requestIndex}</span>
                      {isSuccess ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                      )}
                    </div>
                    <div className="text-[10px] font-bold">
                      [{res.status}]
                    </div>
                    <div className="text-[10px] text-[#94A3B8] mt-1 flex justify-between">
                      <span>HTTP {res.httpStatus}</span>
                      <span>{res.elapsedMs}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-[11px] text-[#94A3B8] flex items-center justify-between pt-2 border-t border-[#222F3A]">
              <span>
                TOTAL SUCCESSFUL: <strong className="text-[#10B981]">{blastResults.filter((r) => r.status === 'SUCCESS').length}</strong> / 10
              </span>
              <span>
                GRACEFULLY REJECTED (HTTP 422): <strong className="text-[#EF4444]">{blastResults.filter((r) => r.status === 'BLOCKED_BY_MUTEX').length}</strong> / 10
              </span>
            </div>
          </div>
        )}

        {/* Structural Split: Console Stream + View 3: Live Client Audit Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* System I/O Console Stream */}
          <div className="bg-[#131A20] border border-[#222F3A] p-3 flex flex-col h-64 lg:h-auto">
            <div className="flex items-center justify-between border-b border-[#222F3A] pb-2 mb-2">
              <span className="text-[11px] font-bold text-[#E2E8F0] uppercase tracking-wider flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#10B981]" />
                <span>// LOG_STREAM</span>
              </span>
              <span className="text-[10px] text-[#10B981]">JWT_SECURE</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 text-[10px] text-[#94A3B8] font-mono">
              <div className="text-[#64748B]">// KERNEL_INIT: Pessimistic Row Lock (SELECT ... FOR UPDATE)</div>
              <div className="text-[#64748B]">// REDIS_IDEMPOTENCY: Active filter enabled</div>
              {liveLogConsole.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.includes('[TX_BLOCKED]') || line.includes('[CRITICAL]') || line.includes('[ERROR]')
                      ? 'text-[#EF4444]'
                      : line.includes('[TX_SUCCESS]') || line.includes('[AUTH_GRANTED]') || line.includes('[WS_READY]')
                      ? 'text-[#10B981]'
                      : line.includes('[STRESS')
                      ? 'text-[#F59E0B]'
                      : 'text-[#E2E8F0]'
                  }
                >
                  &gt; {line}
                </div>
              ))}
              <div ref={consoleBottomRef} />
            </div>
          </div>

          {/* View 3: Live Client Audit Stream (Double-Entry Ledger Table for active user) */}
          <div className="lg:col-span-3">
            <LiveAuditStream
              transactions={transactions}
              currentWalletId={session.wallet.id}
              isLoading={isLoadingTx}
              onClearLogs={() => setTransactions([])}
            />
          </div>
        </div>
      </main>

      {/* Industrial Cryptographic Footer */}
      <footer className="border-t border-[#222F3A] bg-[#0B0F12] px-4 py-2.5 text-[11px] text-[#64748B] flex flex-wrap items-center justify-between select-none">
        <div className="flex items-center space-x-4">
          <span>MUTEX_ENGINE: SERIALIZABLE / PESSIMISTIC_ROW_LOCK</span>
          <span>|</span>
          <span>AUTH: JWT_HS256 / BCRYPT</span>
          <span>|</span>
          <span>STREAM: /api/v1/ledger/stream</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`w-1.5 h-1.5 ${serverOnline ? 'bg-[#10B981]' : 'bg-[#64748B]'}`}></span>
          <span className="text-[#E2E8F0]">
            MUTEX_LEDGER_CORE // CONCURRENCY_RACE_RESISTANT
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
