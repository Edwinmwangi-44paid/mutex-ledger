import React, { useState } from 'react';
import { ShieldCheck, Activity, Copy, Check } from 'lucide-react';
import { Transaction } from '../types';

interface DoubleEntryTableProps {
  transactions: Transaction[];
  onClearLogs?: () => void;
}

export const DoubleEntryTable: React.FC<DoubleEntryTableProps> = ({
  transactions,
  onClearLogs,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = (text: string, hash: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  return (
    <div className="bg-[#131A20] border border-[#222F3A] p-4 flex flex-col shadow-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-[#222F3A] pb-3 mb-3 gap-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#10B981]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">
            GLOBAL TRANSACTION LOGS STREAM
          </h2>
          <span className="text-[10px] text-[#64748B]">
            ({transactions.length} RECORDS)
          </span>
        </div>

        {onClearLogs && (
          <button
            onClick={onClearLogs}
            className="text-[10px] text-[#64748B] hover:text-[#EF4444] px-2 py-1 border border-[#222F3A] hover:border-[#EF4444] transition-colors cursor-pointer"
          >
            CLEAR_LOGS
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#222F3A] text-[#64748B] text-[10px] uppercase tracking-wider">
              <th className="py-2.5 px-3">TIMESTAMP</th>
              <th className="py-2.5 px-3">TX HASH</th>
              <th className="py-2.5 px-3">SOURCE</th>
              <th className="py-2.5 px-3">DESTINATION</th>
              <th className="py-2.5 px-3 text-right">AMOUNT (USD)</th>
              <th className="py-2.5 px-3 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222F3A]/60">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#64748B] text-xs">
                  NO GLOBAL TRANSACTIONS CAPTURED
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isSuccess = tx.status === 'SUCCESS';

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#172129] transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-[11px] text-[#94A3B8] whitespace-nowrap">
                      {tx.timestamp}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-[#E2E8F0] font-bold">
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.hash, tx.hash)}
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

                    <td className="py-2.5 px-3 text-[11px] text-[#94A3B8] truncate max-w-[140px]">
                      {tx.sourceWallet}
                    </td>

                    <td className="py-2.5 px-3 text-[11px] text-[#94A3B8] truncate max-w-[140px]">
                      {tx.destinationWallet}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-xs text-[#E2E8F0]">
                      ${Number(tx.amount).toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {isSuccess ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-[#10B981] bg-[#10B981]/15 border border-[#10B981]">
                          [ SUCCESS ]
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/15 border border-[#EF4444]">
                          [ BLOCKED_BY_MUTEX ]
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

      <div className="pt-3 border-t border-[#222F3A] mt-3 flex items-center justify-between text-[10px] text-[#64748B]">
        <span>ENGINE: SERIALIZABLE ROW-LOCKING</span>
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span>MUTEX CONSISTENCY GUARANTEED</span>
        </span>
      </div>
    </div>
  );
};
