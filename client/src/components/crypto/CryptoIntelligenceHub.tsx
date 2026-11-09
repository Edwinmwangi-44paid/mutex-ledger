import React, { useState, useEffect } from 'react';
import {
  LineChart as ChartIcon,
  TrendingUp,
  Search,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface CryptoIntelligenceHubProps {
  apiBase: string;
}

export const CryptoIntelligenceHub: React.FC<CryptoIntelligenceHubProps> = ({ apiBase }) => {
  const [overview, setOverview] = useState<any>(null);
  const [coins, setCoins] = useState<any[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<string>('7d');
  const [search, setSearch] = useState<string>('');
  const [, setLoading] = useState<boolean>(true);
const [loadingChart, setLoadingChart] = useState<boolean>(false);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pesaflip_crypto_watchlist') || '["bitcoin", "ethereum", "solana"]');
    } catch {
      return ['bitcoin', 'ethereum', 'solana'];
    }
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCoin) {
      fetchChart(selectedCoin.id, timeframe);
    }
  }, [selectedCoin, timeframe]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [ovRes, coinsRes] = await Promise.all([
        fetch(`${apiBase}/crypto/overview`),
        fetch(`${apiBase}/crypto/coins`),
      ]);
      if (ovRes.ok && coinsRes.ok) {
        const ovJson = await ovRes.json();
        const coinsJson = await coinsRes.json();
        setOverview(ovJson);
        setCoins(coinsJson);
        if (coinsJson.length > 0) {
          setSelectedCoin(coinsJson[0]);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const fetchChart = async (coinId: string, tf: string) => {
    setLoadingChart(true);
    try {
      const res = await fetch(`${apiBase}/crypto/coins/${coinId}/chart?timeframe=${tf}`);
      if (res.ok) {
        const data = await res.json();
        setChartData(data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingChart(false);
    }
  };

  const toggleWatchlist = (coinId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist((prev) => {
      const next = prev.includes(coinId)
        ? prev.filter((id) => id !== coinId)
        : [...prev, coinId];
      localStorage.setItem('pesaflip_crypto_watchlist', JSON.stringify(next));
      return next;
    });
  };

  const filteredCoins = coins.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Editorial Header - Micro-1 Polished */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/[0.08] p-6 md:p-8 mesh-glow-cyan">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold shadow-inner">
            <ChartIcon className="w-3.5 h-3.5" />
            <span>Pure Market Intelligence • Non-Custodial Data Feed</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            TradingView Market Intelligence
          </h1>
          <p className="text-sm md:text-base text-gray-400 leading-relaxed">
            Real-time global capitalization, Bitcoin dominance, interactive multi-timeframe analytics, and transparent on-chain coin metrics.
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4.5 rounded-2xl glass-panel border border-white/[0.07] space-y-1.5 shadow-sm">
            <span className="text-xs text-gray-400 font-medium">Total Market Cap</span>
            <div className="text-lg md:text-xl font-bold text-white font-mono tracking-tight">
              ${(overview.total_market_cap / 1e12).toFixed(2)} Trillion
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>+{overview.market_cap_change_24h}% 24h</span>
            </div>
          </div>

          <div className="p-4.5 rounded-2xl glass-panel border border-white/[0.07] space-y-1.5 shadow-sm">
            <span className="text-xs text-gray-400 font-medium">Bitcoin Dominance</span>
            <div className="text-lg md:text-xl font-bold text-white font-mono tracking-tight">
              {overview.btc_dominance}%
            </div>
            <span className="text-[11px] text-gray-500">Global Share</span>
          </div>

          <div className="p-4.5 rounded-2xl glass-panel border border-white/[0.07] space-y-1.5 shadow-sm">
            <span className="text-xs text-gray-400 font-medium">24h Global Volume</span>
            <div className="text-lg md:text-xl font-bold text-white font-mono tracking-tight">
              ${(overview.total_volume_24h / 1e9).toFixed(1)} Billion
            </div>
            <span className="text-[11px] text-gray-500">Liquidity Volume</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#121620] border border-[#1F2533] space-y-1">
            <span className="text-xs text-gray-400 font-medium">Top Mover Today</span>
            <div className="text-lg md:text-xl font-bold text-emerald-400">
              {overview.top_gainers[0]?.name} (+{overview.top_gainers[0]?.change_24h}%)
            </div>
            <span className="text-[11px] text-gray-500">Highest 24h Gain</span>
          </div>
        </div>
      )}

      {/* Main Dual Grid: Interactive Chart + Assets Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Coin Explorer & Chart (7 cols) */}
        {selectedCoin && (
          <div className="lg:col-span-7 rounded-2xl bg-[#131722] border border-[#202636] p-6 space-y-6">
            {/* Coin Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCoin.logo}
                  alt={selectedCoin.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">{selectedCoin.name}</h2>
                    <span className="text-xs font-bold text-gray-400 uppercase bg-[#1C2130] px-2 py-0.5 rounded">
                      {selectedCoin.symbol}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">Market Rank #{selectedCoin.rank}</div>
                </div>
              </div>

              {/* Price & Change */}
              <div className="text-right">
                <div className="text-2xl font-black text-white">
                  ${selectedCoin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div
                  className={`text-xs font-bold flex items-center justify-end gap-1 ${
                    selectedCoin.change_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedCoin.change_24h >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  <span>{selectedCoin.change_24h}% (24h)</span>
                </div>
              </div>
            </div>

            {/* Timeframe Controls */}
            <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl w-fit backdrop-blur-md">
              {['1h', '24h', '7d', '30d', '90d', '1y', 'all'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase transition-all active:scale-95 cursor-pointer ${
                    timeframe === tf
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-lg shadow-cyan-500/20 font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Interactive SVG Chart Canvas */}
            <div className="h-64 relative flex items-center justify-center bg-black/40 rounded-2xl border border-white/[0.06] p-3 shadow-inner">
              {loadingChart ? (
                <div className="text-xs text-gray-400 animate-pulse">Generating price curve...</div>
              ) : chartData && chartData.points?.length > 1 ? (
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* SVG Points Calculation */}
                  {(() => {
                    const pts = chartData.points;
                    const min = Math.min(...pts.map((p: any) => p.price));
                    const max = Math.max(...pts.map((p: any) => p.price));
                    const range = max - min || 1;

                    const coords = pts.map((p: any, idx: number) => {
                      const x = (idx / (pts.length - 1)) * 500;
                      const y = 200 - ((p.price - min) / range) * 170 - 15;
                      return `${x},${y}`;
                    });

                    const pathLine = `M ${coords.join(' L ')}`;
                    const pathArea = `${pathLine} L 500,200 L 0,200 Z`;

                    return (
                      <>
                        <path d={pathArea} fill="url(#chartGradient)" />
                        <path
                          d={pathLine}
                          fill="none"
                          stroke="#06B6D4"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </>
                    );
                  })()}
                </svg>
              ) : (
                <div className="text-xs text-gray-500">Historical chart data preview</div>
              )}
            </div>

            {/* In-depth Asset Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#0F121A] border border-[#1B212D]">
                <div className="text-[11px] text-gray-500 font-medium">Market Capitalization</div>
                <div className="text-sm font-bold text-white mt-1">
                  ${(selectedCoin.market_cap / 1e9).toFixed(2)}B
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0F121A] border border-[#1B212D]">
                <div className="text-[11px] text-gray-500 font-medium">Circulating Supply</div>
                <div className="text-sm font-bold text-white mt-1">
                  {selectedCoin.circulating_supply.toLocaleString()} {selectedCoin.symbol}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0F121A] border border-[#1B212D]">
                <div className="text-[11px] text-gray-500 font-medium">All Time High (ATH)</div>
                <div className="text-sm font-bold text-white mt-1">
                  ${selectedCoin.all_time_high.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Asset Description */}
            <div className="p-4 rounded-xl bg-[#0F121A] border border-[#1B212D] text-xs text-gray-300 leading-relaxed">
              <div className="font-bold text-white mb-1">About {selectedCoin.name}</div>
              {selectedCoin.description}
            </div>
          </div>
        )}

        {/* Right Column: Tracked Assets Table (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#131722] border border-[#202636] p-4 flex flex-col space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coin name or symbol..."
              className="w-full pl-9 pr-3 py-2 bg-[#0F121A] border border-[#1F2535] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none"
            />
          </div>

          {/* Coins List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[620px]">
            {filteredCoins.map((coin) => {
              const isSelected = selectedCoin?.id === coin.id;
              const isWatched = watchlist.includes(coin.id);

              return (
                <div
                  key={coin.id}
                  onClick={() => setSelectedCoin(coin)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/30 border border-cyan-500/40 text-white'
                      : 'hover:bg-[#1A202D] border border-transparent text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => toggleWatchlist(coin.id, e)}
                      className="text-gray-500 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isWatched ? 'text-amber-400 fill-amber-400' : ''
                        }`}
                      />
                    </button>
                    <img src={coin.logo} alt={coin.name} className="w-7 h-7 rounded-full" />
                    <div>
                      <div className="text-xs font-bold text-white">{coin.name}</div>
                      <div className="text-[10px] text-gray-400 uppercase">{coin.symbol}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-white">
                      ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`text-[10px] font-semibold ${
                        coin.change_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {coin.change_24h >= 0 ? '+' : ''}
                      {coin.change_24h}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
