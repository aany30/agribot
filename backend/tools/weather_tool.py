import requests

def get_weather(city: str) -> dict:
    try:
        # Step 1: Geocoding - getting lat and long for the city/state
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json"
        geo_resp = requests.get(geo_url, timeout=5)
        geo_resp.raise_for_status()
        geo_data = geo_resp.json()
        
        if not geo_data.get("results"):
            return _get_mock_weather(city)
            
        lat = geo_data["results"][0]["latitude"]
        lon = geo_data["results"][0]["longitude"]
        
        # Step 2: Fetching Weather Data (Current + Daily)
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&daily=temperature_2m_max,precipitation_probability_max,weathercode&timezone=auto"
        weather_resp = requests.get(weather_url, timeout=5)
        weather_resp.raise_for_status()
        weather_data = weather_resp.json()
        
        current = weather_data.get("current_weather", {})
        daily = weather_data.get("daily", {})
        
        # Open-Meteo uses WMO Weather interpretation codes (WW)
        # We will map a few common ones loosely
        def get_condition(code):
            if code in [0]: return "Clear"
            if code in [1, 2, 3]: return "Clouds"
            if code in [45, 48]: return "Fog"
            if code in [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]: return "Rain"
            if code in [71, 73, 75, 77, 85, 86]: return "Snow"
            if code in [95, 96, 99]: return "Thunderstorm"
            return "Clear"

        forecast = []
        for i in range(min(5, len(daily.get("time", [])))):
            forecast.append({
                "day": f"Day {i+1}",
                "temp": daily["temperature_2m_max"][i],
                "condition": get_condition(daily["weathercode"][i]),
                "rain_prob": daily["precipitation_probability_max"][i]
            })
            
        # Add current weather to the response too for the frontend
        return {
            "live": True,
            "city": city,
            "current": {
                "temp": current.get("temperature"),
                "condition": get_condition(current.get("weathercode", 0))
            },
            "forecast": forecast
        }
    except Exception as e:
        return _get_mock_weather(city)

def _get_mock_weather(city: str) -> dict:
    return {
        "live": False,
        "city": city,
        "advisory": "Harvest and dry stored grain before Day 4",
        "current": {
            "temp": 28,
            "condition": "Clear"
        },
        "forecast": [
            {"day": "Day 1", "condition": "Clear", "temp": 34, "rain_prob": 5},
            {"day": "Day 2", "condition": "Clear", "temp": 34, "rain_prob": 5},
            {"day": "Day 3", "condition": "Clouds", "temp": 31, "rain_prob": 20},
            {"day": "Day 4", "condition": "Rain", "temp": 28, "rain_prob": 70},
            {"day": "Day 5", "condition": "Rain", "temp": 28, "rain_prob": 70}
        ],
        "disclaimer": "⚠️ Live data unavailable — showing estimated figures. Verify locally."
    }
