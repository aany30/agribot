import os

def get_mandi_prices(crop: str, state: str) -> dict:
    api_key = os.getenv("AGMARKNET_API_KEY")
    if not api_key:
        return _get_mock_mandi(crop, state)
    
    # Placeholder for actual API call, defaulting to mock for robust demonstration
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
