# FinanzApp

App móvil para escanear y analizar tickets de compra usando IA.

## Stack Tecnológico

- **Frontend**: React Native + Expo
- **Backend**: Node.js + Express
- **Base de datos**: Supabase (PostgreSQL)
- **IA**: AWS Bedrock (Claude 3 Haiku)
- **OCR**: AWS Textract

## Estructura del Proyecto

```
finanzapp/
├── frontend/          # App React Native
│   ├── src/
│   ├── app.json
│   └── package.json
├── backend/
│   └── aws-api/      # API Node.js
│       ├── src/
│       ├── Dockerfile
│       └── package.json
└── docs/             # Documentación técnica
```

## Quick Start

### Frontend (Desarrollo)

```bash
cd frontend
npm install
npx expostart
```

### Backend (Local)

```bash
cd backend/aws-api
cp .env.example .env  # Configura tus credenciales
npm install
npm run dev
```

## Deployment

Ver documentación en `/docs`:

- **Backend**: [docs/deploy-backend.md](docs/deploy-backend.md)
- **Mobile**: [docs/deploy-mobile.md](docs/deploy-mobile.md)

## Configuración

Copia `.env.example` y configura:

- Credenciales AWS (Bedrock + Textract)
- Credenciales Supabase
- URL del backend (para el móvil)

## Licencia

Uso privado - Brollix © 2025
