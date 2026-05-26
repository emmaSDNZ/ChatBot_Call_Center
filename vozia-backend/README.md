# 🤖 VozIA Backend

Sistema de Inteligencia Emocional para Call Centers - Backend FastAPI

## 📋 Descripción

VozIA es un sistema que analiza llamadas telefónicas en tiempo real para detectar:
- **Emociones del cliente** (Enojo, Alivio, Confusión, Ansiedad, Neutral)
- **Temas principales** de la conversación
- **Urgencia y estrés** del cliente
- **Satisfacción** con el servicio
- **Recomendaciones** para el agente

## 🚀 Instalación Rápida

### 1. Crear y Activar Entorno Virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 3. Ejecutar el Servidor

```bash
python main.py
```

El servidor estará disponible en: **http://localhost:8000**

## 📚 Documentación de API

Una vez que el servidor esté corriendo, accede a la documentación interactiva:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

## 🔌 Endpoints Principales

### 1. Health Check
```
GET /health
```
Verifica que el servidor está operativo.

### 2. Analizar Texto
```
POST /analizar-texto
Content-Type: application/json

{
  "text": "Hola, tengo un problema con mi pago...",
  "call_id": "CALL_12345"
}
```

Retorna análisis de emociones y temas principales.

### 3. Análisis Completo de Llamada
```
POST /analizar-llamada
Content-Type: application/json

{
  "transcript": "Hola, tengo un problema urgente con mi pago...",
  "call_id": "CALL_12345",
  "agent_id": "AGENT_001"
}
```

Retorna análisis COMPLETO con todos los indicadores:
- Emoción del cliente
- Temas detectados
- Nivel de interés
- Nivel de estrés
- Urgencia
- Satisfacción
- Recomendación para el agente
- Resumen

### 4. Subir Audio
```
POST /subir-audio
Content-Type: multipart/form-data

[Archivo: audio.wav]
```

Sube un archivo de audio (en desarrollo con Whisper).

### 5. Simular Llamada
```
POST /simular-llamada
```

Simula una llamada completa con datos aleatorios. Útil para pruebas.

## 📊 Ejemplo de Respuesta

```json
{
  "call_id": "CALL_12345",
  "timestamp": "2026-05-26T14:35:00",
  "transcript": "Hola, tengo un problema con mi pago...",
  "emotion_analysis": {
    "primary_emotion": "enojo",
    "confidence": 0.87,
    "secondary_emotions": [
      {
        "emotion": "frustración",
        "confidence": 0.65
      }
    ]
  },
  "nlp_analysis": {
    "main_topics": ["pago", "facturación"],
    "keywords": ["rechazado", "cuenta bancaria"],
    "problem_statement": "Pago rechazado en cuenta"
  },
  "interest_level": "alto",
  "stress_level": "crítico",
  "urgency_level": "inmediata",
  "satisfaction": 0.23,
  "recommendation": {
    "action": "Escalar inmediatamente a supervisor + Expresar empatía",
    "reason": "Cliente furioso con problema urgente",
    "priority": "inmediata"
  },
  "summary": "Cliente frustrado por pago rechazado. Requiere solución inmediata."
}
```

## 🏗️ Estructura del Proyecto

```
vozia-backend/
├── main.py                 # Aplicación FastAPI principal
├── models.py              # Modelos Pydantic
├── config.py              # Configuración
├── requirements.txt       # Dependencias
├── services/
│   ├── __init__.py
│   ├── emotion.py         # Análisis de emociones
│   ├── nlp.py             # Procesamiento de lenguaje natural
│   └── transcription.py   # Transcripción de audio
└── uploads/               # Directorio para archivos subidos
```

## 🔧 Servicios

### EmotionAnalysisService
Detecta emociones en el texto usando análisis de palabras clave.

En **producción** usaría:
```python
from transformers import pipeline
classifier = pipeline("sentiment-analysis", 
                     model="nlptown/bert-base-multilingual-uncased-sentiment")
```

### NLPService
Extrae temas, palabras clave y enunciados de problemas.

En **producción** usaría spaCy:
```python
import spacy
nlp = spacy.load("es_core_news_sm")
```

### TranscriptionService
Convierte audio a texto.

En **producción** usaría Whisper:
```python
import whisper
model = whisper.load_model("base")
result = model.transcribe("audio.mp3")
```

## ⚙️ Variables de Entorno

Crear archivo `.env`:

```
# API
DEBUG=True

# OpenAI (para producción)
OPENAI_API_KEY=sk-...

# Base de datos
DATABASE_URL=sqlite:///./vozia.db

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]
```

## 🧪 Pruebas Rápidas

### Con cURL

```bash
# Health check
curl http://localhost:8000/health

# Simular llamada
curl -X POST http://localhost:8000/simular-llamada

# Analizar texto
curl -X POST http://localhost:8000/analizar-texto \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Estoy muy frustrado",
    "call_id": "CALL_123"
  }'
```

### Con Python

```python
import requests

# Health check
response = requests.get("http://localhost:8000/health")
print(response.json())

# Simular llamada
response = requests.post("http://localhost:8000/simular-llamada")
print(response.json())
```

## 🔄 Flujo de Análisis

1. **Entrada**: Transcripción de llamada
2. **Análisis Emocional**: Detecta emoción primaria y secundarias
3. **Análisis NLP**: Extrae temas y palabras clave
4. **Cálculo de Indicadores**: Interés, estrés, urgencia, satisfacción
5. **Generación de Recomendación**: Basada en emoción y urgencia
6. **Resumen**: Síntesis de los puntos clave

## 📈 Próximos Pasos

- [ ] Integración con modelo BERT multilingual real
- [ ] WebSockets para análisis en tiempo real
- [ ] Base de datos PostgreSQL
- [ ] Autenticación con JWT
- [ ] Rate limiting
- [ ] Logs y monitoreo
- [ ] Tests unitarios
- [ ] Docker containerización

## 📝 Licencia

Proyecto académico - ISPC 2026

## 👥 Autores

Equipo Proyecto Integrador - VozIA

---

**¿Preguntas?** Consults la documentación en `/docs`
