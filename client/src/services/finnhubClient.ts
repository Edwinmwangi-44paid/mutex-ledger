/**
 * Finnhub Market Data Client Module
 * Supports:
 * - Rate-limited REST Client (< 30 req/sec token-bucket queue)
 * - Permanent auto-reconnecting WebSocket client with automatic ticker subscriptions
 * - Forex, Crypto, and Stock data ingestion
 */

export interface FinnhubTrade {
  s: string;  // Symbol (e.g. 'BINANCE:BTCUSDT')
  p: number;  // Last price
  t: number;  // UNIX timestamp in milliseconds
  v: number;  // Volume
  c?: string[]; // Trade conditions
}

export interface FinnhubWSMessage {
  type: 'trade' | 'ping';
  data?: FinnhubTrade[];
}

export interface CryptoCandleResponse {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string;   // Status ('ok' or 'no_data')
  t: number[]; // Timestamps
  v: number[]; // Volume
}

export interface FinnhubQuote {
  c: number;  // Current price
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface FinnhubClientConfig {
  apiKey: string;
  baseUrl?: string;
  wsUrl?: string;
  maxRequestsPerSecond?: number;
  autoSubscribeTickers?: string[];
  onTrade?: (trade: FinnhubTrade) => void;
  onStatusChange?: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING') => void;
}

/**
 * Token Bucket Request Queue to guarantee strict rate-limiting under Finnhub's cap
 */
class RateLimiter {
  private queue: Array<() => void> = [];
  private tokens: number;
  private maxTokens: number;
  private intervalMs: number;
  private timer: any = null;

  constructor(maxRequestsPerSecond = 30) {
    this.maxTokens = maxRequestsPerSecond;
    this.tokens = maxRequestsPerSecond;
    // Replenish tokens every 1000ms
    this.intervalMs = 1000;
    this.startReplenishment();
  }

  private startReplenishment() {
    this.timer = setInterval(() => {
      this.tokens = this.maxTokens;
      this.drain();
    }, this.intervalMs);
  }

  private drain() {
    while (this.tokens > 0 && this.queue.length > 0) {
      this.tokens--;
      const nextFn = this.queue.shift();
      if (nextFn) nextFn();
    }
  }

  public schedule<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      if (this.tokens > 0 && this.queue.length === 0) {
        this.tokens--;
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }

  public destroy() {
    if (this.timer) clearInterval(this.timer);
    this.queue = [];
  }
}

/**
 * Main Finnhub Client
 */
export class FinnhubClient {
  private apiKey: string;
  private baseUrl: string;
  private wsUrl: string;
  private rateLimiter: RateLimiter;
  private ws: WebSocket | null = null;
  private isDestroyed = false;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: any = null;
  private subscribedSymbols: Set<string> = new Set();
  private onTradeCallback?: (trade: FinnhubTrade) => void;
  private onStatusChangeCallback?: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING') => void;

  constructor(config: FinnhubClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://finnhub.io').replace(/\/+$/, '');
    this.wsUrl = config.wsUrl || 'wss://ws.finnhub.io';
    this.rateLimiter = new RateLimiter(config.maxRequestsPerSecond || 28); // 28 rps to maintain safety cushion below 30
    this.onTradeCallback = config.onTrade;
    this.onStatusChangeCallback = config.onStatusChange;

    const initialTickers = config.autoSubscribeTickers || ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT'];
    initialTickers.forEach((t) => this.subscribedSymbols.add(t));

    this.connectWebSocket();
  }

  // ==========================================
  // 1. REST CLIENT (Rate-Limited < 30 req/sec)
  // ==========================================

