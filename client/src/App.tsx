import React, { useState, useEffect } from 'react';
import { AuthGateway } from './components/AuthGateway';
import { ClientWalletInterface } from './components/ClientWalletInterface';
import { TopBanner } from './components/TopBanner';
import { PerformanceTickers } from './components/PerformanceTickers';
import { ExchangeOrdersHistory } from './components/ExchangeOrdersHistory';
import {
  AuthSession,
  WalletNode,
  Transaction,
} from './types';

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
  const [serverOnline, setServerOnline] = useState<boolean>(false);

  // Save/clear session in localStorage
  const handleAuthSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    localStorage.setItem('mutex_ledger_auth_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('mutex_ledger_auth_session');
    setTransactions([]);
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

  // Fetch all peer wallets for recipient selection
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
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.status) {
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

  // Execute standard single peer transfer
  const handleExecuteTransfer = async (
    destWalletId: string,
    amount: number
  ): Promise<boolean> => {
    if (!session) return false;

    setIsTransferring(true);
    const idempotencyKey = generateUUIDv4();

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

      if (res.ok) {
        await refreshUserWallet();
        await fetchMyTransactions();
        return true;
      } else {
        await refreshUserWallet();
        await fetchMyTransactions();
        return false;
      }
    } catch {
      return false;
    } finally {
      setIsTransferring(false);
    }
  };

  // Balance visibility toggle state
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    return localStorage.getItem('binance_balance_hidden') === 'true';
  });

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      localStorage.setItem('binance_balance_hidden', String(next));
      return next;
    });
  };

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Compute real metrics from user's live transactions
  const totalSettledAmount = transactions
    .filter((tx) => tx.status === 'SUCCESS')
    .reduce((acc, tx) => acc + tx.amount, 0);

  // If user is not authenticated, render Authentication Gateway Screen
  if (!session) {
    return <AuthGateway onAuthSuccess={handleAuthSuccess} apiBase={API_BASE} />;
  }

  // Render Logged-In Exchange Interface
  return (
    <div className="min-h-screen bg-[#181A20] text-[#EAECEF] flex flex-col antialiased selection:bg-[#F0B90B] selection:text-[#0B0E11]">
      {/* Top Binance Header Navigation with Search, Eye Toggle, Profile, Status */}
      <TopBanner
        isBalanceHidden={isBalanceHidden}
        onToggleBalanceVisibility={toggleBalanceVisibility}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userEmail={session.user.email}
        onLogout={handleLogout}
        serverOnline={serverOnline}
      />

      {/* Main Dashboard Body */}
      <main className="flex-1 p-3 md:p-6 space-y-4 max-w-[1720px] w-full mx-auto">
        {/* Dynamic Real Account Performance Tickers */}
        <PerformanceTickers
          userBalance={Number(session.wallet.balance)}
          transactionsCount={transactions.length}
          totalSettledAmount={totalSettledAmount}
        />

        {/* Client Wallet Interface (Balance Overview, Quick Actions, Assets, Clean Swap Transfer, Live Order Book) */}
        <ClientWalletInterface
          user={session.user}
          wallet={session.wallet}
          allWallets={allWallets}
          onRefreshWallet={refreshUserWallet}
          onExecuteTransfer={handleExecuteTransfer}
          isTransferring={isTransferring}
          isBalanceHidden={isBalanceHidden}
          searchFilter={searchQuery}
        />

        {/* Wide Tabular Component: Open Orders / Order History / Transaction History */}
        <ExchangeOrdersHistory
          transactions={transactions}
          currentWalletId={session.wallet.id}
          isLoading={isLoadingTx}
        />
      </main>

      {/* Binance Exchange Footer */}
      <footer className="border-t border-[#2B313A] bg-[#0B0E11] px-6 py-3.5 text-[11px] text-[#848E9C] flex flex-wrap items-center justify-between select-none">
        <div className="flex items-center space-x-4">
          <span>Real-time Custody Ledger</span>
          <span>•</span>
          <span>Tier 1 Security</span>
          <span>•</span>
          <span>Instant Liquidity Settlement</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`}></span>
          <span className="text-[#EAECEF] font-medium">
            MutexEx • Digital Asset Exchange
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
