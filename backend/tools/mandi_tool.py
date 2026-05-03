import os
from langchain_community.tools import DuckDuckGoSearchRun

def get_mandi_prices(crop: str, state: str) -> dict:
    # Try fetching via search
    try:
        search = DuckDuckGoSearchRun()
        query = f"current mandi price of {crop} in {state} today"
        result = search.invoke(query)
        
        # Simple extraction from the text, using the LLM later to parse it. 
        # For the tool output, we'll just return the raw text as "prices" and mark it live.
        # But wait, the mandi agent expects a specific dict format.
        # Let's provide it in the format the agent can use or adapt the agent.
        
        # We will parse out a mock-like structure but populate it with the search result
        # so the agent can still construct a response easily.
        
        return {
            "live": True,
            "prices": [
                {"mandi": "Search Result", "price": result[:100] + "...", "trend": "live"}
            ],
            "best_mandi": "Varies (see search)",
            "arbitrage_opportunity": "Check local sources",
            "disclaimer": "⚠️ Live data fetched via web search. Verify at local mandi.",
            "raw_search_result": result
        }
    except Exception as e:
        return _get_mock_mandi(crop, state)

def _get_mock_mandi(crop: str, state: str) -> dict:
    crop_name = crop.capitalize() if crop else "Wheat"
    return {
        "live": False,
        "prices": [
            {"mandi": "Indore", "price": 2180, "trend": "down"},
            {"mandi": "Bhopal", "price": 2200, "trend": "stable"},
            {"mandi": "Ujjain", "price": 2155, "trend": "down"}
        ],
        "best_mandi": "Bhopal",
        "arbitrage_opportunity": "+₹200/q after transport",
        "disclaimer": "⚠️ Live data unavailable — showing estimated figures. Verify at local mandi."
    }
