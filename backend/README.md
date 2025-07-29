# Backend de Finanzapp

Este directorio contiene los micro-servicios que apoyan a la app móvil.
Cada servicio está totalmente containerizado y se orquesta mediante un único
`docker-compose.yml` ubicado en esta misma carpeta.

## 🗂️ Estructura

```
backend/
├── docker-compose.yml        # Orquestador raíz
├── models/                   # Aquí van los modelos `.gguf` u otros pesos de IA (no se versionan)
├── ocr-api/                  # Servicio OCR (FastAPI + PaddleOCR)
│   ├── Dockerfile
│   └── ...
└── gpt-api/                  # Servicio LLM (FastAPI + llamacpp)
    ├── Dockerfile
    └── ...
```

## 🚀 Puesta en marcha (3 pasos)

1. Instala **Docker Desktop** (incluye Docker Compose).
2. Copia tu modelo `.gguf` a `backend/models/` (solo la primera vez).
3. Ejecuta:
   ```bash
   cd backend
   docker compose up --build -d  # monta ./models como volumen
   ```
   Eso levantará:
   • OCR API → `http://localhost:8000/ocr`  
   • GPT API → `http://localhost:8080/parse`


3. Descarga el modelo una sola vez siguiendo las instrucciones en [models/README.md](models/README.md).

## 📄 Documentación por servicio

| Servicio | README local |
| -------- | ------------- |
| OCR API  | [ocr-api/README.md](ocr-api/README.md) |
| GPT API  | [gpt-api/README.md](gpt-api/README.md) |

## 🧹 Buenas prácticas

- Agrega reglas a `.dockerignore` para mantener los contextos livianos.
- Los entornos `venv/` y cachés de Python están ignorados globalmente en `.gitignore`.
- Mantén los ejemplos y archivos de prueba en `samples/` o `tests/` fuera de la imagen.

---

> Última actualización: 2025-07-29
