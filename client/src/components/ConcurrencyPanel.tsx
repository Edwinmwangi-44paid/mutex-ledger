import React, { useState } from 'react';

interface ConcurrencyPanelProps {
  onExecuteBlast: (params: {
    source: string;
    destination: string;
    amount: number;
    threads: number;
  }) => void;
  isExecuting: boolean;
  wallets: { id: string; name: string; balance: number }[];
}

export const ConcurrencyPanel: React.FC<ConcurrencyPanelProps> = ({
  onExecuteBlast,
  isExecuting,
  wallets,
}) => {
  const [source, setSource] = useState(wallets[0]?.id || 'WLT-0x892aF410');
  const [destination, setDestination] = useState(wallets[1]?.id || 'WLT-0x310cB912');
  const [amount, setAmount] = useState<number>(4500.00);
  const [threads, setThreads] = useState<number>(8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExecuting) return;
    onExecuteBlast({
      source,
      destination,
      amount: Number(amount),
      threads: Number(threads),
    });
  };

  return (
    <div className="bg-[#131A20] border border-[#222F3A] p-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#222F3A] pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-[#10B981]"></span>
          <span className="text-xs font-bold text-[#E2E8F0] tracking-wider uppercase">
            // CONCURRENCY_STRESS_TEST_SUITE
          </span>
        </div>
        <span className="text-[11px] text-[#64748B]">
          ENGINE_MODE: [DISTRIBUTED_MUTEX_PESSIMISTIC_LOCK]
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Source Wallet */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#64748B] uppercase tracking-wider block">
              SOURCE_WALLET
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={isExecuting}
              className="w-full bg-[#0B0F12] border border-[#222F3A] px-3 py-2 text-xs text-[#E2E8F0] focus:border-[#10B981] focus:outline-none rounded-none"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#0B0F12] text-[#E2E8F0]">
                  {w.id} [{w.name}] - ${w.balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Wallet */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#64748B] uppercase tracking-wider block">
              DESTINATION_WALLET
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              disabled={isExecuting}
              className="w-full bg-[#0B0F12] border border-[#222F3A] px-3 py-2 text-xs text-[#E2E8F0] focus:border-[#10B981] focus:outline-none rounded-none"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#0B0F12] text-[#E2E8F0]">
                  {w.id} [{w.name}]
                </option>
              ))}
            </select>
          </div>

          {/* Entry Amount */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#64748B] uppercase tracking-wider block">
              ENTRY_AMOUNT (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-[#64748B]">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                disabled={isExecuting}
                className="w-full bg-[#0B0F12] border border-[#222F3A] pl-7 pr-3 py-2 text-xs text-[#E2E8F0] focus:border-[#10B981] focus:outline-none rounded-none font-mono"
              />
            </div>
          </div>

          {/* Parallel Repeating Threads */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#64748B] uppercase tracking-wider block">
              PARALLEL_THREADS (RACE SIMULATION)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="2"
                max="32"
                value={threads}
                onChange={(e) => setThreads(parseInt(e.target.value) || 2)}
                disabled={isExecuting}
                className="w-full bg-[#0B0F12] border border-[#222F3A] px-3 py-2 text-xs text-[#E2E8F0] focus:border-[#10B981] focus:outline-none rounded-none font-mono"
              />
              <span className="text-[11px] text-[#64748B] whitespace-nowrap">MAX: 32</span>
            </div>
          </div>
        </div>

        {/* Action Button & Explanatory Notice */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-[#222F3A]/60">
          <div className="text-[11px] text-[#64748B] leading-relaxed">
            <span className="text-[#10B981] font-semibold">ATTENTION:</span> Parallel execution fires concurrent micro-tasks with identical timestamp windows. The Mutex transaction engine will lock the source row, settling 1 transaction and rejecting overlapping race conditions to guarantee ACID double-entry consistency.
          </div>

          <button
            type="submit"
            disabled={isExecuting}
            className={`cursor-pointer px-6 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors shrink-0 text-center rounded-none border ${
              isExecuting
                ? 'bg-[#172129] text-[#64748B] border-[#222F3A] cursor-not-allowed'
                : 'bg-[#10B981] text-[#0B0F12] border-[#10B981] hover:bg-[#0ea371] active:translate-y-px'
            }`}
          >
            {isExecuting ? 'DISPATCHING_RACE_CONCURRENTLY...' : 'EXECUTE_CONCURRENCY_BLAST'}
          </button>
        </div>
      </form>
    </div>
  );
};
