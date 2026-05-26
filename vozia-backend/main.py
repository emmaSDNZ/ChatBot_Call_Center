"""
VozIA Backend - API FastAPI
Sistema de Inteligencia Emocional para Call Centers
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uuid
from datetime import datetime
import random

from config import settings
from models import (
    CallAnalysisRequest, CallAnalysisResponse, EmotionAnalysisResponse,
    RecommendationResponse, NLPAnalysisResponse, InterestLevel, 
    StressLevel, UrgencyLevel, HealthCheckResponse, EmotionType,
    TextAnalysisRequest
)
from services.emotion import emotion_service
from services.transcription import transcription_service
from services.nlp import nlp_service

# ==================== INICIALIZACIÓN ====================

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# CORS - Permitir acceso desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== UTILIDADES ====================

def calculate_interest_level(text: str) -> InterestLevel:
    """Calcula el nivel de interés basado en el texto"""
    interest_keywords = {
        "alto": ["quiero", "interesado", "comprar", "contratar", "precio", "costo", "cuánto"],
        "medio": ["talvez", "posiblemente", "a lo mejor", "no sé", "depende"],
        "bajo": ["no quiero", "no me interesa", "no puedo", "imposible"]
    }
    
    text_lower = text.lower()
    
    # Contar coincidencias
    alto = sum(1 for kw in interest_keywords["alto"] if kw in text_lower)
    bajo = sum(1 for kw in interest_keywords["bajo"] if kw in text_lower)
    
    if alto >= 2:
        return InterestLevel.ALTO
    elif bajo >= 1:
        return InterestLevel.BAJO
    else:
        return InterestLevel.MEDIO


def calculate_stress_level(emotion_confidence: float, urgency: UrgencyLevel) -> StressLevel:
    """Calcula el nivel de estrés basado en emoción y urgencia"""
    if urgency == UrgencyLevel.INMEDIATA and emotion_confidence > 0.75:
        return StressLevel.CRITICO
    elif emotion_confidence > 0.7:
        return StressLevel.MODERADO
    else:
        return StressLevel.NORMAL


def calculate_satisfaction(emotion: EmotionType, stress: StressLevel) -> float:
    """Calcula satisfacción del cliente"""
    satisfaction_map = {
        EmotionType.ALIVIO: 0.85,
        EmotionType.NEUTRAL: 0.60,
        EmotionType.CONFUSION: 0.40,
        EmotionType.ENOJO: 0.20,
        EmotionType.ANSIEDAD: 0.35,
    }
    
    base_satisfaction = satisfaction_map.get(emotion, 0.5)
    
    # Ajustar por estrés
    if stress == StressLevel.CRITICO:
        base_satisfaction *= 0.5
    elif stress == StressLevel.MODERADO:
        base_satisfaction *= 0.8
    
    return round(base_satisfaction, 2)


def generate_recommendation(
    emotion: EmotionType, 
    urgency: UrgencyLevel, 
    topics: list
) -> RecommendationResponse:
    """Genera recomendación para el agente basada en análisis"""
    
    recommendations = {
        EmotionType.ENOJO: {
            UrgencyLevel.INMEDIATA: {
                "action": "Escalar inmediatamente a supervisor + Expresar empatía",
                "reason": "Cliente furioso con problema urgente",
            },
            UrgencyLevel.MEDIA: {
                "action": "Tomar control, escuchar activamente, prometer solución",
                "reason": "Cliente frustrado pero no crítico",
            },
            UrgencyLevel.BAJA: {
                "action": "Validar preocupaciones, ofrecer alternativas",
                "reason": "Frustración controlable, no hay urgencia extrema",
            }
        },
        EmotionType.ANSIEDAD: {
            UrgencyLevel.INMEDIATA: {
                "action": "Tranquilizar + Solución rápida + Supervisor",
                "reason": "Cliente ansioso con problema urgente",
            },
            UrgencyLevel.MEDIA: {
                "action": "Brindar confianza, pasos claros, seguimiento",
                "reason": "Cliente estresado pero manejable",
            },
            UrgencyLevel.BAJA: {
                "action": "Información clara y detallada",
                "reason": "Ansiedad leve",
            }
        },
        EmotionType.CONFUSION: {
            UrgencyLevel.INMEDIATA: {
                "action": "Explicar CLARO + Paso a paso + Paciencia",
                "reason": "Confusión con urgencia",
            },
            UrgencyLevel.MEDIA: {
                "action": "Explicación detallada, ejemplos",
                "reason": "Cliente confundido",
            },
            UrgencyLevel.BAJA: {
                "action": "Aclarar dudas, información",
                "reason": "Pregunta informativa",
            }
        },
        EmotionType.ALIVIO: {
            UrgencyLevel.INMEDIATA: {
                "action": "Confirmar solución, seguimiento rápido",
                "reason": "Problema resuelto pero con urgencia",
            },
            UrgencyLevel.MEDIA: {
                "action": "Consolidar solución, cerrar llamada positivamente",
                "reason": "Cliente satisfecho",
            },
            UrgencyLevel.BAJA: {
                "action": "Cerrar exitosamente, ofrecer servicios adicionales",
                "reason": "Llamada exitosa",
            }
        },
        EmotionType.NEUTRAL: {
            UrgencyLevel.INMEDIATA: {
                "action": "Resolver rápidamente, preguntar necesidades",
                "reason": "Cliente eficiente con urgencia",
            },
            UrgencyLevel.MEDIA: {
                "action": "Atención profesional, resolución clara",
                "reason": "Llamada factual",
            },
            UrgencyLevel.BAJA: {
                "action": "Responder consulta, ofrecer ayuda adicional",
                "reason": "Consulta general",
            }
        }
    }
    
    emotion_recs = recommendations.get(emotion, recommendations[EmotionType.NEUTRAL])
    urgency_recs = emotion_recs.get(urgency, emotion_recs[UrgencyLevel.MEDIA])
    
    return RecommendationResponse(
        action=urgency_recs["action"],
        reason=urgency_recs["reason"],
        priority=urgency
    )


# ==================== ENDPOINTS ====================

@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Health check - Verifica que el servidor está operativo
    """
    return HealthCheckResponse(
        status="healthy",
        version=settings.API_VERSION,
        message="VozIA API operativa ✓"
    )


