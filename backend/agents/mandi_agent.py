from backend.models.state import AgriState
from backend.tools.mandi_tool import get_mandi_prices

def process_mandi(state: AgriState) -> AgriState:
    state["agent_status"]["MandiAgent"] = "active"
    profile = state["farmer_profile"]
    crop = profile.get("crop", "Wheat")
    state_loc = profile.get("state", "MP")
    
    try:
        mandi_data = get_mandi_prices(crop, state_loc)
        confidence = 0.9 if mandi_data.get("live") else 0.4
        
        best_mandi = mandi_data.get("best_mandi", "Unknown")
        arbitrage = mandi_data.get("arbitrage_opportunity", "")
        prices_str = ", ".join([f"{p['mandi']} (₹{p['price']}/q, {p['trend']})" for p in mandi_data.get("prices", [])])
        
        output = f"Prices: {prices_str}. Best Mandi: {best_mandi}. Arbitrage: {arbitrage}. Recommend selling now at {best_mandi} if transport costs are justified."
        
        state["agent_outputs"]["MandiAgent"] = output
        state["agent_confidence"]["MandiAgent"] = confidence
        state["agent_status"]["MandiAgent"] = "done"
    except Exception:
        state["agent_outputs"]["MandiAgent"] = "Service unavailable"
        state["agent_confidence"]["MandiAgent"] = 0.0
        state["agent_status"]["MandiAgent"] = "failed"
    return state
