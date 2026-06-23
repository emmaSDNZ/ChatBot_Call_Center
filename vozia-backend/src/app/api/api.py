from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import io
import speech_recognition as sr
import os
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
from bson.binary import Binary

from langchain_core.messages import HumanMessage

from src.app.ai_core.graphs.graph_ia_voz import app_agent_call_state
from src.app.ai_core.graphs.graph_copilot import app_copilot

load_dotenv()

mongo_uri = os.getenv("MONGO_URI")
mongo_db_name = os.getenv("MONGO_DB_NAME", "VozIAdb")
app_api = FastAPI()
db = None
calls_collection = None

if mongo_uri:
    try:
        if "<db_password>" not in mongo_uri:
  
            mongo_client = MongoClient(
                mongo_uri,
                tls=True,
                tlsAllowInvalidCertificates=True,
                tlsAllowInvalidHostnames=True
            )
            db = mongo_client[mongo_db_name]
            calls_collection = db["calls"]
        else:
            print("MONGO_URI contiene el placeholder '<db_password>'.")
    except Exception as e:
        print(f"Error al conectar con MongoDB Atlas: {e}")
        


MEMORY_LIVE_CONTEXT = {}
AUDIO_CACHE = {}

app_api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default-session"
    active_model: str = "openai"
    page_context: dict = None


# ============================================================
# 1. API 1 & AGENTE 1 - ANALISIS
# ============================================================

@app_api.post("/ia-voz/call-state")
def call_state(req: ChatRequest):

    config = {
        "configurable": {
            "thread_id": req.session_id
        }
    }

    state = {
        "messages": [HumanMessage(content=req.message)],
        "call_state": {
            "page": "ia_voz",
            "audio_original": {
                "type": "text",
                "content": req.message
            },
            "estado": {
                "step": "resultados",
                "processing": False
            },
            "analisis": {
                "emocion_principal": "",
                "sentiment": "",  
                "interes": 0,
                "angustia": 0,
                "urgencia": 0,
                "satisfaccion": 0
            },
            "resultado": {
                "resumen": "",
                "palabras_clave": []
            },
            "accion": {
                "recomendada": ""
            }
        }
    }

    result = app_agent_call_state.invoke(state, config=config)


    MEMORY_LIVE_CONTEXT[req.session_id] = result["call_state"]

    if calls_collection is not None:
        try:
            audio_bytes = AUDIO_CACHE.pop(req.session_id, None)
            
            document = {
                "session_id": req.session_id,
                "timestamp": datetime.utcnow(),
                "transcript": req.message,
                "call_state": result["call_state"]
            }
            
            if audio_bytes is not None:
                document["audio_data"] = Binary(audio_bytes)
                
            calls_collection.update_one(
                {"session_id": req.session_id},
                {"$set": document},
                upsert=True
            )
        except Exception as e:
            print(f"Error al guardar estado de la llamada en MongoDB: {e}")

    return {
        "session_id": req.session_id,
        "call_state": result["call_state"]
    }


# ============================================================
# 2.API 2 & AGENTE 2 - COPILOT
# ============================================================

