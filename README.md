<div align="center">
  <h1>💸 Finanzapp</h1>
  <img src="./docs/logo_finanzapp.png" alt="FinanzApp Logo" width="150"/>
</div>

---

# Descripción
Finanzapp es una aplicación de micro-finanzas personales. Fotografía tus tickets, obtén los datos clave con OCR + LLM y lleva tu control de gastos desde el móvil.

---

# Arquitectura
- **Frontend**: Expo / React Native + Supabase Auth.
- **OCR API**: FastAPI + PaddleOCR (Docker).
- **GPT API**: FastAPI + LLM local (Docker, modelo `.gguf`).

```
monorepo/
├── frontend/      # App móvil
└── backend/
    ├── ocr-api/   # OCR service
    └── gpt-api/   # LLM service
```

---

# Quick Start
1. Clona el repositorio.
2. Ejecuta `docker compose up` dentro de **`backend/ocr-api`** y **`backend/gpt-api`**.
3. Corre `npm start` en **`frontend`** para lanzar Expo.
4. Completa las variables de entorno indicadas en cada directorio.

¡Eso es todo! 📲  
Abre la app con Expo Go o un emulador y prueba a escanear tu primer ticket.

---

# Contribuir
1. Crea un fork y una rama feature.
2. Haz tus commits con mensajes descriptivos.
3. Envía un Pull Request.

---

# Licencia
MIT © 2025 Agustín Brollo
