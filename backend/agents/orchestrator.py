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

def intent_classifier(state: AgriState):
    api_key = os.getenv("OPENAI_API_KEY")
    query = state.get("english_query", "")
    
    if not api_key:
        state["intent"] = "general"
    else:
        try:
            llm = ChatOpenAI(model="gpt-4o", api_key=api_key)
            prompt = PromptTemplate.from_template(
                "Classify the following query into exactly one of these intents: crop_selection, pest_disease, weather_irrigation, mandi_price, soil_health, finance_scheme, post_harvest, yield_prediction, general. "
                "Return ONLY the intent string. Query: {query}"
            )
            res = (prompt | llm).invoke({"query": query}).content.strip().lower()
            valid_intents = ["crop_selection", "pest_disease", "weather_irrigation", "mandi_price", "soil_health", "finance_scheme", "post_harvest", "yield_prediction", "general"]
            if res in valid_intents:
                state["intent"] = res
            else:
                state["intent"] = "general"
        except Exception:
            state["intent"] = "general"

    intent = state["intent"]
    if intent == "crop_selection":
        state["active_agents"] = ["CropAgent", "WeatherAgent", "SoilAgent"]
    elif intent == "pest_disease":
        state["active_agents"] = ["PestAgent", "SoilAgent"]
    elif intent == "weather_irrigation":
        state["active_agents"] = ["WeatherAgent", "CropAgent"]
    elif intent == "mandi_price":
        state["active_agents"] = ["MandiAgent", "WeatherAgent", "StorageAgent"]
    elif intent == "soil_health":
        state["active_agents"] = ["SoilAgent", "CropAgent"]
    elif intent == "finance_scheme":
        state["active_agents"] = ["FinanceAgent"]
    elif intent == "post_harvest":
        state["active_agents"] = ["StorageAgent", "MandiAgent"]
    elif intent == "yield_prediction":
        state["active_agents"] = ["YieldAgent", "WeatherAgent"]
    else:
        state["active_agents"] = ["CropAgent", "WeatherAgent", "MandiAgent", "PestAgent", "SoilAgent", "FinanceAgent", "StorageAgent", "YieldAgent"]
        
    return {"intent": state["intent"], "active_agents": state["active_agents"]}

def route_agents(state: AgriState):
    agents = state.get("active_agents", [])
    return [Send(agent, state) for agent in agents]

def conflict_resolver(state: AgriState):
    has_conflict, explanation = check_for_conflicts(state.get("agent_outputs", {}))
    return {
        "conflicts_detected": has_conflict,
        "conflict_explanation": explanation
    }

def response_synthesizer(state: AgriState):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {
            "final_recommendation": f"Mock final recommendation based on agents: {state.get('agent_outputs')}\nConfidence: High\nData Sources: Mock\nFollow-up: Is there anything else I can help with?"
        }
    
    # Filter agent outputs based on confidence
    agent_outputs = state.get("agent_outputs", {})
    agent_confidence = state.get("agent_confidence", {})
    
    high_confidence_outputs = {}
    for agent, output in agent_outputs.items():
        if agent_confidence.get(agent, 0) > 0.8:
            high_confidence_outputs[agent] = output
            
    if not high_confidence_outputs:
        high_confidence_outputs = {"System": "I couldn't find a high confidence answer for that query. Based on the context, here is the closest advice: " + str(agent_outputs)}

    try:
        llm = ChatOpenAI(model="gpt-4o", api_key=api_key)
        prompt = PromptTemplate.from_template(
            "You are an AgriAdvisor synthesizing specialist outputs.\n"
            "Query: {query}\n"
            "Agent Outputs: {outputs}\n"
            "Conflicts: {conflicts}\n\n"
            "Write a simple, plain language response in English. Include:\n"
            "- Main recommendation\n"
            "- Which agents contributed and what they said\n"
            "- Confidence level (High/Medium/Low based on scores)\n"
            "- If conflicts exist, flag both options with tradeoffs.\n"
            "- Data sources used\n"
            "- A single follow_up_question to refine advice further.\n"
        )
        res = (prompt | llm).invoke({
            "query": state.get("english_query", ""),
            "outputs": str(high_confidence_outputs),
            "conflicts": state.get("conflict_explanation", "") if state.get("conflicts_detected") else "None"
        })
        return {"final_recommendation": res.content}
    except Exception:
        return {"final_recommendation": "Service unavailable. Could not synthesize response."}

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
builder.add_node("CropAgent", process_crop)
builder.add_node("WeatherAgent", process_weather)
builder.add_node("MandiAgent", process_mandi)
builder.add_node("PestAgent", process_pest)
builder.add_node("SoilAgent", process_soil)
builder.add_node("FinanceAgent", process_finance)
builder.add_node("StorageAgent", process_storage)
builder.add_node("YieldAgent", process_yield)
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
