import re
from collections import Counter

# ============================================================
# DICCIONARIOS ENRIQUECIDOS - FACTURACIÓN, QUEJAS Y SOPORTE (AR)
# ============================================================

INTERES_WORDS = {
    "informacion": 4, "información": 4, "consulta": 3, "consultar": 3, "interes": 4, 
    "interés": 4, "interesa": 4, "interesado": 4, "interesada": 4, "quiero": 4, 
    "quisiera": 4, "necesito": 4, "cotizacion": 5, "cotización": 5, "precio": 4, 
    "precios": 4, "cuanto": 3, "cuánto": 3, "sale": 3, "cuesta": 3, "valor": 3,
    "producto": 3, "productos": 3, "servicio": 3, "servicios": 3, "comprar": 5, 
    "contratar": 5, "alta": 5, "adquirir": 5, "promo": 4, "promocion": 4, 
    "promoción": 4, "descuento": 4, "planes": 3, "plan": 3, "abono": 3,
    "averiguar": 4, "saber": 3, "disponible": 3, "stock": 4, "catalogo": 3
}

ANGUSTIA_WORDS = {
    "triste": 7, "tristeza": 8, "problema": 5, "problemas": 5, "error": 5, "errores": 5, 
    "falla": 5, "fallas": 5, "fallando": 5, "roto": 6, "rompio": 6, "rompió": 6,
    "angustia": 7, "angustiado": 7, "angustiada": 7, "preocupado": 5, "preocupada": 5, 
    "preocupacion": 5, "preocupación": 5, "miedo": 6, "temor": 6, "mal": 5, 
    "horrible": 7, "pesimo": 7, "pésimo": 7, "pesima": 7, "pésima": 7, "terrible": 7, 
    "insatisfecho": 6, "insatisfecha": 6, "reclamo": 6, "reclamos": 6, "queja": 6, 
    "quejas": 6, "reclamar": 6, "estafa": 8, "estafado": 8, "estafada": 8,
    "caido": 5, "caído": 5, "anda": 4, "funciona": 4, "corte": 4, "cortado": 5,
    "bosta": 8, "basura": 7, "desastre": 7, "verguenza": 7, "vergüenza": 7,
    "bronca": 7, "indignado": 7, "indignada": 7, "cansado": 5, "cansada": 5,
    "podrido": 7, "podrida": 7, "harto": 7, "harta": 7, "clavo": 6, "perdiendo": 6,
    "plata": 4, "dinero": 4, "cobraron": 5, "devolucion": 5, "devolución": 5,
    "injusto": 6, "baja": 7, "cancelar": 7, "decepcion": 6, "decepción": 6, "malisimo": 7, "malísimo": 7,
    # Foco Call Center: Quejas de costos y facturación (Causas de frustración)
    "caro": 7, "carisimo": 8, "carísimo": 8, "afano": 8, "robo": 8, "te sacan": 6, "excesivo": 6,
    "aumento": 5, "aumentaron": 6, "factura": 4, "boleta": 4, "cobrando": 5, "demasiado": 5
}

URGENCIA_WORDS = {
    "urgente": 9, "urgencia": 9, "ahora": 6, "ya": 7, "hoy": 5, "inmediato": 8, 
    "inmediata": 8, "rapido": 6, "rápido": 6, "rapida": 6, "rápida": 6, 
    "inmediatamente": 8, "demora": 5, "demoras": 5, "demorado": 5, "esperando": 5,
    "cuantoantes": 8, "cuanto antes": 8, "tarde": 5, "emergencia": 9, "prioridad": 7, 
    "plazo": 6, "vence": 6, "vencido": 6, "vencimiento": 6, "limite": 6, "límite": 6,
    "cortar": 7, "quedarme sin": 7, "atendeme": 7, "respondeme": 7, "solucionen ya": 9
}

SATISFACCION_WORDS = {
    "feliz": 6, "contento": 6, "contenta": 6, "satisfecho": 8, "satisfecha": 8, 
    "excelente": 8, "genial": 7, "perfecto": 8, "perfecta": 8, "gracias": 5, 
    "buenísimo": 6, "buenisimo": 6, "buenísima": 6, "buenisima": 6,
    "encantado": 8, "encantada": 8, "maravilloso": 8, "maravillosa": 8, 
    "solucionado": 7, "solucionada": 7, "correcto": 5, "correcta": 5, 
    "bueno": 5, "buena": 5, "gusto": 6, "gusta": 6, "gustó": 6,
    "joya": 7, "barbaro": 7, "bárbaro": 7, "espectacular": 8, "impecable": 8
}

# Mapeo de errores comunes del STT (Voz a Texto) en llamadas
TYPO_FIXES = {
    "gusot": "gusto", "gusta": "gusto", "gusto": "gusto",
    "exelente": "excelente", "ecelente": "excelente",
    "reclamar": "reclamo", "reclemo": "reclamo",
    "servicio": "servicio", "sevisio": "servicio", "serbicio": "servicio",
    "solucion": "solucionado", "solusió": "solucionado"
}

NEGATION_WORDS = {"no", "ni", "nunca", "tampoco", "jamas", "jamás"}


# ============================================================
# ENGINE DE PROCESAMIENTO ROBUSTO CON ANÁLISIS DE CONTEXTO
# ============================================================

