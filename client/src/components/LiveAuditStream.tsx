import React, { useState } from 'react';
import { ShieldCheck, Activity, Copy, Check } from 'lucide-react';
import { Transaction } from '../types';

interface LiveAuditStreamProps {
  transactions: Transaction[];
  currentWalletId: string;
  onClearLogs?: () => void;
  isLoading?: boolean;
}

export const LiveAuditStream: React.FC<LiveAuditStreamProps> = ({
  transactions,
  currentWalletId,
  onClearLogs,
  isLoading,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'SUCCESS_ONLY' | 'BLOCKED_ONLY'>('ALL');

  const copyToClipboard = (text: string, hash: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterMode === 'SUCCESS_ONLY') return tx.status === 'SUCCESS';
    if (filterMode === 'BLOCKED_ONLY') return tx.status === 'BLOCKED_BY_MUTEX';
    return true;
  });

  return (
    <div className="bg-[#131A20] border border-[#222F3A] p-4 flex flex-col shadow-xl">
      {/* Ledger Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#222F3A] pb-3 mb-3 gap-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#10B981]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">
            LIVE CLIENT AUDIT STREAM // DOUBLE-ENTRY LEDGER JOURNAL
          </h2>
          <span className="text-[10px] text-[#64748B]">
            ({filteredTransactions.length} RECORDS)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filters */}
          <div className="flex items-center space-x-1 border border-[#222F3A] p-0.5 bg-[#0B0F12]">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2 py-0.5 text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-[#222F3A] text-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#E2E8F0]'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilterMode('SUCCESS_ONLY')}
              className={`px-2 py-0.5 text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                filterMode === 'SUCCESS_ONLY'
                  ? 'bg-[#10B981]/20 text-[#10B981]'
                  : 'text-[#64748B] hover:text-[#10B981]'
              }`}
            >
              SUCCESS
            </button>
            <button
              onClick={() => setFilterMode('BLOCKED_ONLY')}
              className={`px-2 py-0.5 text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                filterMode === 'BLOCKED_ONLY'
                  ? 'bg-[#EF4444]/20 text-[#EF4444]'
                  : 'text-[#64748B] hover:text-[#EF4444]'
              }`}
            >
              BLOCKED
            </button>
          </div>

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="text-[10px] text-[#64748B] hover:text-[#EF4444] px-2 py-1 border border-[#222F3A] hover:border-[#EF4444] transition-colors cursor-pointer"
            >
              CLEAR_STREAM
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#222F3A] text-[#64748B] text-[10px] uppercase tracking-wider">
              <th className="py-2.5 px-3">TIMESTAMP</th>
              <th className="py-2.5 px-3">TX HASH</th>
              <th className="py-2.5 px-3">DESTINATION WALLET</th>
              <th className="py-2.5 px-3 text-right">AMOUNT (USD)</th>
              <th className="py-2.5 px-3 text-center">STATUS TAG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222F3A]/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#64748B] text-xs">
                  SYNCHRONIZING_CLIENT_AUDIT_STREAM...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#64748B] text-xs">
                  NO TRANSACTIONS RECORDED FOR ACTIVE USER YET // DISPATCH TRANSFER OR STRESS BLAST TO BEGIN
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isBlocked = tx.status === 'BLOCKED_BY_MUTEX';
                const isMyDestination = tx.destinationWallet === currentWalletId;

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#172129] transition-colors group"
                  >
                    {/* Timestamp */}
                    <td className="py-2.5 px-3 text-[11px] text-[#94A3B8] whitespace-nowrap">
                      {tx.timestamp}
                    </td>

                    {/* Tx Hash */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-[#E2E8F0] font-bold">
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.hash, tx.hash)}
                          title="Copy full cryptographic hash"
                          className="opacity-0 group-hover:opacity-100 text-[#64748B] hover:text-[#10B981] transition-opacity cursor-pointer p-0.5"
                        >
                          {copiedHash === tx.hash ? (
                            <Check className="w-3 h-3 text-[#10B981]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Destination Wallet */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[11px] text-[#94A3B8] font-mono select-all">
                        {tx.destinationWallet}
                      </span>
                      {isMyDestination && (
                        <span className="ml-1.5 text-[9px] text-[#10B981] bg-[#10B981]/10 px-1 py-0.2 border border-[#10B981]/30">
                          (INCOMING)
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-xs text-[#E2E8F0]">
                      ${Number(tx.amount).toFixed(2)}
                    </td>

                    {/* Flat Status Tag: [ SUCCESS ] in emerald green, or [ BLOCKED_BY_MUTEX ] in ruby red */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isBlocked ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/15 border border-[#EF4444] tracking-wider">
                          [ BLOCKED_BY_MUTEX ]
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-[#10B981] bg-[#10B981]/15 border border-[#10B981] tracking-wider">
                          [ SUCCESS ]
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-[#222F3A] mt-3 flex items-center justify-between text-[10px] text-[#64748B]">
        <span>FILTER: ACTIVE USER WALLET TRANSACTIONS ONLY</span>
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span>CRYPTOGRAPHIC DOUBLE-ENTRY AUDIT TRAIL</span>
        </span>
      </div>
    </div>
  );
};
