---
description: Guía y workflow para aplicar estilos usando el sistema de diseño (theme.ts)
---

# Workflow: Estilos y Diseño (Theme)

Este proyecto utiliza un sistema de diseño centralizado en `src/styles/theme.ts`. **Es obligatorio usar este tema para mantener la consistencia visual.**

## 1. Reglas de Oro

- ❌ **PROHIBIDO** usar colores hardcodeados (ej: `#fff`, `rgb(0,0,0)`, `red`).
- ✅ **SIEMPRE** importar `theme` y usar sus propiedades (ej: `theme.colors.primary`).
- ✅ Usar `theme.spacing` para márgenes y paddings.
- ✅ Usar `theme.font` para tipografías.

## 2. Cómo usar el Theme

### Importación

```typescript
import { theme } from "@/src/styles/theme";
// O ruta relativa si el alias no funciona en el contexto
// import { theme } from "../../styles/theme";
```

### Colores (`theme.colors`)

| Propiedad       | Uso                                          |
| :-------------- | :------------------------------------------- |
| `primary`       | Color principal de la marca (Verde neón)     |
| `secondary`     | Color secundario (Violeta)                   |
| `background`    | Fondo principal de pantallas (Casi negro)    |
| `surface`       | Fondo de tarjetas o elementos sobre el fondo |
| `text`          | Texto principal (Blanco)                     |
| `textSecondary` | Texto secundario (Gris claro)                |
| `error`         | Mensajes de error (Rojo)                     |
| `success`       | Mensajes de éxito (Verde)                    |

**Ejemplo Correcto:**

```tsx
<View style={{ backgroundColor: theme.colors.background }}>
	<Text style={{ color: theme.colors.text }}>Hola</Text>
</View>
```

**Ejemplo Incorrecto:**

```tsx
<View style={{ backgroundColor: "#131313" }}>
	<Text style={{ color: "white" }}>Hola</Text>
</View>
```

### Espaciado (`theme.spacing`)

Usa las claves `xs` (4), `sm` (8), `md` (16), `lg` (24), `xl` (32).

```tsx
<View style={{ padding: theme.spacing.md, gap: theme.spacing.sm }}>
```

### Tipografía (`theme.font`)

```tsx
<Text
	style={{
		fontFamily: theme.font.family.bold,
		fontSize: theme.font.size.h2,
	}}
>
	Título
</Text>
```

## 3. Verificación

Si estás revisando código (Code Review):

1.  Busca colores hexadecimales o rgb hardcodeados.
2.  Sugiere el cambio por la variable correspondiente en `theme.ts`.
