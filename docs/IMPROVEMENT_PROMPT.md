# Prompt para Sugerencias de Mejoras - FinanzApp

Soy el desarrollador de **FinanzApp**, una aplicación móvil que automatiza el registro de gastos mediante escaneo inteligente de tickets usando OCR e IA. Necesito sugerencias de mejoras para el proyecto.

## 📋 Descripción del Proyecto

FinanzApp permite a los usuarios:

- Escanear tickets/recibos con la cámara del móvil
- Extraer automáticamente productos, precios y totales usando AWS Textract (OCR)
- Procesar y estructurar datos con Claude 3 (AWS Bedrock)
- Visualizar gastos, estadísticas y análisis en un dashboard
- Sincronizar datos en tiempo real con PostgreSQL (Supabase)

## 🛠️ Stack Tecnológico Actual

### Frontend (App Móvil)

- React Native + Expo (TypeScript)
- Expo Router para navegación
- Supabase Auth para autenticación

### Backend (API)

- Node.js + Express + TypeScript
- AWS Textract (OCR)
- AWS Bedrock (Claude 3 Haiku para IA)
- Supabase (PostgreSQL)
- Docker containerizado

### Website (Landing Page)

- Vite + React + TypeScript
- Tailwind CSS
- Docker containerizado

### Infraestructura

- AWS EC2 (hosting)
- CloudFront (CDN + SSL)
- Nginx (reverse proxy)
- GitHub Actions (CI/CD)
- Docker (containerización)

## 🏗️ Arquitectura Actual

```
Usuario → CloudFront (HTTPS) → EC2:80 (nginx) → {
    / → Website (puerto 3000)
    /api/ → Backend API (puerto 8080)
}

Backend → AWS Textract → AWS Bedrock → Supabase
```

## 📊 Estado Actual del Proyecto

### ✅ Funcionando

- App móvil con escaneo de tickets
- OCR con AWS Textract
- Procesamiento IA con Bedrock
- API REST completa
- Website landing page
- HTTPS en producción
- CI/CD automático
- Autenticación con Supabase
- Dashboard con estadísticas

### 📈 Métricas

- Backend test coverage: ~70%
- Deployment: Automático con GitHub Actions
- Uptime: Contenedores healthy

## 🎯 Áreas de Interés para Mejoras

Por favor, sugiere mejoras en las siguientes áreas (o cualquier otra que consideres importante):

### 1. **Performance y Escalabilidad**

- ¿Cómo optimizar el procesamiento de imágenes?
- ¿Debería implementar caché? ¿Dónde?
- ¿Cómo manejar mejor picos de tráfico?

### 2. **Arquitectura**

- ¿La arquitectura actual es óptima?
- ¿Debería separar servicios (microservicios)?
- ¿Qué patrones de diseño podría implementar?

### 3. **Seguridad**

- ¿Qué mejoras de seguridad son críticas?
- ¿Cómo proteger mejor las credenciales AWS?
- ¿Debería implementar rate limiting más robusto?

### 4. **Testing**

- ¿Qué tipos de tests faltan?
- ¿Cómo mejorar el coverage actual?
- ¿Debería implementar E2E testing?

### 5. **Monitoreo y Observabilidad**

- ¿Qué herramientas de monitoreo recomiendas?
- ¿Cómo implementar mejor logging?
- ¿Debería usar APM (Application Performance Monitoring)?

### 6. **Costos**

- ¿Cómo optimizar costos de AWS?
- ¿Hay alternativas más económicas a Bedrock/Textract?
- ¿Debería considerar otras plataformas cloud?

### 7. **Developer Experience**

- ¿Qué herramientas facilitarían el desarrollo?
- ¿Debería mejorar la documentación?
- ¿Cómo simplificar el setup local?

### 8. **Features**

- ¿Qué funcionalidades agregarías?
- ¿Cómo mejorar la UX del escaneo?
- ¿Debería implementar notificaciones push?

## 📝 Restricciones

- Presupuesto limitado (proyecto personal)
- Preferencia por servicios managed/serverless
- Mantener stack TypeScript
- Priorizar simplicidad sobre complejidad

## 🎯 Objetivo

Busco sugerencias **prácticas y priorizadas** que:

1. Mejoren la calidad del código
2. Aumenten la confiabilidad del sistema
3. Optimicen costos
4. Mejoren la experiencia del usuario
5. Faciliten el mantenimiento futuro

Por favor, prioriza las sugerencias por **impacto vs esfuerzo** y explica el razonamiento detrás de cada una.

---

**Información adicional disponible:**

- Repositorio: https://github.com/Brollix/finanzapp
- Website: https://finanzapp.info
- API: https://finanzapp.info/api/health