@app_api.post("/copilot/chat")
def copilot_chat(req: ChatRequest):
    import json
    from src.app.ai_core.connectors.llm_client_Ollama import get_ollama_llm
    from langchain_core.messages import SystemMessage, HumanMessage

    # Determinar qué página está consultando el usuario
    page = "ia_voz"
    if req.page_context and isinstance(req.page_context, dict):
        page = req.page_context.get("page", "ia_voz")

    # Mapear el nombre del modelo
    model_name_map = {
        "openai": "OpenAI GPT-4",
        "gemini": "Gemini 1.5 Pro",
        "anthropic": "Anthropic Claude 3.5"
    }
    model_label = model_name_map.get(req.active_model.lower(), "Groq LLaMA")

    # Obtener el LLM en modo texto plano (json_mode=False) para responder la pregunta del usuario
    llm = get_ollama_llm(json_mode=False)

    call_state = MEMORY_LIVE_CONTEXT.get(req.session_id)
    if call_state is None and calls_collection is not None and req.session_id:
        try:
            doc = calls_collection.find_one({"session_id": req.session_id})
            if doc:
                call_state = doc.get("call_state")
                MEMORY_LIVE_CONTEXT[req.session_id] = call_state
        except Exception as e:
            print(f"Error al buscar sesión en MongoDB: {e}")

    # Construir el System Prompt según la página activa
    if page == "dashboard":
        dashboard_data = req.page_context.get("data")
        system_prompt = (
            f"Actúas como un Business Copilot inteligente de VozIA (simulando la personalidad y estilo del asistente: {model_label}).\n"
            f"Estás asistiendo a un gerente del Call Center que está visualizando el Tablero de Control y Métricas de Analítica de VozIA en tiempo real.\n\n"
            f"MÉTRICAS DEL TABLERO ACTUALES:\n"
            f"{json.dumps(dashboard_data, ensure_ascii=False, indent=2) if dashboard_data else 'Sin métricas registradas en este momento.'}\n\n"
            f"INSTRUCCIONES:\n"
            f"El gerente te ha hecho una pregunta o comentario sobre las estadísticas, ingresos, nivel de urgencia o actividad. "
            f"Respóndele en español con consejos concisos, análisis útiles y recomendaciones estratégicas para mejorar la operación "
            f"del call center. Sé profesional, directo y mantén un tono acorde al asistente ({model_label}). Limita tu respuesta a un máximo de 3-4 oraciones."
        )
        updated_state = call_state

    elif page == "historial":
        active_call = req.page_context.get("active_call")
        total_calls = req.page_context.get("total_calls", 0)
        current_page = req.page_context.get("current_page", 1)

        if active_call:
            system_prompt = (
                f"Actúas como un Business Copilot inteligente de VozIA (simulando la personalidad y estilo del asistente: {model_label}).\n"
                f"Estás asistiendo a un analista que está consultando el registro histórico de llamadas y ha seleccionado una llamada específica.\n\n"
                f"DETALLES DE LA LLAMADA HISTÓRICA SELECCIONADA:\n"
                f"- ID de Sesión: {active_call.get('session_id')}\n"
                f"- Transcripción: \"{active_call.get('transcript', 'No disponible')}\"\n"
                f"- Emoción predominante: {active_call.get('emocion_principal', 'neutral').upper()}\n"
                f"- Nivel de Satisfacción: {active_call.get('satisfaccion', 0)}%\n\n"
                f"INSTRUCCIONES:\n"
                f"El analista te ha hecho una consulta sobre esta llamada específica. Bríndale un análisis retrospectivo en español, "
                f"evalúa cómo se manejó la situación o sugiere qué acciones correctivas tomar para el futuro. "
                f"Mantén un tono conciso y alineado con {model_label}. Limita tu respuesta a un máximo de 3-4 oraciones."
            )
        else:
            system_prompt = (
                f"Actúas como un Business Copilot inteligente de VozIA (simulando la personalidad y estilo del asistente: {model_label}).\n"
                f"Estás asistiendo a un analista que está explorando el Historial General de Llamadas de VozIA.\n"
                f"Actualmente hay {total_calls} llamadas registradas en total en esta vista (página {current_page} del historial).\n\n"
                f"INSTRUCCIONES:\n"
                f"El analista te ha hecho una pregunta general sobre el historial de simulaciones o cómo analizar llamadas pasadas. "
                f"Respóndele en español con consejos prácticos de análisis, cómo usar los filtros o mejores prácticas de control de calidad. "
                f"Sé conciso y mantén el tono de {model_label} (máximo 3-4 oraciones)."
            )
        updated_state = call_state

    else:  # "ia_voz"
        if call_state is None:
            return {
                "session_id": req.session_id,
                "response": "No hay una llamada activa en esta sesión. Inicia la simulación para hablar con el copiloto.",
                "call_state": None
            }

        # Ejecutar el grafo de copiloto para actualizar el estado del dominio heurístico
        state = {
            "messages": [HumanMessage(content=req.message)],
            "call_state": call_state
        }
        try:
            result = app_copilot.invoke(state)
            updated_state = result["call_state"]
        except Exception as e:
            print(f"Error al ejecutar grafo de copiloto: {e}")
            updated_state = call_state

        analisis = updated_state.get("analisis", {})
        resultado = updated_state.get("resultado", {})
        
        system_prompt = (
            f"Actúas como un Business Copilot inteligente de VozIA, simulando la personalidad y estilo del asistente: {model_label}.\n"
            f"Estás asistiendo en tiempo real a un agente telefónico que está conversando con un cliente.\n\n"
            f"INFORMACIÓN ACTUAL DE LA LLAMADA:\n"
            f"- Transcripción actual del cliente: \"{updated_state.get('transcript', 'No disponible')}\"\n"
            f"- Emoción predominante: {analisis.get('emocion_principal', 'neutral').upper()}\n"
            f"- Satisfacción del cliente: {analisis.get('satisfaccion', '100')}%\n"
            f"- Nivel de Angustia: {analisis.get('angustia', '0')}%\n"
            f"- Nivel de Urgencia: {analisis.get('urgencia', '0')}%\n"
            f"- Nivel de Interés: {analisis.get('interes', '0')}%\n"
            f"- Resumen rápido: {resultado.get('resumen', 'Sin resumen aún.')}\n\n"
            f"INSTRUCCIONES:\n"
            f"El agente de VozIA te ha hecho una pregunta o comentario. Respóndele en español con consejos concisos, "
            f"prácticos y accionables sobre cómo guiar la llamada. Sé claro, directo y mantén un tono acorde al asistente "
            f"seleccionado ({model_label}). Limita tu respuesta a un máximo de 3-4 oraciones."
        )

    # Invocación al LLM
    if llm is None:
        ai_response = f"[Copiloto fuera de línea - Habilita USE_LLM=true] ({model_label}) está inactivo."
        if page == "ia_voz" and updated_state:
            ai_response += " Recomendación: " + updated_state.get("copilot", {}).get("guia_agente", {}).get("que_hacer", "Resolver el caso.")
    else:
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=req.message)
            ]
            response = llm.invoke(messages)
            ai_response = response.content.strip()
        except Exception as e:
            print(f"Error al invocar LLM en copilot chat ({page}): {e}")
            ai_response = f"Lo siento, ocurrió un error en la conexión de copiloto con {model_label}: {str(e)}"

    if updated_state and req.session_id:
        MEMORY_LIVE_CONTEXT[req.session_id] = updated_state

        if calls_collection is not None:
            try:
                calls_collection.update_one(
                    {"session_id": req.session_id},
                    {"$set": {
                        "call_state": updated_state,
                        "last_updated": datetime.utcnow()
                    }},
                    upsert=True
                )
            except Exception as e:
                print(f"Error al actualizar copiloto en MongoDB: {e}")

    return {
        "session_id": req.session_id,
        "response": ai_response,
        "call_state": updated_state
    }


