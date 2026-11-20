import os
import json
import logging
from typing import Dict, Any, Optional
import httpx

from app.core.config import get_settings

logger = logging.getLogger("pesaflip.gemini")


class GeminiAIService:
    """
    Central Gemini AI Engine powering:
    1. Sports match predictions (form, squad depth, injuries, winner probability, tactical verdict).
    2. TradingView Market Intelligence (ICT Change in Trend & Smart Money Concepts - Buy/Sell/Hold, target signal, key levels, timestamp).
    3. Entertainment Discovery & AI Critic Q&A.
    """

    _CACHE: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def _get_api_key_and_model(cls) -> tuple[str, str]:
        settings = get_settings()
        api_key = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY", "")
        model = getattr(settings, "GEMINI_MODEL", "gemini-3.1-flash-lite") or "gemini-3.1-flash-lite"
        return api_key, model

    @classmethod
    async def generate_sports_match_analysis(
        cls,
        home_team: str,
        away_team: str,
        home_form: list[str],
        away_form: list[str],
        h2h_records: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Uses Gemini to assess match outcome based on:
        - Past 5-match performance & momentum
        - Form & squad strength comparison
        - Injury & squad availability impacts
        - Tactical verdict and predicted winner/scoreline
        """
        cache_key = f"sports_{home_team}_{away_team}".lower().replace(" ", "_")
        if cache_key in cls._CACHE:
            return cls._CACHE[cache_key]

        api_key, model = cls._get_api_key_and_model()
        if not api_key:
            logger.warning("GEMINI_API_KEY not configured. Skipping Gemini call.")
            return None

        h_str = "-".join(home_form[:5]) if home_form else "W-D-W-W-D"
        a_str = "-".join(away_form[:5]) if away_form else "D-W-L-W-D"

        prompt = (
            f"You are the Lead Sports Tactical AI Analyst.\n"
            f"Analyze the upcoming match between {home_team} (Home) and {away_team} (Away).\n"
            f"Recent Form: {home_team} ({h_str}), {away_team} ({a_str}).\n"
            f"Provide a structured JSON output with:\n"
            f"1. 'suggested_winner': The team name or 'Draw'.\n"
            f"2. 'win_probability_pct': Estimated winning percentage for suggested winner (e.g. 55.0).\n"
            f"3. 'predicted_scoreline': Projected exact scoreline (e.g. '2-1').\n"
            f"4. 'form_analysis': Thorough evaluation of recent match performances, momentum, and goal rates.\n"
            f"5. 'squad_strength': In-depth comparison of starting XI quality, tactical discipline, and bench depth.\n"
            f"6. 'injury_updates': Key squad availability, fitness concerns, and how missing players impact tactical balance.\n"
            f"7. 'tactical_verdict': Tactical match-up overview (pressing triggers, transition threat, set-piece edge).\n"
            f"8. 'key_factors': List of 4 concise decisive match factors."
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"},
        }

        try:
            async with httpx.AsyncClient(timeout=14.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0]["content"]["parts"][0]["text"]
                        analysis_json = json.loads(text)
                        cls._CACHE[cache_key] = analysis_json
                        return analysis_json
                else:
                    logger.warning(f"Gemini API returned status {res.status_code}: {res.text[:120]}")
        except Exception as e:
            logger.error(f"Gemini sports analysis error: {e}")

        return None

    @classmethod
    async def generate_ict_smc_market_advisory(
        cls,
        symbol: str,
        name: str,
        category: str,
        live_price: float,
        change_24h: float,
        timeframe: str = "7d",
    ) -> Optional[Dict[str, Any]]:
        """
        Uses Gemini to deliver ICT (Inner Circle Trader) CIT Model & SMC (Smart Money Concepts) advisory:
        - Recommendation: BUY, SELL, or HOLD
        - Clear reason using Order Blocks (OB), Fair Value Gaps (FVG), Liquidity Sweeps (BSL/SSL), and CIT
        - Target signal price, live price, primary support/resistance key levels
        - Exact issued date & UTC time
        """
        cache_key = f"ict_smc_{symbol}".lower().replace("/", "_").replace(":", "_")
        if cache_key in cls._CACHE:
            return cls._CACHE[cache_key]

        api_key, model = cls._get_api_key_and_model()
        if not api_key:
            return None

        prompt = (
            f"You are an Elite Institutional Algorithmic Trader specializing in ICT (Inner Circle Trader) CIT (Change in Trend) model and SMC (Smart Money Concepts).\n"
            f"Analyze the market asset: {name} ({symbol}) | Category: {category}.\n"
            f"Live Current Price: ${live_price:,.4f} | 24h Price Change: {change_24h}% | Timeframe: {timeframe}.\n"
            f"Provide a structured JSON output with the exact keys:\n"
            f"1. 'action_signal': One of 'BUY', 'SELL', or 'HOLD / WAIT'.\n"
            f"2. 'signal_confidence': 'HIGH' or 'MEDIUM'.\n"
            f"3. 'target_signal_price': Numeric price target based on unmitigated Order Blocks or Liquidity Pool.\n"
            f"4. 'primary_support': Nearest institutional demand zone or Bullish Order Block price.\n"
            f"5. 'primary_resistance': Nearest liquidity resting zone (Buy Side Liquidity) or Bearish Order Block price.\n"
            f"6. 'invalidation_price': Stop-loss invalidation price below market structure shift.\n"
            f"7. 'ict_cit_rationale': Detailed technical analysis explaining the Change in Trend (CIT), Liquidity Sweeps, and Fair Value Gaps (FVG).\n"
            f"8. 'smc_order_flow': Assessment of institutional order flow, premium vs discount pricing, and mitigation status.\n"
            f"9. 'tactical_execution_advice': Explicit trade execution guide for retail vs smart money positioning.\n"
            f"10. 'issued_date': Today's calendar date.\n"
            f"11. 'issued_time_utc': Current exact UTC timestamp string (e.g. '13:45 UTC')."
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"},
        }

        try:
            async with httpx.AsyncClient(timeout=14.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0]["content"]["parts"][0]["text"]
                        analysis_json = json.loads(text)
                        # Inject live verified price
                        analysis_json["live_price"] = live_price
                        analysis_json["symbol"] = symbol
                        analysis_json["category"] = category
                        cls._CACHE[cache_key] = analysis_json
                        return analysis_json
        except Exception as e:
            logger.error(f"Gemini ICT/SMC market advisory error: {e}")

        return None

    @classmethod
    async def chat_with_sports_ai(
        cls,
        home_team: str,
        away_team: str,
        user_message: str,
        match_context: Optional[Dict[str, Any]] = None,
        chat_history: Optional[list[dict]] = None,
    ) -> str:
        """
        Interactive conversational sports analyst powered by Gemini AI with full multi-turn chat history.
        """
        api_key, model = cls._get_api_key_and_model()
        ctx_summary = f"Fixture: {home_team} vs {away_team}."
        if match_context:
            ctx_summary += f" Projected Winner: {match_context.get('winner', 'N/A')}, Projected Score: {match_context.get('score', 'N/A')}."

        system_instruction = (
            f"You are the Lead Sports Tactical AI Analyst at PesaFlip, having an interactive, natural conversation with the user.\n"
            f"Match Context: {ctx_summary}\n"
            f"Style: Engaging, conversational like ChatGPT, analytical, concise (under 120 words), and directly responsive to greetings, banter, or tactical/injury questions."
        )

        contents = []
        if chat_history:
            for turn in chat_history[-6:]:
                role = "user" if turn.get("sender") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": turn.get("text", "")}]})
        
        contents.append({"role": "user", "parts": [{"text": f"System context: {system_instruction}\n\nUser: {user_message}"}]})

        if api_key:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {"contents": contents}
            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            return candidates[0]["content"]["parts"][0]["text"].strip()
            except Exception as e:
                logger.error(f"Gemini sports chat error: {e}")

        # Natural conversational fallback if API is unreachable
        if any(w in user_message.lower() for w in ["hi", "hello", "hey", "sup"]):
            return f"Hey there! Ready to break down {home_team} vs {away_team}. What would you like to explore—lineup news, injury reports, or our scoreline projection?"
        return f"Regarding {home_team} vs {away_team}: Tactical models project high midfield intensity. Focus remains on half-space penetration and key player availability. Let me know if you need specific set-piece or scoreline details!"

    @classmethod
    async def chat_with_trading_ai(
        cls,
        symbol: str,
        name: str,
        user_message: str,
        market_context: Optional[Dict[str, Any]] = None,
        chat_history: Optional[list[dict]] = None,
    ) -> str:
        """
        Interactive institutional trading strategist powered by Gemini AI with full multi-turn chat history.
        """
        api_key, model = cls._get_api_key_and_model()
        price_str = f"${market_context.get('price', 0):,.2f}" if market_context else "Live Market"
        signal_str = market_context.get("signal", "WATCH") if market_context else "WATCH"

        system_instruction = (
            f"You are an Elite Institutional Algorithmic Trader at PesaFlip specializing in ICT (Inner Circle Trader) CIT model and SMC (Smart Money Concepts).\n"
            f"Asset: {name} ({symbol}) | Live Price: {price_str} | Current Signal: {signal_str}.\n"
            f"Style: Natural conversational style like ChatGPT, professional, sharp, and concise (under 130 words). If the user says hello or asks open questions, respond politely in trader persona and ask what setups or levels they want to review."
        )

        contents = []
        if chat_history:
            for turn in chat_history[-6:]:
                role = "user" if turn.get("sender") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": turn.get("text", "")}]})

        contents.append({"role": "user", "parts": [{"text": f"System context: {system_instruction}\n\nUser: {user_message}"}]})

        if api_key:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {"contents": contents}
            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            return candidates[0]["content"]["parts"][0]["text"].strip()
            except Exception as e:
                logger.error(f"Gemini trading chat error: {e}")

        if any(w in user_message.lower() for w in ["hi", "hello", "hey", "sup"]):
            return f"Hello! I'm monitoring the order flow and institutional levels for {symbol} ({price_str}). Are you looking for key Order Blocks, Fair Value Gaps, or entry/exit invalidation zones today?"
        return f"Trade Analysis for {symbol}: Currently monitoring key institutional order blocks near current levels. Maintain strict risk parameters and watch for liquidity sweeps before committing leverage."

    @classmethod
    async def chat_with_entertainment_ai(
        cls,
        user_message: str,
        media_context: Optional[Dict[str, Any]] = None,
        chat_history: Optional[list[dict]] = None,
    ) -> str:
        """
        Interactive Entertainment & Movie Critic powered by Gemini AI with full multi-turn chat history.
        """
        api_key, model = cls._get_api_key_and_model()
        ctx_str = ""
        if media_context:
            ctx_str = f"Currently Viewing: {media_context.get('title', 'Featured Title')} ({media_context.get('year', '')}) - Genre: {media_context.get('genre', '')}.\n"

        system_instruction = (
            f"You are the Lead Entertainment Curator & Movie Critic at PesaFlip having a friendly, conversational chat like ChatGPT.\n"
            f"{ctx_str}"
            f"Style: Enthusiastic, knowledgeable, engaging, and concise (under 130 words). Chat naturally, respond warmly to greetings, and recommend tailored titles, hidden gems, and streaming options."
        )

        contents = []
        if chat_history:
            for turn in chat_history[-6:]:
                role = "user" if turn.get("sender") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": turn.get("text", "")}]})

        contents.append({"role": "user", "parts": [{"text": f"System context: {system_instruction}\n\nUser: {user_message}"}]})

        if api_key:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {"contents": contents}
            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            return candidates[0]["content"]["parts"][0]["text"].strip()
            except Exception as e:
                logger.error(f"Gemini entertainment chat error: {e}")

        if any(w in user_message.lower() for w in ["hi", "hello", "hey", "sup"]):
            return "Hey there! Ready for movie night? Tell me what kind of mood you're in—mind-bending sci-fi, edge-of-your-seat thrillers, or a cozy comedy—and I'll pull the best recommendations for you!"
        return "Looking for a phenomenal watch? If you love gripping thrillers, check out 'Severance' or 'Inception'. For cinematic masterclasses, 'Dune: Part Two' is unmissable. Tell me your favorite genre or mood and I'll find your perfect title!"


