import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from backend.models.state import AgriState

def process_soil(state: AgriState) -> AgriState:
    state["agent_status"]["SoilAgent"] = "active"
    api_key = os.getenv("ANTHROPIC_API_KEY")
    profile = state["farmer_profile"]
    
    if not api_key:
        state["agent_outputs"]["SoilAgent"] = "Recommend standard NPK application. Add vermicompost to improve organic matter. Apply before sowing."
        state["agent_confidence"]["SoilAgent"] = 0.75
        state["agent_status"]["SoilAgent"] = "done"
        return state

    try:
        llm = ChatOpenAI(model="gpt-4o", api_key=api_key)
        prompt = PromptTemplate.from_template(
            "You are an expert Indian agricultural advisor. "
            "Farmer profile: {profile}. "
            "Recommend NPK fertilizer ratio + quantity per acre, pH amendment, organic matter improvement, and timing of application."
        )
        chain = prompt | llm
        res = chain.invoke({"profile": str(profile)})
        state["agent_outputs"]["SoilAgent"] = res.content
        state["agent_confidence"]["SoilAgent"] = 0.75
        state["agent_status"]["SoilAgent"] = "done"
    except Exception:
        state["agent_outputs"]["SoilAgent"] = "Service unavailable"
        state["agent_confidence"]["SoilAgent"] = 0.0
        state["agent_status"]["SoilAgent"] = "failed"
    return state
