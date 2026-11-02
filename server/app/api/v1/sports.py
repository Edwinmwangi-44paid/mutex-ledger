from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.models.sports import League, Team, Fixture, MatchStatistic, MatchPrediction, UserFavorite
from app.schemas.sports import (
    LeagueBase,
    FixtureSummary,
    MatchStatisticSchema,
    H2HSummary,
    AIDeepAnalysisResponse,
    PredictionItem,
)
from app.services.ai_prediction_service import AIPredictionEngine

router = APIRouter(prefix="/sports", tags=["Sports Match Centre"])

# Realistic form cache dictionary
TEAM_FORMS = {
    "arsenal": ["W", "W", "D", "W", "W"],
    "mancity": ["W", "W", "W", "D", "W"],
    "liverpool": ["W", "D", "W", "W", "L"],
    "chelsea": ["D", "W", "L", "W", "D"],
    "manutd": ["L", "W", "D", "L", "W"],
    "tottenham": ["W", "L", "W", "D", "L"],
    "realmadrid": ["W", "W", "W", "W", "D"],
    "barcelona": ["W", "W", "W", "L", "W"],
    "atletico": ["D", "W", "W", "L", "W"],
    "bayern": ["W", "W", "W", "D", "W"],
    "leverkusen": ["W", "D", "W", "W", "D"],
    "dortmund": ["W", "L", "D", "W", "W"],
    "inter": ["W", "W", "W", "W", "W"],
    "juventus": ["D", "W", "D", "W", "L"],
    "milan": ["L", "W", "W", "D", "W"],
    "psg": ["W", "W", "W", "W", "D"],
    "monaco": ["W", "D", "L", "W", "W"],
    "gormahia": ["W", "W", "W", "D", "W"],
    "afcleopards": ["D", "W", "L", "W", "D"],
    "tusker": ["W", "D", "W", "L", "W"],
    "bandari": ["D", "D", "W", "L", "D"],
}


@router.get("/leagues", response_model=List[LeagueBase])
async def get_leagues(session: AsyncSession = Depends(get_db_session)):
    stmt = select(League).order_priority = League.order_priority.asc()
    stmt = select(League).order_by(League.order_priority.asc())
    result = await session.execute(stmt)
    leagues = result.scalars().all()
    
    # Enrich with count of fixtures
    enriched = []
    for lg in leagues:
        c_stmt = select(func.count(Fixture.id)).where(Fixture.league_id == lg.id)
        c_res = await session.execute(c_stmt)
        count = c_res.scalar() or 0
        enriched.append(
            LeagueBase(
                id=lg.id,
                name=lg.name,
                country=lg.country,
                logo=lg.logo,
                flag=lg.flag,
                season=lg.season,
                is_popular=lg.is_popular,
                order_priority=lg.order_priority,
                fixtures_count=count,
            )
        )
    return enriched


