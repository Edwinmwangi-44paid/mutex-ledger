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
    crypto_matches = [
        {
            "category": "crypto",
            "id": c["id"],
            "title": f"{c['name']} ({c['symbol']})",
            "subtitle": f"${c['price']:,.2f} • 24h: {'+' if c['change_24h'] >= 0 else ''}{c['change_24h']}%",
            "image": c["logo"],
            "badge": f"Rank #{c['rank']}",
            "route": f"/crypto/{c['id']}",
        }
        for c in CryptoIntelligenceService.get_coins(search=query)
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
    Combines trending sports clashes, trending crypto movers, and blockbuster entertainment releases.
    """
    crypto_ov = CryptoIntelligenceService.get_global_market_overview()
    ent_hub = EntertainmentService.get_entertainment_hub()

    return {
        "editorial_hero": {
            "headline": "PesaFlip Intelligence Feed",
            "subheading": "Real-time AI Match Predictions, Deep Crypto Analytics & Cinematic Discovery",
            "timestamp": "2026-11-02T17:30:00Z",
        },
        "trending_sports": [
            {
                "id": "fix_live_mci_ars",
                "home_team": "Manchester City",
                "away_team": "Arsenal",
                "score": "2 - 1",
                "status": "LIVE (68')",
                "ai_outcome": "Man City Win (61%)",
                "league": "Premier League",
            },
            {
                "id": "fix_live_gor_afc",
                "home_team": "Gor Mahia",
                "away_team": "AFC Leopards",
                "score": "1 - 0",
                "status": "LIVE (34')",
                "ai_outcome": "Gor Mahia Win (58%)",
                "league": "Kenyan Premier League",
            },
            {
                "id": "fix_today_rma_bar",
                "home_team": "Real Madrid",
                "away_team": "Barcelona",
                "status": "Tonight 20:45",
                "ai_outcome": "Real Madrid Win (48%)",
                "league": "La Liga",
            },
        ],
        "crypto_highlights": {
            "market_cap": crypto_ov["total_market_cap"],
            "btc_dominance": crypto_ov["btc_dominance"],
            "top_gainers": crypto_ov["top_gainers"],
            "top_coins": CryptoIntelligenceService.get_coins()[:4],
        },
        "entertainment_picks": ent_hub["trending_this_week"][:4],
        "ai_insights": [
            {
                "domain": "Sports",
                "title": "Mashemeji Derby Tactical Edge",
                "summary": "Gor Mahia conversion probability peaks in second-half transition attacks with 56% midfield possession control.",
            },
            {
                "domain": "Crypto",
                "title": "Solana Network Velocity",
                "summary": "SOL shows +6.82% 24h volume expansion driven by sustained decentralized exchange liquidity inflows.",
            },
            {
                "domain": "Entertainment",
                "title": "Sci-Fi Resurgence",
                "summary": "Project Hail Mary leads audience anticipation index with an 8.2 rating ahead of global streaming availability.",
            },
        ],
    }

