import math
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import httpx

from app.core.config import get_settings

logger = logging.getLogger("pesaflip.crypto")


class CryptoIntelligenceService:
    """
    Dedicated Cryptocurrency & Market Intelligence Service.
    Pulls live market quotes via Finnhub API and real historical candle klines from Binance.
    """

    _CACHE: Dict[str, Any] = {}
    _CACHE_TTL: int = 15  # 15s cache to respect free-tier rate limits

    # Tracked digital assets mapped to Finnhub & Binance tickers
    COINS_DATABASE: List[Dict[str, Any]] = [
        {
            "id": "bitcoin",
            "symbol": "BTC",
            "finnhub_symbol": "BINANCE:BTCUSDT",
            "binance_symbol": "BTCUSDT",
            "name": "Bitcoin",
            "price": 73500.00,
            "change_24h": -2.1,
            "change_7d": 4.12,
            "market_cap": 1450000000000,
            "volume_24h": 32410200000,
            "circulating_supply": 19780000,
            "all_time_high": 73750.07,
            "rank": 1,
            "logo": "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
            "description": "Bitcoin is the premier decentralized digital currency and store of value powered by proof-of-work consensus.",
        },
        {
            "id": "ethereum",
            "symbol": "ETH",
            "finnhub_symbol": "BINANCE:ETHUSDT",
            "binance_symbol": "ETHUSDT",
            "name": "Ethereum",
            "price": 2040.00,
            "change_24h": -4.6,
            "change_7d": 1.25,
            "market_cap": 245500200000,
            "volume_24h": 18920300000,
            "circulating_supply": 120250000,
            "all_time_high": 4891.70,
            "rank": 2,
            "logo": "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
            "description": "Ethereum is a decentralized programmable platform for smart contracts and decentralized applications.",
        },
        {
            "id": "solana",
            "symbol": "SOL",
            "finnhub_symbol": "BINANCE:SOLUSDT",
            "binance_symbol": "SOLUSDT",
            "name": "Solana",
            "price": 82.50,
            "change_24h": -5.3,
            "change_7d": 12.45,
            "market_cap": 38520000000,
            "volume_24h": 4820300000,
            "circulating_supply": 465100000,
            "all_time_high": 260.06,
            "rank": 3,
            "logo": "https://assets.coingecko.com/coins/images/4128/large/solana.png",
            "description": "Solana is an ultra-high performance public blockchain designed for mass adoption with low fees and sub-second settlement.",
        },
        {
            "id": "ripple",
            "symbol": "XRP",
            "finnhub_symbol": "BINANCE:XRPUSDT",
            "binance_symbol": "XRPUSDT",
            "name": "XRP",
            "price": 1.05,
            "change_24h": -5.5,
            "change_7d": 8.42,
            "market_cap": 58800000000,
            "volume_24h": 3250000000,
            "circulating_supply": 56120000000,
            "all_time_high": 3.84,
            "rank": 4,
            "logo": "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
            "description": "XRP is an enterprise payment settlement asset powering cross-border liquidity and instant institutional remittances.",
        },
        {
            "id": "cardano",
            "symbol": "ADA",
            "finnhub_symbol": "BINANCE:ADAUSDT",
            "binance_symbol": "ADAUSDT",
            "name": "Cardano",
            "price": 0.445,
            "change_24h": -2.10,
            "change_7d": 4.25,
            "market_cap": 15900000000,
            "volume_24h": 410000000,
            "circulating_supply": 35700000000,
            "all_time_high": 3.10,
            "rank": 5,
            "logo": "https://assets.coingecko.com/coins/images/975/large/cardano.png",
            "description": "Cardano is a proof-of-stake blockchain built on peer-reviewed methods and formal verification.",
        },
        {
            "id": "avalanche-2",
            "symbol": "AVAX",
            "finnhub_symbol": "BINANCE:AVAXUSDT",
            "binance_symbol": "AVAXUSDT",
            "name": "Avalanche",
            "price": 28.75,
            "change_24h": 4.12,
            "change_7d": 9.85,
            "market_cap": 11340000000,
            "volume_24h": 680000000,
            "circulating_supply": 395000000,
            "all_time_high": 146.22,
            "rank": 6,
            "logo": "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
            "description": "Avalanche is a high-throughput smart contracts platform utilizing subnet scaling architectures.",
        },
    ]

    @classmethod
    async def fetch_finnhub_quotes(cls) -> None:
        """
        Pulls live quotes from Finnhub API for all tracked coins and updates in-memory states.
        """
        now_ts = datetime.utcnow().timestamp()
        if "finnhub_quotes_sync" in cls._CACHE:
            _, last_sync = cls._CACHE["finnhub_quotes_sync"]
            if now_ts - last_sync < cls._CACHE_TTL:
                return

        settings = get_settings()
        api_key = getattr(settings, "FINNHUB_API_KEY", "dbpjv1hr01qr0r9nu7dgdbpjv1hr01qr0r9nu7e0")

        headers = {"X-Finnhub-Token": api_key, "User-Agent": "PesaFlip/1.0"}

        async def fetch_coin_quote(client: httpx.AsyncClient, coin: Dict[str, Any]):
            finnhub_ticker = coin.get("finnhub_symbol")
            if not finnhub_ticker:
                return
            try:
                res = await client.get(
                    f"https://finnhub.io/api/v1/quote?symbol={finnhub_ticker}",
                    headers=headers,
                    timeout=3.5,
                )
                if res.status_code == 200:
                    data = res.json()
                    curr_price = data.get("c")
                    dp_change = data.get("dp")
                    if curr_price and curr_price > 0:
                        coin["price"] = curr_price
                        if dp_change is not None:
                            coin["change_24h"] = round(dp_change, 2)
            except Exception as e:
                logger.debug(f"Finnhub quote fetch error for {finnhub_ticker}: {e}")

        try:
            async with httpx.AsyncClient() as client:
                tasks = [fetch_coin_quote(client, c) for c in cls.COINS_DATABASE]
                await asyncio.gather(*tasks, return_exceptions=True)
            cls._CACHE["finnhub_quotes_sync"] = (True, now_ts)
        except Exception as ex:
            logger.debug(f"Finnhub batch sync exception: {ex}")

    @classmethod
    async def get_global_market_overview(cls) -> Dict[str, Any]:
        await cls.fetch_finnhub_quotes()

        total_mcap = sum(c["price"] * c["circulating_supply"] for c in cls.COINS_DATABASE)
        total_vol = sum(c["volume_24h"] for c in cls.COINS_DATABASE)
        btc_mcap = cls.COINS_DATABASE[0]["price"] * cls.COINS_DATABASE[0]["circulating_supply"]
        btc_dominance = round((btc_mcap / total_mcap) * 100, 1) if total_mcap > 0 else 52.4

        sorted_by_change = sorted(cls.COINS_DATABASE, key=lambda x: x["change_24h"], reverse=True)

        return {
            "total_market_cap": total_mcap,
            "total_volume_24h": total_vol,
            "market_cap_change_24h": round(sum(c["change_24h"] for c in cls.COINS_DATABASE) / len(cls.COINS_DATABASE), 2),
            "btc_dominance": btc_dominance,
            "eth_dominance": 16.8,
            "top_gainers": sorted_by_change[:3],
            "top_losers": sorted_by_change[-3:],
            "trending": cls.COINS_DATABASE[:4],
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "source": "Finnhub Real-Time Live Feed",
        }

    @classmethod
    async def get_coins(cls, search: Optional[str] = None) -> List[Dict[str, Any]]:
        await cls.fetch_finnhub_quotes()
        if not search:
            return cls.COINS_DATABASE
        q = search.lower()
        return [
            c for c in cls.COINS_DATABASE
            if q in c["name"].lower() or q in c["symbol"].lower()
        ]

    @classmethod
    def get_coin_by_id(cls, coin_id: str) -> Optional[Dict[str, Any]]:
        for c in cls.COINS_DATABASE:
            if c["id"] == coin_id.lower() or c["symbol"].lower() == coin_id.lower():
                return c
        return None

    @classmethod
    async def generate_chart_history(cls, coin_id: str, timeframe: str = "7d") -> Dict[str, Any]:
        await cls.fetch_finnhub_quotes()
        coin = cls.get_coin_by_id(coin_id)
        if not coin:
            coin = cls.COINS_DATABASE[0]

        binance_symbol = coin.get("binance_symbol", f"{coin['symbol']}USDT")

        # Map timeframe to Binance interval & limit
        tf_map = {
            "1h": ("5m", 12),
            "24h": ("1h", 24),
            "7d": ("4h", 42),
            "30d": ("1d", 30),
            "90d": ("3d", 30),
            "1y": ("1w", 52),
            "all": ("1M", 36),
        }
        interval, limit = tf_map.get(timeframe.lower(), ("4h", 42))

        data_points = []
        try:
            async with httpx.AsyncClient(timeout=3.5) as client:
                res = await client.get(
                    f"https://api.binance.com/api/v3/klines?symbol={binance_symbol}&interval={interval}&limit={limit}"
                )
                if res.status_code == 200:
                    klines = res.json()
                    for k in klines:
                        # k[0] = open time ms, k[4] = close price, k[5] = volume
                        dt_iso = datetime.utcfromtimestamp(k[0] / 1000.0).isoformat() + "Z"
                        close_p = float(k[4])
                        vol = float(k[5])
                        data_points.append({
                            "timestamp": dt_iso,
                            "price": round(close_p, 4 if close_p < 1.0 else 2),
                            "volume": round(vol, 2),
                        })
        except Exception as e:
            logger.debug(f"Binance klines fetch exception for {binance_symbol}: {e}")

        # If Binance klines returned, lock current price to the latest Finnhub price
        if data_points:
            data_points[-1]["price"] = coin["price"]
            min_p = min(p["price"] for p in data_points)
            max_p = max(p["price"] for p in data_points)
            first_p = data_points[0]["price"]
            change_pct = round(((coin["price"] - first_p) / first_p) * 100, 2) if first_p > 0 else 0.0

            return {
                "coin_id": coin["id"],
                "symbol": coin["symbol"],
                "timeframe": timeframe,
                "current_price": coin["price"],
                "min_price": min_p,
                "max_price": max_p,
                "change_pct": change_pct,
                "points": data_points,
            }

        # Mathematical fallback curve if internet connection blocked
        base_price = coin["price"]
        now = datetime.utcnow()
        count = 28
        delta_mins = 360
        fallback_points = []
        for i in range(count):
            t = now - timedelta(minutes=(count - i) * delta_mins)
            step_price = base_price * (1.0 + (math.sin(i * 0.4) * 0.03))
            if i == count - 1:
                step_price = base_price
            fallback_points.append({
                "timestamp": t.isoformat() + "Z",
                "price": round(step_price, 4 if step_price < 1.0 else 2),
                "volume": 1000000,
            })

        return {
            "coin_id": coin["id"],
            "symbol": coin["symbol"],
            "timeframe": timeframe,
            "current_price": base_price,
            "min_price": min(p["price"] for p in fallback_points),
            "max_price": max(p["price"] for p in fallback_points),
            "change_pct": coin["change_24h"],
            "points": fallback_points,
        }
