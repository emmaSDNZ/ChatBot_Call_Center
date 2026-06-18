# 🤖 VozIA Backend

Sistema de Inteligencia Emocional para Call Centers - Backend FastAPI

## 📋 Descripción

VozIA es un sistema que analiza llamadas telefónicas en tiempo real para detectar:
- **Emociones del cliente** (Enojo, Alivio, Confusión, Ansiedad, Neutral)
- **Temas principales** de la conversación
- **Urgencia y estrés** del cliente
- **Satisfacción** con el servicio
- **Recomendaciones** para el agente

#Estrctura 

## 🏗️ Estructura del Proyecto

vozia-backend/
└── src/
    └── app/
        ├── ai_core/
        │   ├── connectors/
        │   ├── graph/
        │   ├── nodes/
        │   ├── prompts/
        │   └── tools/
        ├── api/
        │   └── api.py
        └── modules/
            ├── copilot/
            └── voice/
          




## 🚀 Instalación Rápida




### 1. Crear y Activar Entorno Virtual



```bash
# Windows

python -m venv venv
venv\Scripts\activate


FOLDER RAIZ :      ChatBot_Call_Center\ vozia-backend >

uvicorn uvicorn app.api.api:app_api --app-dir src --reload --port 8000

Levantar debug cli COPILOTO
 python -m src.app.chat_copilot.main

Levantar debug cli VOICE
 python -m src.app.modules.voice.main




activar cli copilot python -m src.app.modules.copilot.main



Crear archivo .env:

cp .env.example .env

Editar:

OLLAMA_MODEL=llama3

según el modelo que tenga cada desarrollador.

debe solicitar la api..

IMPORTANTEEE PARA LEVANTAR ESTA EN EL ENV V2.0.1 SE DEBE TENER LA API Y EL MODELO. PARA PODER AVANZAR EN EL DESARROLLO USAMOS UNA API ONPEN SOURCE. (LA DIFERENCIA ES LA POTENCIA DEL MODELO) 

link como instalar y solicitar la api de ollama https://docs.ollama.com/cloud  
link modelo open source ollama https://ollama.com/ 
link docs 
https://docs.ollama.com/cloud   

tutorial para solicitrar la api 

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar Dependencias

```bash

pip install -r requirements_1.txt

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



## 🔄 Flujo de Análisis

1. **Entrada**: Transcripción de llamada
2. **Análisis Emocional**: Detecta emoción primaria y secundarias
3. **Análisis NLP**: Extrae temas y palabras clave
4. **Cálculo de Indicadores**: Interés, estrés, urgencia, satisfacción
5. **Generación de Recomendación**: Basada en emoción y urgencia
6. **Resumen**: Síntesis de los puntos clave

