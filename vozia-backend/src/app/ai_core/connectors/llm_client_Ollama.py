import os
from dotenv import load_dotenv
from langchain_core.callbacks import BaseCallbackHandler

load_dotenv()

# ============================================================
# CALLBACK (MONITOR UNIFICADO)
# ============================================================
class LLMMonitorCallback(BaseCallbackHandler):
    def on_llm_start(self, serialized, prompts, **kwargs):
        print("🟡 [LLM START]")

    def on_llm_end(self, response, **kwargs):
        print("🟢 [LLM END]")

    def on_llm_error(self, error, **kwargs):
        print("🔴 [LLM ERROR]:", error)


# ============================================================
# FLAGS & CONFIG
# ============================================================
USE_LLM = os.getenv("USE_LLM", "false").lower() == "true"


# ============================================================
# MULTI-KEY WRAPPER FOR GROQ ROTATION
# ============================================================
class MultiKeyChatGroq:
    def __init__(self, api_keys, **kwargs):
        self.api_keys = api_keys
        self.kwargs = kwargs
        self.current_key_idx = 0

    def _get_llm_instance(self, current_key):
        # Importación diferida para no exigir la librería si no se usa
        from langchain_groq import ChatGroq
        return ChatGroq(groq_api_key=current_key, **self.kwargs)

    def invoke(self, messages, **kwargs):
        if not self.api_keys:
            raise ValueError("No se configuró ninguna GROQ_API_KEY en el entorno.")
        last_exception = None
        for _ in range(len(self.api_keys)):
            current_key = self.api_keys[self.current_key_idx]
            masked_key = f"...{current_key[-6:]}" if len(current_key) > 6 else "oculta"
            print(f"[Groq Multi-Key] Intentando invoke con API Key index {self.current_key_idx} ({masked_key})")
            try:
                llm = self._get_llm_instance(current_key)
                return llm.invoke(messages, **kwargs)
            except Exception as e:
                print(f"[Groq Multi-Key] Error usando API Key index {self.current_key_idx}: {e}")
                last_exception = e
                self.current_key_idx = (self.current_key_idx + 1) % len(self.api_keys)
        raise last_exception

    async def ainvoke(self, messages, **kwargs):
        if not self.api_keys:
            raise ValueError("No se configuró ninguna GROQ_API_KEY en el entorno.")
        last_exception = None
        for _ in range(len(self.api_keys)):
            current_key = self.api_keys[self.current_key_idx]
            masked_key = f"...{current_key[-6:]}" if len(current_key) > 6 else "oculta"
            print(f"[Groq Multi-Key] Intentando ainvoke con API Key index {self.current_key_idx} ({masked_key})")
            try:
                llm = self._get_llm_instance(current_key)
                return await llm.ainvoke(messages, **kwargs)
            except Exception as e:
                print(f"[Groq Multi-Key] Error async usando API Key index {self.current_key_idx}: {e}")
                last_exception = e
                self.current_key_idx = (self.current_key_idx + 1) % len(self.api_keys)
        raise last_exception


# ============================================================
# SINGLETON HOLDERS
# ============================================================
_llm_json_instance = None
_llm_text_instance = None


# ============================================================
# ADAPTIVE FACTORY / ACCESSOR (MANTIENE LA FIRMA ANTERIOR)
# ============================================================
def get_ollama_llm(json_mode=True):
    global _llm_json_instance, _llm_text_instance

    if not USE_LLM:
        return None

    # Si ya están inicializados, los devolvemos directo
    if json_mode and _llm_json_instance is not None:
        return _llm_json_instance
    if not json_mode and _llm_text_instance is not None:
        return _llm_text_instance

    # 1. Recolectar llaves de Groq si existen
    groq_keys = []
    
    keys_env = os.getenv("GROQ_API_KEYS", "")
    if keys_env:
        groq_keys.extend([k.strip() for k in keys_env.split(",") if k.strip()])

    single_key_env = os.getenv("GROQ_API_KEY", "")
    if single_key_env:
        groq_keys.extend([k.strip() for k in single_key_env.split(",") if k.strip()])

    for key, value in os.environ.items():
        if key.startswith("GROQ_API_KEY_"):
            groq_keys.extend([part.strip() for part in value.split(",") if part.strip()])

    # Quitar duplicados manteniendo orden
    groq_keys = list(dict.fromkeys(groq_keys))

    # 2. Estrategia de inicialización basada en lo que esté configurado
    if groq_keys:
        print("🤖 [Factory] Inicializando proveedor: GROQ (Multi-Key)")
        instance = MultiKeyChatGroq(
            api_keys=groq_keys,
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            temperature=0,
            response_format={"type": "json_object"} if json_mode else None,
            callbacks=[LLMMonitorCallback()]
        )
    else:
        # Si no hay llaves de Groq, cae por defecto en Ollama (Local/Render anterior)
        print("🦙 [Factory] Inicializando proveedor: OLLAMA")
        from langchain_ollama import ChatOllama
        instance = ChatOllama(
            model=os.getenv("OLLAMA_MODEL", "llama3"),
            format="json" if json_mode else None,
            temperature=0,
            callbacks=[LLMMonitorCallback()]
        )

    # Guardar en la instancia correspondiente
    if json_mode:
        _llm_json_instance = instance
    else:
        _llm_text_instance = instance

    return _llm_json_instance if json_mode else _llm_text_instance