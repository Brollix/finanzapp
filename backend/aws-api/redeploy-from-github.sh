#!/bin/bash

# Script de redespliegue automático desde GitHub
# Usar en EC2 después de hacer push a GitHub

set -e

echo "🔄 FinanzApp - Redespliegue desde GitHub"
echo "========================================"
echo ""

# Variables
CONTAINER_NAME="finanzapp-api"
IMAGE_NAME="finanzapp-backend:latest"
PROJECT_DIR="$HOME/finanzapp"
BACKEND_DIR="$PROJECT_DIR/backend/aws-api"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que el directorio existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Error: Directorio $PROJECT_DIR no existe${NC}"
    echo "Primero debes clonar el repositorio:"
    echo "  cd ~"
    echo "  git clone https://github.com/TU_USUARIO/finanzapp.git"
    exit 1
fi

# Ir al directorio del proyecto
cd "$PROJECT_DIR"

# Pull cambios desde GitHub
echo -e "${BLUE}📥 Pulling código desde GitHub...${NC}"
git fetch origin
BEFORE_COMMIT=$(git rev-parse HEAD)
git pull origin main

AFTER_COMMIT=$(git rev-parse HEAD)

if [ "$BEFORE_COMMIT" = "$AFTER_COMMIT" ]; then
    echo -e "${YELLOW}ℹ️  No hay cambios nuevos desde GitHub${NC}"
    echo -e "${YELLOW}   ¿Quieres redesplegar de todas formas? (y/n)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Operación cancelada"
        exit 0
    fi
else
    echo -e "${GREEN}✓ Código actualizado${NC}"
    echo "Cambios:"
    git log --oneline $BEFORE_COMMIT..$AFTER_COMMIT
    echo ""
fi

# Ir al directorio del backend
cd "$BACKEND_DIR"

# Verificar que existe el .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: No existe el archivo .env${NC}"
    echo "Crea el archivo .env con las variables necesarias:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Build imagen Docker
echo -e "${BLUE}🔨 Building imagen Docker...${NC}"
docker build -t "$IMAGE_NAME" .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al construir la imagen Docker${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Imagen construida${NC}"

# Detener contenedor anterior
echo -e "${BLUE}🛑 Deteniendo contenedor anterior...${NC}"
if docker stop "$CONTAINER_NAME" 2>/dev/null; then
    echo -e "${GREEN}✓ Contenedor detenido${NC}"
    docker rm "$CONTAINER_NAME" 2>/dev/null
else
    echo -e "${YELLOW}ℹ️  No había contenedor corriendo${NC}"
fi

# Ejecutar nuevo contenedor
echo -e "${BLUE}🚀 Iniciando nuevo contenedor...${NC}"
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p 8080:8080 \
  --env-file .env \
  "$IMAGE_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al iniciar el contenedor${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Contenedor iniciado${NC}"
echo ""

# Esperar un momento para que el contenedor inicie
echo -e "${BLUE}⏳ Esperando que el servicio esté listo...${NC}"
sleep 3

# Verificar que el contenedor está corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ El contenedor no está corriendo${NC}"
    echo "Logs del contenedor:"
    docker logs "$CONTAINER_NAME"
    exit 1
fi

# Health check
echo -e "${BLUE}🏥 Verificando salud del servicio...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Servicio respondiendo correctamente${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ El servicio no responde después de 10 intentos${NC}"
        echo "Logs del contenedor:"
        docker logs --tail 30 "$CONTAINER_NAME"
        exit 1
    fi
    echo "Intento $i/10..."
    sleep 2
done

# Resumen final
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Deployment completado!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}📊 Estado del contenedor:${NC}"
docker ps | grep "$CONTAINER_NAME" | awk '{print "   ID: "$1"\n   Image: "$2"\n   Status: "$7" "$8" "$9}'
echo ""
echo -e "${BLUE}📝 Últimas líneas de log:${NC}"
docker logs --tail 10 "$CONTAINER_NAME" 2>&1 | sed 's/^/   /'
echo ""
echo -e "${BLUE}🔗 URLs:${NC}"
echo "   Health: http://localhost:8080/health"
echo "   API Base: http://localhost:8080/api"
echo ""
echo -e "${BLUE}💡 Comandos útiles:${NC}"
echo "   Ver logs:     docker logs -f $CONTAINER_NAME"
echo "   Reiniciar:    docker restart $CONTAINER_NAME"
echo "   Detener:      docker stop $CONTAINER_NAME"
echo ""
