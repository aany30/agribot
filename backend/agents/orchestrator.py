from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from backend.models.state import AgriState
import os
import re
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from backend.utils.conflict_resolver import check_for_conflicts
from backend.utils.translator import translate_en_to_hi
from backend.agents.crop_agent import process_crop
from backend.agents.weather_agent import process_weather
from backend.agents.mandi_agent import process_mandi
from backend.agents.pest_agent import process_pest
from backend.agents.soil_agent import process_soil
from backend.agents.finance_agent import process_finance
from backend.agents.storage_agent import process_storage
from backend.agents.yield_agent import process_yield

VALID_INTENTS = [
    "crop_selection",
    "pest_disease",
    "weather_irrigation",
    "mandi_price",
    "soil_health",
    "finance_scheme",
    "post_harvest",
    "yield_prediction",
    "general",
]

INTENT_AGENT_MAP = {
    "crop_selection": ["CropAgent", "WeatherAgent", "SoilAgent"],
    "pest_disease": ["PestAgent", "SoilAgent"],
    "weather_irrigation": ["WeatherAgent", "CropAgent"],
    "mandi_price": ["MandiAgent", "StorageAgent"],
    "soil_health": ["SoilAgent", "CropAgent"],
    "finance_scheme": ["FinanceAgent"],
    "post_harvest": ["StorageAgent", "MandiAgent"],
    "yield_prediction": ["YieldAgent", "WeatherAgent"],
    "general": ["CropAgent", "WeatherAgent", "SoilAgent"],
}

AGENT_PROCESSORS = {
    "CropAgent": process_crop,
    "WeatherAgent": process_weather,
    "MandiAgent": process_mandi,
    "PestAgent": process_pest,
    "SoilAgent": process_soil,
    "FinanceAgent": process_finance,
    "StorageAgent": process_storage,
    "YieldAgent": process_yield,
}

def classify_intent_with_keywords(query: str) -> str:
    query = query.lower()
    keyword_intents = [
        ("pest_disease", ["pest", "disease", "insect", "fungus", "leaf spot", "rust", "aphid", "worm", "blight", "yellow leaves"]),
        ("weather_irrigation", ["weather", "rain", "rainfall", "irrigation", "water", "temperature", "forecast", "monsoon"]),
        ("mandi_price", ["mandi", "market", "price", "sell", "rate", "quintal", "buyer"]),
        ("soil_health", ["soil", "fertilizer", "fertiliser", "npk", "ph", "compost", "manure", "nutrient"]),
        ("finance_scheme", ["loan", "scheme", "subsidy", "insurance", "pm-kisan", "kcc", "credit", "finance"]),
        ("post_harvest", ["storage", "store", "warehouse", "harvested", "post harvest", "shelf life"]),
        ("yield_prediction", ["yield", "production", "quintals per acre", "estimate", "output"]),
        ("crop_selection", ["which crop", "what crop", "crop should", "sow", "plant", "seed", "variety", "intercrop"]),
    ]
    for intent, keywords in keyword_intents:
        if any(keyword in query for keyword in keywords):
            return intent
    return "general"

def intent_classifier(state: AgriState):
    api_key = os.getenv("OPENAI_API_KEY")
    query = state.get("english_query", "")
    intent = classify_intent_with_keywords(query)
    
    if api_key:
        try:
            llm = ChatOpenAI(model="gpt-4o", api_key=api_key)
            prompt = PromptTemplate.from_template(
                "Classify the following query into exactly one of these intents: crop_selection, pest_disease, weather_irrigation, mandi_price, soil_health, finance_scheme, post_harvest, yield_prediction, general. "
                "Return ONLY the intent string. Query: {query}"
            )
            res = (prompt | llm).invoke({"query": query}).content.strip().lower()
            if res in VALID_INTENTS:
                intent = res
        except Exception:
            pass

    state["intent"] = intent
    state["active_agents"] = INTENT_AGENT_MAP[intent]
        
    return {"intent": state["intent"], "active_agents": state["active_agents"]}

def route_agents(state: AgriState):
    agents = state.get("active_agents", [])
    return [Send(agent, state) for agent in agents]

def run_agent(agent_name: str, state: AgriState):
    processor = AGENT_PROCESSORS[agent_name]
    agent_state = {
        **state,
        "agent_outputs": dict(state.get("agent_outputs", {})),
        "agent_confidence": dict(state.get("agent_confidence", {})),
        "agent_status": dict(state.get("agent_status", {})),
    }
    result = processor(agent_state)
    return {
        "agent_outputs": {
            agent_name: result.get("agent_outputs", {}).get(agent_name, "Service unavailable")
        },
        "agent_confidence": {
            agent_name: result.get("agent_confidence", {}).get(agent_name, 0.0)
        },
        "agent_status": {
            agent_name: result.get("agent_status", {}).get(agent_name, "failed")
        },
    }

