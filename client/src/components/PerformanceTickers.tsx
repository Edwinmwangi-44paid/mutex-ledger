import React from 'react';
import { TrendingUp, ShieldCheck, Activity, Wallet } from 'lucide-react';

interface PerformanceTickersProps {
  userBalance: number;
  transactionsCount: number;
  totalSettledAmount: number;
}

export const PerformanceTickers: React.FC<PerformanceTickersProps> = ({
  userBalance,
  transactionsCount,
  totalSettledAmount,
}) => {
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
      {/* Real Account Metric 1: Available Liquid Balance */}
      <div className="bg-[#1E2329] border border-[#2B313A] rounded-lg p-4 shadow transition-all hover:border-[#F0B90B]/50">
        <div className="flex items-center justify-between text-xs text-[#848E9C] mb-1.5">
          <span className="font-semibold tracking-wide uppercase text-[11px] flex items-center space-x-1.5">
            <Wallet className="w-3.5 h-3.5 text-[#F0B90B]" />
            <span>Liquid Account Balance</span>
          </span>
          <span className="flex items-center space-x-1 text-[11px] font-bold text-[#F0B90B] bg-[#F0B90B]/10 px-2 py-0.5 rounded font-mono">
            <span>USD</span>
          </span>
        </div>
        <div>
          <div className="text-xl lg:text-2xl font-extrabold tracking-tight text-[#EAECEF] font-mono">
            ${formatCurrency(userBalance)}
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-[#848E9C] mt-1.5">
            <span className="flex items-center text-[#0ECB81] font-bold font-mono">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              100% Withdrawable
            </span>
            <span>•</span>
            <span>Zero Lockout</span>
          </div>
        </div>
      </div>

      {/* Real Account Metric 2: Settled User Volume */}
      <div className="bg-[#1E2329] border border-[#2B313A] rounded-lg p-4 shadow transition-all hover:border-[#F0B90B]/50">
        <div className="flex items-center justify-between text-xs text-[#848E9C] mb-1.5">
          <span className="font-semibold tracking-wide uppercase text-[11px] flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-[#0ECB81]" />
            <span>Personal Settled Volume</span>
          </span>
          <span className="flex items-center space-x-1 text-[11px] font-bold text-[#0ECB81] bg-[#0ECB81]/10 px-2 py-0.5 rounded font-mono">
            <span>REAL-TIME</span>
          </span>
        </div>
        <div>
          <div className="text-xl lg:text-2xl font-extrabold tracking-tight text-[#EAECEF] font-mono">
            ${formatCurrency(totalSettledAmount)}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] mt-1.5 text-[#848E9C]">
            <span>Total Recorded Transfers:</span>
            <span className="text-[#EAECEF] font-bold font-mono">
              {formatNumber(transactionsCount)}
            </span>
          </div>
        </div>
      </div>

      {/* Real Account Metric 3: Account & Custody Status */}
      <div className="bg-[#1E2329] border border-[#2B313A] rounded-lg p-4 shadow transition-all hover:border-[#F0B90B]/50">
        <div className="flex items-center justify-between text-xs text-[#848E9C] mb-1.5">
          <span className="font-semibold tracking-wide uppercase text-[11px] flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0ECB81]" />
            <span>Security &amp; Custody</span>
          </span>
          <span className="flex items-center space-x-1 text-[11px] font-bold text-[#0ECB81] bg-[#0ECB81]/10 px-2 py-0.5 rounded font-mono">
            <span>VERIFIED</span>
          </span>
        </div>
        <div>
          <div className="text-xl lg:text-2xl font-extrabold tracking-tight text-[#0ECB81] font-mono">
            Active Tier 1
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-[#848E9C] mt-1.5">
            <span>2FA Protection: <strong className="text-[#EAECEF]">Enabled</strong></span>
            <span>•</span>
            <span className="text-[#0ECB81]">Direct Settlement</span>
          </div>
        </div>
      </div>
    </div>
  );
};
