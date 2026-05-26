"""
Modelos Pydantic para VozIA
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class EmotionType(str, Enum):
    """Emociones detectables"""
    ENOJO = "enojo"
    ALIVIO = "alivio"
    CONFUSION = "confusión"
    ANSIEDAD = "ansiedad"
    NEUTRAL = "neutral"


class InterestLevel(str, Enum):
    """Niveles de interés"""
    BAJO = "bajo"
    MEDIO = "medio"
    ALTO = "alto"


class UrgencyLevel(str, Enum):
    """Niveles de urgencia"""
    BAJA = "baja"
    MEDIA = "media"
    INMEDIATA = "inmediata"


class StressLevel(str, Enum):
    """Niveles de estrés"""
    NORMAL = "normal"
    MODERADO = "moderado"
    CRITICO = "crítico"


# ==================== REQUEST MODELS ====================

class AudioUploadRequest(BaseModel):
    """Request para subir archivo de audio"""
    pass


class TextAnalysisRequest(BaseModel):
    """Request para analizar texto (transcripción)"""
    text: str = Field(..., min_length=1, max_length=10000)
    call_id: str = Field(..., min_length=1)


class CallAnalysisRequest(BaseModel):
    """Request para análisis completo de llamada"""
    transcript: str = Field(..., description="Transcripción de la llamada")
    call_id: str = Field(..., description="ID único de la llamada")
    agent_id: Optional[str] = None


# ==================== RESPONSE MODELS ====================

class EmotionAnalysisResponse(BaseModel):
    """Respuesta de análisis emocional"""
    primary_emotion: EmotionType
    confidence: float = Field(..., ge=0.0, le=1.0)
    secondary_emotions: List[dict] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "primary_emotion": "enojo",
                "confidence": 0.87,
                "secondary_emotions": [
                    {"emotion": "frustración", "confidence": 0.65}
                ]
            }
        }


class NLPAnalysisResponse(BaseModel):
    """Respuesta de análisis NLP"""
    main_topics: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    problem_statement: str = Field(default="")
    
    class Config:
        json_schema_extra = {
            "example": {
                "main_topics": ["Pago", "Facturación"],
                "keywords": ["rechazado", "cuenta bancaria"],
                "problem_statement": "Cliente reporta pago rechazado"
            }
        }


class RecommendationResponse(BaseModel):
    """Recomendación para el agente"""
    action: str = Field(..., description="Acción recomendada")
    reason: str = Field(..., description="Razón de la recomendación")
    priority: UrgencyLevel = Field(..., description="Prioridad de la acción")
    
    class Config:
        json_schema_extra = {
            "example": {
                "action": "Escalar con supervisor + Empatía",
                "reason": "Cliente con estrés crítico y problema urgente",
                "priority": "inmediata"
            }
        }


class CallAnalysisResponse(BaseModel):
    """Respuesta completa del análisis de llamada"""
    call_id: str
    timestamp: datetime
    transcript: str
    
    # Análisis
    emotion_analysis: EmotionAnalysisResponse
    nlp_analysis: NLPAnalysisResponse
    interest_level: InterestLevel
    stress_level: StressLevel
    urgency_level: UrgencyLevel
    satisfaction: float = Field(..., ge=0.0, le=1.0)
    
    # Recomendación
    recommendation: RecommendationResponse
    
    # Resumen
    summary: str = Field(..., description="Resumen de la llamada")
    
    class Config:
        json_schema_extra = {
            "example": {
                "call_id": "CALL_12345",
                "timestamp": "2026-05-26T14:35:00",
                "transcript": "Cliente reporta problema con pago...",
                "emotion_analysis": {
                    "primary_emotion": "enojo",
                    "confidence": 0.87
                },
                "nlp_analysis": {
                    "main_topics": ["Pago", "Facturación"],
                    "keywords": ["rechazado"]
                },
                "interest_level": "alto",
                "stress_level": "crítico",
                "urgency_level": "inmediata",
                "satisfaction": 0.23,
                "recommendation": {
                    "action": "Escalar con supervisor",
                    "reason": "Estrés crítico detectado",
                    "priority": "inmediata"
                },
                "summary": "Cliente muy frustrado por pago rechazado..."
            }
        }


class HealthCheckResponse(BaseModel):
    """Respuesta de health check"""
    status: str = "healthy"
    version: str = "1.0.0"
    message: str = "VozIA API operativa"
