import React, { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import { Transaction } from '../types';

interface ExchangeOrdersHistoryProps {
  transactions: Transaction[];
  currentWalletId: string;
  isLoading?: boolean;
}

export const ExchangeOrdersHistory: React.FC<ExchangeOrdersHistoryProps> = ({
  transactions,
  currentWalletId,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'OPEN' | 'ORDER_HISTORY' | 'TRADE_HISTORY'>('TRADE_HISTORY');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [searchTx, setSearchTx] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const filtered = transactions.filter((tx) => {
    if (!searchTx.trim()) return true;
    const q = searchTx.toLowerCase();
    return (
      tx.id.toLowerCase().includes(q) ||
      tx.hash.toLowerCase().includes(q) ||
      tx.destinationWallet.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-[#1E2329] border border-[#2B313A] rounded-xl p-4 md:p-5 shadow-lg flex flex-col">
      {/* Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2B313A] pb-3 mb-4 gap-3">
        <div className="flex items-center space-x-2">
          {(
            [
              { id: 'OPEN', label: 'Open Orders (0)' },
              { id: 'ORDER_HISTORY', label: 'Order History' },
              { id: 'TRADE_HISTORY', label: 'Transaction & Settlement History' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#2B313A] text-[#F0B90B] shadow'
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#848E9C] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTx}
              onChange={(e) => setSearchTx(e.target.value)}
              placeholder="Search by Tx ID / Wallet..."
              className="bg-[#181A20] border border-[#2B313A] rounded pl-8 pr-3 py-1.5 text-xs text-[#EAECEF] placeholder:text-[#474D57] focus:outline-none focus:border-[#F0B90B] font-mono transition-colors"
            />
          </div>
          <span className="text-[11px] text-[#848E9C] font-mono px-2 py-1 rounded bg-[#181A20] border border-[#2B313A]">
            {filtered.length} Records
          </span>
        </div>
      </div>

      {/* Main Table Body */}
      {activeTab === 'OPEN' ? (
        <div className="py-16 text-center text-[#848E9C] text-xs flex flex-col items-center justify-center space-y-2">
          <FileText className="w-8 h-8 text-[#2B313A]" />
          <span>You have no open limit or stop orders on the order book.</span>
        </div>
      ) : activeTab === 'ORDER_HISTORY' ? (
        <div className="py-16 text-center text-[#848E9C] text-xs flex flex-col items-center justify-center space-y-2">
          <Clock className="w-8 h-8 text-[#2B313A]" />
          <span>All previous limit orders have been completely filled or settled.</span>
        </div>
      ) : (
        /* Wide Tabular Component for Transaction / Settlement History */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#2B313A] text-[#848E9C] text-[11px] uppercase tracking-wider font-sans">
                <th className="py-3 px-3 font-medium">Timestamp (UTC)</th>
                <th className="py-3 px-3 font-medium">Pair / Direction</th>
                <th className="py-3 px-3 font-medium">Tx Hash</th>
                <th className="py-3 px-3 font-medium">Counterparty Wallet</th>
                <th className="py-3 px-3 font-medium text-right">Settled Amount</th>
                <th className="py-3 px-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B313A]/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#848E9C] text-xs font-sans">
                    Synchronizing exchange settlement records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#848E9C] text-xs font-sans">
                    No transactions found for this account. Send an instant peer transfer to generate history.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isIncoming = tx.destinationWallet === currentWalletId;
                  const isSuccess = tx.status === 'SUCCESS';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#2B313A]/30 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-3 text-[#848E9C] whitespace-nowrap text-[11px]">
                        {tx.timestamp}
                      </td>

                      {/* Direction */}
                      <td className="py-3 px-3 whitespace-nowrap font-sans">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isIncoming
                              ? 'bg-[#0ECB81]/15 text-[#0ECB81]'
                              : 'bg-[#F6465D]/15 text-[#F6465D]'
                          }`}
                        >
                          {isIncoming ? 'BUY / RECEIVE' : 'TRANSFER / OUT'}
                        </span>
                      </td>

                      {/* Tx Hash */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => copyToClipboard(tx.hash, tx.id)}
                          className="flex items-center space-x-1.5 text-[#EAECEF] hover:text-[#F0B90B] cursor-pointer group text-[11px]"
                          title="Click to copy SHA-256 hash"
                        >
                          <span>{tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}</span>
                          {copiedHash === tx.id ? (
                            <Check className="w-3 h-3 text-[#0ECB81]" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#848E9C]" />
                          )}
                        </button>
                      </td>

                      {/* Counterparty */}
                      <td className="py-3 px-3 text-[#848E9C] text-[11px]">
                        {isIncoming ? (
                          <span>From: {tx.sourceWallet.slice(0, 8)}...</span>
                        ) : (
                          <span>To: {tx.destinationWallet.slice(0, 8)}...</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-3 px-3 text-right font-bold text-xs whitespace-nowrap ${
                          isIncoming ? 'text-[#0ECB81]' : 'text-[#EAECEF]'
                        }`}
                      >
                        {isIncoming ? '+' : '-'}${tx.amount.toFixed(2)} USD
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-medium ${
                            isSuccess
                              ? 'bg-[#0ECB81]/10 text-[#0ECB81] border border-[#0ECB81]/30'
                              : 'bg-[#F6465D]/10 text-[#F6465D] border border-[#F6465D]/30'
                          }`}
                        >
                          {isSuccess ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>FILLED</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>CANCELLED</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
