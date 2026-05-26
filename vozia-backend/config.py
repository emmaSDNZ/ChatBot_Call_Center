"""
Configuración de VozIA Backend
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configuración global de la aplicación"""
    
    # API
    API_TITLE: str = "VozIA API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "API de Inteligencia Emocional para Call Centers"
    DEBUG: bool = True
    
    # OpenAI (opcional, para producción)
    OPENAI_API_KEY: Optional[str] = None
    
    # Base de datos
    DATABASE_URL: str = "sqlite:///./vozia.db"
    
    # CORS
    CORS_ORIGINS: list = ["*"]
    
    # Paths
    UPLOAD_DIR: str = "uploads"
    
    class Config:
        env_file = ".env"


settings = Settings()
