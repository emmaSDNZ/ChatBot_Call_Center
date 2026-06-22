import json
from typing import TypedDict, List, Dict, Any
from langgraph.checkpoint.memory import MemorySaver

from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    SystemMessage,
    BaseMessage,
)

from src.app.ai_core.connectors.llm_client_Ollama import get_ollama_llm
from src.app.ai_core.prompts.prompt_ai_voz import build_system_prompt


# ============================================================
# LLM
# ============================================================

llm = get_ollama_llm()
memory = MemorySaver()


# ============================================================
# STATE
# ============================================================

class IaVozState(TypedDict):
    messages: List[BaseMessage]
    call_state: Dict[str, Any]
    transcript: str
    prompt: List[BaseMessage]
    llm_response: str
    parsed: Dict[str, Any]
    nlp_response: Dict[str, Any]
    llm_status: str


# ============================================================
# NODO 1: extract_transcript
# ============================================================

def extract_transcript_node(state: IaVozState):

    call_state = state["call_state"]

    transcript = (
        call_state
        .get("audio_original", {})
        .get("content", "")
    )

    return {
        "transcript": transcript
    }


# ============================================================
# NODO 2: build_prompt
# ============================================================

def build_prompt_node(state: IaVozState):

    call_state = state["call_state"]
    transcript = state["transcript"]

    prompt = [
        SystemMessage(content=build_system_prompt()),
        SystemMessage(
            content="CALL_STATE:\n"
            + json.dumps(call_state, ensure_ascii=False, indent=2)
        ),
        HumanMessage(content=transcript)
    ]

    return {
        "prompt": prompt
    }


# ============================================================
# NODO 3: llm_analysis (LLM + NLP ready infra)
# ============================================================
def llm_analysis_node(state: IaVozState):

    from src.app.nlp.nlp_engine import nlp_engine

    def fallback(transcript: str):
        print("🟡 NLP FALLBACK ACTIVE (pysentimiento)")
        print("ESTO ES TRANSCRIPT", transcript)

        result = nlp_engine(transcript)

        return {
            "summary": transcript[:120],
            "sentiment": result["sentiment"],
            "emotion": result["emotion"],
            "text": result["text"]
        }

    try:
        llm = get_ollama_llm()

        # =====================================================
        # CASO 1: NO HAY LLM (Render / producción)
        # =====================================================
        if llm is None:
            raise Exception("LLM desactivado → fallback NLP")

        # =====================================================
        # CASO 2: LLM ACTIVO
        # =====================================================
        response = llm.invoke(state["prompt"])
        raw = response.content.strip()

        return {
            "llm_response": raw,
            "llm_status": "ok",
            "nlp_response": None
        }

    except Exception as e:

        print("🔴 LLM FALLÓ → NLP ACTIVADO:", str(e))
        transcript = state.get("transcript", "")
        nlp_result = fallback(transcript)

        return {
            "llm_response": None,
            "llm_status": "fallback",
            "nlp_response": nlp_result
        }

# ============================================================
# NODO 4: parse_response
# ============================================================

def parse_response_node(state: IaVozState):

    raw = state.get("llm_response")
    nlp = state.get("nlp_response")

    parsed = None

    # ======================
    # LLM PATH
    # ======================
    if raw:
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = None

    # ======================
    # NLP PATH 
    # ======================
    if parsed is None and nlp is not None:

        sentiment = nlp.get("sentiment", "NEU")
        emotion = nlp.get("emotion", "others")
        text = nlp.get("text", "")

        parsed = {
            "analisis": {
                "emocion_principal": emotion,
                "sentiment": sentiment,  
                "interes": 0,
                "angustia": 70 if sentiment == "NEG" else 0,
                "urgencia": 80 if emotion == "anger" else 0,
                "satisfaccion": 80 if sentiment == "POS" else 0
            },
            "resultado": {
                "resumen": text[:120],
                "palabras_clave": []
            },
            "accion": {
                "recomendada": (
                    "Retención cliente"
                    if sentiment == "NEG"
                    else "Atención estándar"
                )
            }
        }

    # ======================
    # FALLBACK
    # ======================
    if parsed is None:
        parsed = {
            "analisis": {
                "emocion_principal": "indeterminado",
                "sentiment": "NEU",
                "interes": 0,
                "angustia": 0,
                "urgencia": 0,
                "satisfaccion": 0
            },
            "resultado": {
                "resumen": "No fue posible procesar el análisis.",
                "palabras_clave": []
            },
            "accion": {
                "recomendada": "Revisar transcripción."
            }
        }

    return {
        "parsed": parsed,
        "nlp_response": nlp,  
        "llm_response": raw
    }


# ============================================================
# NODO 5: update_state
# ============================================================

def update_state_node(state: IaVozState):

    call_state = state["call_state"]
    parsed = state["parsed"]
    messages = state["messages"]

    call_state["estado"]["step"] = "resultados"
    call_state["estado"]["processing"] = False

    call_state["analisis"] = parsed.get("analisis", call_state["analisis"])
    call_state["resultado"] = parsed.get("resultado", call_state["resultado"])
    call_state["accion"] = parsed.get("accion", call_state["accion"])

    return {
        "call_state": call_state,
        "messages": messages + [
            AIMessage(content=json.dumps(call_state, ensure_ascii=False))
        ]
    }