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

# 🚀 Quick Start

1. Clona el repo y entra al directorio:
   ```bash
   git clone https://github.com/Brollix/finanzapp.git
   cd finanzapp
   ```
2. Descarga el modelo `.gguf` siguiendo [`backend/models/README.md`](backend/models/README.md).
3. Levanta los micro-servicios (OCR + GPT) con Docker Compose:
   ```bash
   cd backend
   docker compose up --build -d  # monta ./models como volumen
   cd ..
   ```
4. Lanza la app móvil:
   ```bash
   cd frontend
   npm install
   npx expo start -c
   ```
5. Escanea el QR con **Expo Go** o usa un emulador. ¡Listo! 📲

---

# Contribuir

1. Crea un fork y una rama feature.
2. Haz tus commits con mensajes descriptivos.
3. Envía un Pull Request.

---

# Licencia

MIT © 2025 Agustín Brollo
