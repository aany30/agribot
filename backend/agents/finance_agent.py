from backend.models.state import AgriState

def process_finance(state: AgriState) -> AgriState:
    state["agent_status"]["FinanceAgent"] = "active"
    try:
        profile = state["farmer_profile"]
        acres = float(profile.get("land_acres", 0))
        category = profile.get("category", "general").lower()
        state_loc = profile.get("state", "").lower()
        
        schemes = ["PM-KISAN", "PMFBY", "Soil Health Card Scheme", "PMKSY"]
        
        if acres <= 5:
            schemes.append("Kisan Credit Card")
            
        if state_loc == "maharashtra":
            schemes.append("Namo Shetkari Maha Samman Nidhi")
        elif state_loc == "mp":
            schemes.append("Mukhyamantri Kisan Kalyan Yojana")
            
        output = f"Eligible schemes: {', '.join(schemes)}. Documents checklist: Aadhar Card, Land Records, Bank Passbook, Passport Size Photo."
        state["agent_outputs"]["FinanceAgent"] = output
        state["agent_confidence"]["FinanceAgent"] = 0.95
        state["agent_status"]["FinanceAgent"] = "done"
    except Exception:
        state["agent_outputs"]["FinanceAgent"] = "Service unavailable"
        state["agent_confidence"]["FinanceAgent"] = 0.0
        state["agent_status"]["FinanceAgent"] = "failed"
    return state
