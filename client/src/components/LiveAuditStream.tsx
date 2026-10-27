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
    <div className="bg-[#1E2329] border border-[#2B313A] rounded-lg p-4 flex flex-col shadow-lg">
      {/* Ledger Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#2B313A] pb-3 mb-3 gap-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#F0B90B]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#EAECEF]">
            Live Concurrency Settlement Journal
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#2B313A] text-[#848E9C]">
            {filteredTransactions.length} logs
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filters */}
          <div className="flex items-center space-x-1 border border-[#2B313A] p-0.5 rounded bg-[#181A20]">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-[#2B313A] text-[#EAECEF]'
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('SUCCESS_ONLY')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
                filterMode === 'SUCCESS_ONLY'
                  ? 'bg-[#0ECB81]/20 text-[#0ECB81]'
                  : 'text-[#848E9C] hover:text-[#0ECB81]'
              }`}
            >
              Settled
            </button>
            <button
              onClick={() => setFilterMode('BLOCKED_ONLY')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
                filterMode === 'BLOCKED_ONLY'
                  ? 'bg-[#F6465D]/20 text-[#F6465D]'
                  : 'text-[#848E9C] hover:text-[#F6465D]'
              }`}
            >
              Blocked 422
            </button>
          </div>

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="text-[11px] text-[#848E9C] hover:text-[#F6465D] px-2.5 py-1 rounded border border-[#2B313A] hover:border-[#F6465D] transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#2B313A] text-[#848E9C] text-[11px] uppercase tracking-wider font-sans">
              <th className="py-2.5 px-3 font-normal">Timestamp (UTC)</th>
              <th className="py-2.5 px-3 font-normal">Tx Hash</th>
              <th className="py-2.5 px-3 font-normal">Destination</th>
              <th className="py-2.5 px-3 font-normal text-right">Amount (USD)</th>
              <th className="py-2.5 px-3 font-normal text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2B313A]/50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#848E9C] text-xs">
                  Synchronizing settlement ledger...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#848E9C] text-xs font-sans">
                  No transaction records found. Execute a transfer to inspect ledger entries.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isBlocked = tx.status === 'BLOCKED_BY_MUTEX';
                const isMyDestination = tx.destinationWallet === currentWalletId;

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#2B3139] transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-[11px] text-[#848E9C] whitespace-nowrap">
                      {tx.timestamp}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-[#EAECEF] font-bold">
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.hash, tx.hash)}
                          title="Copy hash"
                          className="opacity-0 group-hover:opacity-100 text-[#848E9C] hover:text-[#F0B90B] transition-opacity cursor-pointer p-0.5"
                        >
                          {copiedHash === tx.hash ? (
                            <Check className="w-3 h-3 text-[#0ECB81]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[11px] text-[#848E9C] select-all">
                        {tx.destinationWallet}
                      </span>
                      {isMyDestination && (
                        <span className="ml-1.5 text-[9px] text-[#0ECB81] bg-[#0ECB81]/10 px-1 py-0.2 rounded border border-[#0ECB81]/30">
                          Incoming
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-xs text-[#EAECEF]">
                      ${Number(tx.amount).toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isBlocked ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-[#F6465D] bg-[#F6465D]/15 border border-[#F6465D]/40">
                          Blocked 422
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-[#0ECB81] bg-[#0ECB81]/15 border border-[#0ECB81]/40">
                          Settled
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

      <div className="pt-3 border-t border-[#2B313A] mt-3 flex items-center justify-between text-[11px] text-[#848E9C]">
        <span>Double-Entry Isolation Enforced</span>
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0ECB81]" />
          <span>Strict ACID Guaranteed</span>
        </span>
      </div>
    </div>
  );
};
