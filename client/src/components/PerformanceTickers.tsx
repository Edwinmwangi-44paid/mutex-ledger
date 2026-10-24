import React from 'react';
import { LedgerMetrics } from '../types';
import { TrendingUp, Activity, Lock } from 'lucide-react';

interface PerformanceTickersProps {
  metrics: LedgerMetrics;
}

export const PerformanceTickers: React.FC<PerformanceTickersProps> = ({ metrics }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  const avgTicket = metrics.totalVolume / Math.max(1, metrics.totalTransactions);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {/* Box 1: Total Volume */}
      <div className="bg-[#0E141B] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between hover:border-[#2D3B4E] transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Total Settlement Volume</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            USD
          </span>
        </div>
        <div className="mt-1">
          <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-100 font-mono tabular-nums">
            ${formatCurrency(metrics.totalVolume)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-[#1E293B]">
            <span className="flex items-center text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              +8.42% 24h
            </span>
            <span className="font-mono text-slate-400">
              Avg Ticket: <span className="text-slate-200">${formatCurrency(avgTicket)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Box 2: Transaction Throughput */}
      <div className="bg-[#0E141B] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between hover:border-[#2D3B4E] transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Transaction Throughput</span>
          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">{metrics.currentTps.toFixed(1)}</span> TPS
          </span>
        </div>
        <div className="mt-1">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-100 font-mono tabular-nums">
              {formatNumber(metrics.totalTransactions)}
            </span>
            <span className="text-xs text-slate-500 font-mono">TXs total</span>
          </div>
          <div className="text-xs mt-2 flex items-center justify-between pt-2 border-t border-[#1E293B] font-mono text-[11px]">
            <span className="text-slate-400">
              Settled: <span className="text-emerald-400 font-medium">{formatNumber(metrics.successfulTxCount)}</span>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              422 Blocked: <span className="text-rose-400 font-medium">{formatNumber(metrics.rejectedRaceCount)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Box 3: Active Ledger Reserves */}
      <div className="bg-[#0E141B] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between hover:border-[#2D3B4E] transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Active Collateralized Reserve</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
            Hot Vault
          </span>
        </div>
        <div className="mt-1">
          <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-100 font-mono tabular-nums">
            ${formatCurrency(metrics.activeLedgerBalance)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-[#1E293B]">
            <span className="font-mono text-slate-400">
              Vault Solvency: <span className="text-emerald-400 font-medium">100.00%</span>
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
              <Lock className="w-3 h-3 text-emerald-400" />
              {metrics.activeLocks} active locks
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
