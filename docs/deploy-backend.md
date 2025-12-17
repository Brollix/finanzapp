# Deploy Backend a EC2

Guía para deployar el backend de FinanzApp en AWS EC2 usando Docker.

## Información EC2

- **Host**: `ec2-18-222-119-175.us-east-2.compute.amazonaws.com`
- **IP**: `18.222.119.175`
- **Puerto**: `8080`
- **CloudFront URL**: `https://d245522eugz5ge.cloudfront.net` (CDN público)

> **Nota**: La app móvil usa CloudFront como CDN para acceder al backend, pero el deployment se hace directamente en EC2.

## Primera Vez (Setup)

### 1. Conectar a EC2

```bash
ssh -i "finanzapp-backend.pem" ubuntu@ec2-18-222-119-175.us-east-2.compute.amazonaws.com
```

### 2. Clonar Repositorio

```bash
cd ~
git clone https://github.com/TU_USUARIO/finanzapp.git
cd finanzapp/backend/aws-api
```

### 3. Configurar `.env`

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

### 4. Subir script de deployment

```bash
# Desde tu computadora
scp -i "finanzapp-backend.pem" backend/aws-api/deploy.sh ubuntu@ec2-18-222-119-175.us-east-2.compute.amazonaws.com:~/finanzapp/backend/aws-api/

# Conectar y dar permisos
ssh -i "finanzapp-backend.pem" ubuntu@ec2-18-222-119-175.us-east-2.compute.amazonaws.com
cd ~/finanzapp/backend/aws-api
chmod +x deploy.sh
```

### 5. Desplegar

```bash
./deploy.sh
```

**El script hace limpieza automática de:**
- ✅ Imágenes Docker antiguas
- ✅ Contenedores detenidos
- ✅ Build cache (>7 días)
- ✅ Networks no usadas
- ✅ Logs rotativos (máx 30MB)

## Redesplegar (Actualizaciones)

### Opción A: Manual

```bash
ssh aws  # Si configuraste el SSH config
cd ~/finanzapp
git pull origin main
cd backend/aws-api
./deploy.sh
```

### Opción B: Automático con GitHub Actions

Solo haz push a `main` y GitHub Actions se encarga del resto.

Ver instrucciones completas en: [`backend/aws-api/DEPLOYMENT.md`](../backend/aws-api/DEPLOYMENT.md)

## Comandos Útiles

```bash
# Ver logs
docker logs -f finanzapp-api

# Reiniciar
docker restart finanzapp-api

# Estado
docker ps

# Health check
curl http://localhost:8080/health
```

## Verificar Deployment

### Opción A: Verificar directamente en EC2 (SSH)

```bash
curl http://localhost:8080/health
```

### Opción B: Verificar desde IP pública

```bash
curl http://18.222.119.175:8080/health
```

### Opción C: Verificar desde CloudFront (producción)

```bash
curl https://d245522eugz5ge.cloudfront.net/health
```

Todas deben responder:

```json
{
	"status": "healthy",
	"timestamp": "...",
	"service": "finanzapp-aws-api"
}
```

## Security Group

Asegúrate que el puerto 8080 esté abierto en AWS Console → EC2 → Security Groups.

## CloudFront (CDN)

El backend está expuesto públicamente a través de CloudFront para HTTPS y mejor performance:

- **Distribution URL**: `https://d245522eugz5ge.cloudfront.net`
- **Origin**: EC2 en `http://18.222.119.175:8080`
- **Beneficios**: HTTPS gratuito, CDN global, protección DDoS

Las apps móviles usan CloudFront (`https://...`), pero el deployment se hace directamente en EC2 por SSH.
