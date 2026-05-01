import operator
from typing import TypedDict, List, Dict, Any, Annotated

def merge_dicts(a: Dict, b: Dict) -> Dict:
    c = a.copy()
    c.update(b)
    return c

class FarmerProfile(TypedDict):
    farmer_id: str
    name: str
    location: str          # city/district
    state: str
    crop: str              # current primary crop
    land_acres: float
    language: str          # "hi" or "en"
    category: str          # "general" | "SC" | "ST" | "OBC"

class AgriState(TypedDict):
    farmer_profile: FarmerProfile
    raw_query: str              # original farmer query
    display_query: str          # in farmer's language (for UI)
    english_query: str          # translated for agents
    detected_language: str      # "hi" or "en"
    intent: str                 # classified intent
    active_agents: List[str]
    agent_outputs: Annotated[Dict[str, str], merge_dicts]
    agent_confidence: Annotated[Dict[str, float], merge_dicts]
    agent_status: Annotated[Dict[str, str], merge_dicts]
    conflicts_detected: bool
    conflict_explanation: str
    final_recommendation: str
    final_recommendation_hindi: str
    follow_up_question: str
    data_sources_used: List[str]
    conversation_history: List[Dict[str, Any]]
