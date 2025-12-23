# Análisis de Inconsistencias del Proyecto

**Fecha:** 2025
**Alcance:** Frontend y Backend

## Resumen Ejecutivo

Se identificaron **8 categorías principales** de inconsistencias que afectan la mantenibilidad, consistencia visual y calidad del código.

---

## 1. Estilos y Theme

### 🔴 CRÍTICO: Colores Hardcodeados

**Problema:** Se encontraron colores hardcodeados que deberían usar el theme.

**Archivos afectados:**

- `frontend/src/components/navigation/CustomTabBar.tsx` (líneas 154, 192)
  - `shadowColor: "#000"` → Debería usar `theme.colors.shadow`

**Impacto:**

- Inconsistencia visual si se cambia el theme
- Dificulta el soporte de temas (dark/light mode)

**Recomendación:**

```typescript
// ❌ Actual
shadowColor: "#000";

// ✅ Correcto
shadowColor: theme.colors.shadow;
```

### 🟡 MEDIO: Valores Mágicos en Espaciado

**Problema:** Algunos componentes usan valores numéricos directos en lugar de `theme.spacing`.

**Ejemplos encontrados:**

- `CustomTabBar.tsx` línea 169: `marginTop: 4` → Debería ser `theme.spacing.xs`
- `CustomTabBar.tsx` línea 74: `bottom: 30` → Debería usar `theme.spacing`

**Impacto:** Menor, pero afecta la consistencia del diseño.

---

## 2. Imports y Path Aliases

### 🟡 MEDIO: Mezcla de Paths Relativos y Aliases

**Problema:** Inconsistencia entre imports relativos (`../../`) y aliases (`@/`).

**Estadísticas:**

- **81 archivos** usan imports relativos (`../`)
- **33 archivos** usan alias `@/`

**Archivos con imports relativos:**

- `frontend/app/(tabs)/tickets.tsx`
- `frontend/app/(tabs)/profile.tsx`
- `frontend/src/components/account/ProfileHeader.tsx`
- `frontend/src/components/forms/ManualItemForm.tsx`
- Y muchos más...

**Recomendación:**

- Estandarizar el uso de `@/` para imports desde `src/`
- Crear un script de migración para convertir imports relativos a aliases

**Ejemplo:**

```typescript
// ❌ Inconsistente
import { theme } from "../../styles/theme";
import { useAlert } from "../../context/AlertContext";

// ✅ Consistente
import { theme } from "@/styles/theme";
import { useAlert } from "@/context/AlertContext";
```

---

## 3. Estilos: StyleSheet.create vs Core Styles

### 🟡 MEDIO: Duplicación de Estilos

**Problema:** Muchos componentes crean `StyleSheet.create` locales cuando podrían usar estilos de `core.styles.ts` o `index.styles.ts`.

**Estadísticas:**

- **32 archivos** usan `StyleSheet.create` localmente
- Muchos de estos estilos son duplicados o muy similares a los existentes en `core.styles.ts`

**Comentarios en código:**
En `frontend/src/styles/index.styles.ts` (líneas 177-181) hay comentarios que indican duplicación:

```typescript
// El estilo 'input' es muy similar a 'uiInputBox' + 'uiInput', se puede refactorizar en el componente.
// El estilo 'button' es muy similar a 'uiButton' + 'uiButtonPrimary', se puede refactorizar en el componente.
// El estilo 'buttonText' es muy similar a 'uiButtonText' + 'uiButtonPrimaryText', se puede refactorizar en el componente.
// El estilo 'buttonDisabled' es muy similar a 'uiButtonDisabled', se puede refactorizar en el componente.
// El estilo 'subtitle' se puede construir con 'text' y 'h2' de core.
```

**Recomendación:**

- Auditar cada `StyleSheet.create` local
- Migrar estilos comunes a `core.styles.ts`
- Usar composición de estilos existentes cuando sea posible

---

## 4. Logging

### ✅ CORRECTO: Backend

**Estado:** El backend sigue correctamente las reglas:

- Usa `logger` de `backend/aws-api/src/utils/logger.ts`
- Los scripts en `src/scripts/` pueden usar `console.*` (son herramientas de desarrollo)

**Archivos con `console.*` (permitidos):**

- `backend/aws-api/src/scripts/*.ts` - ✅ Correcto (scripts de desarrollo)

### 🟢 SIN PROBLEMAS: Frontend

**Estado:** El frontend no tiene reglas estrictas sobre logging, pero no se encontraron usos problemáticos de `console.*` en código de producción.

---

## 5. Manejo de Errores

### 🟡 MEDIO: Frontend - Manejo Inconsistente

**Problema:** El frontend maneja errores de forma inconsistente comparado con el backend.

**Backend (✅ Correcto):**

- Usa clases de error personalizadas (`ValidationError`, `AuthenticationError`, etc.)
- Tiene un error handler global
- Formato de respuesta consistente

