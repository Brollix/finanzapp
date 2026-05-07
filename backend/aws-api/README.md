# FinanzApp Backend API

Backend API para FinanzApp construido con Node.js, Express, TypeScript, AWS Textract, AWS Bedrock y Supabase.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm o yarn
- AWS Account con acceso a Textract y Bedrock
- Supabase Project

### Installation

```bash
npm install
```

### Environment Variables

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Server
PORT=8080
NODE_ENV=development

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR
SUPABASE_ANON_KEY=your_anon_key

# CORS (Optional - comma-separated list of allowed origins)
# If not set, allows all origins (for development/Expo)
CORS_ALLOWED_ORIGINS=https://finanzapp.info,https://app.finanzapp.info

# Sentry (Optional - for error tracking)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Development

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:8080`

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## 📁 Estructura del Proyecto

```
src/
├── config/          # Configuración (AWS, Supabase, Sentry)
├── controllers/     # Controladores de rutas
├── middleware/      # Middleware (auth, rate limit, upload)
├── routes/          # Definición de rutas
├── services/        # Lógica de negocio
│   └── bedrock/     # Servicios de Bedrock (embeddings, prompts, utils)
├── types/           # Tipos TypeScript
└── utils/           # Utilidades (logger, errors, retry, validateEnv)
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🔍 Code Quality

```bash
# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check

# Type check
npm run type-check
```

## 📚 API Endpoints

Ver [docs/API.md](../../docs/API.md) para documentación completa de la API.

### Health Checks

- `GET /api/health` - Health check básico
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe (verifica conexión a Supabase)

### Receipt Processing

- `POST /api/receipt/process` - Procesar ticket (OCR + IA)
- `GET /api/receipt/process/:jobId/status` - Estado del procesamiento
- `GET /api/receipt/user` - Obtener tickets del usuario
- `GET /api/receipt/:id` - Obtener ticket por ID
- `DELETE /api/receipt/:id` - Eliminar ticket

## 🔒 Seguridad

- **Autenticación**: Bearer token (Supabase JWT)
- **Rate Limiting**:
  - General: 100 requests / 15 minutos
  - Receipt processing: 10 requests / hora
- **CORS**: Configurable via `CORS_ALLOWED_ORIGINS`
- **Helmet**: Headers de seguridad HTTP
- **Input Validation**: Zod schemas

## 🐳 Docker

```bash
# Build
docker build -t finanzapp-backend .

# Run
docker run -p 8080:8080 --env-file .env finanzapp-backend
```

## 📊 Monitoring & Optimization

- **Logging**: Winston logger con formato estructurado
- **Error Tracking**: Sentry (opcional, configurar `SENTRY_DSN`)
- **Health Checks**: Endpoints para Kubernetes/Docker health probes
- **AI Optimization**: Implementación de **Claude 3.5 Haiku** con prompt consolidado para reducir latencia y costos.
- **DB Efficiency**: Sistema de **Batch Processing** para inserción de productos y recibos, reduciendo llamadas a la DB en un 90%.
- **Performance**: Arquitectura de **Early Return** con procesamiento en segundo plano para una respuesta al usuario en <8s.

## 🚢 Deployment

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para guía completa de deployment en AWS EC2.

## 📝 License

MIT