# ============================================================
# 2.4. HISTORIAL Y DASHBOARD (MONGODB)
# ============================================================

@app_api.get("/ia-voz/history")
def get_history():
    if calls_collection is None:
        return []
    try:
        cursor = calls_collection.find().sort("timestamp", -1).limit(50)
        history = []
        for doc in cursor:
            history.append({
                "session_id": doc.get("session_id"),
                "timestamp": doc.get("timestamp").isoformat() if doc.get("timestamp") else None,
                "transcript": doc.get("transcript"),
                "call_state": doc.get("call_state"),
                "has_audio": "audio_data" in doc and doc["audio_data"] is not None
            })
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener historial: {str(e)}")


@app_api.get("/ia-voz/audio/{session_id}")
def get_audio(session_id: str):
    if calls_collection is None:
        raise HTTPException(status_code=500, detail="Base de datos no configurada")
    try:
        doc = calls_collection.find_one({"session_id": session_id})
        if not doc or "audio_data" not in doc:
            raise HTTPException(status_code=404, detail="Audio no encontrado para esta sesión")
        
        return StreamingResponse(io.BytesIO(doc["audio_data"]), media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener audio: {str(e)}")


@app_api.get("/dashboard/data")
def get_dashboard_data():
    # Datos por defecto (mock) en caso de que no haya llamadas en la base de datos
    default_data = {
        "KPIGrid": [
            {"title": "Llamadas Totales", "value": "0", "growth": "0%", "description": "Llamadas en la base de datos"},
            {"title": "Nivel de Urgencia", "value": "Bajo", "growth": "realtime", "description": "Estado del Call Center"},
            {"title": "Satisfacción Promedio", "value": "100%", "growth": "0%", "description": "Sin datos de llamadas"},
            {"title": "Tiempo de Resolución", "value": "0s", "growth": "0%", "description": "Sin llamadas"}
        ],
        "RevenueChart": [
            {"month": "Ene", "revenue": 100},
            {"month": "Feb", "revenue": 150},
            {"month": "Mar", "revenue": 200},
            {"month": "Abr", "revenue": 250},
            {"month": "May", "revenue": 300},
            {"month": "Jun", "revenue": 350}
        ],
        "AIInsights": [
            {"text": "Aún no se han registrado llamadas. Las métricas e insights de IA aparecerán aquí una vez inicies simulaciones."}
        ],
        "TopProducts": [
            {"name": "Sin Datos", "sales": "0 llamadas", "growth": "0%"}
        ],
        "SalesTarget": {"progress": 0},
        "ActivityFeed": [
            {"title": "No hay actividad reciente", "time": "Ahora"}
        ]
    }

    if calls_collection is None:
        return default_data

    try:
        all_calls = list(calls_collection.find())
        total_calls = len(all_calls)

        if total_calls == 0:
            return default_data

        total_satisfaction = 0
        total_urgency = 0
        total_stress = 0
        topic_counts = {}
        activity_feed = []
        ai_insights = []

        for call in all_calls:
            call_state_data = call.get("call_state", {})
            analisis = call_state_data.get("analisis", {})
            resultado = call_state_data.get("resultado", {})
            
            # Satisfacción
            sat = analisis.get("satisfaccion", 0)
            if isinstance(sat, (int, float)):
                if sat <= 1:
                    sat_percentage = sat * 100
                elif sat <= 10:
                    sat_percentage = sat * 10
                else:
                    sat_percentage = sat
                total_satisfaction += sat_percentage
            else:
                total_satisfaction += 80

            # Urgencia
            urg = analisis.get("urgencia", 0)
            if isinstance(urg, (int, float)):
                total_urgency += urg

            # Estrés
            stress = analisis.get("angustia", 0)
            if isinstance(stress, (int, float)):
                total_stress += stress

            # Keywords
            keywords = resultado.get("palabras_clave", [])
            for kw in keywords:
                if kw:
                    topic_counts[kw] = topic_counts.get(kw, 0) + 1

        avg_satisfaction = round(total_satisfaction / total_calls, 1)
        avg_urgency_score = total_urgency / total_calls

        urgency_label = "Bajo"
        if avg_urgency_score > 7:
            urgency_label = "Crítico"
        elif avg_urgency_score > 4:
            urgency_label = "Medio"

        # 3. KPIGrid
        kpi_grid = [
            {
                "title": "Llamadas Totales",
                "value": f"{total_calls}",
                "growth": f"+{total_calls * 10}%" if total_calls < 10 else "+24.8%",
                "description": "Llamadas acumuladas en base de datos"
            },
            {
                "title": "Nivel de Urgencia",
                "value": urgency_label,
                "growth": "realtime",
                "description": "Nivel promedio de alerta de llamadas"
            },
            {
                "title": "Satisfacción Promedio",
                "value": f"{avg_satisfaction}%",
                "growth": "+3.4%" if avg_satisfaction > 70 else "-5.1%",
                "description": "Basado en análisis emocional"
            },
            {
                "title": "Tiempo de Resolución",
                "value": "3m 45s",
                "growth": "-12.5%",
                "description": "Tiempo promedio de llamada"
            }
        ]

        # 4. ActivityFeed e Insights
        recent_calls = sorted(all_calls, key=lambda c: c.get("timestamp") or datetime.min, reverse=True)[:4]
        
        for call in recent_calls:
            session_id = call.get("session_id", "Desconocido")
            call_state_data = call.get("call_state", {})
            analisis = call_state_data.get("analisis", {})
            resultado = call_state_data.get("resultado", {})
            
            emotion = analisis.get("emocion_principal", "neutral")
            resumen = resultado.get("resumen", "Llamada analizada.")
            
            activity_feed.append({
                "title": f"Sesión {session_id} - Cliente con emoción {emotion.upper()}",
                "time": "Reciente"
            })

            if resumen and len(ai_insights) < 3:
                ai_insights.append({"text": resumen})

        if not ai_insights:
            ai_insights = [{"text": "Las conversaciones analizadas muestran una tendencia estable esta sesión."}]

        # 5. TopProducts (Temas discutidos)
        sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        top_products = []
        for topic, count in sorted_topics:
            top_products.append({
                "name": topic,
                "sales": f"{count} llamadas",
                "growth": "+12%"
            })
        
        while len(top_products) < 3:
            top_products.append({
                "name": "Consulta General",
                "sales": "1 llamada",
                "growth": "+5%"
            })

        # 6. Gráfico mensual
        revenue_chart = [
            {"month": "Ene", "revenue": 1200 + total_calls * 10},
            {"month": "Feb", "revenue": 1800 + total_calls * 15},
            {"month": "Mar", "revenue": 2200 + total_calls * 20},
            {"month": "Abr", "revenue": 3400 + total_calls * 25},
            {"month": "May", "revenue": 4500 + total_calls * 30},
            {"month": "Jun", "revenue": 5200 + total_calls * 40}
        ]

        return {
            "KPIGrid": kpi_grid,
            "RevenueChart": revenue_chart,
            "AIInsights": ai_insights,
            "TopProducts": top_products,
            "SalesTarget": {"progress": min(int(avg_satisfaction), 100)},
            "ActivityFeed": activity_feed
        }

    except Exception as e:
        print(f"Error al generar datos del dashboard: {e}")
        return default_data


# ============================================================
# 2.5. TRANSCRIBE AUDIO
# ============================================================

@app_api.post("/ia-voz/transcribe")
async def transcribe(file: UploadFile = File(...), session_id: str = Form(None)):
    try:
        # Leer el archivo WAV
        audio_bytes = await file.read()
        
        if session_id:
            AUDIO_CACHE[session_id] = audio_bytes
        
        # Cargar el audio con speech_recognition
        recognizer = sr.Recognizer()
        
        # SpeechRecognition requiere un objeto tipo file. Usamos BytesIO.
        audio_file_like = io.BytesIO(audio_bytes)
        
        with sr.AudioFile(audio_file_like) as source:
            audio_data = recognizer.record(source)
            
        # Reconocer el audio usando la API de Google
        try:
            transcript = recognizer.recognize_google(audio_data, language="es-ES")
        except sr.UnknownValueError:
            raise HTTPException(status_code=400, detail="No se pudo entender el audio. ¿Es un audio vacío o con mucho ruido?")
        except sr.RequestError as e:
            raise HTTPException(status_code=520, detail=f"Error en el servicio de Google Speech Recognition: {e}")
            
        return {
            "filename": file.filename,
            "transcript": transcript,
            "status": "success"
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el audio: {str(e)}")


# ============================================================
# 3. HEALTH
# ============================================================

@app_api.get("/health")
def health():
    return {"status": "ok"}