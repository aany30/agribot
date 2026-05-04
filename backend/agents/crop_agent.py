import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from backend.models.state import AgriState

def process_crop(state: AgriState) -> AgriState:
    state["agent_status"]["CropAgent"] = "active"
    profile = state["farmer_profile"]
    api_key = os.getenv("OPENAI_API_KEY")
    confidence = 0.85 if profile.get("crop") and profile.get("location") else 0.6
    
    if not api_key:
        state["agent_outputs"]["CropAgent"] = "Recommend planting short-duration wheat based on current season. Intercrop with mustard. Consider water availability and soil type."
        state["agent_confidence"]["CropAgent"] = confidence
        state["agent_status"]["CropAgent"] = "done"
        return state

    try:
        llm = ChatOpenAI(model="gpt-4o", api_key=api_key)
        prompt = PromptTemplate.from_template(
            "You are an expert Indian agricultural advisor. "
            "Farmer profile: {profile}. Query: {query}. "
            "Derive the current season from the location and suggest a primary crop and intercrop with rationale. Keep it concise."
        )
        chain = prompt | llm
        res = chain.invoke({"profile": str(profile), "query": state["english_query"]})
        state["agent_outputs"]["CropAgent"] = res.content
        state["agent_confidence"]["CropAgent"] = confidence
        state["agent_status"]["CropAgent"] = "done"
    except Exception:
        state["agent_outputs"]["CropAgent"] = "Service unavailable"
        state["agent_confidence"]["CropAgent"] = 0.0
        state["agent_status"]["CropAgent"] = "failed"
    return state
