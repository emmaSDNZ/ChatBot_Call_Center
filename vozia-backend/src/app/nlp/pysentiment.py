from functools import lru_cache
from pysentimiento import create_analyzer


# ============================================================
# SINGLETON CON LRU CACHE (NO SE RECREA NUNCA)
# ============================================================
@lru_cache(maxsize=1)
def get_analyzers():

    sentiment = create_analyzer(task="sentiment", lang="es")
    emotion = create_analyzer(task="emotion", lang="es")
    return sentiment, emotion


# ============================================================
# CORE NLP FUNCTION
# ============================================================
def nlp_engine(text: str) -> dict:
    """
    Analiza sentimiento y emoción de un texto en español.
    """

    if not text or not isinstance(text, str):
        return {
            "text": "",
            "sentiment": "NEU",
            "emotion": "others"
        }

    text = text.strip()

    # 🔥 SOLO SE INICIALIZA UNA VEZ
    sentiment_analyzer, emotion_analyzer = get_analyzers()

    sentiment_result = sentiment_analyzer.predict(text)
    emotion_result = emotion_analyzer.predict(text)

    return {
        "text": text,
        "sentiment": sentiment_result.output,
        "emotion": emotion_result.output
    }


# ============================================================
# CLI TEST MODE (NO TOCAR - OK)
# ============================================================
if __name__ == "__main__":

    print("Pysentimiento NLP - CLI Test Mode")
    print("Escribe 'exit' para salir\n")

    while True:
        text = input("Texto > ")

        if text.lower() in ["exit", "quit", "salir"]:
            break

        result = nlp_engine(text)

        print("\n📊 RESULTADO:")
        print(f"Sentimiento: {result['sentiment']}")
        print(f"Emoción:     {result['emotion']}")
        print("-" * 40)