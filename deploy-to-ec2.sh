#!/bin/bash

# Script de deployment rápido para FinanzApp Backend
# Ejecutar desde Git Bash en Windows

set -e

echo "🚀 FinanzApp - Deployment a EC2"
echo "================================"
echo ""

# Variables
EC2_HOST="ubuntu@ec2-18-222-119-175.us-east-2.compute.amazonaws.com"
PEM_KEY="finanzapp-backend.pem"
BACKEND_DIR="backend/aws-api"

# Verificar que existe el archivo .pem
if [ ! -f "$PEM_KEY" ]; then
    echo "❌ Error: No se encuentra el archivo $PEM_KEY"
    echo "Asegúrate de que el archivo .pem esté en el directorio actual"
    exit 1
fi

echo "📦 Transfiriendo archivos a EC2..."
scp -i "$PEM_KEY" -r "$BACKEND_DIR" "$EC2_HOST:~/"

if [ $? -eq 0 ]; then
    echo "✅ Archivos transferidos exitosamente"
    echo ""
    echo "📝 Próximos pasos:"
    echo "1. Conéctate a EC2:"
    echo "   ssh -i \"$PEM_KEY\" $EC2_HOST"
    echo ""
    echo "2. Configura el .env:"
    echo "   cd ~/aws-api"
    echo "   cp .env.example .env"
    echo "   nano .env"
    echo ""
    echo "3. Deploy:"
    echo "   chmod +x deploy.sh"
    echo "   ./deploy.sh"
    echo ""
    echo "4. Verifica:"
    echo "   curl http://18.222.119.175:8080/health"
else
    echo "❌ Error al transferir archivos"
    exit 1
fi
