from deep_translator import GoogleTranslator

def translate_hi_to_en(text: str) -> str:
    try:
        return GoogleTranslator(source='hi', target='en').translate(text)
    except Exception:
        return text

def translate_en_to_hi(text: str) -> str:
    try:
        return GoogleTranslator(source='en', target='hi').translate(text)
    except Exception:
        return text
