from backend.models.state import AgriState
from backend.tools.weather_tool import get_weather

def process_weather(state: AgriState) -> AgriState:
    state["agent_status"]["WeatherAgent"] = "active"
    profile = state["farmer_profile"]
    city = profile.get("location", "Indore")
    
    try:
        weather_data = get_weather(city)
        if weather_data.get("live"):
            confidence = 0.9
            forecast_summary = ", ".join([f"Day {i+1}: {w['condition']}, {w['temp']}°C, Rain {w['rain_prob']}%" for i, w in enumerate(weather_data['forecast'])])
            advisory = "Good window for activities if rain prob is low. Adjust irrigation based on rain probability."
        else:
            confidence = 0.0 # From spec: If API fails, mock data is returned but wait, weather API fails -> mock, confidence=0
            forecast_summary = "Mock data: " + ", ".join([f"{w['day']}: {w['condition']}" for w in weather_data['forecast']])
            advisory = weather_data.get("advisory", "")
            
        output = f"Forecast: {forecast_summary}. Advisory: {advisory}"
        state["agent_outputs"]["WeatherAgent"] = output
        state["agent_confidence"]["WeatherAgent"] = confidence
        state["agent_status"]["WeatherAgent"] = "done"
    except Exception:
        state["agent_outputs"]["WeatherAgent"] = "Service unavailable"
        state["agent_confidence"]["WeatherAgent"] = 0.0
        state["agent_status"]["WeatherAgent"] = "failed"
    return state
