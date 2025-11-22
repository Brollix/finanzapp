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
- **Backend**: Node.js + Express + AWS Textract + AWS Bedrock + Supabase.

```
monorepo/
├── frontend/      # App móvil (React Native)
├── backend/
│   └── aws-api/   # API con AWS services
└── docs/          # Documentación y schemas
```

**Flujo de procesamiento:**
```
📸 Image → AWS Textract (OCR) → AWS Bedrock (Claude LLM) → Supabase DB → 📊 Structured Data
```

---

# 🚀 Quick Start

## Prerequisites

- Node.js 20+
- AWS Account con Textract y Bedrock habilitados
- Proyecto Supabase configurado

## 1. Configurar AWS

Sigue la guía detallada: [`docs/aws-setup.md`](docs/aws-setup.md)

Resumen:
- Crear IAM user con permisos para Textract y Bedrock
- Habilitar modelos Claude en Bedrock
- Obtener access keys

## 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el schema SQL: [`docs/supabase-schema.sql`](docs/supabase-schema.sql)
3. Obtén tu `SUPABASE_URL` y `SUPABASE_ANON_KEY`

## 3. Configurar Backend

```bash
cd backend/aws-api
cp .env.example .env
# Edita .env con tus credenciales AWS y Supabase
npm install
npm run dev
```

El backend estará disponible en `http://localhost:8080`

Ver documentación completa: [`backend/aws-api/README.md`](backend/aws-api/README.md)

## 4. Lanzar App Móvil

```bash
cd frontend
npm install
npx expo start -c
```

Escanea el QR con **Expo Go** o usa un emulador. ¡Listo! 📲

---

# 📡 API Endpoints

- `POST /api/receipt/process` - Procesar imagen de ticket
- `GET /api/receipt/:id` - Obtener ticket por ID
- `GET /api/receipt/user/:userId` - Listar tickets de usuario

Ver documentación completa de la API: [`backend/aws-api/README.md`](backend/aws-api/README.md)

---

# 🐳 Docker Deployment

```bash
cd backend
# Configurar .env primero
docker compose up --build -d
```

---

# 💰 Costos Estimados

- **AWS Textract**: ~$1.50 por 1,000 páginas
- **AWS Bedrock (Claude Haiku)**: ~$0.25 por 1M tokens de entrada
- **Supabase**: Gratis hasta 500MB

**Costo estimado por ticket**: $0.002 - $0.005

---

# Contribuir

1. Crea un fork y una rama feature.
2. Haz tus commits con mensajes descriptivos.
3. Envía un Pull Request.

---

# Licencia

MIT © 2025 Agustín Brollo
