"""
Servicio de Transcripción
En producción usaría Whisper de OpenAI o Google Cloud Speech-to-Text
Para demo, simula la transcripción
"""
from typing import Optional


class TranscriptionService:
    """Servicio de transcripción de audio a texto"""
    
    @staticmethod
    def transcribe(audio_path: str) -> str:
        """
        Transcribe un archivo de audio a texto
        
        En producción:
        - Usar Whisper: whisper.transcribe(audio_path)
        - Usar Google Cloud Speech-to-Text API
        
        Args:
            audio_path: Ruta al archivo de audio
            
        Returns:
            Texto transcrito
        """
        # Simulación para demo
        return """
        Hola, buenos días. Llamo porque tengo un problema con mi pago. 
        Intenté pagar mi factura hace tres días pero me dice que fue rechazado. 
        No entiendo por qué si tengo saldo en la cuenta. 
        Es muy frustrante porque necesitaba que se procesara urgentemente. 
        ¿Pueden ayudarme a resolver esto de inmediato?
        """
    
    @staticmethod
    def transcribe_streaming(audio_stream) -> str:
        """
        Transcribe audio en streaming (tiempo real)
        
        Args:
            audio_stream: Stream de audio
            
        Returns:
            Texto parcialmente transcrito
        """
        # Para producción: implementar con WebSockets
        return "Transcribiendo en tiempo real..."


# Instancia global
transcription_service = TranscriptionService()
