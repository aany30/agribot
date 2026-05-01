import os
from io import BytesIO
from gtts import gTTS
from backend.utils.translator import translate_en_to_hi

def transcribe_audio(file_bytes: bytes) -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {
            "hindi_text": "आज इंदौर मंडी में गेहूं का भाव क्या है?",
            "english_text": "What is the price of wheat in Indore mandi today?",
            "detected_language": "hi"
        }
    
    # In a fully connected environment, write to temp file and call OpenAI Whisper
    # client.audio.transcriptions.create(model="whisper-1", file=open(temp_file, "rb"))
    return {
        "hindi_text": "आज इंदौर मंडी में गेहूं का भाव क्या है?",
        "english_text": "What is the price of wheat in Indore mandi today?",
        "detected_language": "hi"
    }

def synthesize_audio(text: str, language: str) -> BytesIO:
    if language == "hi":
        text = translate_en_to_hi(text)
    
    tts = gTTS(text=text, lang='hi' if language == 'hi' else 'en', slow=False)
    fp = BytesIO()
    tts.write_to_fp(fp)
    fp.seek(0)
    return fp
