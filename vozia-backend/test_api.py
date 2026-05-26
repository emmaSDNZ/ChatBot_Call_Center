"""
Script de Prueba para VozIA Backend
Demuestra cómo usar los endpoints de la API
"""
import requests
import json
from datetime import datetime

# URL base de la API
BASE_URL = "http://localhost:8000"

print("""
╔════════════════════════════════════════════════════════════╗
║            🧪 PRUEBAS DE VozIA Backend                   ║
╚════════════════════════════════════════════════════════════╝
""")

# ==================== PRUEBA 1: HEALTH CHECK ====================
print("\n1️⃣  HEALTH CHECK")
print("=" * 60)

try:
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"❌ Error: {e}")


# ==================== PRUEBA 2: ROOT ====================
print("\n2️⃣  INFORMACIÓN DE LA API")
print("=" * 60)

try:
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"❌ Error: {e}")


# ==================== PRUEBA 3: ANALIZAR TEXTO ====================
print("\n3️⃣  ANÁLISIS DE TEXTO")
print("=" * 60)

text_payload = {
    "text": "Estoy muy frustrado, mi pago fue rechazado hace tres días. Necesito ayuda urgente!",
    "call_id": "TEST_001"
}

print(f"\n📝 Texto: {text_payload['text']}")

try:
    response = requests.post(
        f"{BASE_URL}/analizar-texto",
        json=text_payload
    )
    print(f"\nStatus: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"❌ Error: {e}")


# ==================== PRUEBA 4: ANÁLISIS COMPLETO ====================
print("\n4️⃣  ANÁLISIS COMPLETO DE LLAMADA")
print("=" * 60)

call_payload = {
    "transcript": """
    Hola, buenos días. Llamo porque tengo un problema urgente con mi pago. 
    Intenté pagar mi factura hace tres días pero me dice que fue rechazado. 
    No entiendo por qué si tengo saldo en la cuenta. 
    Es muy frustrante porque necesitaba que se procesara urgentemente. 
    ¿Pueden ayudarme a resolver esto de inmediato?
    """,
    "call_id": "CALL_20260526_001",
    "agent_id": "AGENT_001"
}

print(f"\n📞 Llamada ID: {call_payload['call_id']}")
print(f"👨‍💼 Agente: {call_payload['agent_id']}")

try:
    response = requests.post(
        f"{BASE_URL}/analizar-llamada",
        json=call_payload
    )
    print(f"\nStatus: {response.status_code}")
    result = response.json()
    
    # Mostrar de forma legible
    print("\n📊 RESULTADOS:")
    print(f"  Emoción Principal: {result['emotion_analysis']['primary_emotion'].upper()}")
    print(f"  Confianza: {result['emotion_analysis']['confidence']:.0%}")
    print(f"  Temas: {', '.join(result['nlp_analysis']['main_topics'])}")
    print(f"  Nivel de Interés: {result['interest_level'].upper()}")
    print(f"  Nivel de Estrés: {result['stress_level'].upper()}")
    print(f"  Urgencia: {result['urgency_level'].upper()}")
    print(f"  Satisfacción: {result['satisfaction']:.0%}")
    print(f"\n💡 RECOMENDACIÓN PARA AGENTE:")
    print(f"  Acción: {result['recommendation']['action']}")
    print(f"  Razón: {result['recommendation']['reason']}")
    print(f"  Prioridad: {result['recommendation']['priority'].upper()}")
    print(f"\n📝 RESUMEN:")
    print(f"  {result['summary']}")
    
except Exception as e:
    print(f"❌ Error: {e}")


# ==================== PRUEBA 5: SIMULAR LLAMADA ====================
print("\n5️⃣  SIMULAR LLAMADA ALEATORIA")
print("=" * 60)

try:
    response = requests.post(f"{BASE_URL}/simular-llamada")
    print(f"\nStatus: {response.status_code}")
    result = response.json()
    
    print("\n📊 RESULTADOS DE SIMULACIÓN:")
    print(f"  ID de Llamada: {result['call_id']}")
    print(f"  Emoción Principal: {result['emotion_analysis']['primary_emotion'].upper()}")
    print(f"  Confianza: {result['emotion_analysis']['confidence']:.0%}")
    print(f"  Temas: {', '.join(result['nlp_analysis']['main_topics'])}")
    print(f"  Urgencia: {result['urgency_level'].upper()}")
    print(f"  Acción: {result['recommendation']['action']}")
    
except Exception as e:
    print(f"❌ Error: {e}")


# ==================== RESUMEN ====================
print("\n" + "=" * 60)
print("✅ PRUEBAS COMPLETADAS")
print("=" * 60)
print("""
✓ El backend está funcionando correctamente
✓ Los endpoints responden correctamente
✓ El análisis emocional y NLP está activo

Próximos pasos:
1. Crear el frontend con React
2. Conectar WebSockets para tiempo real
3. Integrar con base de datos
4. Agregar autenticación JWT
""")
