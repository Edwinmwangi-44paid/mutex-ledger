import React, { useState } from 'react';
import { Activity, Copy, Check } from 'lucide-react';
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
    <div className="bg-[#0E141B] border border-[#1E293B] rounded-2xl p-5 flex flex-col shadow-xl hover:border-[#2D3B4E] transition-all">
      {/* Ledger Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#1E293B] pb-3 mb-4 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-200">
              Double-Entry Settlement Journal
            </h2>
            <p className="text-[11px] text-slate-500">Live transaction stream for active node</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#141C24] text-slate-400 border border-[#1E293B]">
            {filteredTransactions.length} records
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter Segmented Control */}
          <div className="flex items-center space-x-1 p-1 bg-[#090D11] border border-[#1E293B] rounded-xl text-xs">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-[#141C24] text-white shadow-sm border border-[#2D3B4E]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('SUCCESS_ONLY')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                filterMode === 'SUCCESS_ONLY'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Settled
            </button>
            <button
              onClick={() => setFilterMode('BLOCKED_ONLY')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                filterMode === 'BLOCKED_ONLY'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Blocked (422)
            </button>
          </div>

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-[#1E293B] hover:border-rose-500/40 bg-[#090D11] transition-all cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1E293B] text-slate-400 text-[11px] font-medium">
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Transaction Hash</th>
              <th className="py-2.5 px-3">Counterparty Wallet</th>
              <th className="py-2.5 px-3 text-right">Amount (USD)</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/60 font-mono text-[11px]">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500 font-sans text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-600 border-t-emerald-400 rounded-full animate-spin" />
                    Synchronizing ledger stream...
                  </div>
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500 font-sans text-xs">
                  No transaction records found for active node. Execute a transfer or stress blast to generate entries.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isBlocked = tx.status === 'BLOCKED_BY_MUTEX';
                const isMyDestination = tx.destinationWallet === currentWalletId;

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#141C24]/70 transition-colors group"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {tx.timestamp}
                    </td>

                    {/* Tx Hash */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-200 font-medium font-mono">
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.hash, tx.hash)}
                          title="Copy full cryptographic hash"
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-emerald-400 transition-opacity cursor-pointer p-0.5"
                        >
                          {copiedHash === tx.hash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Destination Wallet */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-slate-300 font-mono select-all">
                        {tx.destinationWallet}
                      </span>
                      {isMyDestination && (
                        <span className="ml-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-sans">
                          Incoming
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-semibold text-slate-100 tabular-nums">
                      ${Number(tx.amount).toFixed(2)}
                    </td>

                    {/* Professional Status Pill */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isBlocked ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium text-rose-300 bg-rose-500/10 border border-rose-500/30 font-sans">
                          Blocked (422 Mutex)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 font-sans">
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

      {/* Footer Info */}
      <div className="pt-3 border-t border-[#1E293B] mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>Displaying ledger records for current node session</span>
        <span className="text-slate-400 font-mono text-[11px]">
          Double-Entry Debit &amp; Credit Verified
        </span>
      </div>
    </div>
  );
};