def nlp_engine(text: str):
    if not text or not isinstance(text, str):
        return {
            "text": "", "sentiment": "NEU", "emotion": "neutral",
            "analysis": {"emocion_principal": "neutral", "interes": 0, "angustia": 0, "urgencia": 0, "satisfaccion": 0},
            "summary": "", "keywords": []
        }

    clean_text = text.lower().strip()
    raw_words = re.findall(r'[a-záéíóúüñ0-9]+', clean_text)
    total_words = max(len(raw_words), 1)

    # 1. Normalización de palabras y Corrección de Typos del STT
    words = [TYPO_FIXES.get(w, w) for w in raw_words]

    interes_raw = 0
    angustia_raw = 0
    urgencia_raw = 0
    satisfaccion_raw = 0

    # 2. Análisis con Ventana de Negación Dinámica
    # Si detecta "no", "ni", etc., invierte las métricas positivas hacia angustia/queja.
    for i, word in enumerate(words):
        # Miramos si las 2 palabras anteriores contienen una negación
        has_negation = False
        start_look = max(0, i - 2)
        for j in range(start_look, i):
            if words[j] in NEGATION_WORDS:
                has_negation = True
                break

        w_interes = INTERES_WORDS.get(word, 0)
        w_angustia = ANGUSTIA_WORDS.get(word, 0)
        w_urgencia = URGENCIA_WORDS.get(word, 0)
        w_satisfaccion = SATISFACCION_WORDS.get(word, 0)

        if has_negation:
            # Si dice "no me gustó", la satisfacción se convierte en angustia/queja
            if w_satisfaccion > 0:
                angustia_raw += w_satisfaccion * 1.5
            elif w_interes > 0:
                angustia_raw += w_interes * 1.2
            # Mantenemos las cargas nativas negativas si existieran
            angustia_raw += w_angustia
            urgencia_raw += w_urgencia
        else:
            # Flujo normal sin alteraciones de contexto
            interes_raw += w_interes
            angustia_raw += w_angustia
            urgencia_raw += w_urgencia
            satisfaccion_raw += w_satisfaccion

    # 3. Escalado e Ingeniería de Probabilidades Dinámica
    base_factor = 10.0
    factor = 100.0 / max(total_words * 1.3, base_factor)

    interes = min(int(round(interes_raw * factor)), 100)
    angustia = min(int(round(angustia_raw * factor)), 100)
    urgencia = min(int(round(urgencia_raw * factor)), 100)
    satisfaccion = min(int(round(satisfaccion_raw * factor)), 100)

    emociones = {
        "interes": interes,
        "angustia": angustia,
        "urgencia": urgencia,
        "satisfaccion": satisfaccion
    }

    # 4. Resolución del Sesgo de Desempate en Cero Absoluto
    # Si no matcheó nada o todo dio idéntico a cero, la emoción principal ES neutral.
    if max(emociones.values()) == 0:
        emocion_principal = "neutral"
    else:
        # Buscamos el máximo de forma segura
        emocion_principal = max(emociones, key=emociones.get)

    # Umbral de confianza operativa para el Call Center
    if emocion_principal != "neutral" and emociones[emocion_principal] < 8:
        emocion_principal = "neutral"

    # 5. Determinación Semántica del Sentimiento Macro
    if emocion_principal == "satisfaccion" and satisfaccion > 0:
        sentiment = "POS"
    elif emocion_principal in ["angustia", "urgencia"] and max(angustia, urgencia) > 0:
        sentiment = "NEG"
    else:
        sentiment = "NEU"

    # Acciones recomendadas dinámicas para la pantalla del agente
    accion_recomendada = "Atención estándar"
    if sentiment == "NEG":
        accion_recomendada = "Retención cliente - Manejo de reclamo prioritario."
    elif emocion_principal == "urgencia":
        accion_recomendada = "Priorizar atención y derivar a supervisor de guardia."
    elif emocion_principal == "interes":
        accion_recomendada = "Asesoramiento comercial activo para cierre de venta."

    resumen_texto = text if len(text) <= 120 else f"{text[:117]}..."

    # Extracción limpia de Keywords
    blacklist = {"de", "la", "el", "los", "las", "y", "en", "un", "una", "que", "por", "para", "con", "del", "al", "me", "mi", "es", "se", "no", "muy"}
    filtered_kws = [w for w in words if len(w) > 3 and w not in blacklist]
    keywords = [word for word, _ in Counter(filtered_kws).most_common(5)]

    return {
        "text": text,
        "sentiment": sentiment,
        "emotion": emocion_principal,
        "analysis": {
            "emocion_principal": emocion_principal,
            "interes": interes,
            "angustia": angustia,
            "urgencia": urgencia,
            "satisfaccion": satisfaccion
        },
        "summary": resumen_texto,
        "keywords": keywords,
        "custom_call_state": {
            "analisis": {
                "emocion_principal": emocion_principal,
                "interes": interes,
                "angustia": angustia,
                "urgencia": urgencia,
                "satisfaccion": satisfaccion
            },
            "resultado": {
                "resumen": resumen_texto,
                "palabras_clave": keywords
            },
            "accion": {
                "recomendada": accion_recomendada
            }
        }
    }