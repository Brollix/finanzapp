# Troubleshooting: Problemas con el Procesamiento de Recibos

## Problema Reportado (Actualizado)

**Síntoma**: Al tomar una foto y presionar "Usar foto", el ticket se procesa casi sin feedback visual, pero **NO navega a la pantalla de confirmación** donde debería mostrar la información reconocida. La pantalla vuelve a la vista de captura con la foto seleccionada.

## Causas Probables

### Problema Principal: Fallo en la Navegación

El ticket se está procesando correctamente en el backend, pero la navegación a la pantalla `/receipt-confirmation` no se está ejecutando. Posibles causas:

1. **Router.push falla silenciosamente**: El método de navegación puede estar fallando sin lanzar error
2. **Datos del receipt inválidos**: El objeto `receipt` no tiene la estructura esperada para JSON.stringify
3. **receiptData es null/undefined**: Después del polling, el `receiptData` o `receiptId` no están disponibles
4. **Polling nunca completa**: El estado del job nunca llega a "completed"
5. **Error de sincronización**: El interval de polling puede estar causando problemas de estado

## Logs de Debugging Implementados

Se han agregado logs detallados en los siguientes archivos:

### 1. `frontend/src/hooks/useReceiptScanner.ts`

- Log del URI de la imagen antes de enviar
- Log de la respuesta completa del servidor
- Log del jobId recibido
- Log detallado de cualquier error (tipo, mensaje, stack trace)

### 2. `frontend/src/services/receiptApi.ts`

- Log del URI de la imagen
- Log del objeto de imagen adjunto al FormData
- Log de la respuesta recibida
- Log de errores en la llamada

### 3. `frontend/src/services/api.ts`

- Log de la URL completa del request
- Log del método HTTP
- Log del tipo de body (FormData, JSON, etc.)
- Log de la disponibilidad del token de autenticación
- Log de todos los headers enviados
- Log del status code de la respuesta
- Log del texto de respuesta (primeros 500 caracteres)
- Log de la respuesta JSON parseada
- Log detallado de errores HTTP

### 4. `frontend/src/services/api.ts` (getBaseUrl)

- Log de la URL base configurada
- Log de las variables de entorno

## Cómo Usar los Logs para Diagnosticar

1. **Abrir la consola de Expo**:
   ```bash
   cd frontend
   npm start
   ```

2. **Tomar una foto y presionar "Usar foto"**

3. **Buscar en la consola los siguientes prefijos**:
   - `[ReceiptScanner]` - Logs del hook de escaneo
   - `[ReceiptAPI]` - Logs del servicio de API de recibos
   - `[APIClient]` - Logs del cliente HTTP base

4. **Revisar el flujo esperado**:
   ```
   [ReceiptScanner] Starting receipt processing...
   [ReceiptScanner] Image URI: file:///path/to/image.jpg
   [ReceiptAPI] Processing receipt with URI: file:///path/to/image.jpg
   [ReceiptAPI] Image data to append: {...}
   [ReceiptAPI] FormData created, sending request...
   [APIClient] Base URL: http://192.168.x.x:8080
   [APIClient] Request to: http://192.168.x.x:8080/api/receipt/process
   [APIClient] Method: POST
   [APIClient] Body type: FormData
   [APIClient] Auth token added (length): 1234
   [APIClient] Sending fetch request...
   [APIClient] Response status: 200
   [APIClient] Response ok: true
   [ReceiptScanner] Response received: {...}
   [ReceiptScanner] JobId: abc123
   [ReceiptScanner] Progress update: { status: "extracting_text", progress: 20, ... }
   [ReceiptScanner] Progress update: { status: "processing_ai", progress: 40, ... }
   [ReceiptScanner] Progress update: { status: "saving", progress: 70, ... }
   [ReceiptScanner] Progress update: { status: "completed", progress: 100, receiptId: "xyz" }
   [ReceiptScanner] Processing finished with status: completed
   [ReceiptScanner] Receipt completed successfully
   [ReceiptScanner] receiptId from progress: xyz
   [ReceiptScanner] Fetching full receipt data...
   [ReceiptScanner] Got receipts count: 1
   [ReceiptScanner] Found receipt: true
   [ReceiptScanner] Navigating to receipt-confirmation with receipt ID: xyz
   [ReceiptScanner] Navigation completed successfully
   [ReceiptScanner] Clearing captured image
   ```

5. **Buscar puntos de fallo en navegación**:
   - Si ves `[ReceiptScanner] Navigating to receipt-confirmation` pero NO ves `Navigation completed successfully`, el router.push está fallando
   - Si ves `No receiptData available` o `No receiptId`, el backend no está devolviendo la data correctamente
   - Si el polling nunca muestra `status: completed`, hay un problema con el job tracking en el backend

## Posibles Problemas y Soluciones

### Problema 1: "No auth token available!"

**Solución**: El usuario no está autenticado correctamente.

```typescript
// Verificar en AuthContext que la sesión está activa
const { user, session } = useAuth();
console.log("User:", user);
console.log("Session:", session);
```

### Problema 2: El polling nunca llega a "completed"

**Síntomas**: Ves múltiples `[ReceiptScanner] Progress update` pero nunca ves `status: completed`.