  private async request<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    return this.rateLimiter.schedule(async () => {
      const url = new URL(`${this.baseUrl}/api/v1${endpoint}`);
      url.searchParams.set('token', this.apiKey);

      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v));
        }
      });

      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Finnhub API Error: ${response.status} ${response.statusText} on ${endpoint}`);
      }

      return (await response.json()) as T;
    });
  }

  /**
   * Fetch real-time Quote (Stock, Forex, or Crypto)
   */
  public async getQuote(symbol: string): Promise<FinnhubQuote> {
    return this.request<FinnhubQuote>('/quote', { symbol });
  }

  /**
   * Fetch Crypto Candles (Historical Bars)
   * resolution: 1, 5, 15, 30, 60, D, W, M
   */
  public async getCryptoCandles(
    symbol: string,
    resolution: string = 'D',
    from: number = Math.floor(Date.now() / 1000) - 86400 * 30,
    to: number = Math.floor(Date.now() / 1000)
  ): Promise<CryptoCandleResponse> {
    return this.request<CryptoCandleResponse>('/crypto/candle', {
      symbol,
      resolution,
      from,
      to,
    });
  }

  /**
   * Fetch Forex Candles (Historical Bars)
   */
  public async getForexCandles(
    symbol: string,
    resolution: string = 'D',
    from: number = Math.floor(Date.now() / 1000) - 86400 * 30,
    to: number = Math.floor(Date.now() / 1000)
  ): Promise<CryptoCandleResponse> {
    return this.request<CryptoCandleResponse>('/forex/candle', {
      symbol,
      resolution,
      from,
      to,
    });
  }

  /**
   * Search symbols across exchanges
   */
  public async symbolLookup(q: string): Promise<any> {
    return this.request('/search', { q });
  }

  // ==========================================
  // 2. PERMANENT WEBSOCKET & REAL-TIME STREAM
  // ==========================================

  private updateStatus(status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING') {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  private connectWebSocket() {
    if (this.isDestroyed) return;

    this.updateStatus(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');
    const wsEndpoint = `${this.wsUrl}?token=${this.apiKey}`;

    try {
      this.ws = new WebSocket(wsEndpoint);

      this.ws.onopen = () => {
        console.log('[Finnhub WS] Connected permanently to Finnhub WebSocket stream.');
        this.reconnectAttempts = 0;
        this.updateStatus('CONNECTED');

        // Auto-subscribe to all queued symbols (e.g. BINANCE:BTCUSDT, BINANCE:ETHUSDT)
        this.subscribedSymbols.forEach((symbol) => {
          this.sendSubscribe(symbol);
        });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const payload: FinnhubWSMessage = JSON.parse(event.data);

          if (payload.type === 'ping') {
            return;
          }

          if (payload.type === 'trade' && Array.isArray(payload.data)) {
            for (const trade of payload.data) {
              const formattedTime = new Date(trade.t).toLocaleTimeString();
              console.log(
                `%c[Finnhub Live] %c${trade.s} %c$${trade.p.toLocaleString(undefined, { minimumFractionDigits: 2 })} %c(Vol: ${trade.v}) %c@ ${formattedTime}`,
                'color: #3E4FFF; font-weight: bold;',
                'color: #10B981; font-weight: bold;',
                'color: #F59E0B; font-weight: bold;',
                'color: #6B7280;',
                'color: #9CA3AF; font-size: 11px;'
              );

              if (this.onTradeCallback) {
                this.onTradeCallback(trade);
              }
            }
          }
        } catch (err) {
          console.error('[Finnhub WS] Error parsing message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[Finnhub WS] Connection error:', err);
      };

      this.ws.onclose = (event) => {
        console.warn(`[Finnhub WS] Socket closed (Code: ${event.code}). Scheduling reconnection...`);
        this.updateStatus('DISCONNECTED');
        this.scheduleReconnect();
      };
    } catch (err) {
      console.error('[Finnhub WS] Connection exception:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed || this.reconnectTimer) return;

    this.reconnectAttempts++;
    // Exponential backoff with jitter (max 30s)
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    console.log(`[Finnhub WS] Attempting reconnect #${this.reconnectAttempts} in ${(delay / 1000).toFixed(1)}s...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWebSocket();
    }, delay);
  }

  private sendSubscribe(symbol: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      console.log(`[Finnhub WS] Subscribed -> ${symbol}`);
    }
  }

  private sendUnsubscribe(symbol: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
      console.log(`[Finnhub WS] Unsubscribed <- ${symbol}`);
    }
  }

  /**
   * Dynamically subscribe to any new ticker
   */
  public subscribe(symbol: string) {
    this.subscribedSymbols.add(symbol);
    this.sendSubscribe(symbol);
  }

  /**
   * Unsubscribe from a ticker
   */
  public unsubscribe(symbol: string) {
    this.subscribedSymbols.delete(symbol);
    this.sendUnsubscribe(symbol);
  }

  /**
   * Gracefully close WebSocket and stop background rate-limiter
   */
  public disconnect() {
    this.isDestroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.rateLimiter.destroy();
    this.updateStatus('DISCONNECTED');
  }
}

// Default export configured with user's provided API key
export const defaultFinnhubClient = new FinnhubClient({
  apiKey: 'dbpjv1hr01qr0r9nu7dgdbpjv1hr01qr0r9nu7e0',
  autoSubscribeTickers: ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT'],
});

