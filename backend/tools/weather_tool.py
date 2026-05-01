import os
import requests

def get_weather(city: str) -> dict:
    api_key = os.getenv("OPENWEATHERMAP_API_KEY")
    if not api_key:
        return _get_mock_weather(city)

    try:
        url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={api_key}&units=metric"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        forecast = []
        for item in data.get('list', [])[::8][:5]: # Approx 1 per day for 5 days
            forecast.append({
                "temp": item['main']['temp'],
                "condition": item['weather'][0]['main'],
                "rain_prob": item.get('pop', 0) * 100
            })
        return {"forecast": forecast, "live": True}
    except Exception:
        return _get_mock_weather(city)

def _get_mock_weather(city: str) -> dict:
    return {
        "live": False,
        "city": city,
        "advisory": "Harvest and dry stored grain before Day 4",
        "forecast": [
            {"day": "Day 1", "condition": "Clear", "temp": 34, "rain_prob": 5},
            {"day": "Day 2", "condition": "Clear", "temp": 34, "rain_prob": 5},
            {"day": "Day 3", "condition": "Clouds", "temp": 31, "rain_prob": 20},
            {"day": "Day 4", "condition": "Rain", "temp": 28, "rain_prob": 70},
            {"day": "Day 5", "condition": "Rain", "temp": 28, "rain_prob": 70}
        ],
        "disclaimer": "⚠️ Live data unavailable — showing estimated figures. Verify locally."
    }
