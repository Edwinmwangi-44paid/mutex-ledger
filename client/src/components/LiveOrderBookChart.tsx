import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart2,
  Maximize2,
  Clock,
  Layers,
} from 'lucide-react';

export const LiveOrderBookChart: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CHART' | 'ORDER_BOOK'>('ORDER_BOOK');
  const [timeframe, setTimeframe] = useState<'1m' | '15m' | '1h' | '4h' | '1D'>('15m');

  // Simulated live high-frequency order book depth matching BTC/USDT spot
  const asks = [
    { price: 64288.5, size: 0.842, total: 54130.9, depth: 85 },
    { price: 64287.0, size: 1.250, total: 80358.7, depth: 72 },
    { price: 64286.2, size: 0.418, total: 26871.6, depth: 48 },
    { price: 64285.5, size: 2.180, total: 140142.3, depth: 95 },
    { price: 64284.0, size: 0.525, total: 33749.1, depth: 32 },
  ];

  const bids = [
    { price: 64282.0, size: 0.940, total: 60425.0, depth: 62 },
    { price: 64281.5, size: 1.840, total: 118277.9, depth: 88 },
    { price: 64280.0, size: 3.120, total: 200553.6, depth: 100 },
    { price: 64278.5, size: 0.720, total: 46280.5, depth: 42 },
    { price: 64277.0, size: 1.450, total: 93201.6, depth: 70 },
  ];

  return (
    <div className="bg-[#1E2329] border border-[#2B313A] rounded-xl p-5 shadow-lg flex flex-col justify-between h-full">
      <div>
        {/* Header Tabs: Order Book / Chart Canvas */}
        <div className="flex items-center justify-between border-b border-[#2B313A] pb-3 mb-4">
          <div className="flex items-center space-x-1 bg-[#181A20] p-1 rounded-lg border border-[#2B313A]">
            <button
              onClick={() => setActiveTab('ORDER_BOOK')}
              className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'ORDER_BOOK'
                  ? 'bg-[#2B313A] text-[#F0B90B] shadow'
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Live Order Book</span>
            </button>
            <button
              onClick={() => setActiveTab('CHART')}
              className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'CHART'
                  ? 'bg-[#2B313A] text-[#F0B90B] shadow'
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>BTC/USDT Chart</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#848E9C] flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#0ECB81] animate-pulse"></span>
              <span className="font-mono text-[11px]">Real-time Feed</span>
            </span>
          </div>
        </div>

        {activeTab === 'ORDER_BOOK' ? (
          <div>
            {/* Market Spread Bar */}
            <div className="flex items-center justify-between text-[11px] text-[#848E9C] px-1 pb-2 font-mono">
              <span>Price (USDT)</span>
              <span>Size (BTC)</span>
              <span>Total (USDT)</span>
            </div>

            {/* Asks (Sells - Red) */}
            <div className="space-y-1 font-mono text-xs">
              {asks.map((ask, idx) => (
                <div key={idx} className="relative flex items-center justify-between py-1 px-1.5 rounded hover:bg-[#2B313A]/40 transition-colors">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-[#F6465D]/15 rounded pointer-events-none transition-all duration-300"
                    style={{ width: `${ask.depth}%` }}
                  />
                  <span className="text-[#F6465D] font-medium z-10">{ask.price.toFixed(1)}</span>
                  <span className="text-[#EAECEF] z-10">{ask.size.toFixed(3)}</span>
                  <span className="text-[#848E9C] text-[11px] z-10">${ask.total.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Mid Price & Spread */}
            <div className="my-3 py-2 px-3 bg-[#181A20] rounded border border-[#2B313A] flex items-center justify-between font-mono">
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-[#0ECB81] flex items-center">
                  $64,282.50
                  <TrendingUp className="w-3.5 h-3.5 ml-1 text-[#0ECB81]" />
                </span>
                <span className="text-[11px] text-[#848E9C]">Spot Price</span>
              </div>
              <span className="text-[11px] text-[#848E9C]">Spread: 2.0 (0.003%)</span>
            </div>

            {/* Bids (Buys - Green) */}
            <div className="space-y-1 font-mono text-xs">
              {bids.map((bid, idx) => (
                <div key={idx} className="relative flex items-center justify-between py-1 px-1.5 rounded hover:bg-[#2B313A]/40 transition-colors">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-[#0ECB81]/15 rounded pointer-events-none transition-all duration-300"
                    style={{ width: `${bid.depth}%` }}
                  />
                  <span className="text-[#0ECB81] font-medium z-10">{bid.price.toFixed(1)}</span>
                  <span className="text-[#EAECEF] z-10">{bid.size.toFixed(3)}</span>
                  <span className="text-[#848E9C] text-[11px] z-10">${bid.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Interactive Chart Canvas Placeholder */
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                {(['1m', '15m', '1h', '4h', '1D'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      timeframe === tf
                        ? 'bg-[#F0B90B] text-[#0B0E11] font-bold'
                        : 'text-[#848E9C] hover:text-[#EAECEF]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-[#848E9C] font-mono">
                <span>O: 63,940.0</span>
                <span>H: 64,480.0</span>
                <span>L: 63,820.0</span>
                <span className="text-[#0ECB81]">C: 64,282.5</span>
              </div>
            </div>

            {/* Canvas / SVG Chart Graphic */}
            <div className="h-64 bg-[#181A20] rounded border border-[#2B313A] relative flex items-end p-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0ECB81]/10 via-transparent to-transparent pointer-events-none" />
              {/* Candlestick & Volume Simulated Bars */}
              <div className="w-full h-full flex items-end justify-between gap-1 z-10 pt-6">
                {[42, 48, 45, 52, 58, 55, 62, 60, 68, 74, 71, 79, 85, 82, 88, 92, 89, 96].map((h, i) => {
                  const isUp = i % 3 !== 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-crosshair">
                      <div
                        className={`w-0.5 ${isUp ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`}
                        style={{ height: `${Math.min(100, h + 10)}%` }}
                      />
                      <div
                        className={`w-full max-w-[12px] rounded-xs transition-all ${
                          isUp ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="absolute top-3 right-3 text-[#848E9C] text-[10px] font-mono flex items-center space-x-1 bg-[#1E2329]/80 px-2 py-1 rounded border border-[#2B313A]">
                <Clock className="w-3 h-3 text-[#F0B90B]" />
                <span>TradingView Engine v2.4</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-[#2B313A] flex items-center justify-between text-[11px] text-[#848E9C]">
        <span className="flex items-center space-x-1">
          <span>Depth Liquidity:</span>
          <strong className="text-[#EAECEF] font-mono font-medium">$1,482,900 USD</strong>
        </span>
        <span className="text-[10px] text-[#848E9C] flex items-center space-x-1 cursor-pointer hover:text-[#EAECEF]">
          <Maximize2 className="w-3 h-3" />
          <span>Expand View</span>
        </span>
      </div>
    </div>
  );
};
