def check_for_conflicts(agent_outputs: dict) -> tuple[bool, str]:
    """
    Check for contradictions between agent outputs.
    Primary conflict pair to detect:
    - WeatherAgent says delay vs MandiAgent says sell now
    """
    weather_output = agent_outputs.get("weather", "").lower()
    mandi_output = agent_outputs.get("mandi", "").lower()

    if not weather_output or not mandi_output:
        return False, ""

    weather_delay = any(word in weather_output for word in ["delay", "wait", "postpone", "rain", "storm", "bad weather"])
    mandi_sell = any(word in mandi_output for word in ["sell now", "immediate", "highest price", "sell immediately"])

    if weather_delay and mandi_sell:
        return True, "Weather indicates risky conditions suggesting a delay, but Mandi prices suggest selling immediately. Tradeoff: Risking crop damage during transport vs capturing current high market prices."

    return False, ""
