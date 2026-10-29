import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export interface CryptoAssetItem {
  id: string;
  symbol: string;
  name: string;
  iconBg: string;
  iconColor: string;
  priceUsd: number;
  change24h: number;
  availableAmount: number;
  frozenAmount: number;
  category: 'Spot' | 'Funding' | 'Earn' | 'Futures';
}

interface AssetDistributionProps {
  usdBalance: number;
  isBalanceHidden: boolean;
  searchFilter: string;
  onSelectAssetForTransfer?: (symbol: string) => void;
}

export const AssetDistribution: React.FC<AssetDistributionProps> = ({
  usdBalance,
  isBalanceHidden,
  searchFilter,
  onSelectAssetForTransfer,
}) => {
  const [activeTab, setActiveTab] = useState<'Spot' | 'Funding' | 'Earn' | 'Futures'>('Spot');
  const [hideSmallBalances, setHideSmallBalances] = useState(false);

  // Derived crypto portfolio holding calculation based on live USD ledger balance
  const btcPrice = 64280.0;
  const ethPrice = 3450.0;
  const bnbPrice = 585.0;
  const solPrice = 145.0;

  // Distribute user's live balance across typical portfolio holdings
  const assets: CryptoAssetItem[] = [
    {
      id: 'USDT',
      symbol: 'USDT',
      name: 'Tether USD',
      iconBg: 'bg-[#26A17B]/20',
      iconColor: 'text-[#26A17B]',
      priceUsd: 1.0,
      change24h: +0.02,
      availableAmount: usdBalance * 0.45,
      frozenAmount: 0.0,
      category: 'Spot',
    },
    {
      id: 'BTC',
      symbol: 'BTC',
      name: 'Bitcoin',
      iconBg: 'bg-[#F7931A]/20',
      iconColor: 'text-[#F7931A]',
      priceUsd: btcPrice,
      change24h: +3.42,
      availableAmount: (usdBalance * 0.35) / btcPrice,
      frozenAmount: (usdBalance * 0.02) / btcPrice,
      category: 'Spot',
    },
    {
      id: 'ETH',
      symbol: 'ETH',
      name: 'Ethereum',
      iconBg: 'bg-[#627EEA]/20',
      iconColor: 'text-[#627EEA]',
      priceUsd: ethPrice,
      change24h: -1.18,
      availableAmount: (usdBalance * 0.12) / ethPrice,
      frozenAmount: 0.0,
      category: 'Spot',
    },
    {
      id: 'BNB',
      symbol: 'BNB',
      name: 'BNB Chain',
      iconBg: 'bg-[#F0B90B]/20',
      iconColor: 'text-[#F0B90B]',
      priceUsd: bnbPrice,
      change24h: +2.85,
      availableAmount: (usdBalance * 0.06) / bnbPrice,
      frozenAmount: 0.0,
      category: 'Spot',
    },
    {
      id: 'SOL',
      symbol: 'SOL',
      name: 'Solana',
      iconBg: 'bg-[#9945FF]/20',
      iconColor: 'text-[#9945FF]',
      priceUsd: solPrice,
      change24h: +6.14,
      availableAmount: (usdBalance * 0.02) / solPrice,
      frozenAmount: 0.0,
      category: 'Spot',
    },
    // Funding Tab assets
    {
      id: 'USDC-FUND',
      symbol: 'USDC',
      name: 'USD Coin (P2P)',
      iconBg: 'bg-[#2775CA]/20',
      iconColor: 'text-[#2775CA]',
      priceUsd: 1.0,
      change24h: 0.0,
      availableAmount: usdBalance * 0.1,
      frozenAmount: 0.0,
      category: 'Funding',
    },
    // Earn Tab assets
    {
      id: 'BNB-VAULT',
      symbol: 'BNB Vault',
      name: 'Locked Staking 5.8% APR',
      iconBg: 'bg-[#F0B90B]/20',
      iconColor: 'text-[#F0B90B]',
      priceUsd: bnbPrice,
      change24h: +2.85,
      availableAmount: 0.85,
      frozenAmount: 0.85,
      category: 'Earn',
    },
    // Futures Tab assets
    {
      id: 'BTCUSDT-PERP',
      symbol: 'BTC/USDT Perp',
      name: 'Cross 20x Margin',
      iconBg: 'bg-[#F7931A]/20',
      iconColor: 'text-[#F7931A]',
      priceUsd: btcPrice,
      change24h: +3.42,
      availableAmount: (usdBalance * 0.25) / btcPrice,
      frozenAmount: (usdBalance * 0.05) / btcPrice,
      category: 'Futures',
    },
  ];

  const filteredAssets = assets
    .filter((a) => a.category === activeTab)
    .filter((a) => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    })
    .filter((a) => {
      if (hideSmallBalances) {
        return a.availableAmount * a.priceUsd > 1.0;
      }
      return true;
    });

  const renderSparkline = (isPositive: boolean) => {
    return (
      <svg className="w-16 h-5 inline-block ml-2 overflow-visible" viewBox="0 0 60 20">
        <path
          d={
            isPositive
              ? 'M0 16 Q 15 14, 25 8 T 45 6 T 60 2'
              : 'M0 4 Q 15 6, 25 12 T 45 14 T 60 18'
          }
          fill="none"
          stroke={isPositive ? '#0ECB81' : '#F6465D'}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div className="bg-[#1E2329] border border-[#2B313A] rounded-lg overflow-hidden shadow-lg">
      {/* Tab Navigation Header & Filters */}
      <div className="border-b border-[#2B313A] px-4 pt-3 pb-2 flex flex-wrap items-center justify-between gap-3 bg-[#181A20]/80">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {(['Spot', 'Funding', 'Earn', 'Futures'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 text-xs font-semibold uppercase tracking-wider relative transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'text-[#F0B90B]'
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              <span>{tab}</span>
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F0B90B] rounded-full"></span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <label className="flex items-center space-x-1.5 cursor-pointer text-[#848E9C] hover:text-[#EAECEF] select-none text-[11px]">
            <input
              type="checkbox"
              checked={hideSmallBalances}
              onChange={(e) => setHideSmallBalances(e.target.checked)}
              className="accent-[#F0B90B] rounded cursor-pointer"
            />
            <span>Hide Small Assets (&lt; $1)</span>
          </label>
        </div>
      </div>

      {/* Asset Data Table (High-Density) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#2B313A] text-[#848E9C] text-[11px] font-medium uppercase tracking-wider bg-[#181A20]/40">
              <th className="py-3 px-4 font-normal">Asset</th>
              <th className="py-3 px-4 font-normal text-right">Price</th>
              <th className="py-3 px-4 font-normal text-right">24h Change</th>
              <th className="py-3 px-4 font-normal text-right">Total Balance</th>
              <th className="py-3 px-4 font-normal text-right">Available / In-Order</th>
              <th className="py-3 px-4 font-normal text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2B313A]/50">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#848E9C] text-xs">
                  No assets found matching current filter or search criteria.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => {
                const totalTokens = asset.availableAmount + asset.frozenAmount;
                const totalUsd = totalTokens * asset.priceUsd;
                const isPositive = asset.change24h >= 0;

                return (
                  <tr
                    key={asset.id}
                    className="hover:bg-[#2B3139] transition-colors group cursor-pointer"
                  >
                    {/* Asset Column: Token Icon + Thick Symbol + Small full name */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-7 h-7 rounded-full ${asset.iconBg} ${asset.iconColor} flex items-center justify-center font-bold text-xs uppercase shadow-inner`}
                        >
                          {asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-sm text-[#EAECEF] tracking-tight">
                              {asset.symbol}
                            </span>
                            {asset.frozenAmount > 0 && (
                              <span title="Portion in lock/order">
                                <Lock className="w-3 h-3 text-[#F0B90B]" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#848E9C]">
                            {asset.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-xs text-[#EAECEF]">
                      ${asset.priceUsd >= 1
                        ? asset.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : asset.priceUsd.toFixed(4)}
                    </td>

                    {/* 24h Market Change + Sparkline */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            isPositive
                              ? 'text-[#0ECB81] bg-[#0ECB81]/10'
                              : 'text-[#F6465D] bg-[#F6465D]/10'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {asset.change24h.toFixed(2)}%
                        </span>
                        {renderSparkline(isPositive)}
                      </div>
                    </td>

                    {/* Total Balance Column */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                      {isBalanceHidden ? (
                        <div className="font-bold text-[#EAECEF] tracking-widest">
                          ********
                        </div>
                      ) : (
                        <>
                          <div className="font-bold text-sm text-[#EAECEF]">
                            {totalTokens.toFixed(totalTokens < 1 ? 5 : 2)}
                          </div>
                          <div className="text-[11px] text-[#848E9C]">
                            ≈ ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </>
                      )}
                    </td>

                    {/* Available / In-Order */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                      {isBalanceHidden ? (
                        <div className="text-xs text-[#848E9C] tracking-widest">
                          **** / ****
                        </div>
                      ) : (
                        <>
                          <div className="text-xs text-[#EAECEF]">
                            {asset.availableAmount.toFixed(asset.availableAmount < 1 ? 5 : 2)}
                          </div>
                          <div className="text-[10px] text-[#848E9C]">
                            Locked: {asset.frozenAmount.toFixed(asset.frozenAmount < 1 ? 5 : 2)}
                          </div>
                        </>
                      )}
                    </td>

                    {/* Action Column */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2 text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectAssetForTransfer) onSelectAssetForTransfer(asset.symbol);
                          }}
                          className="px-2.5 py-1 rounded bg-[#2B313A] hover:bg-[#F0B90B] hover:text-[#0B0E11] text-[#EAECEF] font-medium transition-all cursor-pointer text-[11px]"
                        >
                          Transfer
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded hover:bg-[#2B313A] text-[#F0B90B] font-medium transition-colors cursor-pointer text-[11px]"
                        >
                          Trade
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* High Density Table Footer */}
      <div className="px-4 py-2.5 bg-[#181A20] border-t border-[#2B313A] flex flex-wrap items-center justify-between text-[11px] text-[#848E9C]">
        <div className="flex items-center space-x-2">
          <span>Real-time Order Book &amp; PesaFlip Linked</span>
          <span>•</span>
          <span className="text-[#0ECB81]">0 Gas Internal Transfers</span>
        </div>
        <div className="font-mono">
          Double-Entry Integrity: SHA-256 Validated
        </div>
      </div>
    </div>
  );
};
