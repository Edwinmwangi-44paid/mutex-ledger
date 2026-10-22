import React, { useState, useEffect } from 'react';
import { WalletNode } from '../types';

interface ConcurrencyPanelProps {
  onExecuteBlast: (params: {
    source: string;
    destination: string;
    amount: number;
    threads: number;
  }) => void;
  isExecuting: boolean;
  wallets: WalletNode[];
  selectedSourceId?: string;
  selectedDestinationId?: string;
  onSelectSource?: (id: string) => void;
  onSelectDestination?: (id: string) => void;
}

export const ConcurrencyPanel: React.FC<ConcurrencyPanelProps> = ({
  onExecuteBlast,
  isExecuting,
  wallets,
  selectedSourceId,
  selectedDestinationId,
  onSelectSource,
  onSelectDestination,
}) => {
  const [source, setSource] = useState(selectedSourceId || wallets[0]?.id || '');
  const [destination, setDestination] = useState(selectedDestinationId || wallets[1]?.id || '');
  const [amount, setAmount] = useState<number>(4500.00);
  const [threads, setThreads] = useState<number>(8);

  useEffect(() => {
    if (selectedSourceId) setSource(selectedSourceId);
  }, [selectedSourceId]);

  useEffect(() => {
    if (selectedDestinationId) setDestination(selectedDestinationId);
  }, [selectedDestinationId]);

  useEffect(() => {
    if (!source && wallets.length > 0) setSource(wallets[0].id);
    if (!destination && wallets.length > 1) setDestination(wallets[1].id);
  }, [wallets]);

  const handleSourceChange = (val: string) => {
    setSource(val);
    if (onSelectSource) onSelectSource(val);
  };

  const handleDestinationChange = (val: string) => {
    setDestination(val);
    if (onSelectDestination) onSelectDestination(val);
  };

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
      <div className="flex flex-wrap items-center justify-between border-b border-[#222F3A] pb-3 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-[#10B981]"></span>
          <span className="text-xs font-bold text-[#E2E8F0] tracking-wider uppercase">
            // CONCURRENCY_STRESS_TEST_SUITE
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] px-2 py-0.5 bg-[#0B0F12] border border-[#222F3A] text-[#10B981]">
            PESSIMISTIC_LOCK: [SELECT ... FOR UPDATE]
          </span>
          <span className="text-[11px] px-2 py-0.5 bg-[#0B0F12] border border-[#222F3A] text-[#38BDF8]">
            REDIS: [SETNX 300s TTL]
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Source Wallet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-[#64748B] uppercase tracking-wider block">
                SOURCE_WALLET (DEBIT -)
              </label>
              <span className="text-[10px] text-[#10B981] font-bold">SRC_KEY</span>
            </div>
            <select
              value={source}
              onChange={(e) => handleSourceChange(e.target.value)}
              disabled={isExecuting}
              className="w-full bg-[#0B0F12] border border-[#222F3A] px-3 py-2 text-xs text-[#E2E8F0] focus:border-[#10B981] focus:outline-none rounded-none"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#0B0F12] text-[#E2E8F0]">
                  {w.id.slice(0, 8)}... [{w.name}] - ${Number(w.balance).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Wallet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-[#64748B] uppercase tracking-wider block">
                DESTINATION_WALLET (CREDIT +)
              </label>
              <span className="text-[10px] text-[#38BDF8] font-bold">DST_KEY</span>
            </div>
            <select
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              disabled={isExecuting}
              className="w-full bg-[#0B0F12] border border-[#222F3A] px-3 py-2 text-xs text-[#E2E8F0] focus:border-[#38BDF8] focus:outline-none rounded-none"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#0B0F12] text-[#E2E8F0]">
                  {w.id.slice(0, 8)}... [{w.name}] - ${Number(w.balance).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Entry Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-[#64748B] uppercase tracking-wider block">
                ENTRY_AMOUNT (USD)
              </label>
              <span className="text-[10px] text-[#64748B]">NUMERIC(20,4)</span>
            </div>
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
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-[#64748B] uppercase tracking-wider block">
                PARALLEL_THREADS (RACE SIM)
              </label>
              <span className="text-[10px] text-[#10B981]">CONCURRENCY</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="32"
                value={threads}
                onChange={(e) => setThreads(parseInt(e.target.value) || 1)}
                disabled={isExecuting}
                className="w-full bg-[#0B0F12] border border-[#222F3A] px-3 py-2 text-xs text-[#E2E8F0] focus:border-[#10B981] focus:outline-none rounded-none font-mono"
              />
              <span className="text-[11px] text-[#64748B] whitespace-nowrap">MAX: 32</span>
            </div>
          </div>
        </div>

        {/* Quick Amount Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] text-[#64748B]">QUICK_AMOUNT:</span>
          {[100, 500, 1000, 4500, 25000].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              disabled={isExecuting}
              className={`px-2 py-0.5 text-[10px] border border-[#222F3A] bg-[#0B0F12] text-[#94A3B8] hover:text-[#10B981] hover:border-[#10B981] cursor-pointer transition-colors ${
                amount === preset ? 'border-[#10B981] text-[#10B981]' : ''
              }`}
            >
              ${preset.toLocaleString()}
            </button>
          ))}

          <span className="text-[11px] text-[#64748B] ml-4">WORKERS:</span>
          {[1, 4, 8, 16, 24].map((th) => (
            <button
              key={th}
              type="button"
              onClick={() => setThreads(th)}
              disabled={isExecuting}
              className={`px-2 py-0.5 text-[10px] border border-[#222F3A] bg-[#0B0F12] text-[#94A3B8] hover:text-[#38BDF8] hover:border-[#38BDF8] cursor-pointer transition-colors ${
                threads === th ? 'border-[#38BDF8] text-[#38BDF8]' : ''
              }`}
            >
              {th}x
            </button>
          ))}
        </div>

        {/* Action Button & Explanatory Notice */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-[#222F3A]/60">
          <div className="text-[11px] text-[#64748B] leading-relaxed">
            <span className="text-[#10B981] font-semibold">ACID_MUTEX:</span> The transaction engine locks resources in deterministic sorted UUID order (<code className="text-[#E2E8F0]">{source.localeCompare(destination) <= 0 ? 'SRC → DST' : 'DST → SRC'}</code>), eliminating deadlocks while rejecting double-spends.
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
            {isExecuting ? 'DISPATCHING_RACE_CONCURRENTLY...' : `FIRE_${threads}X_CONCURRENCY_BLAST`}
          </button>
        </div>
      </form>
    </div>
  );
};
