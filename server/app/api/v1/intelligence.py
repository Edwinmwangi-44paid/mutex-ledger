from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException

from app.services.crypto_intelligence_service import CryptoIntelligenceService
from app.services.entertainment_service import EntertainmentService

router = APIRouter(tags=["Multi-Domain Intelligence"])


# ─────────────────────────────────────────────────────────────
# CRYPTO INTELLIGENCE ENDPOINTS (PURE MARKET DATA & CHARTS)
# ─────────────────────────────────────────────────────────────

@router.get("/crypto/overview")
async def get_crypto_overview():
    """Returns global crypto market cap, BTC dominance, volume, and top movers."""
    return await CryptoIntelligenceService.get_global_market_overview()


@router.get("/crypto/coins")
async def get_crypto_coins(search: Optional[str] = Query(None)):
    """Returns list of tracked cryptocurrencies with real-time stats."""
    return await CryptoIntelligenceService.get_coins(search=search)


@router.get("/crypto/coins/{coin_id}")
async def get_coin_details(coin_id: str):
    """Returns in-depth coin statistics, market capitalization, ATH, and summary."""
    coin = CryptoIntelligenceService.get_coin_by_id(coin_id)
    if not coin:
        raise HTTPException(status_code=404, detail="Cryptocurrency asset not found")
    return coin


@router.get("/crypto/coins/{coin_id}/chart")
async def get_coin_chart(
    coin_id: str,
    timeframe: str = Query("7d", description="1h, 24h, 7d, 30d, 90d, 1y, all"),
):
    """Generates interactive multi-timeframe price chart points."""
    return await CryptoIntelligenceService.generate_chart_history(coin_id=coin_id, timeframe=timeframe)


# ─────────────────────────────────────────────────────────────
# ENTERTAINMENT & STREAMING DISCOVERY ENDPOINTS
# ─────────────────────────────────────────────────────────────

@router.get("/entertainment/hub")
async def get_entertainment_hub():
    """Returns featured movie hero, trending carousel, movies, series, and streaming partners."""
    return EntertainmentService.get_entertainment_hub()


@router.get("/entertainment/media/{media_id}")
async def get_media_details(media_id: str):
    """Returns complete title details, synopsis, cast, director, and authorized streaming providers."""
    details = EntertainmentService.get_media_details(media_id)
    if not details:
        raise HTTPException(status_code=404, detail="Entertainment media title not found")
    return details


@router.get("/entertainment/search")
async def search_entertainment(q: str = Query(..., min_length=1)):
    """Search movies, series, genres, and directors."""
    return EntertainmentService.search_media(q)

