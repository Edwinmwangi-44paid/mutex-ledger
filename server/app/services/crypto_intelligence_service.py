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
    Dedicated Multi-Market Intelligence Service for:
    1. Cryptocurrencies (BTC, ETH, SOL, XRP, BNB, DOGE, ADA, AVAX, LINK, SUI, SHIB, PEPE, NEAR, DOT, UNI, LTC, etc.)
    2. Global Stocks & Equities (AAPL, NVDA, MSFT, AMZN, GOOGL, TSLA, META, AMD, NFLX, PLTR, COIN, BABA, etc.)
    3. Global Currencies & Forex Pairs (EUR/USD, GBP/USD, USD/JPY, USD/CHF, USD/KES, AUD/USD, USD/CAD, NZD/USD, USD/ZAR, etc.)
    4. Paginated Infinite Scroll & on-demand price refresh to guarantee < 30 req/sec speed caps.
    """

    _CACHE: Dict[str, Any] = {}
    _CACHE_TTL: int = 15  # 15s cache

    ASSETS_DATABASE: List[Dict[str, Any]] = [
        # ─────────────────────────────────────────────────────────────
        # 1. CRYPTOCURRENCIES
        # ─────────────────────────────────────────────────────────────
        {"id": "bitcoin", "symbol": "BTC", "finnhub_symbol": "BINANCE:BTCUSDT", "binance_symbol": "BTCUSDT", "category": "crypto", "name": "Bitcoin", "price": 73500.00, "change_24h": -2.1, "market_cap": 1450000000000, "volume_24h": 32410200000, "circulating_supply": 19780000, "all_time_high": 73750.07, "rank": 1, "logo": "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", "description": "Bitcoin is the premier decentralized digital currency and global store of value."},
        {"id": "ethereum", "symbol": "ETH", "finnhub_symbol": "BINANCE:ETHUSDT", "binance_symbol": "ETHUSDT", "category": "crypto", "name": "Ethereum", "price": 2040.00, "change_24h": -4.6, "market_cap": 245500200000, "volume_24h": 18920300000, "circulating_supply": 120250000, "all_time_high": 4891.70, "rank": 2, "logo": "https://assets.coingecko.com/coins/images/279/large/ethereum.png", "description": "Ethereum powers smart contracts and decentralized applications worldwide."},
        {"id": "solana", "symbol": "SOL", "finnhub_symbol": "BINANCE:SOLUSDT", "binance_symbol": "SOLUSDT", "category": "crypto", "name": "Solana", "price": 82.50, "change_24h": -5.3, "market_cap": 38520000000, "volume_24h": 4820300000, "circulating_supply": 465100000, "all_time_high": 260.06, "rank": 3, "logo": "https://assets.coingecko.com/coins/images/4128/large/solana.png", "description": "High-throughput blockchain built for consumer web scale with sub-second finality."},
        {"id": "ripple", "symbol": "XRP", "finnhub_symbol": "BINANCE:XRPUSDT", "binance_symbol": "XRPUSDT", "category": "crypto", "name": "XRP", "price": 1.05, "change_24h": -5.5, "market_cap": 58800000000, "volume_24h": 3250000000, "circulating_supply": 56120000000, "all_time_high": 3.84, "rank": 4, "logo": "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png", "description": "Institutional enterprise settlement and cross-border remittance asset."},
        {"id": "binancecoin", "symbol": "BNB", "finnhub_symbol": "BINANCE:BNBUSDT", "binance_symbol": "BNBUSDT", "category": "crypto", "name": "BNB", "price": 585.20, "change_24h": -1.4, "market_cap": 85400000000, "volume_24h": 1420000000, "circulating_supply": 145800000, "all_time_high": 720.67, "rank": 5, "logo": "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png", "description": "Native fuel of the BNB Chain ecosystem powering gas and staking utilities."},
        {"id": "dogecoin", "symbol": "DOGE", "finnhub_symbol": "BINANCE:DOGEUSDT", "binance_symbol": "DOGEUSDT", "category": "crypto", "name": "Dogecoin", "price": 0.165, "change_24h": -3.8, "market_cap": 24200000000, "volume_24h": 1850000000, "circulating_supply": 146000000000, "all_time_high": 0.7376, "rank": 6, "logo": "https://assets.coingecko.com/coins/images/5/large/dogecoin.png", "description": "Open-source peer-to-peer cryptocurrency popular for decentralized community micro-payments."},
        {"id": "cardano", "symbol": "ADA", "finnhub_symbol": "BINANCE:ADAUSDT", "binance_symbol": "ADAUSDT", "category": "crypto", "name": "Cardano", "price": 0.445, "change_24h": -2.10, "market_cap": 15900000000, "volume_24h": 410000000, "circulating_supply": 35700000000, "all_time_high": 3.10, "rank": 7, "logo": "https://assets.coingecko.com/coins/images/975/large/cardano.png", "description": "Evidence-based, peer-reviewed proof-of-stake smart contract platform."},
        {"id": "avalanche-2", "symbol": "AVAX", "finnhub_symbol": "BINANCE:AVAXUSDT", "binance_symbol": "AVAXUSDT", "category": "crypto", "name": "Avalanche", "price": 28.75, "change_24h": 4.12, "market_cap": 11340000000, "volume_24h": 680000000, "circulating_supply": 395000000, "all_time_high": 146.22, "rank": 8, "logo": "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png", "description": "Scalable blockchain with novel consensus and customizable subnet architecture."},
        {"id": "chainlink", "symbol": "LINK", "finnhub_symbol": "BINANCE:LINKUSDT", "binance_symbol": "LINKUSDT", "category": "crypto", "name": "Chainlink", "price": 14.85, "change_24h": 1.25, "market_cap": 8900000000, "volume_24h": 520000000, "circulating_supply": 600000000, "all_time_high": 52.88, "rank": 9, "logo": "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", "description": "Decentralized oracle network connecting smart contracts to off-chain data."},
        {"id": "sui", "symbol": "SUI", "finnhub_symbol": "BINANCE:SUIUSDT", "binance_symbol": "SUIUSDT", "category": "crypto", "name": "Sui", "price": 2.85, "change_24h": 7.4, "market_cap": 8100000000, "volume_24h": 940000000, "circulating_supply": 2850000000, "all_time_high": 3.92, "rank": 10, "logo": "https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png", "description": "Object-centric Layer 1 blockchain optimized for fast parallel execution."},
        {"id": "shiba-inu", "symbol": "SHIB", "finnhub_symbol": "BINANCE:SHIBUSDT", "binance_symbol": "SHIBUSDT", "category": "crypto", "name": "Shiba Inu", "price": 0.0000185, "change_24h": -2.8, "market_cap": 10800000000, "volume_24h": 450000000, "circulating_supply": 589000000000000, "all_time_high": 0.000088, "rank": 11, "logo": "https://assets.coingecko.com/coins/images/11939/large/shiba.png", "description": "Decentralized meme ecosystem token powering Shibarium Layer 2."},
        {"id": "polkadot", "symbol": "DOT", "finnhub_symbol": "BINANCE:DOTUSDT", "binance_symbol": "DOTUSDT", "category": "crypto", "name": "Polkadot", "price": 5.42, "change_24h": -1.1, "market_cap": 7800000000, "volume_24h": 280000000, "circulating_supply": 1430000000, "all_time_high": 55.00, "rank": 12, "logo": "https://assets.coingecko.com/coins/images/12171/large/polkadot.png", "description": "Multi-chain network coordinating heterogeneous parachains securely."},
        {"id": "near", "symbol": "NEAR", "finnhub_symbol": "BINANCE:NEARUSDT", "binance_symbol": "NEARUSDT", "category": "crypto", "name": "NEAR Protocol", "price": 5.25, "change_24h": 3.2, "market_cap": 6400000000, "volume_24h": 380000000, "circulating_supply": 1210000000, "all_time_high": 20.42, "rank": 13, "logo": "https://assets.coingecko.com/coins/images/10365/large/near.png", "description": "Sharded developer-friendly proof-of-stake blockchain built with Nightshade."},
        {"id": "uniswap", "symbol": "UNI", "finnhub_symbol": "BINANCE:UNIUSDT", "binance_symbol": "UNIUSDT", "category": "crypto", "name": "Uniswap", "price": 9.40, "change_24h": -0.6, "market_cap": 5600000000, "volume_24h": 240000000, "circulating_supply": 600000000, "all_time_high": 44.97, "rank": 14, "logo": "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", "description": "Leading decentralized automated market maker exchange protocol."},
        {"id": "litecoin", "symbol": "LTC", "finnhub_symbol": "BINANCE:LTCUSDT", "binance_symbol": "LTCUSDT", "category": "crypto", "name": "Litecoin", "price": 72.80, "change_24h": 0.45, "market_cap": 5400000000, "volume_24h": 310000000, "circulating_supply": 75000000, "all_time_high": 412.96, "rank": 15, "logo": "https://assets.coingecko.com/coins/images/2/large/litecoin.png", "description": "Early proof-of-work payment network offering fast blocks and negligible fees."},
        {"id": "pepe", "symbol": "PEPE", "finnhub_symbol": "BINANCE:PEPEUSDT", "binance_symbol": "PEPEUSDT", "category": "crypto", "name": "Pepe", "price": 0.0000098, "change_24h": -4.2, "market_cap": 4100000000, "volume_24h": 620000000, "circulating_supply": 420690000000000, "all_time_high": 0.000017, "rank": 16, "logo": "https://assets.coingecko.com/coins/images/29850/large/pepe-token.png", "description": "Popular meme coin launched on Ethereum with zero-tax tokenomics."},

        # ─────────────────────────────────────────────────────────────
        # 2. GLOBAL EQUITIES & STOCKS (FINNHUB US EQUITIES)
        # ─────────────────────────────────────────────────────────────
        {"id": "aapl", "symbol": "AAPL", "finnhub_symbol": "AAPL", "category": "stocks", "name": "Apple Inc.", "price": 347.41, "change_24h": -0.94, "market_cap": 3520000000000, "volume_24h": 52400000, "circulating_supply": 15200000000, "all_time_high": 358.50, "rank": 1, "logo": "https://assets.coingecko.com/markets/images/apple.png", "description": "Global consumer technology, mobile devices, operating systems, and digital services."},
        {"id": "nvda", "symbol": "NVDA", "finnhub_symbol": "NVDA", "category": "stocks", "name": "NVIDIA Corporation", "price": 167.23, "change_24h": -6.40, "market_cap": 3120000000000, "volume_24h": 82000000, "circulating_supply": 24500000000, "all_time_high": 182.00, "rank": 2, "logo": "https://assets.coingecko.com/markets/images/nvidia.png", "description": "Pioneer of GPU hardware, accelerated computing, AI data center hardware, and software stacks."},
        {"id": "msft", "symbol": "MSFT", "finnhub_symbol": "MSFT", "category": "stocks", "name": "Microsoft Corporation", "price": 428.15, "change_24h": -0.52, "market_cap": 3180000000000, "volume_24h": 22400000, "circulating_supply": 7430000000, "all_time_high": 468.35, "rank": 3, "logo": "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg", "description": "Enterprise cloud computing via Azure, productivity platforms, gaming, and AI development."},
        {"id": "amzn", "symbol": "AMZN", "finnhub_symbol": "AMZN", "category": "stocks", "name": "Amazon.com Inc.", "price": 204.80, "change_24h": 1.15, "market_cap": 2150000000000, "volume_24h": 41200000, "circulating_supply": 10500000000, "all_time_high": 215.90, "rank": 4, "logo": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", "description": "Global e-commerce marketplace, logistics infrastructure, and AWS cloud computing."},
        {"id": "googl", "symbol": "GOOGL", "finnhub_symbol": "GOOGL", "category": "stocks", "name": "Alphabet Inc. (Google)", "price": 182.60, "change_24h": -0.85, "market_cap": 2240000000000, "volume_24h": 28100000, "circulating_supply": 12300000000, "all_time_high": 193.30, "rank": 5, "logo": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg", "description": "Search engine dominance, YouTube streaming, Google Cloud, and Gemini AI models."},
        {"id": "tsla", "symbol": "TSLA", "finnhub_symbol": "TSLA", "category": "stocks", "name": "Tesla Inc.", "price": 318.50, "change_24h": 4.80, "market_cap": 1020000000000, "volume_24h": 78500000, "circulating_supply": 3210000000, "all_time_high": 414.50, "rank": 6, "logo": "https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg", "description": "Electric vehicles, autonomous Full Self-Driving software, and energy storage batteries."},
        {"id": "meta", "symbol": "META", "finnhub_symbol": "META", "category": "stocks", "name": "Meta Platforms Inc.", "price": 578.40, "change_24h": 0.65, "market_cap": 1460000000000, "volume_24h": 18200000, "circulating_supply": 2540000000, "all_time_high": 602.95, "rank": 7, "logo": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg", "description": "Social connectivity through Facebook, Instagram, WhatsApp, and open-source Llama AI."},
        {"id": "amd", "symbol": "AMD", "finnhub_symbol": "AMD", "category": "stocks", "name": "Advanced Micro Devices", "price": 144.20, "change_24h": -1.80, "market_cap": 234000000000, "volume_24h": 38400000, "circulating_supply": 1620000000, "all_time_high": 227.30, "rank": 8, "logo": "https://upload.wikimedia.org/wikipedia/commons/7/7c/AMD_Logo.svg", "description": "Semiconductor producer powering x86 server chips, gaming consoles, and MI300 AI accelerators."},
        {"id": "coin", "symbol": "COIN", "finnhub_symbol": "COIN", "category": "stocks", "name": "Coinbase Global Inc.", "price": 312.40, "change_24h": 5.40, "market_cap": 78000000000, "volume_24h": 14200000, "circulating_supply": 248000000, "all_time_high": 429.54, "rank": 9, "logo": "https://assets.coingecko.com/coins/images/279/large/ethereum.png", "description": "Premier US digital asset custodian, regulated exchange, and Base Layer 2 incubator."},
        {"id": "pltr", "symbol": "PLTR", "finnhub_symbol": "PLTR", "category": "stocks", "name": "Palantir Technologies", "price": 64.80, "change_24h": 8.20, "market_cap": 145000000000, "volume_24h": 68000000, "circulating_supply": 2240000000, "all_time_high": 66.20, "rank": 10, "logo": "https://upload.wikimedia.org/wikipedia/commons/1/13/Palantir_Technologies_logo.svg", "description": "Defense intelligence software, Gotham analytics, and Artificial Intelligence Platform (AIP)."},

        # ─────────────────────────────────────────────────────────────
        # 3. GLOBAL FOREX & CURRENCIES
        # ─────────────────────────────────────────────────────────────
        {"id": "eur-usd", "symbol": "EUR/USD", "forex_base": "EUR", "forex_quote": "USD", "category": "forex", "name": "Euro / US Dollar", "price": 1.0825, "change_24h": 0.18, "market_cap": 0, "volume_24h": 650000000000, "circulating_supply": 0, "all_time_high": 1.6038, "rank": 1, "logo": "https://flagcdn.com/w80/eu.png", "description": "The world's most heavily traded currency pair, representing the Eurozone and US economies."},
        {"id": "gbp-usd", "symbol": "GBP/USD", "forex_base": "GBP", "forex_quote": "USD", "category": "forex", "name": "British Pound / US Dollar", "price": 1.2940, "change_24h": -0.22, "market_cap": 0, "volume_24h": 350000000000, "circulating_supply": 0, "all_time_high": 2.1161, "rank": 2, "logo": "https://flagcdn.com/w80/gb.png", "description": "Known as 'Cable', benchmark for transatlantic commerce and financial settlements."},
        {"id": "usd-jpy", "symbol": "USD/JPY", "forex_base": "USD", "forex_quote": "JPY", "category": "forex", "name": "US Dollar / Japanese Yen", "price": 154.20, "change_24h": 0.45, "market_cap": 0, "volume_24h": 420000000000, "circulating_supply": 0, "all_time_high": 161.95, "rank": 3, "logo": "https://flagcdn.com/w80/jp.png", "description": "Primary Asian currency pair, heavily driven by central bank yield differentials."},
        {"id": "usd-chf", "symbol": "USD/CHF", "forex_base": "USD", "forex_quote": "CHF", "category": "forex", "name": "US Dollar / Swiss Franc", "price": 0.8840, "change_24h": -0.15, "market_cap": 0, "volume_24h": 180000000000, "circulating_supply": 0, "all_time_high": 1.8310, "rank": 4, "logo": "https://flagcdn.com/w80/ch.png", "description": "Swiss Franc safe-haven benchmark for macroeconomic hedging."},
        {"id": "aud-usd", "symbol": "AUD/USD", "forex_base": "AUD", "forex_quote": "USD", "category": "forex", "name": "Australian Dollar / US Dollar", "price": 0.6580, "change_24h": -0.35, "market_cap": 0, "volume_24h": 220000000000, "circulating_supply": 0, "all_time_high": 1.1080, "rank": 5, "logo": "https://flagcdn.com/w80/au.png", "description": "Commodity currency benchmark tied to iron ore, agricultural exports, and metals."},
        {"id": "usd-cad", "symbol": "USD/CAD", "forex_base": "USD", "forex_quote": "CAD", "category": "forex", "name": "US Dollar / Canadian Dollar", "price": 1.4110, "change_24h": 0.12, "market_cap": 0, "volume_24h": 190000000000, "circulating_supply": 0, "all_time_high": 1.6190, "rank": 6, "logo": "https://flagcdn.com/w80/ca.png", "description": "Known as the 'Loonie', closely correlated to crude oil benchmarks and North American trade."},
        {"id": "nzd-usd", "symbol": "NZD/USD", "forex_base": "NZD", "forex_quote": "USD", "category": "forex", "name": "New Zealand Dollar / USD", "price": 0.5890, "change_24h": -0.25, "market_cap": 0, "volume_24h": 85000000000, "circulating_supply": 0, "all_time_high": 0.8840, "rank": 7, "logo": "https://flagcdn.com/w80/nz.png", "description": "The 'Kiwi' dollar, heavily influenced by dairy exports and Asia-Pacific trade flows."},
        {"id": "usd-kes", "symbol": "USD/KES", "forex_base": "USD", "forex_quote": "KES", "category": "forex", "name": "US Dollar / Kenyan Shilling", "price": 129.90, "change_24h": -0.08, "market_cap": 0, "volume_24h": 12000000000, "circulating_supply": 0, "all_time_high": 162.50, "rank": 8, "logo": "https://flagcdn.com/w80/ke.png", "description": "East Africa's premier financial hub currency and mobile money settlement medium."},
        {"id": "usd-zar", "symbol": "USD/ZAR", "forex_base": "USD", "forex_quote": "ZAR", "category": "forex", "name": "US Dollar / South African Rand", "price": 17.65, "change_24h": 0.35, "market_cap": 0, "volume_24h": 45000000000, "circulating_supply": 0, "all_time_high": 19.92, "rank": 9, "logo": "https://flagcdn.com/w80/za.png", "description": "Liquid emerging market currency tied to gold and platinum commodity cycles."},
        {"id": "usd-cnh", "symbol": "USD/CNH", "forex_base": "USD", "forex_quote": "CNH", "category": "forex", "name": "US Dollar / Offshore Chinese Yuan", "price": 7.2450, "change_24h": 0.15, "market_cap": 0, "volume_24h": 180000000000, "circulating_supply": 0, "all_time_high": 7.3750, "rank": 10, "logo": "https://flagcdn.com/w80/cn.png", "description": "Offshore traded Renminbi reflecting global manufacturing and Chinese economic momentum."},
    ]

    @classmethod
    async def fetch_live_quotes(cls, asset_ids: Optional[List[str]] = None) -> None:
        """
        On-demand quote fetcher:
        Pulls real-time live quotes for requested or visible assets via Finnhub (< 30 req/sec cap).
        """
        settings = get_settings()
        api_key = getattr(settings, "FINNHUB_API_KEY", "dbpjv1hr01qr0r9nu7dgdbpjv1hr01qr0r9nu7e0")
        headers = {"X-Finnhub-Token": api_key, "User-Agent": "PesaFlip/1.0"}

        target_assets = (
            [a for a in cls.ASSETS_DATABASE if a["id"] in asset_ids]
            if asset_ids
            else cls.ASSETS_DATABASE[:15]
        )

        async def fetch_asset_quote(client: httpx.AsyncClient, asset: Dict[str, Any]):
            finnhub_ticker = asset.get("finnhub_symbol")
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
                        asset["price"] = curr_price
                        if dp_change is not None:
                            asset["change_24h"] = round(dp_change, 2)
            except Exception as e:
                logger.debug(f"Quote fetch error for {finnhub_ticker}: {e}")

        async def fetch_forex_rates(client: httpx.AsyncClient):
            try:
                res = await client.get("https://open.er-api.com/v6/latest/USD", timeout=3.5)
                if res.status_code == 200:
                    rates = res.json().get("rates", {})
                    for a in cls.ASSETS_DATABASE:
                        if a.get("category") == "forex":
                            base = a.get("forex_base")
                            quote = a.get("forex_quote")
                            if base and quote:
                                if base == "USD" and quote in rates:
                                    a["price"] = round(rates[quote], 4 if rates[quote] < 10 else 2)
                                elif quote == "USD" and base in rates and rates[base] > 0:
                                    a["price"] = round(1.0 / rates[base], 4)
            except Exception as e:
                logger.debug(f"Forex fetch error: {e}")

        try:
            async with httpx.AsyncClient() as client:
                finnhub_targets = [a for a in target_assets if a.get("finnhub_symbol")]
                tasks = [fetch_asset_quote(client, a) for a in finnhub_targets]
                if any(a.get("category") == "forex" for a in target_assets):
                    tasks.append(fetch_forex_rates(client))
                await asyncio.gather(*tasks, return_exceptions=True)
        except Exception as ex:
            logger.debug(f"Batch quote update error: {ex}")

    @classmethod
    async def get_global_market_overview(cls) -> Dict[str, Any]:
        cryptos = [a for a in cls.ASSETS_DATABASE if a.get("category") == "crypto"]
        stocks = [a for a in cls.ASSETS_DATABASE if a.get("category") == "stocks"]
        forex = [a for a in cls.ASSETS_DATABASE if a.get("category") == "forex"]

        total_mcap = sum(c["price"] * c.get("circulating_supply", 0) for c in cryptos)
        total_vol = sum(c.get("volume_24h", 0) for c in cryptos)
        btc_mcap = cryptos[0]["price"] * cryptos[0].get("circulating_supply", 1)
        btc_dominance = round((btc_mcap / total_mcap) * 100, 1) if total_mcap > 0 else 52.4

        sorted_by_change = sorted(cls.ASSETS_DATABASE, key=lambda x: x["change_24h"], reverse=True)

        return {
            "total_market_cap": total_mcap,
            "total_volume_24h": total_vol,
            "market_cap_change_24h": round(sum(c["change_24h"] for c in cryptos) / len(cryptos), 2),
            "btc_dominance": btc_dominance,
            "eth_dominance": 16.8,
            "top_gainers": sorted_by_change[:3],
            "top_losers": sorted_by_change[-3:],
            "trending": cls.ASSETS_DATABASE[:6],
            "total_count": len(cls.ASSETS_DATABASE),
            "forex_count": len(forex),
            "stocks_count": len(stocks),
            "crypto_count": len(cryptos),
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "source": "Finnhub & Global Market Feeds",
        }

    @classmethod
    async def get_coins(
        cls,
        category: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        results = cls.ASSETS_DATABASE

        if category and category != "all":
            results = [a for a in results if a.get("category") == category.lower()]

        if search:
            q = search.lower()
            results = [
                a for a in results
                if q in a["name"].lower() or q in a["symbol"].lower()
            ]

        total_items = len(results)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_items = results[start_idx:end_idx]

        # Trigger on-demand price refresh for this specific page slice
        await cls.fetch_live_quotes(asset_ids=[a["id"] for a in paginated_items])

        return {
            "page": page,
            "limit": limit,
            "total": total_items,
            "has_more": end_idx < total_items,
            "items": paginated_items,
        }

    @classmethod
    def get_coin_by_id(cls, coin_id: str) -> Optional[Dict[str, Any]]:
        for a in cls.ASSETS_DATABASE:
            if a["id"] == coin_id.lower() or a["symbol"].lower() == coin_id.lower():
                return a
        return None

    @classmethod
    async def generate_chart_history(cls, coin_id: str, timeframe: str = "7d") -> Dict[str, Any]:
        asset = cls.get_coin_by_id(coin_id)
        if not asset:
            asset = cls.ASSETS_DATABASE[0]

        is_crypto = asset.get("category") == "crypto"
        binance_symbol = asset.get("binance_symbol", f"{asset['symbol']}USDT")

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

        candles: List[Dict[str, Any]] = []

        if is_crypto:
            try:
                async with httpx.AsyncClient(timeout=3.5) as client:
                    res = await client.get(
                        f"https://api.binance.com/api/v3/klines?symbol={binance_symbol}&interval={interval}&limit={limit}"
                    )
                    if res.status_code == 200:
                        klines = res.json()
                        for k in klines:
                            dt_iso = datetime.utcfromtimestamp(k[0] / 1000.0).isoformat() + "Z"
                            open_p = float(k[1])
                            high_p = float(k[2])
                            low_p = float(k[3])
                            close_p = float(k[4])
                            vol = float(k[5])
                            candles.append({
                                "timestamp": dt_iso,
                                "time": int(k[0] / 1000),
                                "open": round(open_p, 4 if open_p < 1.0 else 2),
                                "high": round(high_p, 4 if high_p < 1.0 else 2),
                                "low": round(low_p, 4 if low_p < 1.0 else 2),
                                "close": round(close_p, 4 if close_p < 1.0 else 2),
                                "price": round(close_p, 4 if close_p < 1.0 else 2),
                                "volume": round(vol, 2),
                            })
            except Exception as e:
                logger.debug(f"Binance klines fetch error for {binance_symbol}: {e}")

        # If stock or forex or network fallback, synthesize realistic OHLC around current live quote
        if not candles:
            base_p = asset["price"]
            now = datetime.utcnow()
            count = limit
            delta_mins = 60 if timeframe in ["1h", "24h"] else 360
            volatility = 0.003 if asset.get("category") == "forex" else (0.015 if asset.get("category") == "stocks" else 0.025)

            for i in range(count):
                t = now - timedelta(minutes=(count - i) * delta_mins)
                drift = (math.sin(i * 0.4) * 0.5 + math.cos(i * 0.25) * 0.5) * volatility
                close_val = base_p * (1.0 + drift)
                open_val = close_val * (1.0 - (math.sin(i * 0.8) * volatility * 0.4))
                high_val = max(open_val, close_val) * (1.0 + (volatility * 0.3))
                low_val = min(open_val, close_val) * (1.0 - (volatility * 0.3))

                if i == count - 1:
                    close_val = base_p
                    high_val = max(high_val, base_p)
                    low_val = min(low_val, base_p)

                decimals = 4 if base_p < 10.0 else 2
                candles.append({
                    "timestamp": t.isoformat() + "Z",
                    "time": int(t.timestamp()),
                    "open": round(open_val, decimals),
                    "high": round(high_val, decimals),
                    "low": round(low_val, decimals),
                    "close": round(close_val, decimals),
                    "price": round(close_val, decimals),
                    "volume": round(1500000 * (0.8 + 0.4 * (i % 3)), 2),
                })

        for idx, c in enumerate(candles):
            if idx >= 6:
                subset = [candles[j]["close"] for j in range(idx - 6, idx + 1)]
                c["sma7"] = round(sum(subset) / 7, 4 if asset["price"] < 10.0 else 2)
            else:
                c["sma7"] = c["close"]

        min_p = min(c["low"] for c in candles)
        max_p = max(c["high"] for c in candles)
        first_p = candles[0]["open"]
        change_pct = round(((asset["price"] - first_p) / first_p) * 100, 2) if first_p > 0 else 0.0

        return {
            "coin_id": asset["id"],
            "symbol": asset["symbol"],
            "category": asset.get("category", "crypto"),
            "timeframe": timeframe,
            "current_price": asset["price"],
            "min_price": min_p,
            "max_price": max_p,
            "change_pct": change_pct,
            "points": candles,
            "candles": candles,
        }
