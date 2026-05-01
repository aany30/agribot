# AgriAdvisor

AgriAdvisor is a complete full-stack web application designed to act as a multi-specialist AI farm decision system for Indian farmers. It leverages LangGraph and Claude to coordinate 8 different specialist AI agents (Crop, Weather, Mandi, Pest, Soil, Finance, Storage, and Yield) that work in parallel to provide comprehensive, conflict-free advice. 

The application incorporates a premium earthy UI design with Framer Motion animations and Recharts for data visualization, and supports Hindi voice input/output through OpenAI Whisper and gTTS.

## Agent Architecture
```text
          [ intent_classifier ]
                   |
     +---------+---+---+---------+
     |         |       |         |
[CropAgent] [Weather] [Mandi] [Pest] ...
     |         |       |         |
     +---------+---+---+---------+
                   |
         [ conflict_resolver ]
                   |
        [ response_synthesizer ]
                   |
         [ hallucination_guard ]
                   |
         [ language_responder ]
```

## Setup

### Backend
1. `cd backend` (or from the project root)
2. `pip install -r backend/requirements.txt`
3. Copy `backend/.env.example` to `backend/.env` and fill in your API keys:
   - `ANTHROPIC_API_KEY` (Claude 3.5 Sonnet)
   - `OPENWEATHERMAP_API_KEY`
   - `OPENAI_API_KEY` (Whisper)
   - `AGMARKNET_API_KEY` (Optional)
   *Note: If API keys are missing, the system will use built-in mock fallbacks with disclaimers to keep functioning.*
4. Run: `uvicorn backend.main:app --reload` (or navigate to backend and run `uvicorn main:app --reload`)

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Sample Queries
Try these sample queries to test the agent orchestration:
1. "आज इंदौर मंडी में गेहूं का भाव क्या है?"
2. "Mere tomato ke patte pe kale daag aa rahe hain"
3. "Is season mein Vidarbha mein kya ugana chahiye?"
4. "PM-KISAN ke liye eligible hoon kya? 2 acre hai"
5. "What yield can I expect from 3 acre wheat in Bhopal?"

## Tech Stack
- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, Recharts
- **Backend**: FastAPI (Python 3.11+)
- **Agents**: LangGraph + LangChain + Claude API
- **Voice**: OpenAI Whisper + gTTS
- **Translation**: deep-translator
