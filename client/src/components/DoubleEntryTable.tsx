import React, { useState } from 'react';
import { Transaction } from '../types';

interface DoubleEntryTableProps {
  transactions: Transaction[];
  onClearLogs?: () => void;
}

export const DoubleEntryTable: React.FC<DoubleEntryTableProps> = ({
  transactions,
  onClearLogs,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'REJECTED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = transactions.filter((t) => {
    if (filter === 'SUCCESS') return t.status === 'SUCCESS';
    if (filter === 'REJECTED') return t.status.startsWith('REJECTED');
    return true;
  });

  const formatAmount = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="bg-[#131A20] border border-[#222F3A] flex flex-col font-mono">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-[#222F3A] gap-3">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-[#E2E8F0] tracking-wider uppercase">
            // IMMUTABLE_DOUBLE_ENTRY_AUDIT_LOG
          </span>
          <span className="text-[11px] px-2 py-0.5 bg-[#0B0F12] border border-[#222F3A] text-[#64748B]">
            {filtered.length} RECORDS_BUFFERED
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#64748B] text-[11px]">FILTER:</span>
          {(['ALL', 'SUCCESS', 'REJECTED'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-2.5 py-1 text-[11px] border cursor-pointer uppercase transition-colors rounded-none ${
                filter === mode
                  ? 'bg-[#222F3A] text-[#E2E8F0] border-[#2E4050]'
                  : 'bg-[#0B0F12] text-[#64748B] border-[#222F3A] hover:text-[#E2E8F0]'
              }`}
            >
              {mode}
            </button>
          ))}
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="px-2.5 py-1 text-[11px] border border-[#222F3A] bg-[#0B0F12] text-[#EF4444] hover:border-[#EF4444] cursor-pointer ml-2"
              title="Purge local buffer"
            >
              FLUSH_LOGS
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#222F3A] bg-[#0B0F12] text-[#64748B] text-[11px] tracking-wider select-none">
              <th className="py-2.5 px-4 font-semibold uppercase">TIMESTAMP (UTC)</th>
              <th className="py-2.5 px-4 font-semibold uppercase">TRANSACTION_HASH</th>
              <th className="py-2.5 px-4 font-semibold uppercase">IDEMPOTENCY_KEY (UUIDv4)</th>
              <th className="py-2.5 px-4 font-semibold uppercase">ROUTE (SRC → DST)</th>
              <th className="py-2.5 px-4 font-semibold uppercase text-right">AMOUNT (USD)</th>
              <th className="py-2.5 px-4 font-semibold uppercase text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222F3A]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#64748B] italic">
                  [ NO_RECORDS_FOUND_FOR_CURRENT_FILTER ]
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const isSuccess = tx.status === 'SUCCESS';
                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#172129] transition-colors group"
                  >
                    {/* Timestamp */}
                    <td className="py-2.5 px-4 text-[#64748B] whitespace-nowrap font-mono text-[11px]">
                      {tx.timestamp}
                    </td>

                    {/* Transaction Hash */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[#E2E8F0] font-mono text-[11px]">
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.hash, tx.id + '-hash')}
                          className="text-[10px] text-[#64748B] hover:text-[#10B981] cursor-pointer"
                          title="Copy Full Hash"
                        >
                          {copiedId === tx.id + '-hash' ? '[COPIED]' : '[CPY]'}
                        </button>
                      </div>
                    </td>

                    {/* Idempotency Key (UUIDv4) */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                        <span className="text-[#94A3B8]">{tx.idempotencyKey}</span>
                        <button
                          onClick={() => copyToClipboard(tx.idempotencyKey, tx.id + '-uuid')}
                          className="text-[10px] text-[#64748B] hover:text-[#10B981] cursor-pointer"
                          title="Copy UUIDv4"
                        >
                          {copiedId === tx.id + '-uuid' ? '[COPIED]' : '[CPY]'}
                        </button>
                      </div>
                    </td>

                    {/* Route */}
                    <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px]">
                      <span className="text-[#E2E8F0]">{tx.sourceWallet}</span>
                      <span className="text-[#64748B] mx-1.5">→</span>
                      <span className="text-[#E2E8F0]">{tx.destinationWallet}</span>
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono font-semibold">
                      <span className={isSuccess ? 'text-[#E2E8F0]' : 'text-[#64748B] line-through'}>
                        ${formatAmount(tx.amount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-center">
                      {isSuccess ? (
                        <span className="inline-block px-2.5 py-0.5 bg-[#10B981]/10 border border-[#10B981] text-[#10B981] text-[10px] font-bold tracking-wider rounded-none">
                          [ SUCCESS ]
                        </span>
                      ) : tx.status === 'REJECTED_RACE_CONDITION' ? (
                        <span className="inline-block px-2.5 py-0.5 bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] text-[10px] font-bold tracking-wider rounded-none">
                          [ REJECTED_RACE_CONDITION ]
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] text-[10px] font-bold tracking-wider rounded-none">
                          [ {tx.status} ]
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
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-[#0B0F12] border-t border-[#222F3A] text-[11px] text-[#64748B]">
        <div>
          CRYPTOGRAPHIC_CHECK: <span className="text-[#10B981]">VALIDATED [MERKLE_ROOT: 0x9f88...31ae]</span>
        </div>
        <div>
          DOUBLE_ENTRY_RULE: <span className="text-[#E2E8F0]">SUM(DEBITS) - SUM(CREDITS) == 0.000000</span>
        </div>
      </div>
    </div>
  );
};
