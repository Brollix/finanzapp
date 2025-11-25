# FinanzApp - Quick Deployment Script (PowerShell)
# Ejecutar desde PowerShell en Windows

Write-Host "🚀 FinanzApp - Deployment a EC2" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$EC2_HOST = "ubuntu@ec2-18-222-119-175.us-east-2.compute.amazonaws.com"
$PEM_KEY = "finanzapp-backend.pem"
$BACKEND_DIR = "backend\aws-api"

# Verificar que existe el archivo .pem
if (-not (Test-Path $PEM_KEY)) {
    Write-Host "❌ Error: No se encuentra el archivo $PEM_KEY" -ForegroundColor Red
    Write-Host "Asegúrate de que el archivo .pem esté en el directorio actual" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Transfiriendo archivos a EC2..." -ForegroundColor Yellow

# Usar scp (requiere OpenSSH instalado en Windows)
scp -i $PEM_KEY -r $BACKEND_DIR "${EC2_HOST}:~/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Archivos transferidos exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Conéctate a EC2:"
    Write-Host "   ssh -i `"$PEM_KEY`" $EC2_HOST" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Configura el .env:"
    Write-Host "   cd ~/aws-api" -ForegroundColor White
    Write-Host "   cp .env.example .env" -ForegroundColor White
    Write-Host "   nano .env" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Deploy:"
    Write-Host "   chmod +x deploy.sh" -ForegroundColor White
    Write-Host "   ./deploy.sh" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Verifica:"
    Write-Host "   curl http://18.222.119.175:8080/health" -ForegroundColor White
} else {
    Write-Host "❌ Error al transferir archivos" -ForegroundColor Red
    exit 1
}
