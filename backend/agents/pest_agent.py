import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from backend.models.state import AgriState

def process_pest(state: AgriState) -> AgriState:
    state["agent_status"]["PestAgent"] = "active"
    api_key = os.getenv("OPENAI_API_KEY")
    query = state["english_query"]
    confidence = 0.8 if len(query.split()) > 5 else 0.5
    
    if not api_key:
        state["agent_outputs"]["PestAgent"] = "Possible pests: Aphids or Rust. Organic treatment: Neem oil spray (5ml/L). Chemical: Imidacloprid (if severe). Please consult local expert if symptoms are severe."
        state["agent_confidence"]["PestAgent"] = confidence
        state["agent_status"]["PestAgent"] = "done"
        return state

    try:
        llm = ChatOpenAI(model="gpt-4o", api_key=api_key)
        prompt = PromptTemplate.from_template(
            "You are an expert Indian agricultural advisor. "
            "Farmer query: {query}. "
            "Identify top 2 likely pests/diseases based on the query. Recommend organic and chemical treatments with dosage per acre. Flag if expert review is needed for severe symptoms."
        )
        chain = prompt | llm
        res = chain.invoke({"query": query})
        state["agent_outputs"]["PestAgent"] = res.content
        state["agent_confidence"]["PestAgent"] = confidence
        state["agent_status"]["PestAgent"] = "done"
    except Exception:
        state["agent_outputs"]["PestAgent"] = "Service unavailable"
        state["agent_confidence"]["PestAgent"] = 0.0
        state["agent_status"]["PestAgent"] = "failed"
    return state
