import React, { useState } from 'react';
import { LedgerEntryRecord } from '../types';

interface LedgerEntriesInspectorProps {
  entries: LedgerEntryRecord[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const LedgerEntriesInspector: React.FC<LedgerEntriesInspectorProps> = ({
  entries,
  onRefresh,
  isLoading,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');

  const filtered = entries.filter((e) => {
    if (filterType === 'CREDIT') return e.entry_type === 'credit';
    if (filterType === 'DEBIT') return e.entry_type === 'debit';
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
            // IMMUTABLE_LEDGER_ENTRIES (AUDIT_JOURNAL)
          </span>
          <span className="text-[11px] px-2 py-0.5 bg-[#0B0F12] border border-[#222F3A] text-[#10B981]">
            {filtered.length} JOURNAL_ENTRIES
          </span>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#64748B] text-[11px]">ENTRY_TYPE:</span>
          {(['ALL', 'DEBIT', 'CREDIT'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterType(mode)}
              className={`px-2 py-0.5 text-[11px] border cursor-pointer uppercase transition-colors rounded-none ${
                filterType === mode
                  ? 'bg-[#222F3A] text-[#E2E8F0] border-[#2E4050]'
                  : 'bg-[#0B0F12] text-[#64748B] border-[#222F3A] hover:text-[#E2E8F0]'
              }`}
            >
              {mode}
            </button>
          ))}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-2.5 py-1 text-[11px] border border-[#222F3A] bg-[#0B0F12] text-[#10B981] hover:border-[#10B981] cursor-pointer ml-2"
            >
              {isLoading ? 'FETCHING...' : 'SYNC_ENTRIES'}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-[#0B0F12] z-10">
            <tr className="border-b border-[#222F3A] text-[#64748B] text-[11px] tracking-wider select-none">
              <th className="py-2.5 px-4 font-semibold uppercase">ENTRY_ID</th>
              <th className="py-2.5 px-4 font-semibold uppercase">TX_ID</th>
              <th className="py-2.5 px-4 font-semibold uppercase">WALLET_NODE</th>
              <th className="py-2.5 px-4 font-semibold uppercase text-center">TYPE</th>
              <th className="py-2.5 px-4 font-semibold uppercase text-right">AMOUNT (USD)</th>
              <th className="py-2.5 px-4 font-semibold uppercase text-right">BALANCE_AFTER</th>
              <th className="py-2.5 px-4 font-semibold uppercase">TIMESTAMP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222F3A]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#64748B] italic">
                  [ NO_LEDGER_ENTRIES_FETCHED_OR_MATCHING ]
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isDebit = item.entry_type === 'debit';
                return (
                  <tr key={item.id} className="hover:bg-[#172129] transition-colors">
                    <td className="py-2 px-4 text-[#E2E8F0] font-mono text-[11px]">
                      #{item.id}
                    </td>
                    <td className="py-2 px-4 text-[#94A3B8] font-mono text-[11px]">
                      {item.transaction_id.slice(0, 8)}...{item.transaction_id.slice(-4)}
                    </td>
                    <td className="py-2 px-4 text-[#E2E8F0] font-mono text-[11px]">
                      {item.wallet_id.slice(0, 8)}...{item.wallet_id.slice(-4)}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-none ${
                          isDebit
                            ? 'bg-[#EF4444]/15 border border-[#EF4444] text-[#EF4444]'
                            : 'bg-[#10B981]/15 border border-[#10B981] text-[#10B981]'
                        }`}
                      >
                        {isDebit ? 'DEBIT (-)' : 'CREDIT (+)'}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-semibold">
                      <span className={isDebit ? 'text-[#EF4444]' : 'text-[#10B981]'}>
                        {isDebit ? '-' : '+'}${formatAmount(item.amount)}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right text-[#E2E8F0] font-mono font-semibold">
                      ${formatAmount(item.balance_after)}
                    </td>
                    <td className="py-2 px-4 text-[#64748B] text-[10px] whitespace-nowrap">
                      {item.created_at.replace('T', ' ').slice(0, 19)}
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
          DOUBLE_ENTRY_INVARIANT: <span className="text-[#10B981]">PERSISTED IN POSTGRES / SQLITE</span>
        </div>
        <div>
          ZERO_FLOATING_DRIFT: <span className="text-[#E2E8F0]">NUMERIC(20, 4) EXACT</span>
        </div>
      </div>
    </div>
  );
};
