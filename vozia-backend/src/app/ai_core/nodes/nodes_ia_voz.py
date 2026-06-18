import json
from typing import TypedDict, List, Dict, Any

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    SystemMessage,
    BaseMessage,
)

from app.ai_core.connectors.llm_client_Ollama import get_ollama_llm
from app.ai_core.prompts.prompt_ai_voz import build_system_prompt

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

    # ============================================================
    # PLACEHOLDER NLP (infra lista)
    # ============================================================
    def nlp_invoke(transcript: str):

        # Infra mock (todavía sin spaCy)
        print("🟡 NLP ENGINE READY (mock)")

        return {
            "summary": transcript[:80],
            "keywords": []
        }

    try:
        # ============================================================
        # FORZAMOS ERROR (DEBUG SPACY) COMENTAR O DESCMENTAR SEGUN SEA EL CASO
        # ============================================================
        #raise Exception("FORZANDO FALLA LLM")

        # ============================================================
        # LLM OK PATH
        # ============================================================
        response = llm.invoke(state["prompt"])
        raw = response.content.strip()

        if raw.startswith("```json"):
            raw = raw.replace("```json", "").replace("```", "").strip()

        print("🟢 LLM OK")

        return {
            "llm_response": raw,
            "llm_status": "ok",
            "nlp_response": None,
            "nlp_status": "skipped"
        }


    except Exception as e:

        print("🔴 LLM FALLÓ → fallback activado:", str(e))

        transcript = state["transcript"]

        nlp_result = nlp_invoke(transcript)

        return {
            # ============================================================
            # LLM FALLBACK STATE
            # ============================================================
            "llm_response": None,
            "llm_status": "fallback",

            # ============================================================
            # NLP ACTIVE (mock)
            # ============================================================
            "nlp_response": nlp_result,
            "nlp_status": "ok"
        }


    except Exception as e:

        print("🔴 LLM FALLÓ → activando fallback NLP:", str(e))

        transcript = state["transcript"]

        # =====================================================
        # NLP HOOK (STUB)
        # =====================================================
        nlp_result = nlp_invoke(transcript)

        return {
            "llm_response": None,
            "llm_status": "fallback",
            "nlp_status": nlp_result["status"],
            "nlp_response": nlp_result
        }

# ============================================================
# NODO 4: parse_response
# ============================================================

def parse_response_node(state: IaVozState):

    raw = state["llm_response"]

    try:
        parsed = json.loads(raw)

    except Exception:
        parsed = {
            "analisis": {
                "emocion_principal": "indeterminado",
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
        "parsed": parsed
    }


# ============================================================
# NODO 5: update_state
# ============================================================

def update_state_node(state: IaVozState):

    call_state = state["call_state"]
    parsed = state["parsed"]
    messages = state["messages"]

    engine = state.get("engine", "unknown")
    print(f"⚙️ Engine usado: {engine}")
    
    call_state["estado"]["step"] = "resultados"
    call_state["estado"]["processing"] = False

    call_state["analisis"] = parsed.get("analisis", call_state.get("analisis"))
    call_state["resultado"] = parsed.get("resultado", call_state.get("resultado"))
    call_state["accion"] = parsed.get("accion", call_state.get("accion"))

    return {
        "call_state": call_state,
        "messages": messages + [
            AIMessage(content=json.dumps(call_state, ensure_ascii=False))
        ]
    }

