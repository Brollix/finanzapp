#!/bin/bash

# Script para forzar el despliegue del website y ver errores en tiempo real
# Ejecutar: ./force-deploy-website.sh

set -e

echo "🚀 Forzando despliegue del website en EC2..."

# Verificar que las variables de entorno estén configuradas
if [ -z "$EC2_HOST" ] || [ -z "$EC2_USER" ]; then
    echo "❌ Error: Debes configurar las variables EC2_HOST y EC2_USER"
    echo "Ejemplo:"
    echo "  export EC2_HOST=tu-servidor.com"
    echo "  export EC2_USER=ubuntu"
    exit 1
fi

echo "📡 Conectando a $EC2_USER@$EC2_HOST..."

ssh -t $EC2_USER@$EC2_HOST << 'ENDSSH'
    set -e
    
    echo "📥 Actualizando código..."
    cd ~/finanzapp
    git fetch origin main
    git reset --hard origin/main
    
    echo ""
    echo "🌐 Desplegando website (con output completo)..."
    cd website
    
    # Hacer el script ejecutable
    chmod +x deploy.sh
    
    # Ejecutar el deployment y mostrar TODO el output
    ./deploy.sh
    
    echo ""
    echo "=== ✅ Verificación final ==="
    echo "Contenedores corriendo:"
    docker ps | grep finanzapp
    
    echo ""
    echo "Test local del website:"
    curl -I http://localhost:3000 || echo "❌ Website no responde en puerto 3000"
    
ENDSSH

echo ""
echo "✅ Despliegue completado"
echo "🌐 Verifica en: http://finanzapp.info"
