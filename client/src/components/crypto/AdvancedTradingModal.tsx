import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  Time,
  ColorType,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from 'lightweight-charts';
import {
  X,
  Maximize2,
  Minimize2,
  TrendingUp,
  BarChart2,
  LineChart as LineIcon,
  Layers,
  Volume2,
  Compass,
  Sliders,
} from 'lucide-react';

interface AdvancedTradingModalProps {
  asset: any;
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
}

export const AdvancedTradingModal: React.FC<AdvancedTradingModalProps> = ({
  asset,
  isOpen,
  onClose,
  apiBase,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [timeframe, setTimeframe] = useState<string>('30m');
  const [chartStyle, setChartStyle] = useState<'candles' | 'line'>('candles');
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string>('cursor');
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [lastLivePrice, setLastLivePrice] = useState<number>(asset?.price || 0);

  const modalRef = useRef<HTMLDivElement>(null);

  // Timeframe presets like GoCharting / TradingView
  const timeframes = [
    { label: '1m', tf: '1h' },
    { label: '5m', tf: '1h' },
    { label: '15m', tf: '24h' },
    { label: '30m', tf: '24h' },
    { label: '1H', tf: '7d' },
    { label: '4H', tf: '30d' },
    { label: '1D', tf: '90d' },
    { label: '1W', tf: '1y' },
  ];

  // Sync initial price
  useEffect(() => {
    if (asset?.price) {
      setLastLivePrice(asset.price);
    }
  }, [asset?.price]);

  // Keyboard shortcut ESC to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Initialize Lightweight Chart Engine
  useEffect(() => {
    if (!isOpen || !chartContainerRef.current) return;

    // Destroy existing chart if any
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#090A0E' },
        textColor: '#848E9C',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        mode: 1, // Magnet crosshair
        vertLine: {
          color: 'rgba(255, 255, 255, 0.25)',
          width: 1,
          style: 3, // Dotted
          labelBackgroundColor: '#1F2937',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.25)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1F2937',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        textColor: '#94A3B8',
        autoScale: true,
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Candlestick Series (GoCharting / TradingView Pro Styling)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ECB81',
      downColor: '#F6465D',
      borderVisible: false,
      wickUpColor: '#0ECB81',
      wickDownColor: '#F6465D',
      priceLineColor: '#F6465D',
      priceLineWidth: 1,
      priceLineStyle: 2, // Dashed
    });
    candleSeriesRef.current = candleSeries;

    // Line Series (Optional Toggle)
    const lineSeries = chart.addSeries(LineSeries, {
      color: '#3E4FFF',
      lineWidth: 2,
      visible: chartStyle === 'line',
    });
    lineSeriesRef.current = lineSeries;

    // Volume Series (Bottom Histogram)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // Overlay over chart
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // SMA Series
    const smaSeries = chart.addSeries(LineSeries, {
      color: '#F59E0B',
      lineWidth: 1,
      lineStyle: 0,
      priceLineVisible: false,
    });
    smaSeriesRef.current = smaSeries;

    // Crosshair hover subscriber
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setHoveredData(null);
        return;
      }
      const data = param.seriesData.get(candleSeries) as any;
      if (data) {
        setHoveredData({
          time: param.time,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
        });
      }
    });

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    // Fetch and load historical data
    loadChartHistory(asset.id, timeframe);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [isOpen, asset.id]);

  // Load candles from server backend
  const loadChartHistory = async (assetId: string, tf: string) => {
    try {
      const res = await fetch(`${apiBase}/crypto/coins/${assetId}/chart?timeframe=${tf}`);
      if (!res.ok) return;
      const json = await res.json();
      const rawCandles = json.candles || json.points || [];

      if (!rawCandles.length) return;

      const formattedCandles: CandlestickData[] = rawCandles.map((c: any) => ({
        time: (c.time || Math.floor(new Date(c.timestamp).getTime() / 1000)) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      const formattedLines: LineData[] = rawCandles.map((c: any) => ({
        time: (c.time || Math.floor(new Date(c.timestamp).getTime() / 1000)) as Time,
        value: c.close,
      }));

      const formattedVolumes = rawCandles.map((c: any) => ({
        time: (c.time || Math.floor(new Date(c.timestamp).getTime() / 1000)) as Time,
        value: c.volume || 1000,
        color: c.close >= c.open ? 'rgba(14, 203, 129, 0.35)' : 'rgba(246, 70, 93, 0.35)',
      }));

      // SMA (7) calculations
      const formattedSMA: LineData[] = [];
      for (let i = 0; i < rawCandles.length; i++) {
        if (i >= 6) {
          const slice = rawCandles.slice(i - 6, i + 1);
          const avg = slice.reduce((acc: number, cur: any) => acc + cur.close, 0) / 7;
          formattedSMA.push({
            time: (rawCandles[i].time || Math.floor(new Date(rawCandles[i].timestamp).getTime() / 1000)) as Time,
            value: avg,
          });
        }
      }

      if (candleSeriesRef.current) candleSeriesRef.current.setData(formattedCandles);
      if (lineSeriesRef.current) lineSeriesRef.current.setData(formattedLines);
      if (volumeSeriesRef.current) volumeSeriesRef.current.setData(formattedVolumes);
      if (smaSeriesRef.current) smaSeriesRef.current.setData(formattedSMA);

      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (err) {
      console.error('Failed to load chart history in modal:', err);
    }
  };

  // Live WebSocket Tick Updater: Update the live candle and price action in real time
  useEffect(() => {
    if (!isOpen || !candleSeriesRef.current || !asset?.price) return;

    setLastLivePrice(asset.price);

    const currentTime = Math.floor(Date.now() / 1000) as Time;

    // Real-time tick update to candle series
    try {
      candleSeriesRef.current.update({
        time: currentTime,
        open: asset.price,
        high: asset.price * 1.0003,
        low: asset.price * 0.9997,
        close: asset.price,
      });

      if (lineSeriesRef.current) {
        lineSeriesRef.current.update({
          time: currentTime,
          value: asset.price,
        });
      }
    } catch {
      /* ignore timestamp collision in fast updates */
    }
  }, [asset?.price, isOpen]);

  // Handle Chart Style Switch (Candles vs Line)
  const toggleChartStyle = (style: 'candles' | 'line') => {
    setChartStyle(style);
    if (candleSeriesRef.current) {
      candleSeriesRef.current.applyOptions({ visible: style === 'candles' });
    }
    if (lineSeriesRef.current) {
      lineSeriesRef.current.applyOptions({ visible: style === 'line' });
    }
  };

  // Toggle SMA
  const toggleSMA = () => {
    setShowSMA((prev) => {
      const next = !prev;
      if (smaSeriesRef.current) {
        smaSeriesRef.current.applyOptions({ visible: next });
      }
      return next;
    });
  };

  // Toggle Volume
  const toggleVolume = () => {
    setShowVolume((prev) => {
      const next = !prev;
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.applyOptions({ visible: next });
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 md:p-6 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className={`w-full ${
          isFullscreen ? 'h-full max-h-none rounded-none' : 'max-w-7xl h-[92vh] rounded-2xl'
        } bg-[#08090D] border border-white/[0.08] flex flex-col shadow-2xl overflow-hidden font-sans`}
      >
        {/* Top Professional Navigation Bar (GoCharting / TradingView Style) */}
        <div className="h-14 bg-[#0D0F17] border-b border-white/[0.08] flex items-center justify-between px-3 md:px-5 shrink-0 select-none">
          {/* Left Controls: Symbol, Timeframes, and Order Buttons */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {/* Symbol & Category */}
            <div className="flex items-center gap-2 pr-3 border-r border-white/10 shrink-0">
              <img
                src={asset.logo}
                alt={asset.name}
                className="w-6 h-6 rounded-full object-contain bg-white/5 p-0.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    asset.symbol
                  )}&background=3E4FFF&color=fff&size=64`;
                }}
              />
              <span className="text-sm font-black text-white tracking-wide">
                {asset.symbol}
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                {asset.category}
              </span>
            </div>

            {/* Buy / Sell Quick Buttons */}
            <div className="hidden sm:flex items-center gap-1.5 pr-3 border-r border-white/10 shrink-0">
              <button className="px-3 py-1 rounded bg-[#F6465D] hover:bg-[#ff3b54] text-white text-xs font-bold transition-all shadow-sm active:scale-95">
                SELL
              </button>
              <button className="px-3 py-1 rounded bg-[#0ECB81] hover:bg-[#00e88f] text-black text-xs font-bold transition-all shadow-sm active:scale-95">
                BUY
              </button>
            </div>

            {/* Timeframe Presets */}
            <div className="flex items-center gap-1 shrink-0">
              {timeframes.map((t) => (
                <button
                  key={t.label}
                  onClick={() => {
                    setTimeframe(t.label);
                    loadChartHistory(asset.id, t.tf);
                  }}
                  className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                    timeframe === t.label
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Chart Style Toggle (Candles vs Line) */}
            <div className="hidden md:flex items-center gap-1 pl-2 border-l border-white/10 shrink-0">
              <button
                onClick={() => toggleChartStyle('candles')}
                title="Candlestick Chart"
                className={`p-1.5 rounded transition-all ${
                  chartStyle === 'candles' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleChartStyle('line')}
                title="Line Chart"
                className={`p-1.5 rounded transition-all ${
                  chartStyle === 'line' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <LineIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Indicators & Studies */}
            <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-white/10 shrink-0">
              <button
                onClick={toggleSMA}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                  showSMA ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>SMA (7)</span>
              </button>

              <button
                onClick={toggleVolume}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                  showVolume ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Volume</span>
              </button>
            </div>
          </div>

          {/* Right Controls: Fullscreen, Screenshot, Close */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-rose-500/20 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 text-gray-300 hover:text-rose-400" />
            </button>
          </div>
        </div>

        {/* Live Ticker & OHLC Real-Time Data Ribbon */}
        <div className="h-8 bg-[#090A0E] border-b border-white/[0.04] px-4 flex items-center justify-between text-[11px] font-mono text-gray-400 shrink-0 select-none">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 text-white font-bold">
              <span className="text-gray-400">{asset.name}</span>
              <span className="text-[#0ECB81] text-xs">
                ${lastLivePrice.toLocaleString(undefined, {
                  minimumFractionDigits: lastLivePrice < 2 ? 4 : 2,
                  maximumFractionDigits: lastLivePrice < 2 ? 4 : 2,
                })}
              </span>
            </div>

            {/* Hovered / Current OHLC Values */}
            <div className="flex items-center gap-3">
              <span>
                O: <strong className="text-white">${hoveredData?.open ?? lastLivePrice}</strong>
              </span>
              <span>
                H: <strong className="text-[#0ECB81]">${hoveredData?.high ?? (lastLivePrice * 1.002).toFixed(2)}</strong>
              </span>
              <span>
                L: <strong className="text-[#F6465D]">${hoveredData?.low ?? (lastLivePrice * 0.998).toFixed(2)}</strong>
              </span>
              <span>
                C: <strong className="text-white">${hoveredData?.close ?? lastLivePrice}</strong>
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-gray-500">
            <span className="w-2 h-2 rounded-full bg-[#0ECB81] animate-ping" />
            <span className="text-[10px] text-gray-400">Live Price Action Active</span>
          </div>
        </div>

        {/* Workspace Body: Left Technical Toolbar + Center Chart Canvas */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Vertical Technical Analysis Toolbar (GoCharting style) */}
          <div className="w-11 bg-[#0D0F17] border-r border-white/[0.08] flex flex-col items-center py-3 gap-3 text-gray-400 shrink-0 select-none">
            {[
              { id: 'cursor', icon: Compass, title: 'Crosshair / Pointer' },
              { id: 'trendline', icon: TrendingUp, title: 'Trend Line Tool' },
              { id: 'fibonacci', icon: Sliders, title: 'Fibonacci Retracement' },
              { id: 'indicators', icon: Layers, title: 'Indicators & Strategies' },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveDrawingTool(tool.id)}
                title={tool.title}
                className={`p-2 rounded-lg transition-all ${
                  activeDrawingTool === tool.id
                    ? 'bg-[#3E4FFF] text-white shadow-md'
                    : 'hover:text-white hover:bg-white/5'
                }`}
              >
                <tool.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Interactive Chart Container Canvas */}
          <div className="flex-1 h-full relative bg-[#090A0E]">
            <div ref={chartContainerRef} className="w-full h-full" />

            {/* Bottom Live Watermark / Brand */}
            <div className="absolute bottom-3 left-4 pointer-events-none opacity-20 flex items-center gap-1.5">
              <span className="text-xs font-black tracking-widest text-white uppercase">PesaFlip Pro Terminal</span>
            </div>
          </div>
        </div>

        {/* Footer Ribbon with UTC Time and Quick Jump Bar */}
        <div className="h-7 bg-[#0D0F17] border-t border-white/[0.08] px-4 flex items-center justify-between text-[10px] font-mono text-gray-400 shrink-0">
          <div className="flex items-center gap-3">
            <span>Timezone: UTC+03:00</span>
            <span className="text-gray-500">•</span>
            <span>Finnhub & Binance Live Feed</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Auto Scale: ON</span>
            <span className="text-gray-500">•</span>
            <span>Log: OFF</span>
          </div>
        </div>
      </div>
    </div>
  );
};
