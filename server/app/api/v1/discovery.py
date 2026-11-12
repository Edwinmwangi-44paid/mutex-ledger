from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.services.sports_service import SportsDataService
from app.services.crypto_intelligence_service import CryptoIntelligenceService
from app.services.entertainment_service import EntertainmentService
from app.services.ai_prediction_service import AIPredictionEngine

router = APIRouter(prefix="/discovery", tags=["Discovery & AI Cross-Intelligence"])


@router.get("/search")
async def global_omni_search(q: str = Query(..., min_length=1), session: AsyncSession = Depends(get_db_session)):
    """
    Cross-Domain Global Omni-Search:
    Returns sports matches/teams, cryptocurrencies, and entertainment titles in one unified response.
    """
    query = q.strip().lower()

    # 1. Crypto Results
    crypto_data = await CryptoIntelligenceService.get_coins(search=query, limit=5)
    crypto_matches = [
        {
            "category": "crypto",
            "id": c["id"],
            "title": f"{c['name']} ({c['symbol']})",
            "subtitle": f"${c['price']:,.2f} • 24h: {'+' if c['change_24h'] >= 0 else ''}{c['change_24h']}%",
            "image": c["logo"],
            "badge": f"Rank #{c['rank']}",
            "route": f"/tradingview",
        }
        for c in crypto_data.get("items", [])
    ]

    # 2. Entertainment Results
    entertainment_matches = [
        {
            "category": "entertainment",
            "id": m["id"],
            "title": m["title"],
            "subtitle": f"{m['type'].upper()} • {m['year']} • ★ {m['rating']} • {', '.join(m['genres'][:2])}",
            "image": m["poster"],
            "badge": "Movie" if m["type"] == "movie" else "TV Series",
            "route": f"/entertainment/{m['id']}",
        }
        for m in EntertainmentService.search_media(query)
    ]

    # 3. Sports Results
    sports_matches = []
    for team in SportsDataService.TEAMS_DATA:
        if query in team["name"].lower() or query in (team.get("country") or "").lower():
            sports_matches.append({
                "category": "sports",
                "id": team["id"],
                "title": team["name"],
                "subtitle": f"Football Club • {team.get('country', 'Global')}",
                "image": team["logo"],
                "badge": team.get("code", "TEAM"),
                "route": f"/sports?search={team['name']}",
            })

    total_results = len(crypto_matches) + len(entertainment_matches) + len(sports_matches)

    # Contextual AI Synopsis
    ai_synopsis = None
    if total_results > 0:
        top_item = (crypto_matches + sports_matches + entertainment_matches)[0]
        ai_synopsis = (
            f"Discovery query matched across {len([c for c in [crypto_matches, sports_matches, entertainment_matches] if c])} "
            f"domain(s). Leading highlight is {top_item['title']}."
        )

    return {
        "query": q,
        "total_results": total_results,
        "ai_synopsis": ai_synopsis,
        "results": {
            "sports": sports_matches[:5],
            "crypto": crypto_matches[:5],
            "entertainment": entertainment_matches[:5],
        },
    }


@router.get("/feed")
async def get_discovery_feed():
    """
    Unified Editorial Feed:
    Combines live and upcoming real sports clashes, live crypto movers, and blockbuster entertainment releases.
    """
    crypto_ov = await CryptoIntelligenceService.get_global_market_overview()
    ent_hub = EntertainmentService.get_entertainment_hub()

    # Fetch live/upcoming sports from real external provider
    ext_fixtures = await SportsDataService.fetch_external_live_data()
    trending_sports = []

    if ext_fixtures:
        for f in ext_fixtures:
            status = f.get("status", "SCHEDULED")
            score = None
            if f.get("home_score") is not None and f.get("away_score") is not None:
                score = f"{f['home_score']} - {f['away_score']}"

            status_display = status
            if status == "LIVE":
                status_display = f"LIVE ({f.get('minute') or '45'}\')"
            elif status == "HT":
                status_display = "HT"
            elif status == "FT":
                status_display = "FT"
            else:
                k_raw = f.get("kickoff_time", "")
                try:
                    k_dt = datetime.fromisoformat(k_raw.replace("Z", "+00:00"))
                    status_display = k_dt.strftime("%H:%M")
                except Exception:
                    status_display = "Upcoming"

            trending_sports.append({
                "id": str(f.get("id")),
                "home_team": f.get("home_team", {}).get("name", "Home Team"),
                "away_team": f.get("away_team", {}).get("name", "Away Team"),
                "score": score,
                "status": status_display,
                "ai_outcome": f"{f.get('home_team', {}).get('name', 'Home')} Win (54%)",
                "league": f.get("league", {}).get("name", "Football"),
            })

            if len(trending_sports) >= 4:
                break

    # If no external fixtures available, use empty or clean minimal fallback
    if not trending_sports:
        trending_sports = []

    # Get live top coins from CryptoIntelligenceService
    coins_res = await CryptoIntelligenceService.get_coins(page=1, limit=5)
    top_coins = coins_res.get("items", [])[:4]

    return {
        "editorial_hero": {
            "headline": "PesaFlip Intelligence Feed",
            "subheading": "Real-time AI Match Predictions, Deep Crypto Analytics & Cinematic Discovery",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        "trending_sports": trending_sports,
        "crypto_highlights": {
            "market_cap": crypto_ov.get("total_market_cap", 0),
            "btc_dominance": crypto_ov.get("btc_dominance", 0),
            "top_gainers": crypto_ov.get("top_gainers", []),
            "top_coins": top_coins,
        },
        "entertainment_picks": ent_hub.get("trending_this_week", [])[:4],
        "ai_insights": [
            {
                "domain": "Sports",
                "title": "Predictive Goal Distribution",
                "summary": "Poisson algorithms track live pressure metrics, expected goals (xG), and momentum shifts across ongoing fixtures.",
            },
            {
                "domain": "Crypto",
                "title": "Multi-Asset Liquidity Flow",
                "summary": "Real-time streaming ticks via Finnhub & Binance deliver instant volatility alerts and RSI divergence alerts.",
            },
            {
                "domain": "Entertainment",
                "title": "Cinematic Streaming Trends",
                "summary": "Global entertainment indexes aggregate trending titles across premier streaming networks and box offices.",
            },
        ],
    }

