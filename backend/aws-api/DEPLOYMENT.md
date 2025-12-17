# Guía de Deployment con Limpieza Automática

## 🎯 Mejoras Implementadas

### 1. Script `deploy.sh` con limpieza automática
- ✅ Remueve imágenes antiguas antes de construir la nueva
- ✅ Limpia build cache de Docker (mantiene últimos 7 días)
- ✅ Remueve contenedores detenidos
- ✅ Limpia networks no usadas
- ✅ Configura logs rotativos (máx 10MB x 3 archivos = 30MB)
- ✅ Health check automático
- ✅ Rollback si falla el deployment

### 2. GitHub Actions Workflow (CI/CD)
- ✅ Deploy automático en push a `main`
- ✅ Limpieza post-deployment en EC2
- ✅ Health check remoto
- ✅ Notificaciones de fallos

### 3. Dockerfile Optimizado
- ✅ Multi-stage build (reduce tamaño final)
- ✅ Limpia npm cache durante build
- ✅ Solo dependencias de producción
- ✅ Health check integrado

## 📋 Setup Inicial

### Opción A: Deployment Manual

1. **Subir el script a EC2:**

```bash
# En tu computadora
scp -i ~/.ssh/finanzapp-backend.pem backend/aws-api/deploy.sh ubuntu@ec2-18-222-119-175.us-east-2.compute.amazonaws.com:~/finanzapp/backend/aws-api/

# Conectar a EC2
ssh aws

# Dar permisos de ejecución
cd ~/finanzapp/backend/aws-api
chmod +x deploy.sh
```

2. **Ejecutar deployment:**

```bash
./deploy.sh
```

### Opción B: Deployment Automático con GitHub Actions

1. **Configurar Secrets en GitHub:**

Ve a tu repo → Settings → Secrets and variables → Actions → New repository secret

Agrega estos secrets:

- `EC2_SSH_KEY`: Contenido de `finanzapp-backend.pem` (todo el archivo)
- `EC2_HOST`: `ec2-18-222-119-175.us-east-2.compute.amazonaws.com`
- `EC2_USER`: `ubuntu`
- `EC2_API_URL`: `https://d245522eugz5ge.cloudfront.net` (tu CloudFront distribution URL)

2. **Push los cambios:**

```bash
git add .
git commit -m "feat: add automated deployment with cleanup"
git push origin main
```

3. **Verificar en GitHub:**

- Ve a Actions → Verás el workflow corriendo
- El deploy se ejecuta automáticamente en cada push a `main`

## 🔧 Uso Diario

### Deployment Manual

```bash
ssh aws
cd ~/finanzapp/backend/aws-api
git pull origin main
./deploy.sh
```

### Deployment Automático

Solo haz push a `main`:

```bash
git push origin main
```

GitHub Actions se encarga del resto automáticamente.

## 🧹 Limpieza que se Hace Automáticamente

### Durante Deployment (`deploy.sh`):

1. **ANTES del build**: Remueve imágenes antiguas y build cache (+7 días)
2. **DURANTE el build**: Docker usa multi-stage para reducir tamaño
3. **DESPUÉS del build**: Limpia imágenes intermedias y dangling
4. **Contenedores**: Remueve contenedores detenidos
5. **Networks**: Remueve networks no usadas
6. **Logs**: Configura rotación automática (30MB máx por contenedor)

### Post-Deployment (GitHub Actions) - LIMPIEZA AGRESIVA:

1. **Imágenes antiguas**: Solo mantiene las últimas 2 versiones de finanzapp-backend
2. **Imágenes dangling**: Remueve TODAS las imágenes sin tag
3. **Contenedores**: Limpia todos los contenedores detenidos
4. **Build cache**: Limpia cache de +24 horas
5. **Networks**: Remueve networks no usadas
6. **Volumes**: Limpia volumes huérfanos (sin contenedores asociados)
7. **Reporte**: Muestra `docker system df` y espacio en disco

## 📊 Monitoreo de Espacio

### Ver estado del disco:

```bash
# En EC2
df -h /
```

### Ver uso de Docker:

```bash
docker system df
```

### Ver tamaño de imágenes:

```bash
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### Ver logs de contenedor:

```bash
docker logs -f finanzapp-api
```

## 🔍 Troubleshooting

### Deployment falla por falta de espacio:

```bash
# Limpieza manual agresiva (cuidado!)
docker system prune -a -f
docker volume prune -f
```

### Ver qué contenedor usa más espacio:

```bash
docker ps -s
```

### Ver logs de un deployment:

```bash
# En EC2
docker logs finanzapp-api --tail 100
```

## 📈 Comparación Antes/Después

### Antes (sin limpieza):
- ❌ Imágenes se acumulan sin límite
- ❌ Build cache crece indefinidamente
- ❌ Logs de contenedores sin límite
- ❌ Disco se llena rápidamente
- ❌ Necesita limpieza manual cada semana

### Después (con limpieza automática):
- ✅ Solo 1-2 imágenes en disco
- ✅ Build cache limitado a 7 días
- ✅ Logs máximo 30MB por contenedor
- ✅ Limpieza automática en cada deploy
- ✅ Espacio estable a largo plazo

## 🎯 Recomendaciones

1. **Usa GitHub Actions** para deployments automáticos (más conveniente)
2. **Monitorea espacio** semanalmente: `df -h /`
3. **Revisa logs** si hay problemas: `docker logs -f finanzapp-api`
4. **Mantén backups** de `.env` (no está en git)
5. **Actualiza regularmente** para aprovechar optimizaciones de Node/Docker

## 🚨 Limpieza Manual de Emergencia

Si el disco se llena inesperadamente:

```bash
# 1. Verificar espacio
df -h /

# 2. Ver qué usa Docker
docker system df

# 3. Limpieza agresiva (detiene todo excepto finanzapp-api)
docker ps -a | grep -v finanzapp-api | awk '{print $1}' | tail -n +2 | xargs -r docker rm -f

# 4. Remover todas las imágenes excepto la actual
docker images | grep -v finanzapp-backend | grep -v REPOSITORY | awk '{print $3}' | xargs -r docker rmi -f

# 5. Limpiar todo lo demás
docker system prune -a -f
docker volume prune -f

# 6. Verificar resultado
df -h /
```

## 📚 Más Información

- [Docker System Prune](https://docs.docker.com/config/pruning/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [GitHub Actions](https://docs.github.com/en/actions)