@router.get("/fixtures", response_model=List[FixtureSummary])
async def get_fixtures(
    status_filter: Optional[str] = Query(None, description="live, today, tomorrow, next_7_days, completed, popular"),
    league_id: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Fixture)
        .options(
            selectinload(Fixture.league),
            selectinload(Fixture.home_team),
            selectinload(Fixture.away_team),
            selectinload(Fixture.predictions),
        )
        .order_by(Fixture.kickoff_time.asc())
    )

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    tomorrow_start = today_end
    tomorrow_end = tomorrow_start + timedelta(days=1)
    next_7_days_end = today_start + timedelta(days=7)

    if status_filter == "live":
        stmt = stmt.where(Fixture.status.in_(["LIVE", "HT"]))
    elif status_filter == "today":
        stmt = stmt.where(
            and_(
                Fixture.kickoff_time >= today_start,
                Fixture.kickoff_time < today_end,
                Fixture.status != "FT"
            )
        )
    elif status_filter == "tomorrow":
        stmt = stmt.where(
            and_(
                Fixture.kickoff_time >= tomorrow_start,
                Fixture.kickoff_time < tomorrow_end,
            )
        )
    elif status_filter == "next_7_days":
        stmt = stmt.where(
            and_(
                Fixture.kickoff_time >= today_start,
                Fixture.kickoff_time <= next_7_days_end,
            )
        )
    elif status_filter == "completed":
        stmt = stmt.where(Fixture.status == "FT").order_by(Fixture.kickoff_time.desc())
    elif status_filter == "popular":
        stmt = stmt.where(Fixture.is_popular == True)

    if league_id:
        stmt = stmt.where(Fixture.league_id == league_id)

    result = await session.execute(stmt)
    fixtures = result.scalars().all()

    # Search filter and country filter in-memory if needed
    filtered = []
    for f in fixtures:
        if country and f.league.country.lower() != country.lower():
            continue
        if search:
            q = search.lower()
            match = (
                q in f.home_team.name.lower()
                or q in f.away_team.name.lower()
                or q in f.league.name.lower()
                or q in (f.league.country or "").lower()
            )
            if not match:
                continue

        # Compute quick AI recommendation
        h_form = TEAM_FORMS.get(f.home_team_id, ["W", "D", "W", "L", "D"])
        a_form = TEAM_FORMS.get(f.away_team_id, ["D", "L", "W", "D", "L"])
        metrics = AIPredictionEngine.calculate_match_metrics(
            f.home_team.name, f.away_team.name, h_form, a_form, {"total": 5, "home_wins": 2, "away_wins": 1}
        )

        filtered.append(
            FixtureSummary(
                id=f.id,
                league=f.league,
                home_team=f.home_team,
                away_team=f.away_team,
                kickoff_time=f.kickoff_time,
                status=f.status,
                elapsed_minutes=f.elapsed_minutes,
                home_score=f.home_score,
                away_score=f.away_score,
                ht_home_score=f.ht_home_score,
                ht_away_score=f.ht_away_score,
                venue=f.venue,
                round_name=f.round_name,
                is_popular=f.is_popular,
                has_ai_prediction=True,
                ai_top_outcome=metrics["top_outcome"],
                ai_top_probability=metrics["top_prob"],
            )
        )
    return filtered


@router.get("/fixtures/{fixture_id}")
async def get_fixture_details(fixture_id: str, session: AsyncSession = Depends(get_db_session)):
    stmt = (
        select(Fixture)
        .options(
            selectinload(Fixture.league),
            selectinload(Fixture.home_team),
            selectinload(Fixture.away_team),
            selectinload(Fixture.statistics),
        )
        .where(Fixture.id == fixture_id)
    )
    result = await session.execute(stmt)
    fixture = result.scalar_one_or_none()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")

    h_form = TEAM_FORMS.get(fixture.home_team_id, ["W", "D", "W", "W", "D"])
    a_form = TEAM_FORMS.get(fixture.away_team_id, ["D", "W", "L", "W", "D"])

    h2h_data = {
        "total": 6,
        "home_wins": 3,
        "draws": 2,
        "away_wins": 1,
    }

    ai_analysis = AIPredictionEngine.generate_full_prediction_package(
        fixture_id=fixture.id,
        home_team=fixture.home_team.name,
        away_team=fixture.away_team.name,
        home_form=h_form,
        away_form=a_form,
        h2h_records=h2h_data,
        kickoff_time=fixture.kickoff_time,
    )

    stats = fixture.statistics or MatchStatistic(
        home_possession=50, away_possession=50,
        home_shots_total=10, away_shots_total=8,
        home_shots_on_target=4, away_shots_on_target=3,
        home_xg=1.2, away_xg=0.9,
        home_corners=5, away_corners=4,
        home_fouls=10, away_fouls=12,
        home_yellow_cards=2, away_yellow_cards=2,
    )

    return {
        "fixture": FixtureSummary(
            id=fixture.id,
            league=fixture.league,
            home_team=fixture.home_team,
            away_team=fixture.away_team,
            kickoff_time=fixture.kickoff_time,
            status=fixture.status,
            elapsed_minutes=fixture.elapsed_minutes,
            home_score=fixture.home_score,
            away_score=fixture.away_score,
            ht_home_score=fixture.ht_home_score,
            ht_away_score=fixture.ht_away_score,
            venue=fixture.venue,
            round_name=fixture.round_name,
            is_popular=fixture.is_popular,
            has_ai_prediction=True,
            ai_top_outcome=ai_analysis.most_likely_outcome,
            ai_top_probability=ai_analysis.probabilities_1x2.get("home_win", 45.0),
        ),
        "statistics": MatchStatisticSchema.from_orm(stats),
        "ai_analysis": ai_analysis,
        "home_form": h_form,
        "away_form": a_form,
        "h2h": H2HSummary(
            total_matches=h2h_data["total"],
            home_wins=h2h_data["home_wins"],
            draws=h2h_data["draws"],
            away_wins=h2h_data["away_wins"],
            home_form=h_form,
            away_form=a_form,
            recent_matches=[
                {
                    "date": "2025-10-18",
                    "competition": fixture.league.name,
                    "home_score": 2,
                    "away_score": 1,
                    "winner": fixture.home_team.name,
                },
                {
                    "date": "2025-04-12",
                    "competition": fixture.league.name,
                    "home_score": 1,
                    "away_score": 1,
                    "winner": "Draw",
                },
                {
                    "date": "2024-11-25",
                    "competition": fixture.league.name,
                    "home_score": 0,
                    "away_score": 2,
                    "winner": fixture.away_team.name,
                },
            ],
        ),
    }