@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "nombre": "VozIA API",
        "versión": settings.API_VERSION,
        "descripción": settings.API_DESCRIPTION,
        "documentación": "/docs",
        "endpoints": [
            "POST /analizar-texto",
            "POST /analizar-llamada",
            "POST /subir-audio",
            "GET /health"
        ]
    }


@app.post("/analizar-texto", response_model=dict)
async def analyze_text(request: TextAnalysisRequest):
    """
    Analiza un texto (transcripción) y extrae emociones y temas
    
    **Parámetros:**
    - `text`: Texto a analizar
    - `call_id`: ID único de la llamada
    
    **Retorna:**
    - Análisis de emociones
    - Análisis NLP
    - Evaluación de urgencia
    """
    try:
        # Análisis de emociones
        emotion_result = emotion_service.analyze(request.text)
        
        # Análisis NLP
        nlp_result = nlp_service.analyze(request.text)
        
        return {
            "call_id": request.call_id,
            "timestamp": datetime.now().isoformat(),
            "emotion": emotion_result,
            "nlp": nlp_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analizar-llamada", response_model=CallAnalysisResponse)
async def analyze_call(request: CallAnalysisRequest):
    """
    Análisis COMPLETO de una llamada
    
    Realiza análisis emocional, NLP, calcula indicadores,
    y genera recomendación para el agente
    
    **Parámetros:**
    - `transcript`: Transcripción de la llamada (completa)
    - `call_id`: ID único de la llamada
    - `agent_id`: ID del agente (opcional)
    
    **Retorna:**
    Análisis completo con todos los indicadores para el dashboard
    """
    try:
        # 1. Análisis de emociones
        emotion_analysis_dict = emotion_service.analyze(request.transcript)
        emotion_analysis = EmotionAnalysisResponse(**emotion_analysis_dict)
        
        # 2. Análisis NLP
        nlp_analysis_dict = nlp_service.analyze(request.transcript)
        nlp_analysis = NLPAnalysisResponse(**nlp_analysis_dict)
        
        # 3. Detectar urgencia desde el texto
        urgency_keywords = ["urgente", "prisa", "ahora", "inmediato", "rápido", "ya"]
        has_urgency = any(kw in request.transcript.lower() for kw in urgency_keywords)
        urgency_level = UrgencyLevel.INMEDIATA if has_urgency else UrgencyLevel.MEDIA
        
        # 4. Calcular otros indicadores
        interest_level = calculate_interest_level(request.transcript)
        stress_level = calculate_stress_level(
            emotion_analysis.confidence,
            urgency_level
        )
        satisfaction = calculate_satisfaction(
            emotion_analysis.primary_emotion,
            stress_level
        )
        
        # 5. Generar recomendación
        recommendation = generate_recommendation(
            emotion_analysis.primary_emotion,
            urgency_level,
            nlp_analysis.main_topics
        )
        
        # 6. Generar resumen
        summary = f"""
Cliente con emoción primaria: {emotion_analysis.primary_emotion.value.upper()}
Temas principales: {', '.join(nlp_analysis.main_topics)}
Problema: {nlp_analysis.problem_statement}
Nivel de interés: {interest_level.value}
Nivel de estrés: {stress_level.value}
Urgencia: {urgency_level.value}
Acción recomendada: {recommendation.action}
        """.strip()
        
        # 7. Retornar análisis completo
        return CallAnalysisResponse(
            call_id=request.call_id,
            timestamp=datetime.now(),
            transcript=request.transcript,
            emotion_analysis=emotion_analysis,
            nlp_analysis=nlp_analysis,
            interest_level=interest_level,
            stress_level=stress_level,
            urgency_level=urgency_level,
            satisfaction=satisfaction,
            recommendation=recommendation,
            summary=summary
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")


@app.post("/subir-audio")
async def upload_audio(file: UploadFile = File(...)):
    """
    Sube un archivo de audio y lo transcribe
    
    **Parámetros:**
    - `file`: Archivo de audio (MP3, WAV, etc.)
    
    **Retorna:**
    Transcripción del audio
    """
    try:
        # Guardar archivo
        file_id = str(uuid.uuid4())
        file_path = f"{settings.UPLOAD_DIR}/{file_id}_{file.filename}"
        
        # En producción, guardaríamos el archivo y lo procesaríamos
        # contents = await file.read()
        # with open(file_path, "wb") as f:
        #     f.write(contents)
        
        # Transcribir (en producción usaríamos Whisper)
        # transcript = transcription_service.transcribe(file_path)
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "status": "Transcripción en proceso",
            "transcript": transcription_service.transcribe("")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/simular-llamada")
async def simulate_call():
    """
    Simula una llamada completa con datos aleatorios
    Útil para pruebas y demostración
    """
    call_id = f"CALL_{str(uuid.uuid4())[:8].upper()}"
    
    # Transcripciones de ejemplo
    example_transcripts = [
        "Hola, tengo un problema urgente. Mi pago fue rechazado hace tres días y necesito que se resuelva inmediatamente. No entiendo por qué pasó esto si tengo saldo suficiente.",
        "Buenos días, necesito información sobre mis próximas facturas. Quiero saber cuándo se envían y cómo puedo hacer un reclamo sobre la última.",
        "Hola, estoy muy frustrado. Llevo una semana intentando resolver un problema técnico y nadie me ayuda. Es inaceptable.",
        "Buenos días, llamaba para consultar sobre los servicios premium. ¿Cuál es el precio y qué incluye exactamente?",
        "Ayuda! Mi cuenta está bloqueada y no puedo acceder. Es crítico, necesito resolver esto ya mismo!"
    ]
    
    # Seleccionar transcripción aleatoria
    transcript = random.choice(example_transcripts)
    
    # Realizar análisis completo
    request = CallAnalysisRequest(
        transcript=transcript,
        call_id=call_id,
        agent_id="AGENT_001"
    )
    
    return await analyze_call(request)


# ==================== MANEJO DE ERRORES ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Manejador de excepciones HTTP"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# ==================== INICIO ====================

if __name__ == "__main__":
    import uvicorn
    
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║                  🤖 VozIA Backend v1.0                    ║
    ║          Sistema de Inteligencia Emocional para CC         ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
