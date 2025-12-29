# In-App Notifications - Usage Guide

## Overview

Sistema de notificaciones in-app para FinanzApp que permite procesamiento en segundo plano de tickets con feedback visual al usuario.

## Componentes

### 1. NotificationBanner

Componente visual que muestra notificaciones en la parte superior de la pantalla.

**Ubicación**: Ya integrado en `app/_layout.tsx` - funciona globalmente en toda la app.

### 2. notificationService

Servicio para mostrar notificaciones desde cualquier parte de la app.

### 3. backgroundProcessingService

Servicio para procesar tickets en segundo plano.

## Uso Básico

### Mostrar Notificaciones

```typescript
import { notificationService } from "@/services/inAppNotification.service";

// Notificación de éxito
notificationService.success(
	"✅ Ticket procesado",
	"Tu ticket ha sido guardado exitosamente"
);

// Notificación de error
notificationService.error("Error", "No se pudo procesar el ticket");

// Notificación informativa
notificationService.info(
	"Información",
	"El procesamiento puede tardar unos segundos"
);

// Notificación de procesamiento (no se oculta automáticamente)
const notificationId = notificationService.processing(
	"Procesando",
	"Tu ticket se está procesando..."
);

// Remover notificación manualmente
notificationService.remove(notificationId);
```

### Notificaciones con Acciones

```typescript
import { useRouter } from "expo-router";

const router = useRouter();

notificationService.success("✅ Ticket procesado", `Total: $${receipt.total}`, {
	label: "Ver",
	onPress: () => {
		router.push({
			pathname: "/ticket",
			params: { id: receipt.id },
		});
	},
});
```

## Procesamiento en Segundo Plano

### Ejemplo Completo

```typescript
import { backgroundProcessingService } from '@/services/backgroundProcessing.service';
import { notificationService } from '@/services/inAppNotification.service';
import { useRouter } from 'expo-router';

function CameraScreen() {
  const router = useRouter();

  const handleUpload = async (imageUri: string) => {
    // Iniciar procesamiento en segundo plano
    const jobId = await backgroundProcessingService.startProcessing(
      imageUri,
      (receiptId) => {
        // Callback cuando el procesamiento termina
        router.push({
          pathname: '/ticket',
          params: { id: receiptId }
        });
      }
    );

    // El usuario puede seguir usando la app
    // La notificación se mostrará automáticamente cuando termine
    router.back(); // Volver a la pantalla anterior
  };

  return (
    <Button
      title="Subir Ticket"
      onPress={() => handleUpload(capturedImage)}
    />
  );
}
```

## Flujo de Usuario

### Antes (Pantalla de Carga)

```
Usuario toma foto
    ↓
Pantalla de carga (5-10s) ❌ Usuario bloqueado
    ↓
Muestra resultado
```

### Ahora (Procesamiento en Segundo Plano)

```
Usuario toma foto
    ↓
Notificación: "Procesando en segundo plano..." ✅
    ↓
Usuario puede seguir usando la app ✅
    ↓
Notificación: "✅ Ticket procesado" con botón "Ver" ✅
    ↓
Usuario toca "Ver" → Navega al ticket
```

## Tipos de Notificaciones

### Success (Verde)

```typescript
notificationService.success("Título", "Mensaje");
```

- Color: Verde (#10B981)
- Icono: ✅
- Auto-hide: 5 segundos

### Error (Rojo)

```typescript
notificationService.error("Título", "Mensaje");
```

- Color: Rojo (#EF4444)
- Icono: ❌
- Auto-hide: 7 segundos (más tiempo para leer)

### Info (Azul)

```typescript
notificationService.info("Título", "Mensaje");
```

- Color: Azul (#3B82F6)
- Icono: ℹ️
- Auto-hide: 5 segundos

### Processing (Naranja)

```typescript
const id = notificationService.processing("Título", "Mensaje");
// ...
notificationService.remove(id); // Remover manualmente
```

- Color: Naranja (#F59E0B)
- Icono: ⏳
- Auto-hide: NO (debe removerse manualmente)

## Personalización

### Duración Personalizada

```typescript
import { useNotificationStore } from "@/services/inAppNotification.service";

useNotificationStore.getState().addNotification({
	title: "Título",
	message: "Mensaje",
	type: "success",
	duration: 10000, // 10 segundos
	autoHide: true,
});
```

### Notificación Permanente

```typescript
useNotificationStore.getState().addNotification({
	title: "Importante",
	message: "Esta notificación no se ocultará",
	type: "info",
	autoHide: false, // No se oculta automáticamente
	action: {
		label: "Entendido",
		onPress: () => {
			// Remover manualmente
			notificationService.clearAll();
		},
	},
});
```

## Integración con Procesamiento Actual

### Opción 1: Reemplazar Pantalla de Carga

En `useReceiptScanner.ts`:

```typescript
const processReceipt = async () => {
	if (!capturedImage) return;

	// Iniciar procesamiento en segundo plano
	await backgroundProcessingService.startProcessing(
		capturedImage,
		(receiptId) => {
			// Navegar al ticket cuando termine
			router.push({
				pathname: "/receipt-confirmation",
				params: { id: receiptId },
			});
		}
	);

	// Volver a la lista inmediatamente
	router.push("/(tabs)/tickets");
};
```

### Opción 2: Mantener Pantalla de Carga como Opción

Agregar un toggle en configuración:

```typescript
const settings = {
	backgroundProcessing: true, // Usuario puede elegir
};

if (settings.backgroundProcessing) {
	// Usar procesamiento en segundo plano
	await backgroundProcessingService.startProcessing(imageUri, onComplete);
	router.back();
} else {
	// Usar pantalla de carga tradicional
	setLoading(true);
	const result = await receiptApi.processReceipt(imageUri);
	setLoading(false);
}
```

## Ventajas

✅ **Mejor UX**: Usuario no está bloqueado esperando
✅ **Más simple**: No requiere permisos de notificaciones push
✅ **Más confiable**: Siempre funciona, no depende de servicios externos
✅ **Feedback visual**: Usuario sabe que el procesamiento está en curso
✅ **Navegación directa**: Botón "Ver" lleva directamente al ticket

## Próximos Pasos

1. ✅ Servicios creados
2. ✅ NotificationBanner integrado en layout
3. ⏳ Actualizar `useReceiptScanner` para usar procesamiento en segundo plano
4. ⏳ Probar flujo completo
5. ⏳ Agregar analytics para medir mejora en UX

## Ejemplo de Implementación Completa

Ver archivo: `frontend/src/examples/background-processing-example.tsx` (próximamente)
