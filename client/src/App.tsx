import React, { useState, useEffect, useRef } from 'react';
import { TopBanner } from './components/TopBanner';
import { PerformanceTickers } from './components/PerformanceTickers';
import { ConcurrencyPanel } from './components/ConcurrencyPanel';
import { DoubleEntryTable } from './components/DoubleEntryTable';
import { Transaction, LedgerMetrics } from './types';

// Helper to generate UUIDv4
const generateUUIDv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper for pseudo-SHA256 hash string
const generateHash = () => {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

const INITIAL_WALLETS = [
  { id: 'WLT-0x892aF410', name: 'TREASURY_ESCROW_PRIMARY', balance: 14850250.75 },
  { id: 'WLT-0x310cB912', name: 'SETTLEMENT_ROUTER_ALPHA', balance: 521400.00 },
  { id: 'WLT-0x762eA184', name: 'LIQUIDITY_HOT_RESERVE_B', balance: 8432190.50 },
  { id: 'WLT-0x994dF001', name: 'INSTITUTIONAL_CLEARING_C', balance: 2901240.25 },
];

export const App: React.FC = () => {
  const [wallets, setWallets] = useState(INITIAL_WALLETS);
  const [isExecuting, setIsExecuting] = useState(false);
  const [liveLogConsole, setLiveLogConsole] = useState<string[]>([]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Initial dummy seed transactions
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-1001',
      timestamp: '2026-10-19 17:34:02.102',
      hash: '0x3bf92c4b8e219001b9ca92e8fa29811400e9981a293bcf91280918cba9283712',
      idempotencyKey: '9e7381b2-c74b-4bfa-9f88-46c5a610f441',
      sourceWallet: 'WLT-0x892aF410',
      destinationWallet: 'WLT-0x310cB912',
      amount: 12500.00,
      status: 'SUCCESS',
      executionTimeMs: 4.2,
      threadId: 1,
      blockHeight: 1849204,
    },
    {
      id: 'tx-1002',
      timestamp: '2026-10-19 17:34:02.102',
      hash: '0x7e29918230bca928371190bc192840019283bca92147102947190bcdae110293',
      idempotencyKey: '281b3c99-4d32-4148-bc19-119283a009fb',
      sourceWallet: 'WLT-0x892aF410',
      destinationWallet: 'WLT-0x310cB912',
      amount: 12500.00,
      status: 'REJECTED_RACE_CONDITION',
      executionTimeMs: 1.1,
      threadId: 2,
      blockHeight: 1849204,
    },
    {
      id: 'tx-1003',
      timestamp: '2026-10-19 17:34:02.103',
      hash: '0xa1984029410cbba9218390bc1284918204918203940192384019283049182039',
      idempotencyKey: '7c99210e-8841-45bc-8910-fe3910c229a1',
      sourceWallet: 'WLT-0x892aF410',
      destinationWallet: 'WLT-0x310cB912',
      amount: 12500.00,
      status: 'REJECTED_RACE_CONDITION',
      executionTimeMs: 0.9,
      threadId: 3,
      blockHeight: 1849204,
    },
    {
      id: 'tx-1004',
      timestamp: '2026-10-19 17:31:40.540',
      hash: '0x8849102830491028304910283049102830491028304910283049102830491028',
      idempotencyKey: '1b2a3c4d-5e6f-47a8-b9c0-112233445566',
      sourceWallet: 'WLT-0x762eA184',
      destinationWallet: 'WLT-0x994dF001',
      amount: 84000.50,
      status: 'SUCCESS',
      executionTimeMs: 6.8,
      threadId: 1,
      blockHeight: 1849203,
    },
  ]);

  const [metrics, setMetrics] = useState<LedgerMetrics>({
    totalVolume: 26697881.50,
    totalTransactions: 284109,
    successfulTxCount: 279540,
    rejectedRaceCount: 4569,
    activeLedgerBalance: 26697881.50,
    currentTps: 182.4,
    activeLocks: 0,
  });

  const appendConsole = (msg: string) => {
    setLiveLogConsole((prev) => [...prev.slice(-30), msg]);
  };

  useEffect(() => {
    consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveLogConsole]);

  const handleExecuteBlast = async ({
    source,
    destination,
    amount,
    threads,
  }: {
    source: string;
    destination: string;
    amount: number;
    threads: number;
  }) => {
    if (source === destination) {
      appendConsole(`[ERROR] TRANSACTION_ROUTING_FAULT: Source wallet matches destination wallet.`);
      return;
    }

    setIsExecuting(true);
    appendConsole(`[INIT] DISPATCHING CONCURRENCY BLAST: ${threads} PARALLEL WORKERS`);
    appendConsole(`[MUTEX] ACQUIRING ROW-LEVEL PESSIMISTIC LOCK ON KEY <${source}>`);

    setMetrics((prev) => ({
      ...prev,
      activeLocks: prev.activeLocks + 1,
      currentTps: prev.currentTps + (threads * 15.5),
    }));

    // Sleep to simulate worker dispatch latency
    await new Promise((r) => setTimeout(r, 450));

    const now = new Date();
    const isoString = now.toISOString().replace('T', ' ').slice(0, 23);
    const baseBlock = 1849205;

    // Simulate Race Condition: exactly 1 thread wins the lock and succeeds, remaining threads are rejected with REJECTED_RACE_CONDITION
    const newTxBatch: Transaction[] = [];

    for (let i = 0; i < threads; i++) {
      const threadId = i + 1;
      const isWinner = i === 0; // First worker acquires the Mutex

      const tx: Transaction = {
        id: `tx-${Date.now()}-${i}`,
        timestamp: isoString,
        hash: generateHash(),
        idempotencyKey: generateUUIDv4(),
        sourceWallet: source,
        destinationWallet: destination,
        amount,
        status: isWinner ? 'SUCCESS' : 'REJECTED_RACE_CONDITION',
        executionTimeMs: isWinner ? 3.4 : 0.6 + Math.random() * 0.4,
        threadId,
        blockHeight: baseBlock,
      };

      newTxBatch.push(tx);
    }

    // Update transactions & ledger
    setTransactions((prev) => [...newTxBatch, ...prev]);

    // Update wallet balances (only for the 1 successful transaction)
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id === source) {
          return { ...w, balance: Math.max(0, w.balance - amount) };
        }
        if (w.id === destination) {
          return { ...w, balance: w.balance + amount };
        }
        return w;
      })
    );

    // Update metrics
    setMetrics((prev) => ({
      ...prev,
      totalVolume: prev.totalVolume + amount,
      totalTransactions: prev.totalTransactions + threads,
      successfulTxCount: prev.successfulTxCount + 1,
      rejectedRaceCount: prev.rejectedRaceCount + (threads - 1),
      activeLocks: Math.max(0, prev.activeLocks - 1),
      currentTps: Number((180 + Math.random() * 15).toFixed(2)),
    }));

    appendConsole(`[MUTEX] THREAD #1 COMMITTED: $${amount.toFixed(2)} [TX_SUCCESS]`);
    appendConsole(`[MUTEX] LOCKED_OUT: ${threads - 1} OVERLAPPING ATTEMPTS REJECTED (PREVENTED DOUBLE-SPEND)`);
    appendConsole(`[AUDIT] ZERO-VARIANCE VERIFIED: DOUBLE-ENTRY JOURNAL IN EQUILIBRIUM`);

    setIsExecuting(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F12] text-[#E2E8F0] font-mono flex flex-col antialiased">
      {/* Top Status Banner */}
      <TopBanner />

      {/* Main Workspace Body */}
      <main className="flex-1 p-4 md:p-6 space-y-5 max-w-[1720px] w-full mx-auto">
        {/* Core Performance Tickers */}
        <PerformanceTickers metrics={metrics} />

        {/* Concurrency Stress Test Panel */}
        <ConcurrencyPanel
          wallets={wallets}
          isExecuting={isExecuting}
          onExecuteBlast={handleExecuteBlast}
        />

        {/* Structural 2-Column Split: Console Stream + Ledger State */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Live Micro-Audit Terminal Stream */}
          <div className="bg-[#131A20] border border-[#222F3A] p-3 flex flex-col h-48 lg:h-auto">
            <div className="flex items-center justify-between border-b border-[#222F3A] pb-2 mb-2">
              <span className="text-[11px] font-bold text-[#E2E8F0] uppercase tracking-wider">
                // SYSTEM_IO_LOG_STREAM
              </span>
              <span className="text-[10px] text-[#10B981]">STDOUT_CAPTURE</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 text-[10px] text-[#94A3B8] font-mono">
              <div className="text-[#64748B]">// KERNEL_INIT: Pessimistic Lock Manager ready</div>
              <div className="text-[#64748B]">// ACID_VERIFY: WAL write buffer synchronous flush</div>
              {liveLogConsole.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.includes('[ERROR]')
                      ? 'text-[#EF4444]'
                      : line.includes('[MUTEX]')
                      ? 'text-[#10B981]'
                      : 'text-[#E2E8F0]'
                  }
                >
                  &gt; {line}
                </div>
              ))}
              <div ref={consoleBottomRef} />
            </div>
          </div>

          {/* Double-Entry Transaction Ledger Table */}
          <div className="lg:col-span-3">
            <DoubleEntryTable
              transactions={transactions}
              onClearLogs={() => setTransactions([])}
            />
          </div>
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-[#222F3A] bg-[#0B0F12] px-4 py-2.5 text-[11px] text-[#64748B] flex flex-wrap items-center justify-between select-none">
        <div className="flex items-center space-x-4">
          <span>MUTEX_ENGINE: POSIX_PTHREAD_MUTEX_V4</span>
          <span>|</span>
          <span>ISOLATION_LEVEL: SERIALIZABLE</span>
          <span>|</span>
          <span>CONSENSUS: RAFT_LEADER_SYNC</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 bg-[#10B981]"></span>
          <span className="text-[#E2E8F0]">SECURE_RUNTIME // ZERO_RACE_CONDITIONS</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
