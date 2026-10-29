import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthGateway } from './components/AuthGateway';
import { ClientWalletInterface } from './components/ClientWalletInterface';
import { TopBanner } from './components/TopBanner';
import { PerformanceTickers } from './components/PerformanceTickers';
import { ExchangeOrdersHistory } from './components/ExchangeOrdersHistory';
import { LandingPage } from './components/LandingPage';
import {
  AuthSession,
  WalletNode,
  Transaction,
} from './types';

const API_BASE = 'http://127.0.0.1:8000/api/v1';
const WS_URL = 'ws://127.0.0.1:8000/api/v1/ledger/stream';

const generateUUIDv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

/* ─── Dashboard (protected) ─── */
const Dashboard: React.FC<{
  session: AuthSession;
  onLogout: () => void;
}> = ({ session, onLogout }) => {
  const [allWallets, setAllWallets] = useState<WalletNode[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean>(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(
    () => localStorage.getItem('binance_balance_hidden') === 'true'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const refreshUserWallet = async () => {
    if (!session?.token) return;
    try {
      await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
    } catch { /* ignore */ }
  };

  const fetchAllWallets = async () => {
    try {
      const res = await fetch(`${API_BASE}/wallets`);
      if (res.ok) {
        setServerOnline(true);
        const data = await res.json();
        setAllWallets(data.map((w: any) => ({
          id: w.id,
          user_id: w.user_id,
          currency: w.currency || 'USD',
          balance: Number(w.balance),
          created_at: w.created_at,
        })));
      }
    } catch { setServerOnline(false); }
  };

  const fetchMyTransactions = async () => {
    if (!session?.token) return;
    setIsLoadingTx(true);
    try {
      const res = await fetch(`${API_BASE}/ledger/my-transactions?limit=50`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.map((t: any) => ({
          id: t.id,
          timestamp: t.created_at
            ? t.created_at.replace('T', ' ').slice(0, 19)
            : new Date().toISOString().replace('T', ' ').slice(0, 19),
          hash: t.tx_hash || '0x' + t.id.replace(/-/g, ''),
          idempotencyKey: t.idempotency_key,
          sourceWallet: t.source_wallet_id,
          destinationWallet: t.destination_wallet_id,
          amount: Number(t.amount),
          status: t.status === 'success' ? 'SUCCESS' : 'BLOCKED_BY_MUTEX',
          executionTimeMs: t.execution_time_ms || 1.2,
          errorReason: t.error_reason,
        })));
      }
    } catch { /* ignore */ }
    finally { setIsLoadingTx(false); }
  };

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket(WS_URL);
        ws.onopen = () => setServerOnline(true);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (
              data.status &&
              session?.wallet &&
              (data.source_wallet_id === session.wallet.id ||
                data.destination_wallet_id === session.wallet.id)
            ) {
              refreshUserWallet();
              fetchMyTransactions();
            }
          } catch { /* non-json */ }
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

  useEffect(() => {
    refreshUserWallet();
    fetchMyTransactions();
  }, [session?.token]);

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
          amount,
        }),
      });
      await refreshUserWallet();
      await fetchMyTransactions();
      return res.ok;
    } catch { return false; }
    finally { setIsTransferring(false); }
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      localStorage.setItem('binance_balance_hidden', String(next));
      return next;
    });
  };

  const totalSettledAmount = transactions
    .filter((tx) => tx.status === 'SUCCESS')
    .reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div className="min-h-screen bg-[#181A20] text-[#EAECEF] flex flex-col antialiased selection:bg-[#F0B90B] selection:text-[#0B0E11]">
      <TopBanner
        isBalanceHidden={isBalanceHidden}
        onToggleBalanceVisibility={toggleBalanceVisibility}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userEmail={session.user.email}
        onLogout={onLogout}
        serverOnline={serverOnline}
      />
      <main className="flex-1 p-3 md:p-6 space-y-4 max-w-[1720px] w-full mx-auto">
        <PerformanceTickers
          userBalance={Number(session.wallet.balance)}
          transactionsCount={transactions.length}
          totalSettledAmount={totalSettledAmount}
        />
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
        <ExchangeOrdersHistory
          transactions={transactions}
          currentWalletId={session.wallet.id}
          isLoading={isLoadingTx}
        />
      </main>
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
          <span className="text-[#EAECEF] font-medium">PesaFlip • Digital Asset Exchange</span>
        </div>
      </footer>
    </div>
  );
};

/* ─── Auth wrapper ─── */
const AuthRoute: React.FC<{
  session: AuthSession | null;
  onAuthSuccess: (s: AuthSession) => void;
}> = ({ session, onAuthSuccess }) => {
  const navigate = useNavigate();
  if (session) return <Navigate to="/app" replace />;
  return (
    <AuthGateway
      onAuthSuccess={(s) => { onAuthSuccess(s); navigate('/app'); }}
      apiBase={API_BASE}
    />
  );
};

/* ═══════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════ */
export const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem('pesaflip_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleAuthSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    localStorage.setItem('pesaflip_auth_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('pesaflip_auth_session');
  };

  return (
    <Routes>
      {/* Landing page — public default */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth — redirects to /app if already logged in */}
      <Route
        path="/auth"
        element={<AuthRoute session={session} onAuthSuccess={handleAuthSuccess} />}
      />

      {/* Dashboard — protected, redirects to /auth if not logged in */}
      <Route
        path="/app"
        element={
          session
            ? <Dashboard session={session} onLogout={handleLogout} />
            : <Navigate to="/auth" replace />
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
