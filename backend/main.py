import os
import json
import asyncio
from dotenv import load_dotenv
load_dotenv()  # CRITICAL: loads OPENAI_API_KEY from .env file
from fastapi import FastAPI, WebSocket, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.models.state import FarmerProfile, AgriState
from backend.agents.orchestrator import agri_graph
from backend.tools.voice_tool import transcribe_audio, synthesize_audio
from backend.tools.mandi_tool import get_mandi_prices
from backend.tools.weather_tool import get_weather
from backend.utils.translator import translate_hi_to_en, translate_en_to_hi
from fastapi.responses import StreamingResponse
from backend.utils.confidence import calculate_overall_confidence

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    farmer_profile: dict
    conversation_history: List[dict] = []

class SynthesizeRequest(BaseModel):
    text: str
    language: str

active_websockets: List[WebSocket] = []

@app.websocket("/ws/agent-status")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        active_websockets.remove(websocket)

async def broadcast_status(agent: str, status: str, confidence: float):
    for ws in active_websockets:
        try:
            await ws.send_json({"agent": agent, "status": status, "confidence": confidence})
        except Exception:
            pass

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    detected_lang = "hi" if any('\u0900' <= c <= '\u097F' for c in req.query) else "en"
    english_query = translate_hi_to_en(req.query) if detected_lang == "hi" else req.query

    initial_state = {
        "farmer_profile": req.farmer_profile,
        "raw_query": req.query,
        "display_query": req.query,
        "english_query": english_query,
        "detected_language": detected_lang,
        "conversation_history": req.conversation_history,
        "agent_outputs": {},
        "agent_confidence": {},
        "agent_status": {}
    }
    
    # To properly simulate streaming without blocking the event loop entirely,
    # we can run invoke in a thread, but for simplicity and because LangGraph
    # is fast with mock tools, we'll just run invoke and broadcast simulated events.
    # We broadcast 'active' before invoke, and 'done' after invoke.
    # A true streaming approach would use astream() but the synchronous LangGraph
    # nodes block the event loop anyway.
    
    # Dummy broadcast to show graph starting
    for agent in ["CropAgent", "WeatherAgent", "MandiAgent", "PestAgent", "SoilAgent", "FinanceAgent", "StorageAgent", "YieldAgent"]:
        await broadcast_status(agent, "idle", 0.0)

    try:
        # Run graph
        final_state = await asyncio.to_thread(agri_graph.invoke, initial_state)
        
        # Broadcast done statuses
        for agent, status in final_state.get("agent_status", {}).items():
            conf = final_state.get("agent_confidence", {}).get(agent, 0.0)
            await broadcast_status(agent, status, conf)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        
    overall_conf = calculate_overall_confidence(final_state.get("agent_confidence", {}))

    return {
        "recommendation": final_state.get("final_recommendation_hindi") if detected_lang == "hi" else final_state.get("final_recommendation"),
        "recommendation_hindi": final_state.get("final_recommendation_hindi"),
        "agents_activated": final_state.get("active_agents", []),
        "agent_outputs": final_state.get("agent_outputs", {}),
        "agent_confidence": final_state.get("agent_confidence", {}),
        "confidence_level": overall_conf,
        "conflicts": final_state.get("conflicts_detected", False),
        "conflict_explanation": final_state.get("conflict_explanation", ""),
        "data_sources": ["API", "Mock Fallbacks"],
        "follow_up": "Is there anything else I can assist with?"
    }

@app.post("/api/voice/transcribe")
async def voice_transcribe(file: UploadFile = File(...)):
    contents = await file.read()
    res = transcribe_audio(contents)
    return res

@app.post("/api/voice/synthesize")
async def voice_synthesize(req: SynthesizeRequest):
    fp = synthesize_audio(req.text, req.language)
    return StreamingResponse(fp, media_type="audio/mpeg")

@app.get("/api/mandi/prices")
async def mandi_prices(crop: str = "Wheat", state: str = "MP", district: str = ""):
    return get_mandi_prices(crop, state)

@app.get("/api/weather")
async def weather(city: str = "Indore"):
    return get_weather(city)

@app.post("/api/farmer/profile")
async def save_profile(profile: dict = Body(...)):
    os.makedirs("backend/data", exist_ok=True)
    file_path = "backend/data/farmer_profiles.json"
    
    profiles = {}
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            profiles = json.load(f)
            
    farmer_id = profile.get("farmer_id", "default_farmer")
    profiles[farmer_id] = profile
    
    with open(file_path, "w") as f:
        json.dump(profiles, f, indent=4)
        
    return {"farmer_id": farmer_id, "saved": True}

@app.get("/api/farmer/profile/{farmer_id}")
async def get_profile(farmer_id: str):
    file_path = "backend/data/farmer_profiles.json"
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            profiles = json.load(f)
            if farmer_id in profiles:
                return profiles[farmer_id]
    return {}
