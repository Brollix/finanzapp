# FinanzApp Deployment Guide

Guía completa para configurar y desplegar FinanzApp en producción.

## Tabla de Contenidos

1. [AWS Setup](#aws-setup)
2. [Backend Deployment](#backend-deployment)
3. [Mobile Deployment](#mobile-deployment)

---

## AWS Setup

Esta sección cubre la configuración de servicios AWS (Textract y Bedrock) necesarios para el backend.

### Prerequisites

- AWS Account
- AWS CLI installed (opcional pero recomendado)

### Step 1: Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Enter username: `finanzapp-backend`
4. Click **Next**

### Step 2: Attach Permissions

#### Option A: Create Custom Policy (Recommended)

1. Click **Attach policies directly**
2. Click **Create policy**
3. Switch to **JSON** tab
4. Paste the following policy:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "TextractAccess",
			"Effect": "Allow",
			"Action": ["textract:DetectDocumentText", "textract:AnalyzeDocument"],
			"Resource": "*"
		},
		{
			"Sid": "BedrockAccess",
			"Effect": "Allow",
			"Action": ["bedrock:InvokeModel"],
			"Resource": [
				"arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
				"arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"
			]
		}
	]
}
```

5. Click **Next**
6. Name the policy: `FinanzAppBackendPolicy`
7. Click **Create policy**
8. Go back to user creation and attach the newly created policy

#### Option B: Use AWS Managed Policies (Less Secure)

Attach these managed policies:

- `AmazonTextractFullAccess`
- `AmazonBedrockFullAccess`

**Note**: Managed policies grant broader permissions than needed.

### Step 3: Create Access Keys

1. After creating the user, click on the username
2. Go to **Security credentials** tab
3. Scroll down to **Access keys**
4. Click **Create access key**
5. Select **Application running outside AWS**
6. Click **Next** → **Create access key**
7. **IMPORTANT**: Copy both:
   - Access key ID
   - Secret access key

   You won't be able to see the secret key again!

### Step 4: Enable Bedrock Models

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Select your region (e.g., `us-east-1`)
3. Click **Model access** in the left sidebar
4. Click **Manage model access**
5. Check the boxes for:
   - **Anthropic** → **Claude 3 Haiku**
   - **Anthropic** → **Claude 3.5 Sonnet** (optional, more expensive)
6. Click **Request model access**
7. Wait for approval (usually instant for Claude models)

### Step 5: Configure Backend

1. Open your `.env` file in `backend/aws-api/`
2. Add your credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Choose your model
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

#### Available Claude Models

| Model             | ID                                          | Speed  | Cost | Use Case                 |
| ----------------- | ------------------------------------------- | ------ | ---- | ------------------------ |
| Claude 3 Haiku    | `anthropic.claude-3-haiku-20240307-v1:0`    | Fast   | Low  | Production (recommended) |
| Claude 3.5 Sonnet | `anthropic.claude-3-5-sonnet-20240620-v1:0` | Medium | High | High accuracy needs      |

### Step 6: Test Configuration

Run the health check:

```bash
cd backend/aws-api
npm run dev
```

In another terminal:

```bash
curl http://localhost:8080/api/health
```

Expected response:

```json
{
	"status": "healthy",
	"timestamp": "2025-11-22T10:00:00.000Z",
	"service": "finanzapp-aws-api"
}
```

### Troubleshooting AWS Setup

#### Error: "The security token included in the request is invalid"

- Check that your access key and secret key are correct
- Ensure the IAM user has the required permissions
- Verify the keys are not expired

#### Error: "Could not connect to the endpoint URL"

- Check your `AWS_REGION` is correct
- Ensure Bedrock is available in your region
- Try using `us-east-1` which has the most services

#### Error: "AccessDeniedException"

- Verify IAM policies are attached to the user
- Check Bedrock model access is approved
- Ensure the model ID in `.env` matches an approved model

#### Error: "ValidationException: The provided model identifier is invalid"

- Check `BEDROCK_MODEL_ID` in `.env` is correct
- Ensure you've requested access to that specific model
- Verify the model is available in your region

### Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Rotate access keys regularly** - Every 90 days recommended
3. **Use least privilege** - Only grant necessary permissions
4. **Enable MFA** - For your AWS root account
5. **Monitor usage** - Set up billing alerts in AWS

### Cost Monitoring

1. Go to [AWS Billing Dashboard](https://console.aws.amazon.com/billing/)
2. Click **Budgets** → **Create budget**
3. Set a monthly budget (e.g., $10)
4. Add email alerts at 80% and 100%

---

## Backend Deployment

Guía para deployar el backend de FinanzApp en AWS EC2 usando Docker.

### Información EC2

- **Host**: `ec2-18-222-119-175.us-east-2.compute.amazonaws.com`
- **IP**: `18.222.119.175`
- **Puerto**: `8080`
- **CloudFront URL**: `https://d245522eugz5ge.cloudfront.net` (CDN público)

> **Nota**: La app móvil usa CloudFront como CDN para acceder al backend, pero el deployment se hace directamente en EC2.

### Primera Vez (Setup)

#### 1. Conectar a EC2