**Frontend (⚠️ Inconsistente):**

- `useReceiptScanner.ts` tiene lógica compleja de parsing de mensajes de error (líneas 199-260)
- Diferentes pantallas manejan errores de forma diferente
- No hay un sistema centralizado de manejo de errores

**Ejemplo problemático:**

```typescript
// frontend/src/hooks/useReceiptScanner.ts
// Lógica compleja de parsing de errores (50+ líneas)
if (error.message.includes("Textract") || error.message.includes("textract")) {
	errorMessage = "...";
} else if (
	error.message.includes("Bedrock") ||
	error.message.includes("bedrock")
) {
	errorMessage = "...";
}
```

**Recomendación:**

- Crear un servicio de manejo de errores en el frontend
- Mapear códigos de error del backend a mensajes amigables
- Centralizar la lógica de parsing de errores

---

## 6. Estructura de Componentes

### 🟡 MEDIO: Exports Incompletos

**Problema:** Algunos componentes no están exportados en los archivos `index.ts`.

**Archivos de exportación:**

- `frontend/src/components/index.ts` - ✅ Exporta `ui` y `modals`
- `frontend/src/components/modals/index.ts` - ⚠️ Solo exporta 4 modales de 10

**Modales no exportados:**

- `ChangePasswordModal`
- `LoadingModal`
- `TicketActionModal`
- `TopProductsModal`
- `FabModal`

**Impacto:**

- Imports inconsistentes (algunos usan path directo, otros usan index)
- Dificulta el refactoring

**Recomendación:**

- Exportar todos los componentes desde sus `index.ts` respectivos
- Estandarizar imports para usar siempre los `index.ts`

---

## 7. Naming Conventions

### 🟢 BUENO: Consistencia General

**Estado:** El proyecto mantiene buenas convenciones de nombres:

- Componentes: PascalCase ✅
- Funciones: camelCase ✅
- Archivos: kebab-case o PascalCase ✅
- Constantes: UPPER_SNAKE_CASE ✅

**Sin problemas detectados.**

---

## 8. Testing

### 🟡 MEDIO: Cobertura Frontend

**Problema:** Según `.cursorrules`, se menciona que "Tests should be added for critical components (AuthContext, ReceiptContext, Dashboard)" pero no se encontraron tests del frontend.

**Backend:**

- ✅ Tiene estructura de tests clara
- ✅ Usa Jest con ts-jest
- ✅ Tests en `backend/aws-api/tests/`

**Frontend:**

- ⚠️ No se encontraron tests
- ⚠️ No hay configuración de testing visible

**Recomendación:**

- Configurar React Native Testing Library
- Agregar tests para componentes críticos mencionados en las reglas

---

## Priorización de Correcciones

### 🔴 Alta Prioridad

1. **Colores hardcodeados** - Fácil de corregir, alto impacto visual
2. **Estandarizar imports** - Mejora mantenibilidad a largo plazo

### 🟡 Media Prioridad

3. **Consolidar estilos** - Reduce duplicación, mejora mantenibilidad
4. **Manejo de errores frontend** - Mejora UX y mantenibilidad
5. **Completar exports** - Facilita refactoring futuro

### 🟢 Baja Prioridad

6. **Testing frontend** - Importante pero requiere más tiempo
7. **Valores mágicos** - Menor impacto, puede corregirse gradualmente

---

## Métricas de Calidad

| Categoría              | Estado | Archivos Afectados |
| ---------------------- | ------ | ------------------ |
| Colores hardcodeados   | 🔴     | 1 archivo          |
| Imports inconsistentes | 🟡     | 81 archivos        |
| Estilos duplicados     | 🟡     | 32 archivos        |
| Logging                | ✅     | 0 problemas        |
| Manejo de errores      | 🟡     | Frontend           |
| Exports incompletos    | 🟡     | 1 archivo          |
| Naming                 | ✅     | Sin problemas      |
| Testing                | 🟡     | Frontend sin tests |

---

## Recomendaciones Generales

1. **Crear un linter rule** para detectar colores hardcodeados
2. **Script de migración** para convertir imports relativos a aliases
3. **Documentar** el sistema de estilos y cuándo crear nuevos vs reutilizar
4. **Crear un error handler** centralizado para el frontend
5. **Configurar testing** para el frontend siguiendo las mejores prácticas

---

## Conclusión

El proyecto tiene una **base sólida** con buenas prácticas en el backend y una estructura de estilos bien definida. Las inconsistencias encontradas son principalmente de **mantenibilidad y consistencia**, no problemas críticos de funcionalidad.

**Puntuación general:** 7.5/10

- ✅ Backend bien estructurado
- ✅ Sistema de estilos bien diseñado
- ⚠️ Inconsistencias menores en frontend
- ⚠️ Falta de tests en frontend