def conflict_resolver(state: AgriState):
    has_conflict, explanation = check_for_conflicts(state.get("agent_outputs", {}))
    return {
        "conflicts_detected": has_conflict,
        "conflict_explanation": explanation
    }

def response_synthesizer(state: AgriState):
    api_key = os.getenv("OPENAI_API_KEY")
    agent_outputs = state.get("agent_outputs", {})
    agent_confidence = state.get("agent_confidence", {})
    active_agents = state.get("active_agents", [])

    relevant_outputs = {
        agent: agent_outputs[agent]
        for agent in active_agents
        if agent in agent_outputs and agent_confidence.get(agent, 0) >= 0.6
    }

    if not relevant_outputs:
        relevant_outputs = {
            agent: output
            for agent, output in agent_outputs.items()
            if agent in active_agents
        } or agent_outputs

    if not api_key:
        return {
            "final_recommendation": "OPENAI_API_KEY is not configured, so the AI response could not be generated."
        }

    try:
        llm = ChatOpenAI(model="gpt-4o", api_key=api_key)
        prompt = PromptTemplate.from_template(
            "You are an AgriAdvisor synthesizing specialist outputs.\n"
            "Query: {query}\n"
            "Agent Outputs: {outputs}\n"
            "Conflicts: {conflicts}\n\n"
            "Write a fresh, simple, plain language response in English that directly answers the farmer's question. Include:\n"
            "- Main recommendation\n"
            "- Which agents contributed and what they said\n"
            "- Confidence level (High/Medium/Low based on scores)\n"
            "- If conflicts exist, flag both options with tradeoffs.\n"
            "- Data sources used\n"
            "- A single follow_up_question to refine advice further.\n"
            "Do not invent live facts not present in Agent Outputs. If a tool output is fallback/mock data, say that clearly.\n"
        )
        res = (prompt | llm).invoke({
            "query": state.get("english_query", ""),
            "outputs": str(relevant_outputs),
            "conflicts": state.get("conflict_explanation", "") if state.get("conflicts_detected") else "None"
        })
        return {"final_recommendation": res.content}
    except Exception:
        return {"final_recommendation": "The AI response could not be generated right now. Please check the OpenAI API key and server logs."}

def hallucination_guard(state: AgriState):
    rec = state.get("final_recommendation", "")
    numbers_in_rec = set(re.findall(r'\b\d+(?:\.\d+)?\b', rec))
    
    agent_texts = " ".join(state.get("agent_outputs", {}).values())
    numbers_in_agents = set(re.findall(r'\b\d+(?:\.\d+)?\b', agent_texts))
    
    unverified_numbers = numbers_in_rec - numbers_in_agents
    
    if unverified_numbers:
        rec += "\n\nDisclaimer: Some figures mentioned could not be strictly verified against raw data sources."
    
    return {"final_recommendation": rec}

def language_responder(state: AgriState):
    if state.get("detected_language") == "hi":
        hindi_rec = translate_en_to_hi(state.get("final_recommendation", ""))
        return {"final_recommendation_hindi": hindi_rec}
    return {"final_recommendation_hindi": state.get("final_recommendation", "")}

builder = StateGraph(AgriState)

builder.add_node("intent_classifier", intent_classifier)
builder.add_node("CropAgent", lambda state: run_agent("CropAgent", state))
builder.add_node("WeatherAgent", lambda state: run_agent("WeatherAgent", state))
builder.add_node("MandiAgent", lambda state: run_agent("MandiAgent", state))
builder.add_node("PestAgent", lambda state: run_agent("PestAgent", state))
builder.add_node("SoilAgent", lambda state: run_agent("SoilAgent", state))
builder.add_node("FinanceAgent", lambda state: run_agent("FinanceAgent", state))
builder.add_node("StorageAgent", lambda state: run_agent("StorageAgent", state))
builder.add_node("YieldAgent", lambda state: run_agent("YieldAgent", state))
builder.add_node("conflict_resolver", conflict_resolver)
builder.add_node("response_synthesizer", response_synthesizer)
builder.add_node("hallucination_guard", hallucination_guard)
builder.add_node("language_responder", language_responder)

builder.add_edge(START, "intent_classifier")
builder.add_conditional_edges("intent_classifier", route_agents, ["CropAgent", "WeatherAgent", "MandiAgent", "PestAgent", "SoilAgent", "FinanceAgent", "StorageAgent", "YieldAgent"])

for agent in ["CropAgent", "WeatherAgent", "MandiAgent", "PestAgent", "SoilAgent", "FinanceAgent", "StorageAgent", "YieldAgent"]:
    builder.add_edge(agent, "conflict_resolver")

builder.add_edge("conflict_resolver", "response_synthesizer")
builder.add_edge("response_synthesizer", "hallucination_guard")
builder.add_edge("hallucination_guard", "language_responder")
builder.add_edge("language_responder", END)

agri_graph = builder.compile()
