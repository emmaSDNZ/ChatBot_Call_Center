"""
Servicio de Procesamiento de Lenguaje Natural (NLP)
Extrae temas, palabras clave, y análisis de texto
Utiliza spaCy y patrones personalizados
"""
from typing import List, Tuple
import re


class NLPService:
    """Servicio de análisis NLP avanzado"""
    
    def __init__(self):
        """Inicializa el servicio NLP"""
        # En producción: cargar modelo de spaCy
        # import spacy
        # self.nlp = spacy.load("es_core_news_sm")
        
        # Palabras clave de temas comunes en call centers
        self.topics = {
            "pago": ["pago", "factura", "cobro", "transferencia", "dinero", "importe", "costo"],
            "problema técnico": ["error", "no funciona", "falla", "bug", "sistema", "app", "página"],
            "servicio al cliente": ["atención", "servicio", "ayuda", "soporte", "consulta"],
            "facturación": ["factura", "invoice", "documento", "comprobante", "recibo"],
            "urgencia": ["urgente", "urgencia", "prisa", "ahora", "inmediato", "rápido"],
            "duda": ["no sé", "no entiendo", "dudoso", "confundido", "pregunta"],
        }
        
        self.urgency_patterns = [
            r"urgente|prisa|ahora|inmediato|rápido|enseguida|ya",
            r"necesito|necesito ya|debo|debo ya|tengo que",
            r"problema grave|muy grave|crítico|catastrofe",
        ]
    
    def extract_topics(self, text: str) -> List[str]:
        """
        Extrae los temas principales del texto
        
        Args:
            text: Texto a analizar
            
        Returns:
            Lista de temas detectados
        """
        text_lower = text.lower()
        detected_topics = []
        
        for topic, keywords in self.topics.items():
            for keyword in keywords:
                if keyword in text_lower:
                    if topic not in detected_topics:
                        detected_topics.append(topic)
                    break
        
        return detected_topics if detected_topics else ["General"]
    
    def extract_keywords(self, text: str) -> List[str]:
        """
        Extrae palabras clave del texto
        
        Args:
            text: Texto a analizar
            
        Returns:
            Lista de palabras clave
        """
        # Remover palabras comunes (stopwords)
        stopwords = {
            "el", "la", "de", "que", "y", "a", "en", "es", "se", "por",
            "con", "para", "un", "una", "o", "del", "me", "te", "le"
        }
        
        # Extraer palabras significativas
        words = re.findall(r'\b\w+\b', text.lower())
        keywords = [w for w in words if len(w) > 4 and w not in stopwords]
        
        # Retornar palabras más frecuentes
        from collections import Counter
        top_keywords = [word for word, _ in Counter(keywords).most_common(5)]
        
        return top_keywords if top_keywords else ["consulta"]
    
    def extract_problem_statement(self, text: str) -> str:
        """
        Extrae el enunciado del problema principal
        
        Args:
            text: Texto de la llamada
            
        Returns:
            Enunciado del problema
        """
        # Buscar patrones comunes de problemas
        problem_patterns = [
            r"tengo (?:un )?problema (?:con|de)?\s+(.+?)(?:\.|,|$)",
            r"el problema es\s+(.+?)(?:\.|,|$)",
            r"no puedo\s+(.+?)(?:\.|,|$)",
            r"no funciona\s+(.+?)(?:\.|,|$)",
            r"falla\s+(.+?)(?:\.|,|$)",
        ]
        
        for pattern in problem_patterns:
            match = re.search(pattern, text.lower())
            if match:
                return match.group(1).strip().capitalize()
        
        # Si no hay patrón, tomar las primeras palabras significativas
        words = text.split()
        problem = " ".join(words[:10])
        return problem if problem else "Consulta general"
    
    def analyze(self, text: str) -> dict:
        """
        Análisis NLP completo del texto
        
        Args:
            text: Texto a analizar
            
        Returns:
            Diccionario con análisis completo
        """
        return {
            "main_topics": self.extract_topics(text),
            "keywords": self.extract_keywords(text),
            "problem_statement": self.extract_problem_statement(text)
        }


# Instancia global
nlp_service = NLPService()
