import os
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import PromptTemplate
from backend.models.state import AgriState

def process_storage(state: AgriState) -> AgriState:
    state["agent_status"]["StorageAgent"] = "active"
    api_key = os.getenv("ANTHROPIC_API_KEY")
    profile = state["farmer_profile"]
    
    if not api_key:
        state["agent_outputs"]["StorageAgent"] = "Recommend storing in gunny bags in a dry place. Shelf life is approximately 6 months. Consider connecting with local FPOs for warehouse access."
        state["agent_confidence"]["StorageAgent"] = 0.7
        state["agent_status"]["StorageAgent"] = "done"
        return state

    try:
        llm = ChatAnthropic(model="claude-3-5-sonnet-20240620", api_key=api_key)
        prompt = PromptTemplate.from_template(
            "You are an expert Indian agricultural advisor. "
            "Farmer profile: {profile}. "
            "Advise whether to store or sell immediately based on general market trends. Suggest storage methods (gunny bags/silos/cold storage), estimated shelf life before quality loss, and FPO connection if applicable."
        )
        chain = prompt | llm
        res = chain.invoke({"profile": str(profile)})
        state["agent_outputs"]["StorageAgent"] = res.content
        state["agent_confidence"]["StorageAgent"] = 0.7
        state["agent_status"]["StorageAgent"] = "done"
    except Exception:
        state["agent_outputs"]["StorageAgent"] = "Service unavailable"
        state["agent_confidence"]["StorageAgent"] = 0.0
        state["agent_status"]["StorageAgent"] = "failed"
    return state
