"""
Servicio de Análisis Emocional
Utiliza transformers y modelos pre-entrenados para detectar emociones
"""
from typing import List, Dict
import random
from models import EmotionType


class EmotionAnalysisService:
    """Análisis de emociones en texto"""
    
    def __init__(self):
        """Inicializa el servicio de emociones"""
        # En producción, cargaríamos un modelo real:
        # from transformers import pipeline
        # self.classifier = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")
        
        # Para demo, usamos análisis simulado basado en palabras clave
        self.emotion_keywords = {
            EmotionType.ENOJO: [
                "enojado", "furioso", "indignado", "molesto", "frustrado",
                "queja", "inaceptable", "ridiculo", "vergüenza", "exigencia"
            ],
            EmotionType.ALIVIO: [
                "gracias", "solucionado", "resuelto", "excelente", "perfecto",
                "satisfecho", "contento", "bien", "muchas gracias", "bueno"
            ],
            EmotionType.CONFUSION: [
                "no entiendo", "confundido", "perdido", "explicar", "como",
                "que", "no claro", "no entiende", "complejo", "difícil"
            ],
            EmotionType.ANSIEDAD: [
                "preocupado", "ansioso", "miedo", "urgente", "prisa",
                "rápido", "enseguida", "ahora", "inmediato", "estresado"
            ],
            EmotionType.NEUTRAL: [
                "información", "datos", "necesito", "quiero", "tengo"
            ]
        }
    
    def analyze(self, text: str) -> Dict:
        """
        Analiza el texto y detecta emociones
        
        Args:
            text: Texto a analizar
            
        Returns:
            Dict con emoción primaria, confianza y emociones secundarias
        """
        text_lower = text.lower()
        emotion_scores = {}
        
        # Calcular puntuación por emoción
        for emotion, keywords in self.emotion_keywords.items():
            matching_keywords = [kw for kw in keywords if kw in text_lower]
            score = len(matching_keywords) / max(len(keywords), 1)
            emotion_scores[emotion] = score
        
        # Obtener emoción primaria
        if max(emotion_scores.values()) > 0:
            primary_emotion = max(emotion_scores, key=emotion_scores.get)
            confidence = min(emotion_scores[primary_emotion] + random.uniform(0.1, 0.2), 1.0)
        else:
            primary_emotion = EmotionType.NEUTRAL
            confidence = 0.6 + random.uniform(0, 0.3)
        
        # Emociones secundarias (con menor confianza)
        secondary_emotions = []
        for emotion, score in sorted(emotion_scores.items(), key=lambda x: x[1], reverse=True)[1:3]:
            if score > 0:
                secondary_emotions.append({
                    "emotion": emotion.value,
                    "confidence": min(score + random.uniform(0, 0.15), 1.0)
                })
        
        return {
            "primary_emotion": primary_emotion,
            "confidence": round(confidence, 2),
            "secondary_emotions": secondary_emotions
        }


# Instancia global del servicio
emotion_service = EmotionAnalysisService()
