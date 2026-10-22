import React, { useState } from 'react';
import { WalletNode } from '../types';

interface WalletCardGridProps {
  wallets: WalletNode[];
  onSelectSource?: (id: string) => void;
  onSelectDestination?: (id: string) => void;
  selectedSourceId?: string;
  selectedDestinationId?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const WalletCardGrid: React.FC<WalletCardGridProps> = ({
  wallets,
  onSelectSource,
  onSelectDestination,
  selectedSourceId,
  selectedDestinationId,
  onRefresh,
  isRefreshing,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="bg-[#131A20] border border-[#222F3A] p-4 font-mono">
      <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-[#222F3A] gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-[#10B981]"></span>
          <span className="text-xs font-bold text-[#E2E8F0] tracking-wider uppercase">
            // ACTIVE_LEDGER_WALLETS_RESERVE
          </span>
          <span className="text-[10px] text-[#64748B] px-1.5 py-0.5 bg-[#0B0F12] border border-[#222F3A]">
            {wallets.length} NODES
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-[11px] text-[#64748B]">CLICK TO ROUTE (SRC / DST)</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-[11px] px-2 py-0.5 bg-[#0B0F12] border border-[#222F3A] text-[#10B981] hover:border-[#10B981] transition-colors cursor-pointer"
            >
              {isRefreshing ? 'SYNCING...' : 'SYNC_DB'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {wallets.map((wallet) => {
          const isSource = wallet.id === selectedSourceId;
          const isDest = wallet.id === selectedDestinationId;

          let borderClass = 'border-[#222F3A]';
          let badgeText = null;

          if (isSource) {
            borderClass = 'border-[#10B981] bg-[#10B981]/5';
            badgeText = '[SELECTED_SOURCE]';
          } else if (isDest) {
            borderClass = 'border-[#38BDF8] bg-[#38BDF8]/5';
            badgeText = '[SELECTED_DEST]';
          }

          return (
            <div
              key={wallet.id}
              className={`p-3 bg-[#0B0F12] border ${borderClass} flex flex-col justify-between transition-all hover:border-[#64748B] relative group`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-1 mb-2">
                <div>
                  <div className="text-[11px] font-bold text-[#E2E8F0] truncate max-w-[170px]" title={wallet.name}>
                    {wallet.name}
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-[#64748B] mt-0.5">
                    <span className="truncate max-w-[110px]" title={wallet.id}>
                      {wallet.id.slice(0, 8)}...{wallet.id.slice(-4)}
                    </span>
                    <button
                      onClick={(e) => copyId(wallet.id, e)}
                      className="text-[#64748B] hover:text-[#10B981] cursor-pointer"
                      title="Copy full UUID"
                    >
                      {copiedId === wallet.id ? '[COPIED]' : '[CPY]'}
                    </button>
                  </div>
                </div>

                <span className="text-[10px] px-1.5 py-0.5 bg-[#131A20] text-[#10B981] border border-[#222F3A]">
                  {wallet.currency || 'USD'}
                </span>
              </div>

              {/* Balance */}
              <div className="my-2">
                <div className="text-lg lg:text-xl font-bold font-mono text-[#E2E8F0] tracking-tight">
                  ${formatCurrency(wallet.balance)}
                </div>
                <div className="text-[10px] text-[#64748B]">ACID_COLLATERALIZED</div>
              </div>

              {/* Status and Action Buttons */}
              <div className="pt-2 border-t border-[#222F3A]/60 flex items-center justify-between text-[10px]">
                {badgeText ? (
                  <span className={isSource ? 'text-[#10B981] font-bold' : 'text-[#38BDF8] font-bold'}>
                    {badgeText}
                  </span>
                ) : (
                  <div className="flex items-center space-x-1">
                    {onSelectSource && (
                      <button
                        onClick={() => onSelectSource(wallet.id)}
                        className="px-1.5 py-0.5 bg-[#131A20] border border-[#222F3A] text-[#94A3B8] hover:text-[#10B981] hover:border-[#10B981] cursor-pointer"
                      >
                        SET_SRC
                      </button>
                    )}
                    {onSelectDestination && (
                      <button
                        onClick={() => onSelectDestination(wallet.id)}
                        className="px-1.5 py-0.5 bg-[#131A20] border border-[#222F3A] text-[#94A3B8] hover:text-[#38BDF8] hover:border-[#38BDF8] cursor-pointer"
                      >
                        SET_DST
                      </button>
                    )}
                  </div>
                )}

                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" title="Active State"></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
