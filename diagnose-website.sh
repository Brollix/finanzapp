#!/bin/bash

# Script de diagnóstico para verificar el estado del website en EC2
# Ejecutar: ./diagnose-website.sh

set -e

echo "🔍 Diagnóstico del Website en EC2..."

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
    echo "=== 🐳 Estado de los contenedores Docker ==="
    docker ps -a | grep finanzapp || echo "No se encontraron contenedores de finanzapp"
    
    echo ""
    echo "=== 📊 Verificando puerto 3000 ==="
    sudo netstat -tlnp | grep :3000 || echo "Puerto 3000 no está en uso"
    
    echo ""
    echo "=== 📝 Logs del contenedor website (últimas 30 líneas) ==="
    if docker ps -a | grep -q finanzapp-website; then
        docker logs --tail 30 finanzapp-website
    else
        echo "❌ Contenedor finanzapp-website no existe"
    fi
    
    echo ""
    echo "=== 🖼️ Imágenes Docker de finanzapp ==="
    docker images | grep finanzapp || echo "No se encontraron imágenes de finanzapp"
    
    echo ""
    echo "=== 📂 Archivos del proyecto website ==="
    ls -la ~/finanzapp/website/ | head -20
    
    echo ""
    echo "=== 🔧 Verificando nginx ==="
    sudo systemctl status nginx | head -10
    
    echo ""
    echo "=== 🌐 Test local del puerto 3000 ==="
    curl -I http://localhost:3000 2>&1 | head -10 || echo "❌ No se puede conectar al puerto 3000"
    
    echo ""
    echo "=== 💾 Espacio en disco ==="
    df -h / | grep -E '(Filesystem|/dev/root)'
    
ENDSSH

echo ""
echo "✅ Diagnóstico completado"
