import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from backend.models.state import AgriState

def process_yield(state: AgriState) -> AgriState:
    state["agent_status"]["YieldAgent"] = "active"
    api_key = os.getenv("OPENAI_API_KEY")
    profile = state["farmer_profile"]
    
    if not api_key:
        state["agent_outputs"]["YieldAgent"] = "Estimated yield: 18-22 quintals/acre. State average is ~20 quintals/acre. Top risks: Pest attacks, unseasonal rain, and poor soil health."
        state["agent_confidence"]["YieldAgent"] = 0.65
        state["agent_status"]["YieldAgent"] = "done"
        return state

    try:
        llm = ChatOpenAI(model="gpt-4o", api_key=api_key)
        prompt = PromptTemplate.from_template(
            "You are an expert Indian agricultural advisor. "
            "Farmer profile: {profile}. "
            "Estimate yield range in quintals/acre. Compare with state average (use realistic averages). Flag top 3 risk factors for yield loss."
        )
        chain = prompt | llm
        res = chain.invoke({"profile": str(profile)})
        state["agent_outputs"]["YieldAgent"] = res.content
        state["agent_confidence"]["YieldAgent"] = 0.65
        state["agent_status"]["YieldAgent"] = "done"
    except Exception:
        state["agent_outputs"]["YieldAgent"] = "Service unavailable"
        state["agent_confidence"]["YieldAgent"] = 0.0
        state["agent_status"]["YieldAgent"] = "failed"
    return state
