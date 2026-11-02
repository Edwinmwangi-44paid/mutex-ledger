import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import httpx

from app.core.database import get_session_factory
from app.models.sports import League, Team, Fixture, MatchStatistic, MatchPrediction
from app.services.ai_prediction_service import AIPredictionEngine

logger = logging.getLogger("pesaflip.sports")


class SportsDataService:
    """
    Modular Sports Data Provider for live matches, fixtures, standings, stats & real-time updates.
    Includes built-in dynamic dataset covering:
    - English Premier League
    - Spanish La Liga
    - Italian Serie A
    - German Bundesliga
    - French Ligue 1
    - UEFA Champions League
    - Kenyan Premier League (FKF Premier League)
    - CAF Champions League / International
    """

    _CACHE: Dict[str, Any] = {}
    _CACHE_TTL: int = 60  # seconds

    LEAGUES_DATA = [
        {
            "id": "epl",
            "name": "Premier League",
            "country": "England",
            "logo": "https://media.api-sports.io/football/leagues/39.png",
            "flag": "https://media.api-sports.io/flags/gb.svg",
            "season": "2025/2026",
            "is_popular": True,
            "order_priority": 1,
        },
        {
            "id": "laliga",
            "name": "La Liga",
            "country": "Spain",
            "logo": "https://media.api-sports.io/football/leagues/140.png",
            "flag": "https://media.api-sports.io/flags/es.svg",
            "season": "2025/2026",
            "is_popular": True,
            "order_priority": 2,
        },
        {
            "id": "ucl",
            "name": "UEFA Champions League",
            "country": "Europe",
            "logo": "https://media.api-sports.io/football/leagues/2.png",
            "flag": "https://media.api-sports.io/flags/eu.svg",
            "season": "2025/2026",
            "is_popular": True,
            "order_priority": 3,
        },
        {
            "id": "seriea",
            "name": "Serie A",
            "country": "Italy",
            "logo": "https://media.api-sports.io/football/leagues/135.png",
            "flag": "https://media.api-sports.io/flags/it.svg",
            "season": "2025/2026",
            "is_popular": True,
            "order_priority": 4,
        },
        {
            "id": "bundesliga",
            "name": "Bundesliga",
            "country": "Germany",
            "logo": "https://media.api-sports.io/football/leagues/78.png",
            "flag": "https://media.api-sports.io/flags/de.svg",
            "season": "2025/2026",
            "is_popular": True,
            "order_priority": 5,
        },
        {
            "id": "ligue1",
            "name": "Ligue 1",
            "country": "France",
            "logo": "https://media.api-sports.io/football/leagues/61.png",
            "flag": "https://media.api-sports.io/flags/fr.svg",
            "season": "2025/2026",
            "is_popular": True,
            "order_priority": 6,
        },
        {
            "id": "kpl",
            "name": "Kenyan Premier League",
            "country": "Kenya",
            "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Kenyan_Premier_League_logo.png/200px-Kenyan_Premier_League_logo.png",
            "flag": "https://media.api-sports.io/flags/ke.svg",
            "season": "2025/2026",
            "is_popular": True,
            "order_priority": 7,
        },
    ]

    TEAMS_DATA = [
        # EPL
        {"id": "arsenal", "name": "Arsenal", "short_name": "ARS", "code": "ARS", "country": "England", "logo": "https://media.api-sports.io/football/teams/42.png", "venue_name": "Emirates Stadium"},
        {"id": "mancity", "name": "Manchester City", "short_name": "MCI", "code": "MCI", "country": "England", "logo": "https://media.api-sports.io/football/teams/50.png", "venue_name": "Etihad Stadium"},
        {"id": "liverpool", "name": "Liverpool", "short_name": "LIV", "code": "LIV", "country": "England", "logo": "https://media.api-sports.io/football/teams/40.png", "venue_name": "Anfield"},
        {"id": "chelsea", "name": "Chelsea", "short_name": "CHE", "code": "CHE", "country": "England", "logo": "https://media.api-sports.io/football/teams/49.png", "venue_name": "Stamford Bridge"},
        {"id": "manutd", "name": "Manchester United", "short_name": "MUN", "code": "MUN", "country": "England", "logo": "https://media.api-sports.io/football/teams/33.png", "venue_name": "Old Trafford"},
        {"id": "tottenham", "name": "Tottenham Hotspur", "short_name": "TOT", "code": "TOT", "country": "England", "logo": "https://media.api-sports.io/football/teams/47.png", "venue_name": "Tottenham Hotspur Stadium"},

        # La Liga
        {"id": "realmadrid", "name": "Real Madrid", "short_name": "RMA", "code": "RMA", "country": "Spain", "logo": "https://media.api-sports.io/football/teams/541.png", "venue_name": "Santiago Bernabéu"},
        {"id": "barcelona", "name": "FC Barcelona", "short_name": "BAR", "code": "BAR", "country": "Spain", "logo": "https://media.api-sports.io/football/teams/529.png", "venue_name": "Camp Nou"},
        {"id": "atletico", "name": "Atlético Madrid", "short_name": "ATM", "code": "ATM", "country": "Spain", "logo": "https://media.api-sports.io/football/teams/530.png", "venue_name": "Cívitas Metropolitano"},

        # Serie A
        {"id": "inter", "name": "Inter Milan", "short_name": "INT", "code": "INT", "country": "Italy", "logo": "https://media.api-sports.io/football/teams/505.png", "venue_name": "San Siro"},
        {"id": "juventus", "name": "Juventus", "short_name": "JUV", "code": "JUV", "country": "Italy", "logo": "https://media.api-sports.io/football/teams/496.png", "venue_name": "Allianz Stadium"},
        {"id": "milan", "name": "AC Milan", "short_name": "MIL", "code": "MIL", "country": "Italy", "logo": "https://media.api-sports.io/football/teams/489.png", "venue_name": "San Siro"},

        # Bundesliga
        {"id": "bayern", "name": "Bayern Munich", "short_name": "BAY", "code": "BAY", "country": "Germany", "logo": "https://media.api-sports.io/football/teams/157.png", "venue_name": "Allianz Arena"},
        {"id": "leverkusen", "name": "Bayer Leverkusen", "short_name": "B04", "code": "B04", "country": "Germany", "logo": "https://media.api-sports.io/football/teams/168.png", "venue_name": "BayArena"},
        {"id": "dortmund", "name": "Borussia Dortmund", "short_name": "BVB", "code": "BVB", "country": "Germany", "logo": "https://media.api-sports.io/football/teams/165.png", "venue_name": "Signal Iduna Park"},

        # Ligue 1
        {"id": "psg", "name": "Paris Saint-Germain", "short_name": "PSG", "code": "PSG", "country": "France", "logo": "https://media.api-sports.io/football/teams/85.png", "venue_name": "Parc des Princes"},
        {"id": "monaco", "name": "AS Monaco", "short_name": "ASM", "code": "ASM", "country": "France", "logo": "https://media.api-sports.io/football/teams/91.png", "venue_name": "Stade Louis II"},

        # Kenya Premier League
        {"id": "gormahia", "name": "Gor Mahia FC", "short_name": "GOR", "code": "GOR", "country": "Kenya", "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Gor_Mahia_FC_crest.svg/220px-Gor_Mahia_FC_crest.svg.png", "venue_name": "Moi International Sports Centre, Kasarani"},
        {"id": "afcleopards", "name": "AFC Leopards", "short_name": "AFC", "code": "AFC", "country": "Kenya", "logo": "https://upload.wikimedia.org/wikipedia/en/4/4e/AFC_Leopards_crest.png", "venue_name": "Nyayo National Stadium"},
        {"id": "tusker", "name": "Tusker FC", "short_name": "TUS", "code": "TUS", "country": "Kenya", "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Tusker_FC_logo.svg/220px-Tusker_FC_logo.svg.png", "venue_name": "Ruaraka Stadium"},
        {"id": "bandari", "name": "Bandari FC", "short_name": "BAN", "code": "BAN", "country": "Kenya", "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/0/00/Bandari_FC_%28Kenya%29_logo.png/220px-Bandari_FC_%28Kenya%29_logo.png", "venue_name": "Mbaraki Sports Club, Mombasa"},
    ]

    @classmethod
    async def seed_sports_dataset(cls):
        """Populates database with structured leagues, teams, and high-fidelity live & scheduled fixtures."""
        session_factory = get_session_factory()
        now = datetime.utcnow()

        async with session_factory() as session:
            # 1. Seed Leagues
            for l_data in cls.LEAGUES_DATA:
                existing = await session.get(League, l_data["id"])
                if not existing:
                    session.add(League(**l_data))

            # 2. Seed Teams
            for t_data in cls.TEAMS_DATA:
                existing = await session.get(Team, t_data["id"])
                if not existing:
                    session.add(Team(**t_data))

            await session.flush()

            # 3. Dynamic Real Fixture Schedule spanning Live, Today, Tomorrow, Next 7 Days, and Completed
            fixtures_spec = [
                # LIVE MATCH 1 (EPL Super Clash)
                {
                    "id": "fix_live_mci_ars",
                    "league_id": "epl",
                    "home_team_id": "mancity",
                    "away_team_id": "arsenal",
                    "kickoff_time": now - timedelta(minutes=68),
                    "status": "LIVE",
                    "elapsed_minutes": 68,
                    "home_score": 2,
                    "away_score": 1,
                    "ht_home_score": 1,
                    "ht_away_score": 1,
                    "venue": "Etihad Stadium",
                    "round_name": "Regular Season - 28",
                    "is_popular": True,
                    "stats": {
                        "home_possession": 62, "away_possession": 38,
                        "home_shots_total": 14, "away_shots_total": 7,
                        "home_shots_on_target": 6, "away_shots_on_target": 3,
                        "home_xg": 1.94, "away_xg": 0.88,
                        "home_corners": 7, "away_corners": 3,
                        "home_fouls": 9, "away_fouls": 13,
                        "home_yellow_cards": 1, "away_yellow_cards": 3,
                        "home_red_cards": 0, "away_red_cards": 0
                    }
                },
                # LIVE MATCH 2 (Kenyan Mashemeji Derby)
                {
                    "id": "fix_live_gor_afc",
                    "league_id": "kpl",
                    "home_team_id": "gormahia",
                    "away_team_id": "afcleopards",
                    "kickoff_time": now - timedelta(minutes=34),
                    "status": "LIVE",
                    "elapsed_minutes": 34,
                    "home_score": 1,
                    "away_score": 0,
                    "ht_home_score": 1,
                    "ht_away_score": 0,
                    "venue": "Moi International Sports Centre, Kasarani",
                    "round_name": "FKF Premier League - Round 21",
                    "is_popular": True,
                    "stats": {
                        "home_possession": 56, "away_possession": 44,
                        "home_shots_total": 8, "away_shots_total": 4,
                        "home_shots_on_target": 3, "away_shots_on_target": 1,
                        "home_xg": 0.92, "away_xg": 0.41,
                        "home_corners": 4, "away_corners": 2,
                        "home_fouls": 11, "away_fouls": 12,
                        "home_yellow_cards": 2, "away_yellow_cards": 2,
                        "home_red_cards": 0, "away_red_cards": 0
                    }
                },
                # TODAY'S UPCOMING MATCHES
                {
                    "id": "fix_today_rma_bar",
                    "league_id": "laliga",
                    "home_team_id": "realmadrid",
                    "away_team_id": "barcelona",
                    "kickoff_time": now.replace(hour=20, minute=0, second=0) + timedelta(minutes=45),
                    "status": "SCHEDULED",
                    "elapsed_minutes": None,
                    "home_score": 0,
                    "away_score": 0,
                    "venue": "Santiago Bernabéu",
                    "round_name": "El Clásico - Matchday 29",
                    "is_popular": True,
                },
                {
                    "id": "fix_today_liv_che",
                    "league_id": "epl",
                    "home_team_id": "liverpool",
                    "away_team_id": "chelsea",
                    "kickoff_time": now.replace(hour=19, minute=30, second=0) + timedelta(hours=2),
                    "status": "SCHEDULED",
                    "elapsed_minutes": None,
                    "home_score": 0,
                    "away_score": 0,
                    "venue": "Anfield",
                    "round_name": "Regular Season - 28",
                    "is_popular": True,
                },
                # TOMORROW'S FIXTURES
                {
                    "id": "fix_tmrw_bay_b04",
                    "league_id": "bundesliga",
                    "home_team_id": "bayern",
                    "away_team_id": "leverkusen",
                    "kickoff_time": (now + timedelta(days=1)).replace(hour=17, minute=30, second=0),
                    "status": "SCHEDULED",
                    "elapsed_minutes": None,
                    "home_score": 0,
                    "away_score": 0,
                    "venue": "Allianz Arena",
                    "round_name": "Matchday 26",
                    "is_popular": True,
                },
                {
                    "id": "fix_tmrw_int_juv",
                    "league_id": "seriea",
                    "home_team_id": "inter",
                    "away_team_id": "juventus",
                    "kickoff_time": (now + timedelta(days=1)).replace(hour=19, minute=45, second=0),
                    "status": "SCHEDULED",
                    "elapsed_minutes": None,
                    "home_score": 0,
                    "away_score": 0,
                    "venue": "San Siro (Derby d'Italia)",
                    "round_name": "Serie A - Round 27",
                    "is_popular": True,
                },
                {
                    "id": "fix_tmrw_tus_ban",
                    "league_id": "kpl",
                    "home_team_id": "tusker",
                    "away_team_id": "bandari",
                    "kickoff_time": (now + timedelta(days=1)).replace(hour=15, minute=0, second=0),
                    "status": "SCHEDULED",
                    "elapsed_minutes": None,
                    "home_score": 0,
                    "away_score": 0,
                    "venue": "Ruaraka Stadium",
                    "round_name": "FKF Premier League - Round 21",
                    "is_popular": False,
                },
                # NEXT 7 DAYS FIXTURES
                {
                    "id": "fix_ucl_psg_rma",
                    "league_id": "ucl",
                    "home_team_id": "psg",
                    "away_team_id": "realmadrid",
                    "kickoff_time": (now + timedelta(days=3)).replace(hour=20, minute=0, second=0),
                    "status": "SCHEDULED",
                    "elapsed_minutes": None,
                    "home_score": 0,
                    "away_score": 0,
                    "venue": "Parc des Princes",
                    "round_name": "Quarter-finals - 1st Leg",
                    "is_popular": True,
                },
                {
                    "id": "fix_ucl_mci_bay",
                    "league_id": "ucl",
                    "home_team_id": "mancity",
                    "away_team_id": "bayern",
                    "kickoff_time": (now + timedelta(days=4)).replace(hour=20, minute=0, second=0),
                    "status": "SCHEDULED",
                    "elapsed_minutes": None,
                    "home_score": 0,
                    "away_score": 0,
                    "venue": "Etihad Stadium",
                    "round_name": "Quarter-finals - 1st Leg",
                    "is_popular": True,
                },
                {
                    "id": "fix_epl_mun_tot",
                    "league_id": "epl",
                    "home_team_id": "manutd",
                    "away_team_id": "tottenham",
                    "kickoff_time": (now + timedelta(days=5)).replace(hour=16, minute=30, second=0),
                    "status": "SCHEDULED",
                    "elapsed_minutes": None,
                    "home_score": 0,
                    "away_score": 0,
                    "venue": "Old Trafford",
                    "round_name": "Regular Season - 29",
                    "is_popular": True,
                },
                # COMPLETED (FINISHED) MATCH
                {
                    "id": "fix_ft_atm_bar",
                    "league_id": "laliga",
                    "home_team_id": "atletico",
                    "away_team_id": "barcelona",
                    "kickoff_time": now - timedelta(days=2),
                    "status": "FT",
                    "elapsed_minutes": 90,
                    "home_score": 1,
                    "away_score": 2,
                    "ht_home_score": 0,
                    "ht_away_score": 1,
                    "venue": "Cívitas Metropolitano",
                    "round_name": "Matchday 28",
                    "is_popular": True,
                    "stats": {
                        "home_possession": 44, "away_possession": 56,
                        "home_shots_total": 11, "away_shots_total": 15,
                        "home_shots_on_target": 4, "away_shots_on_target": 6,
                        "home_xg": 1.25, "away_xg": 1.82,
                        "home_corners": 5, "away_corners": 6,
                        "home_fouls": 15, "away_fouls": 11,
                        "home_yellow_cards": 4, "away_yellow_cards": 2,
                        "home_red_cards": 0, "away_red_cards": 0
                    }
                },
            ]

            for fix in fixtures_spec:
                existing_f = await session.get(Fixture, fix["id"])
                if not existing_f:
                    f_record = Fixture(
                        id=fix["id"],
                        league_id=fix["league_id"],
                        home_team_id=fix["home_team_id"],
                        away_team_id=fix["away_team_id"],
                        kickoff_time=fix["kickoff_time"],
                        status=fix["status"],
                        elapsed_minutes=fix["elapsed_minutes"],
                        home_score=fix["home_score"],
                        away_score=fix["away_score"],
                        ht_home_score=fix.get("ht_home_score"),
                        ht_away_score=fix.get("ht_away_score"),
                        venue=fix["venue"],
                        round_name=fix["round_name"],
                        is_popular=fix["is_popular"],
                    )
                    session.add(f_record)
                    await session.flush()

                    # Add stats if present
                    if "stats" in fix:
                        s_data = fix["stats"]
                        stat_rec = MatchStatistic(
                            fixture_id=fix["id"],
                            home_possession=s_data["home_possession"],
                            away_possession=s_data["away_possession"],
                            home_shots_total=s_data["home_shots_total"],
                            away_shots_total=s_data["away_shots_total"],
                            home_shots_on_target=s_data["home_shots_on_target"],
                            away_shots_on_target=s_data["away_shots_on_target"],
                            home_xg=s_data["home_xg"],
                            away_xg=s_data["away_xg"],
                            home_corners=s_data["home_corners"],
                            away_corners=s_data["away_corners"],
                            home_fouls=s_data["home_fouls"],
                            away_fouls=s_data["away_fouls"],
                            home_yellow_cards=s_data["home_yellow_cards"],
                            away_yellow_cards=s_data["away_yellow_cards"],
                            home_red_cards=s_data["home_red_cards"],
                            away_red_cards=s_data["away_red_cards"],
                        )
                        session.add(stat_rec)

            await session.commit()
            logger.info("Sports Match Centre datasets successfully initialized.")

