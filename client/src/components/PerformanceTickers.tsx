import React from 'react';
import { LedgerMetrics } from '../types';

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Box 1: Total Volume */}
      <div className="bg-[#131A20] border border-[#222F3A] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#64748B] tracking-wider mb-2">
          <span>// AGGREGATE_SETTLEMENT_VOLUME</span>
          <span className="text-[#10B981] font-mono">USD</span>
        </div>
        <div className="text-right">
          <div className="text-2xl lg:text-3xl font-bold tracking-tight text-[#E2E8F0] font-mono">
            ${formatCurrency(metrics.totalVolume)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 font-mono">
            DELTA_24H: <span className="text-[#10B981]">+8.42%</span> | AVG_TICKET: ${formatCurrency(metrics.totalVolume / Math.max(1, metrics.totalTransactions))}
          </div>
        </div>
      </div>

      {/* Box 2: Transaction Metrics */}
      <div className="bg-[#131A20] border border-[#222F3A] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#64748B] tracking-wider mb-2">
          <span>// TRANSACTION_THROUGHPUT_METRICS</span>
          <span className="text-[#64748B] font-mono">REAL_TIME</span>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end space-x-2">
            <span className="text-2xl lg:text-3xl font-bold tracking-tight text-[#E2E8F0] font-mono">
              {formatNumber(metrics.totalTransactions)}
            </span>
            <span className="text-xs text-[#64748B] font-mono">TXS</span>
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 font-mono flex items-center justify-end gap-2">
            <span>SUCC: <span className="text-[#10B981]">{formatNumber(metrics.successfulTxCount)}</span></span>
            <span>|</span>
            <span>RACE_LOCKED: <span className="text-[#EF4444]">{formatNumber(metrics.rejectedRaceCount)}</span></span>
            <span>|</span>
            <span>TPS: <span className="text-[#E2E8F0]">{metrics.currentTps.toFixed(2)}</span></span>
          </div>
        </div>
      </div>

      {/* Box 3: Active Ledger Balances */}
      <div className="bg-[#131A20] border border-[#222F3A] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#64748B] tracking-wider mb-2">
          <span>// ACTIVE_LEDGER_RESERVE_BALANCE</span>
          <span className="text-[#10B981] font-mono">COLLATERALIZED</span>
        </div>
        <div className="text-right">
          <div className="text-2xl lg:text-3xl font-bold tracking-tight text-[#E2E8F0] font-mono">
            ${formatCurrency(metrics.activeLedgerBalance)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 font-mono">
            HOT_VAULT: <span className="text-[#E2E8F0]">98.91%</span> | MUTEX_LOCKS: <span className="text-[#10B981]">{metrics.activeLocks} ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