```bash
ssh -i "finanzapp-backend.pem" ubuntu@ec2-18-222-119-175.us-east-2.compute.amazonaws.com
```

#### 2. Clonar Repositorio

```bash
cd ~
git clone https://github.com/TU_USUARIO/finanzapp.git
cd finanzapp/backend/aws-api
```

#### 3. Configurar `.env`

```bash
nano .env
```

Variables necesarias:

```env
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=tu_key
AWS_SECRET_ACCESS_KEY=tu_secret
PORT=8080
NODE_ENV=production
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
SUPABASE_URL=tu_url
SUPABASE_ANON_KEY=tu_key
SUPABASE_SERVICE_ROLE_KEY=tu_key
```

#### 4. Subir script de deployment

```bash
# Desde tu computadora
scp -i "finanzapp-backend.pem" backend/aws-api/deploy.sh ubuntu@ec2-18-222-119-175.us-east-2.compute.amazonaws.com:~/finanzapp/backend/aws-api/

# Conectar y dar permisos
ssh -i "finanzapp-backend.pem" ubuntu@ec2-18-222-119-175.us-east-2.compute.amazonaws.com
cd ~/finanzapp/backend/aws-api
chmod +x deploy.sh
```

#### 5. Desplegar

```bash
./deploy.sh
```

**El script hace limpieza automática de:**
- ✅ Imágenes Docker antiguas
- ✅ Contenedores detenidos
- ✅ Build cache (>7 días)
- ✅ Networks no usadas
- ✅ Logs rotativos (máx 30MB)

### Redesplegar (Actualizaciones)

#### Opción A: Manual

```bash
ssh aws  # Si configuraste el SSH config
cd ~/finanzapp
git pull origin main
cd backend/aws-api
./deploy.sh
```

#### Opción B: Automático con GitHub Actions

Solo haz push a `main` y GitHub Actions se encarga del resto.

Ver instrucciones completas en: [`backend/aws-api/DEPLOYMENT.md`](../backend/aws-api/DEPLOYMENT.md)

### Comandos Útiles

```bash
# Ver logs
docker logs -f finanzapp-api

# Reiniciar
docker restart finanzapp-api

# Estado
docker ps

# Health check
curl http://localhost:8080/api/health
```

### Verificar Deployment

#### Opción A: Verificar directamente en EC2 (SSH)

```bash
curl http://localhost:8080/api/health
```

#### Opción B: Verificar desde IP pública

```bash
curl http://18.222.119.175:8080/api/health
```

#### Opción C: Verificar desde CloudFront (producción)

```bash
curl https://d245522eugz5ge.cloudfront.net/api/health
```

Todas deben responder:

```json
{
	"status": "healthy",
	"timestamp": "...",
	"service": "finanzapp-aws-api"
}
```

### Security Group

Asegúrate que el puerto 8080 esté abierto en AWS Console → EC2 → Security Groups.

### CloudFront (CDN)

El backend está expuesto públicamente a través de CloudFront para HTTPS y mejor performance:

- **Distribution URL**: `https://d245522eugz5ge.cloudfront.net`
- **Origin**: EC2 en `http://18.222.119.175:8080`
- **Beneficios**: HTTPS gratuito, CDN global, protección DDoS

Las apps móviles usan CloudFront (`https://...`), pero el deployment se hace directamente en EC2 por SSH.

---

## Mobile Deployment

Guía para compilar y publicar FinanzApp en Android/iOS.

### Setup Inicial

```bash
npm install -g eas-cli
eas login
cd frontend
eas build:configure
```

### Configurar Backend URL

Edita `frontend/.env`:

```env
EXPO_PUBLIC_BACKEND_URL=http://18.222.119.175:8080
EXPO_PUBLIC_SUPABASE_URL=tu_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_key
```

### Builds de Prueba

```bash
cd frontend

# Android APK
npm run build:android:preview

# iOS Simulator
npm run build:ios:preview
```

### Builds de Producción

#### Android (Play Store)

```bash
npm run build:android   # Genera AAB
npm run submit:android  # Sube a Play Store
```

#### iOS (App Store)

```bash
npm run build:ios      # Genera IPA
npm run submit:ios     # Sube a App Store
```

### Actualizar Versión

Edita `frontend/app.json`:

```json
{
	"expo": {
		"version": "0.1.4",
		"android": {
			"versionCode": 2
		},
		"ios": {
			"buildNumber": "2"
		}
	}
}
```

Luego:

```bash
npm run build:all
npm run submit:android
npm run submit:ios
```

### Requisitos

- **Android**: Cuenta Google Play Console ($25 único)
- **iOS**: Cuenta Apple Developer ($99/año)

### Ver Builds

```bash
eas build:list
```

O en: https://expo.dev

---

## Support

### AWS Issues

- [AWS Textract Documentation](https://docs.aws.amazon.com/textract/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS Support Center](https://console.aws.amazon.com/support/)

### Deployment Issues

- Check GitHub Actions logs for automated deployments
- Review Docker logs: `docker logs -f finanzapp-api`
- Verify environment variables are set correctly
- Check health endpoints for service status



