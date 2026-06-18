from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from langchain_core.callbacks import BaseCallbackHandler

import os

load_dotenv()


# ============================================================
# MONITOR CALLBACK
# ============================================================

class LLMMonitorCallback(BaseCallbackHandler):

    def on_llm_start(self, serialized, prompts, **kwargs):
        print("🟡 LLM START")

    def on_llm_end(self, response, **kwargs):
        print("🟢 LLM END")

    def on_llm_error(self, error, **kwargs):
        print("🔴 LLM ERROR:", error)


# ============================================================
# SINGLETON LLM
# ============================================================

_llm_instance = ChatOllama(
    model=os.getenv("OLLAMA_MODEL"),
    format="json",
    temperature=0,
    callbacks=[LLMMonitorCallback()]   
)


# ============================================================
# ACCESSOR
# ============================================================

def get_ollama_llm():
    """
    Devuelve la instancia única del modelo.
    """
    return _llm_instance