**Solución**: Verificar los logs del backend para ver si el job se está completando correctamente.

```bash
# Si está en desarrollo local
cd backend/aws-api
npm run dev

# Si está en EC2
ssh ec2-user@your-instance
sudo docker logs -f finanzapp-backend
```

Buscar en los logs del backend:
- `Job completed: [jobId]`
- Errores de Textract, Bedrock o Supabase
- Timeouts o rate limits

### Problema 3: "No receiptData available" o "No receiptId"

**Síntomas**: 
- `[ReceiptScanner] No receiptData available for fallback!`
- `[ReceiptScanner] receiptId from progress: undefined`

**Causa**: El backend no está devolviendo la estructura correcta.

**Solución**: Verificar que el endpoint `/api/receipt/process` devuelva:

```json
{
  "success": true,
  "data": {
    "id": "receipt-id",
    "supermarket": "...",
    "items": [...],
    "total": 1000
  },
  "jobId": "job-id"
}
```

Y que el endpoint `/api/receipt/process/:jobId/status` devuelva:

```json
{
  "success": true,
  "data": {
    "status": "completed",
    "progress": 100,
    "message": "...",
    "receiptId": "receipt-id"
  }
}
```

### Problema 4: Navigation no completa

**Síntomas**: 
- Ves `[ReceiptScanner] Navigating to receipt-confirmation` 
- Pero NO ves `[ReceiptScanner] Navigation completed successfully`
- O ves `[ReceiptScanner] Navigation error`

**Causa Posible 1**: El objeto receipt tiene referencias circulares y JSON.stringify falla.

**Solución**: Verificar la estructura del objeto antes de stringify:
```typescript
console.log("Receipt keys:", Object.keys(receipt));
console.log("Receipt items count:", receipt.items?.length);
```

**Causa Posible 2**: La ruta `/receipt-confirmation` no existe o tiene un error.

**Solución**: Verificar que el archivo `frontend/app/receipt-confirmation.tsx` existe y no tiene errores de sintaxis.

**Causa Posible 3**: El router de expo-router tiene un problema de timing.

**Solución**: Intentar usar `router.replace` en lugar de `router.push`:
```typescript
router.replace({
  pathname: "/receipt-confirmation",
  params: { receipt: JSON.stringify(receipt) },
});
```

### Problema 5: "Request to: http://10.0.2.2:8080/..." o "localhost"

**Solución**: La URL del backend está apuntando a localhost en lugar de la IP de la red local.

1. Verificar el archivo `.env`:
   ```env
   EXPO_PUBLIC_BACKEND_URL=http://192.168.x.x:8080
   ```

2. O verificar `app.config.ts`:
   ```typescript
   extra: {
     backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.x.x:8080'
   }
   ```

3. **IMPORTANTE**: Reiniciar el servidor de Expo después de cambiar variables de entorno

### Problema 6: "Response status: 401" o "Response status: 403"

**Solución**: Problema de autenticación en el backend.

1. Verificar que el token se está enviando correctamente
2. Verificar que el backend está validando el token correctamente
3. Verificar los logs del backend para más detalles

### Problema 7: "Response status: 413" (Payload Too Large)

**Solución**: La imagen es demasiado grande.

1. Verificar la calidad de la imagen en `capture.tsx`:
   ```typescript
   const photo = await cameraRef.current.takePictureAsync({
     quality: 0.5, // Reducir a 0.3 si sigue siendo muy grande
     base64: false,
     exif: false,
   });
   ```

### Problema 8: "Response status: 500" (Server Error)

**Solución**: Error en el backend.

1. Revisar los logs del backend:
   ```bash
   # Si está en desarrollo local
   cd backend/aws-api
   npm run dev
   
   # Si está en EC2
   ssh ec2-user@your-instance
   sudo docker logs finanzapp-backend
   ```

2. Buscar errores relacionados con:
   - AWS Textract
   - AWS Bedrock
   - Supabase
   - Validación de datos

### Problema 9: "Network request failed" o timeout

**Solución**: Problema de conectividad.

1. Verificar que el dispositivo móvil está en la misma red que la PC
2. Verificar que el firewall no está bloqueando el puerto 8080
3. Probar la URL directamente en el navegador del teléfono: `http://192.168.x.x:8080/health`

## Limpieza de Logs

Una vez identificado y resuelto el problema, se deben **REMOVER** todos los `console.log` agregados, siguiendo las reglas del proyecto:

> **NUNCA** usar `console.log`, `console.error`, `console.warn` en código de producción en el backend.
> Para el frontend, minimizar el uso de console.* y usarlos solo para debugging temporal.

Los logs agregados son **TEMPORALES** solo para troubleshooting.

## Próximos Pasos

1. Ejecutar la app y reproducir el problema
2. Copiar todos los logs de la consola
3. Identificar en qué punto falla el flujo
4. Aplicar la solución correspondiente
5. **IMPORTANTE**: Remover los logs de debugging una vez resuelto el problema

## Información Adicional

- **Documentación de API**: `docs/API.md`
- **Error Handling Strategy**: `docs/ADRs/002-error-handling-strategy.md`
- **Frontend Error Service**: `frontend/src/services/errorService.ts`