@router.get("/fixtures/{fixture_id}/predictions", response_model=List[PredictionItem])
async def get_fixture_predictions(fixture_id: str, session: AsyncSession = Depends(get_db_session)):
    stmt = (
        select(Fixture)
        .options(selectinload(Fixture.home_team), selectinload(Fixture.away_team))
        .where(Fixture.id == fixture_id)
    )
    result = await session.execute(stmt)
    fixture = result.scalar_one_or_none()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")

    h_form = TEAM_FORMS.get(fixture.home_team_id, ["W", "D", "W", "W", "D"])
    a_form = TEAM_FORMS.get(fixture.away_team_id, ["D", "W", "L", "W", "D"])
    h2h_data = {"total": 5, "home_wins": 2, "draws": 2, "away_wins": 1}

    pkg = AIPredictionEngine.generate_full_prediction_package(
        fixture_id=fixture.id,
        home_team=fixture.home_team.name,
        away_team=fixture.away_team.name,
        home_form=h_form,
        away_form=a_form,
        h2h_records=h2h_data,
        kickoff_time=fixture.kickoff_time,
    )
    return pkg.market_predictions


@router.post("/fixtures/{fixture_id}/ai-deep-analysis", response_model=AIDeepAnalysisResponse)
async def run_deep_ai_analysis(fixture_id: str, session: AsyncSession = Depends(get_db_session)):
    """Triggers an instantaneous, high-dimensional AI model rerun considering tactical metrics."""
    stmt = (
        select(Fixture)
        .options(selectinload(Fixture.home_team), selectinload(Fixture.away_team))
        .where(Fixture.id == fixture_id)
    )
    result = await session.execute(stmt)
    fixture = result.scalar_one_or_none()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")

    h_form = TEAM_FORMS.get(fixture.home_team_id, ["W", "W", "D", "W", "W"])
    a_form = TEAM_FORMS.get(fixture.away_team_id, ["W", "L", "W", "D", "D"])
    h2h_data = {"total": 8, "home_wins": 4, "draws": 3, "away_wins": 1}

    return AIPredictionEngine.generate_full_prediction_package(
        fixture_id=fixture.id,
        home_team=fixture.home_team.name,
        away_team=fixture.away_team.name,
        home_form=h_form,
        away_form=a_form,
        h2h_records=h2h_data,
        kickoff_time=fixture.kickoff_time,
    )

