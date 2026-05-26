"""
Script de verificación rápida del backend
"""
import sys
sys.path.insert(0, '.')

try:
    from main import app
    from config import settings
    
    print(f"""
╔════════════════════════════════════════════════════════════╗
║           ✅ VozIA BACKEND CARGADO CORRECTAMENTE          ║
╚════════════════════════════════════════════════════════════╝

📋 Configuración:
  - API Title: {settings.API_TITLE}
  - API Version: {settings.API_VERSION}
  - Debug Mode: {settings.DEBUG}
  - Database: {settings.DATABASE_URL}

🔌 Endpoints Disponibles:
""")
    
    for route in app.routes:
        if hasattr(route, 'path'):
            methods = getattr(route, 'methods', ['GET'])
            methods_str = ', '.join(methods) if methods else 'GET'
            print(f"  [{methods_str}] {route.path}")
    
    print(f"""
✨ El backend está listo para usar!

Próximos pasos:
1. Ejecutar el servidor:
   python main.py
   
2. Acceder a la documentación:
   http://localhost:8000/docs
   
3. Ejecutar las pruebas:
   python test_api.py
    """)
    
except Exception as e:
    print(f"❌ ERROR AL CARGAR: {e}")
    import traceback
    traceback.print_exc()
