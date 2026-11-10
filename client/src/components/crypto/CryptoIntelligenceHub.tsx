import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TrendingUp,
  Search,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  LineChart as LineIcon,
  Activity,
  Layers,
  Loader2,
} from 'lucide-react';
import { FinnhubClient, FinnhubTrade } from '../../services/finnhubClient';

interface CryptoIntelligenceHubProps {
  apiBase: string;
}

export const CryptoIntelligenceHub: React.FC<CryptoIntelligenceHubProps> = ({ apiBase }) => {
  const [overview, setOverview] = useState<any>(null);
  const [coins, setCoins] = useState<any[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<string>('7d');
  const [activeTab, setActiveTab] = useState<'all' | 'crypto' | 'stocks' | 'forex'>('all');
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('candlestick');
  const [showIndicators, setShowIndicators] = useState<boolean>(true);
  const [hoveredCandle, setHoveredCandle] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadingChart, setLoadingChart] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pesaflip_crypto_watchlist') || '["bitcoin", "aapl", "eur-usd"]');
    } catch {
      return ['bitcoin', 'aapl', 'eur-usd'];
    }
  });

  const finnhubClientRef = useRef<FinnhubClient | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    fetchInitialData();

    // Permanent WebSocket streaming for high-frequency crypto & stock updates
    const client = new FinnhubClient({
      apiKey: 'dbpjv1hr01qr0r9nu7dgdbpjv1hr01qr0r9nu7e0',
      autoSubscribeTickers: [
        'BINANCE:BTCUSDT',
        'BINANCE:ETHUSDT',
        'BINANCE:SOLUSDT',
        'BINANCE:XRPUSDT',
        'BINANCE:BNBUSDT',
        'BINANCE:DOGEUSDT',
        'BINANCE:ADAUSDT',
        'BINANCE:AVAXUSDT',
        'BINANCE:LINKUSDT',
        'BINANCE:SUIUSDT',
        'AAPL',
        'NVDA',
        'MSFT',
        'AMZN',
        'GOOGL',
        'TSLA',
      ],
      onTrade: (trade: FinnhubTrade) => {
        handleIncomingTrade(trade);
      },
    });

    finnhubClientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, []);

  const handleIncomingTrade = (trade: FinnhubTrade) => {
    const symbolMap: Record<string, string> = {
      'BINANCE:BTCUSDT': 'bitcoin',
      'BINANCE:ETHUSDT': 'ethereum',
      'BINANCE:SOLUSDT': 'solana',
      'BINANCE:XRPUSDT': 'ripple',
      'BINANCE:BNBUSDT': 'binancecoin',
      'BINANCE:DOGEUSDT': 'dogecoin',
      'BINANCE:ADAUSDT': 'cardano',
      'BINANCE:AVAXUSDT': 'avalanche-2',
      'BINANCE:LINKUSDT': 'chainlink',
      'BINANCE:SUIUSDT': 'sui',
      'AAPL': 'aapl',
      'NVDA': 'nvda',
      'MSFT': 'msft',
      'AMZN': 'amzn',
      'GOOGL': 'googl',
      'TSLA': 'tsla',
    };

    const assetId = symbolMap[trade.s];
    if (!assetId) return;

    setCoins((prevCoins) =>
      prevCoins.map((c) => (c.id === assetId ? { ...c, price: trade.p } : c))
    );

    setSelectedCoin((prev: any) => {
      if (prev && prev.id === assetId) {
        return { ...prev, price: trade.p };
      }
      return prev;
    });
  };

  // Reset page and reload on tab or search change
  useEffect(() => {
    setPage(1);
    fetchAssetPage(1, true);
  }, [activeTab, search]);

  useEffect(() => {
    if (selectedCoin) {
      fetchChart(selectedCoin.id, timeframe);
    }
  }, [selectedCoin?.id, timeframe]);

  const fetchInitialData = async () => {
    setLoadingInitial(true);
    try {
      const ovRes = await fetch(`${apiBase}/crypto/overview`);
      if (ovRes.ok) {
        const ovJson = await ovRes.json();
        setOverview(ovJson);
      }
      await fetchAssetPage(1, true);
    } catch {
      /* ignore */
    } finally {
      setLoadingInitial(false);
    }
  };

  const fetchAssetPage = async (pageNumber: number, reset = false) => {
    if (!reset) setLoadingMore(true);
    try {
      let url = `${apiBase}/crypto/coins?page=${pageNumber}&limit=16`;
      if (activeTab !== 'all') url += `&category=${activeTab}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const newItems = data.items || [];
        setHasMore(data.has_more ?? false);

        setCoins((prev) => (reset ? newItems : [...prev, ...newItems]));
        if (reset && newItems.length > 0 && !selectedCoin) {
          setSelectedCoin(newItems[0]);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  };

  // Infinite scroll trigger callback
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore || loadingInitial) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => {
            const nextPage = prev + 1;
            fetchAssetPage(nextPage, false);
            return nextPage;
          });
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loadingMore, hasMore, loadingInitial, activeTab, search]
  );

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
      const next = prev.includes(coinId) ? prev.filter((id) => id !== coinId) : [...prev, coinId];
      localStorage.setItem('pesaflip_crypto_watchlist', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Editorial Platform Header */}
      <div className="relative rounded-3xl overflow-hidden micro-card border border-black/[0.08] dark:border-white/[0.08] p-6 md:p-8 micro-glow-cyan shadow-xl">
        <div className="max-w-3xl space-y-2 relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
            TradingView Market Intelligence
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-[#94A3B8] leading-relaxed">
            Real-time global capitalization, Bitcoin dominance, interactive multi-timeframe analytics, and transparent on-chain coin metrics.
          </p>
        </div>
      </div>

      {/* SKELETON LOADING FRAME (Rendered when loading initial data) */}
      {loadingInitial ? (
        <div className="space-y-6 animate-pulse">
          {/* Skeleton Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl micro-card border border-black/[0.06] dark:border-white/[0.06] p-4.5 space-y-2.5"
              >
                <div className="w-24 h-3 bg-black/[0.06] dark:bg-white/[0.08] rounded-md" />
                <div className="w-32 h-6 bg-black/[0.08] dark:bg-white/[0.12] rounded-md" />
                <div className="w-16 h-3 bg-black/[0.05] dark:bg-white/[0.06] rounded-md" />
              </div>
            ))}
          </div>

          {/* Skeleton Dual Explorer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 h-[540px] rounded-2xl micro-card border border-black/[0.06] dark:border-white/[0.06] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
                <div className="space-y-2">
                  <div className="w-32 h-5 bg-black/[0.08] dark:bg-white/[0.12] rounded-md" />
                  <div className="w-20 h-3 bg-black/[0.05] dark:bg-white/[0.06] rounded-md" />
                </div>
              </div>
              <div className="h-64 rounded-xl bg-black/[0.04] dark:bg-white/[0.04]" />
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="h-16 rounded-xl bg-black/[0.04] dark:bg-white/[0.04]" />
                <div className="h-16 rounded-xl bg-black/[0.04] dark:bg-white/[0.04]" />
                <div className="h-16 rounded-xl bg-black/[0.04] dark:bg-white/[0.04]" />
              </div>
            </div>

            <div className="lg:col-span-5 h-[540px] rounded-2xl micro-card border border-black/[0.06] dark:border-white/[0.06] p-4 space-y-3">
              <div className="h-9 rounded-xl bg-black/[0.06] dark:bg-white/[0.06]" />
              <div className="h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.04]" />
              <div className="space-y-2 pt-2">
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <div key={k} className="h-12 rounded-xl bg-black/[0.03] dark:bg-white/[0.03]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Metric Cards */}
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4.5 rounded-2xl micro-card border border-black/[0.08] dark:border-white/[0.07] space-y-1.5 shadow-sm">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Market Cap</span>
                <div className="text-lg md:text-xl font-bold text-gray-950 dark:text-white font-mono tracking-tight">
                  ${(overview.total_market_cap / 1e12).toFixed(2)} Trillion
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <TrendingUp className="w-3 h-3" />
                  <span>+{overview.market_cap_change_24h}% 24h</span>
                </div>
              </div>

              <div className="p-4.5 rounded-2xl micro-card border border-black/[0.08] dark:border-white/[0.07] space-y-1.5 shadow-sm">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Bitcoin Dominance</span>
                <div className="text-lg md:text-xl font-bold text-gray-950 dark:text-white font-mono tracking-tight">
                  {overview.btc_dominance}%
                </div>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">Global Share</span>
              </div>

              <div className="p-4.5 rounded-2xl micro-card border border-black/[0.08] dark:border-white/[0.07] space-y-1.5 shadow-sm">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">24h Global Volume</span>
                <div className="text-lg md:text-xl font-bold text-gray-950 dark:text-white font-mono tracking-tight">
                  ${(overview.total_volume_24h / 1e9).toFixed(1)} Billion
                </div>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">Liquidity Volume</span>
              </div>

              <div className="p-4.5 rounded-2xl micro-card border border-black/[0.08] dark:border-[#1F2533] space-y-1.5 shadow-sm">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Top Mover Today</span>
                <div className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {overview.top_gainers[0]?.name} (+{overview.top_gainers[0]?.change_24h}%)
                </div>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">Highest 24h Gain</span>
              </div>
            </div>
          )}

          {/* Main Dual Grid: Interactive Chart + Paginated Infinite-Scroll Assets */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Asset Explorer & Live Chart (7 cols) */}
            {selectedCoin && (
              <div className="lg:col-span-7 rounded-2xl micro-card border border-black/[0.08] dark:border-white/[0.08] p-6 space-y-6 shadow-sm">
                {/* Coin Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedCoin.logo}
                      alt={selectedCoin.name}
                      className="w-10 h-10 rounded-full p-1 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCoin.symbol)}&background=3E4FFF&color=fff&size=64`;
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-gray-950 dark:text-white">{selectedCoin.name}</h2>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.06] px-2 py-0.5 rounded-md">
                          {selectedCoin.symbol}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/20">
                          {selectedCoin.category === 'forex' ? 'Forex' : selectedCoin.category === 'stocks' ? 'US Equity' : 'Crypto'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Market Rank #{selectedCoin.rank}</div>
                    </div>
                  </div>

                  {/* Price & Change */}
                  <div className="text-right">
                    <div className="text-2xl font-black text-gray-950 dark:text-white font-mono">
                      ${selectedCoin.price.toLocaleString(undefined, {
                        minimumFractionDigits: selectedCoin.price < 2 ? 4 : 2,
                        maximumFractionDigits: selectedCoin.price < 2 ? 4 : 2,
                      })}
                    </div>
                    <div
                      className={`text-xs font-bold flex items-center justify-end gap-1 font-mono ${
                        selectedCoin.change_24h >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {selectedCoin.change_24h >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{selectedCoin.change_24h}% (24h)</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Analysis Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-b border-black/[0.06] dark:border-white/[0.06] py-3">
                  {/* Chart Mode Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] rounded-xl">
                    <button
                      onClick={() => setChartType('candlestick')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        chartType === 'candlestick'
                          ? 'bg-[#3E4FFF] text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Candlesticks</span>
                    </button>
                    <button
                      onClick={() => setChartType('line')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        chartType === 'line'
                          ? 'bg-[#3E4FFF] text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <LineIcon className="w-3.5 h-3.5" />
                      <span>Line</span>
                    </button>
                  </div>

                  {/* Indicator Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowIndicators((prev) => !prev)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        showIndicators
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                          : 'bg-black/[0.02] dark:bg-white/[0.02] text-gray-500 border-black/10 dark:border-white/10'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>SMA (7)</span>
                    </button>
                  </div>

                  {/* Timeframe Controls */}
                  <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] rounded-xl backdrop-blur-md">
                    {['1h', '24h', '7d', '30d', '90d', '1y', 'all'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold uppercase transition-all cursor-pointer ${
                          timeframe === tf
                            ? 'bg-[#3E4FFF] text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Inspection Bar (Hover / Active Candle) */}
                <div className="flex items-center justify-between text-[11px] font-mono px-1 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] text-gray-600 dark:text-gray-400">
                  {hoveredCandle ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-gray-900 dark:text-white font-bold">{new Date(hoveredCandle.timestamp).toLocaleString()}</span>
                      <span>O: <strong className="text-gray-900 dark:text-white">${hoveredCandle.open}</strong></span>
                      <span>H: <strong className="text-emerald-500">${hoveredCandle.high}</strong></span>
                      <span>L: <strong className="text-rose-500">${hoveredCandle.low}</strong></span>
                      <span>C: <strong className="text-gray-900 dark:text-white">${hoveredCandle.close}</strong></span>
                      {hoveredCandle.sma7 && <span className="text-indigo-400 font-bold">SMA: ${hoveredCandle.sma7}</span>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3 text-[#3E4FFF]" />
                      <span>Hover across bars to inspect candle OHLC and technical metrics in real time</span>
                    </div>
                  )}
                </div>

                {/* Interactive SVG Chart Canvas (Candlestick + Line Modes) */}
                <div className="h-72 relative flex items-center justify-center bg-black/[0.02] dark:bg-black/50 rounded-2xl border border-black/[0.08] dark:border-white/[0.06] p-4 shadow-inner">
                  {loadingChart ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">Loading live market candles...</div>
                  ) : chartData && chartData.points?.length > 1 ? (
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 600 240">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.30" />
                          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {(() => {
                        const candles = chartData.points;
                        const min = Math.min(...candles.map((p: any) => p.low ?? p.price));
                        const max = Math.max(...candles.map((p: any) => p.high ?? p.price));
                        const range = max - min || 1;
                        const svgW = 600;
                        const svgH = 240;
                        const topPadding = 20;
                        const bottomPadding = 20;
                        const chartH = svgH - topPadding - bottomPadding;

                        const getY = (price: number) => svgH - bottomPadding - ((price - min) / range) * chartH;
                        const barW = Math.max(3, (svgW / candles.length) * 0.7);

                        return (
                          <>
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                              const y = topPadding + chartH * pct;
                              const pVal = max - range * pct;
                              return (
                                <g key={idx}>
                                  <line x1="0" y1={y} x2={svgW} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                                  <text x={svgW - 5} y={y - 3} fill="gray" fontSize="9" textAnchor="end" fontFamily="monospace">
                                    ${pVal.toFixed(pVal < 2 ? 4 : 2)}
                                  </text>
                                </g>
                              );
                            })}

                            {/* CANDLESTICK MODE */}
                            {chartType === 'candlestick' &&
                              candles.map((c: any, idx: number) => {
                                const x = (idx / (candles.length - 1)) * (svgW - 40) + 20;
                                const isGreen = c.close >= c.open;
                                const yOpen = getY(c.open);
                                const yClose = getY(c.close);
                                const yHigh = getY(c.high);
                                const yLow = getY(c.low);
                                const rectY = Math.min(yOpen, yClose);
                                const rectH = Math.max(2, Math.abs(yClose - yOpen));
                                const color = isGreen ? '#10B981' : '#F43F5E';

                                return (
                                  <g
                                    key={idx}
                                    onMouseEnter={() => setHoveredCandle(c)}
                                    onMouseLeave={() => setHoveredCandle(null)}
                                    className="cursor-crosshair transition-opacity hover:opacity-80"
                                  >
                                    <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" />
                                    <rect
                                      x={x - barW / 2}
                                      y={rectY}
                                      width={barW}
                                      height={rectH}
                                      fill={color}
                                      rx="1"
                                    />
                                  </g>
                                );
                              })}

                            {/* LINE MODE */}
                            {chartType === 'line' &&
                              (() => {
                                const coords = candles.map((p: any, idx: number) => {
                                  const x = (idx / (candles.length - 1)) * (svgW - 40) + 20;
                                  const y = getY(p.close || p.price);
                                  return `${x},${y}`;
                                });
                                const pathLine = `M ${coords.join(' L ')}`;
                                const pathArea = `${pathLine} L ${svgW - 20},${svgH} L 20,${svgH} Z`;

                                return (
                                  <>
                                    <path d={pathArea} fill="url(#chartGradient)" />
                                    <path d={pathLine} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
                                    {candles.map((c: any, idx: number) => {
                                      const x = (idx / (candles.length - 1)) * (svgW - 40) + 20;
                                      const y = getY(c.close || c.price);
                                      return (
                                        <circle
                                          key={idx}
                                          cx={x}
                                          cy={y}
                                          r="4"
                                          fill="transparent"
                                          className="cursor-crosshair"
                                          onMouseEnter={() => setHoveredCandle(c)}
                                          onMouseLeave={() => setHoveredCandle(null)}
                                        />
                                      );
                                    })}
                                  </>
                                );
                              })()}

                            {/* OVERLAY INDICATOR: SMA(7) */}
                            {showIndicators &&
                              (() => {
                                const smaCoords = candles.map((p: any, idx: number) => {
                                  const x = (idx / (candles.length - 1)) * (svgW - 40) + 20;
                                  const y = getY(p.sma7 || p.close);
                                  return `${x},${y}`;
                                });
                                return (
                                  <path
                                    d={`M ${smaCoords.join(' L ')}`}
                                    fill="none"
                                    stroke="#818CF8"
                                    strokeWidth="1.8"
                                    strokeDasharray="4 3"
                                  />
                                );
                              })()}
                          </>
                        );
                      })()}
                    </svg>
                  ) : (
                    <div className="text-xs text-gray-400">Historical chart data preview</div>
                  )}
                </div>

                {/* In-depth Asset Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-[#0F121A] border border-black/[0.06] dark:border-[#1B212D]">
                    <div className="text-[11px] text-gray-500 font-medium">Market Capitalization</div>
                    <div className="text-sm font-bold text-gray-950 dark:text-white mt-1 font-mono">
                      {selectedCoin.market_cap > 0 ? `$${(selectedCoin.market_cap / 1e9).toFixed(2)}B` : 'Global Forex'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-[#0F121A] border border-black/[0.06] dark:border-[#1B212D]">
                    <div className="text-[11px] text-gray-500 font-medium">Circulating Supply</div>
                    <div className="text-sm font-bold text-gray-950 dark:text-white mt-1 font-mono">
                      {selectedCoin.circulating_supply > 0
                        ? `${selectedCoin.circulating_supply.toLocaleString()} ${selectedCoin.symbol}`
                        : 'Fiat Benchmark'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-[#0F121A] border border-black/[0.06] dark:border-[#1B212D]">
                    <div className="text-[11px] text-gray-500 font-medium">All Time High (ATH)</div>
                    <div className="text-sm font-bold text-gray-950 dark:text-white mt-1 font-mono">
                      ${selectedCoin.all_time_high?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Asset Description */}
                <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-[#0F121A] border border-black/[0.06] dark:border-[#1B212D] text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  <div className="font-bold text-gray-900 dark:text-white mb-1">About {selectedCoin.name}</div>
                  {selectedCoin.description}
                </div>
              </div>
            )}

            {/* Right Column: Tracked Assets Table with Infinite Scroll (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl micro-card border border-black/[0.08] dark:border-white/[0.08] p-4 flex flex-col space-y-3 shadow-sm">
              {/* Category Tabs: All / Crypto / Stocks / Forex */}
              <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'crypto', label: 'Crypto' },
                  { id: 'stocks', label: 'Stocks' },
                  { id: 'forex', label: 'Forex' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-[#3E4FFF] text-white shadow-sm font-bold'
                        : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search 1,000+ cryptos, stocks, or forex..."
                  className="w-full pl-9 pr-3 py-2 bg-black/[0.03] dark:bg-[#0F121A] border border-black/[0.08] dark:border-[#1F2535] rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#3E4FFF]"
                />
              </div>

              {/* Coins & Currencies Scroll Container with Incremental Loader */}
              <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[640px] pr-1">
                {coins.map((coin, index) => {
                  const isSelected = selectedCoin?.id === coin.id;
                  const isWatched = watchlist.includes(coin.id);
                  const isLastItem = index === coins.length - 1;

                  return (
                    <div
                      key={`${coin.id}_${index}`}
                      ref={isLastItem ? lastElementRef : null}
                      onClick={() => setSelectedCoin(coin)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#3E4FFF]/10 border border-[#3E4FFF]/40 text-gray-950 dark:text-white shadow-sm'
                          : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04] border border-transparent text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => toggleWatchlist(coin.id, e)}
                          className="text-gray-400 hover:text-amber-400 transition-colors"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              isWatched ? 'text-amber-400 fill-amber-400' : ''
                            }`}
                          />
                        </button>
                        <img
                          src={coin.logo}
                          alt={coin.name}
                          className="w-7 h-7 rounded-full p-0.5 object-cover bg-black/[0.03] dark:bg-white/[0.05]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coin.symbol)}&background=3E4FFF&color=fff&size=64`;
                          }}
                        />
                        <div>
                          <div className="text-xs font-bold text-gray-950 dark:text-white">{coin.name}</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase flex items-center gap-1.5">
                            <span>{coin.symbol}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-black/[0.04] dark:bg-white/[0.04]">
                              {coin.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-gray-950 dark:text-white font-mono">
                          ${coin.price.toLocaleString(undefined, {
                            minimumFractionDigits: coin.price < 2 ? 4 : 2,
                            maximumFractionDigits: coin.price < 2 ? 4 : 2,
                          })}
                        </div>
                        <div
                          className={`text-[10px] font-semibold font-mono ${
                            coin.change_24h >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {coin.change_24h >= 0 ? '+' : ''}
                          {coin.change_24h}%
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Bottom Scroll Loader for Infinite Scrolling */}
                {loadingMore && (
                  <div className="py-3 flex items-center justify-center gap-2 text-xs text-gray-400 font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3E4FFF]" />
                    <span>Loading more live assets...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
