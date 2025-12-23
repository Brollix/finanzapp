#!/bin/bash

set -e  # Exit on error

echo "🚀 Iniciando deployment de FinanzApp Website..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="finanzapp-website"
CONTAINER_NAME="finanzapp-website"
PORT=80

# Step 1: Verificar espacio en disco
echo -e "\n${YELLOW}📊 Verificando espacio en disco...${NC}"
df -h / | grep -E '(Filesystem|/dev/root)'

# Step 2: Detener y remover contenedor anterior
echo -e "\n${YELLOW}🛑 Deteniendo contenedor anterior...${NC}"
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Deteniendo contenedor $CONTAINER_NAME..."
    docker stop $CONTAINER_NAME
fi

if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Removiendo contenedor $CONTAINER_NAME..."
    docker rm $CONTAINER_NAME
fi

# Step 3: Limpiar imágenes antiguas (ANTES de construir la nueva)
echo -e "\n${YELLOW}🧹 Limpiando imágenes antiguas...${NC}"
# Remover imágenes antiguas de finanzapp-website (excepto la más reciente)
OLD_IMAGES=$(docker images $IMAGE_NAME -q | tail -n +2)
if [ -n "$OLD_IMAGES" ]; then
    echo "Removiendo imágenes antiguas de $IMAGE_NAME..."
    docker rmi $OLD_IMAGES 2>/dev/null || echo "Algunas imágenes están en uso, continuando..."
else
    echo "No hay imágenes antiguas para remover"
fi

# Limpiar imágenes dangling (sin tag)
echo "Removiendo imágenes dangling..."
docker image prune -f

# Limpiar build cache viejo (mantener últimos 7 días)
echo "Limpiando build cache..."
docker builder prune -f --filter "until=168h"

# Step 4: Construir nueva imagen
echo -e "\n${YELLOW}🔨 Construyendo nueva imagen...${NC}"
docker build -t $IMAGE_NAME:latest .

# Step 4.5: Limpieza inmediata post-build
echo -e "\n${YELLOW}🧹 Limpieza post-build...${NC}"
# Remover imágenes intermedias y dangling creadas durante el build
docker image prune -f
# Limpiar build cache adicional si es necesario
BUILD_CACHE_SIZE=$(docker system df --format "{{.BuildCache}}" | awk '{print $1}')
echo "Build cache actual: ${BUILD_CACHE_SIZE}"

# Step 5: Ejecutar nuevo contenedor
echo -e "\n${YELLOW}🚀 Iniciando nuevo contenedor...${NC}"
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $PORT:80 \
    --log-driver json-file \
    --log-opt max-size=10m \
    --log-opt max-file=3 \
    $IMAGE_NAME:latest

# Step 6: Esperar health check
echo -e "\n${YELLOW}⏳ Esperando health check...${NC}"
sleep 5

MAX_RETRIES=12  # 60 segundos total
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:$PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check exitoso!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Intento $RETRY_COUNT/$MAX_RETRIES..."
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Health check falló. Mostrando logs:${NC}"
    docker logs --tail 50 $CONTAINER_NAME
    exit 1
fi

# Step 7: Limpieza final
echo -e "\n${YELLOW}🧹 Limpieza final...${NC}"
# Remover contenedores detenidos
docker container prune -f
# Remover networks no usadas
docker network prune -f

# Step 8: Mostrar estado final
echo -e "\n${GREEN}✅ Deployment completado exitosamente!${NC}"
echo -e "\n📊 Estado del sistema:"
docker ps --filter name=$CONTAINER_NAME
echo -e "\n💾 Espacio en disco:"
df -h / | grep -E '(Filesystem|/dev/root)'
echo -e "\n📈 Uso de recursos del contenedor:"
docker stats --no-stream $CONTAINER_NAME

echo -e "\n${GREEN}🎉 Website desplegado en http://localhost:$PORT${NC}"
echo -e "Ver logs: ${YELLOW}docker logs -f $CONTAINER_NAME${NC}"


