# FinanzApp

![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue?logo=react)
![Expo](https://img.shields.io/badge/Expo-54.0-black?logo=expo)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![AWS](https://img.shields.io/badge/AWS-Bedrock%20%2B%20Textract-orange?logo=amazon-aws)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)

[![Backend CI](https://github.com/USER/finanzapp/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/USER/finanzapp/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/USER/finanzapp/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/USER/finanzapp/actions/workflows/frontend-ci.yml)

Aplicación móvil que automatiza el registro de gastos mediante escaneo inteligente de tickets. Utiliza **OCR** y **IA** para extraer y estructurar información de compras, facilitando el seguimiento financiero personal.

## 🎯 Características Principales

- **📸 Escaneo Inteligente**: Captura tickets con la cámara y extrae automáticamente productos, precios y totales usando AWS Textract
- **🤖 Procesamiento con IA**: Claude 3 (AWS Bedrock) estructura y categoriza los datos de compra
- **📊 Dashboard Analítico**: Visualiza gastos, estadísticas y análisis de descuentos por supermercado
- **💾 Sincronización en Tiempo Real**: Base de datos PostgreSQL en Supabase con autenticación integrada
- **🚀 Arquitectura Escalable**: Backend en Node.js/Express desplegado en AWS con Docker

## 🏗️ Arquitectura

![Flujo de la Aplicación](docs/flowchart-architecture.jpg)

Ver [documentación técnica completa](docs/) para detalles de implementación.

## 🛠️ Stack Tecnológico

- **Frontend**: React Native + Expo (TypeScript)
- **Backend**: Node.js + Express + TypeScript
- **Website**: Next.js 14 + TypeScript + Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **IA**: AWS Bedrock (Claude 3 Haiku)
- **OCR**: AWS Textract
- **Deployment**: AWS EC2 + CloudFront, EAS Build, Nginx

## 🚀 Quick Start

### Frontend (Desarrollo)

```bash
cd frontend
npm install
npx expo start
```

### Backend (Local)

```bash
cd backend/aws-api
cp .env.example .env  # Configura tus credenciales
npm install
npm run dev
```

### Website (Desarrollo Local)

```bash
cd website
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Estructura del Proyecto

```
finanzapp/
├── frontend/          # App React Native (Expo)
│   ├── app/          # Rutas y navegación
│   └── src/          # Componentes, servicios, hooks
├── backend/
│   └── aws-api/      # API Node.js/Express
│       ├── src/
│       │   ├── controllers/
│       │   ├── services/  # Textract, Bedrock, DB
│       │   └── routes/
│       └── Dockerfile
├── website/          # Landing page (Next.js)
│   ├── app/          # Páginas y layouts
│   ├── components/   # Componentes React
│   └── Dockerfile
└── docs/             # Documentación técnica
```

## 📚 Documentación

- **Deployment Guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Guía completa de AWS setup, backend y mobile deployment
- **Website Deployment**: [website/DEPLOYMENT.md](website/DEPLOYMENT.md) - Guía para desplegar el sitio web en EC2 con Nginx
- **Sitio Web**: [https://finanzapp.info](https://finanzapp.info) - Landing page de FinanzApp

## ⚙️ Configuración

### Backend

Copia `.env.example` a `.env` en `backend/aws-api/` y configura:

- **AWS**: Credenciales IAM (Bedrock + Textract)
  - `AWS_REGION`: Región de AWS (ej: `us-east-1`)
  - `AWS_ACCESS_KEY_ID`: Access key ID
  - `AWS_SECRET_ACCESS_KEY`: Secret access key
  - `BEDROCK_MODEL_ID`: ID del modelo de Bedrock
- **Supabase**:
  - `SUPABASE_URL`: URL del proyecto
  - `SUPABASE_SERVICE_ROLE_KEY` o `SUPABASE_ANON_KEY`: Una de las dos
- **CORS** (Opcional): `CORS_ALLOWED_ORIGINS` - Lista separada por comas de orígenes permitidos
- **Sentry** (Opcional): `SENTRY_DSN` - Para error tracking

Ver [backend/aws-api/README.md](backend/aws-api/README.md) para más detalles.

### Frontend

Crea `.env` en `frontend/` con:

- `EXPO_PUBLIC_BACKEND_URL`: URL del backend API
- `EXPO_PUBLIC_SUPABASE_URL`: URL de Supabase
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Anon key de Supabase

Ver [frontend/README.md](frontend/README.md) para más detalles.

## 📄 Licencia

Uso privado - Brollix © 2025
