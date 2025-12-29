#!/bin/bash

# Script para desplegar manualmente el website en EC2
# Ejecutar: ./deploy-website-now.sh

set -e

echo "🚀 Desplegando website en EC2..."

# Verificar que las variables de entorno estén configuradas
if [ -z "$EC2_HOST" ] || [ -z "$EC2_USER" ]; then
    echo "❌ Error: Debes configurar las variables EC2_HOST y EC2_USER"
    echo "Ejemplo:"
    echo "  export EC2_HOST=tu-servidor.com"
    echo "  export EC2_USER=ubuntu"
    exit 1
fi

echo "📡 Conectando a $EC2_USER@$EC2_HOST..."

ssh $EC2_USER@$EC2_HOST << 'ENDSSH'
    set -e
    
    echo "📥 Actualizando código..."
    cd ~/finanzapp
    git pull origin main
    
    echo "🌐 Desplegando website..."
    cd website
    chmod +x deploy.sh
    ./deploy.sh
    
    echo "✅ Website desplegado exitosamente!"
    
    echo ""
    echo "📊 Estado de los contenedores:"
    docker ps | grep finanzapp
    
ENDSSH

echo ""
echo "✅ ¡Despliegue completado!"
echo "🌐 Visita http://finanzapp.info para verificar"
