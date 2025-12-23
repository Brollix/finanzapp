# Email Templates

Plantillas de correo electrónico para Supabase que utilizan el diseño de FinanzApp.

## Password Reset Email

**Archivo:** `password-reset-email.html`

### Cómo usar en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Authentication** > **Email Templates**
3. Selecciona la plantilla **"Reset Password"**
4. Copia y pega el contenido completo de `password-reset-email.html`
5. Guarda los cambios

### Características

- ✅ Diseño oscuro que coincide con la app (`rgb(19, 19, 19)`)
- ✅ Color primario verde neón (`rgb(40, 255, 100)`)
- ✅ Botón CTA prominente y accesible
- ✅ Enlace alternativo si el botón no funciona
- ✅ Nota de seguridad sobre expiración
- ✅ Compatible con todos los clientes de correo (Gmail, Outlook, Apple Mail, etc.)
- ✅ Diseño responsive para móviles y escritorio
- ✅ Estilos inline para máxima compatibilidad

### Variables de Supabase

La plantilla usa la variable `{{ .Token }}` que Supabase reemplaza automáticamente con el enlace completo de restablecimiento de contraseña. Este enlace HTTP redirige automáticamente al deep link `finanzapp://reset-password` cuando se abre desde un dispositivo móvil con la app instalada.

### Configuración Requerida en Supabase

Para que el deep link funcione correctamente, asegúrate de:

1. **Configurar la URL de redirección en Supabase:**
   - Ve a **Authentication** > **URL Configuration**
   - En **Redirect URLs**, agrega: `finanzapp://reset-password`
   - Guarda los cambios

2. **Verificar que `redirectTo` esté configurado en el código:**
   - El código ya está configurado en `frontend/src/features/auth/services/authService.ts` con `redirectTo: "finanzapp://reset-password"`

3. **Si el enlace no abre la app directamente o muestra "no carga":**
   - Verifica que el enlace HTTP de Supabase esté configurado para redirigir correctamente
   - El enlace debería tener el formato: `https://[proyecto].supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=finanzapp://reset-password`
   - Si el enlace no tiene `redirect_to=finanzapp://reset-password`, verifica la configuración en `authService.ts`
   - Algunos clientes de correo (como Outlook) pueden interceptar los enlaces - prueba desde Gmail o el cliente de correo nativo del dispositivo
   - Asegúrate de que la app esté instalada y que el esquema `finanzapp://` esté registrado correctamente en `app.json`

### Troubleshooting

**Problema: El enlace abre un navegador que no carga**

1. Verifica que `redirectTo` esté configurado en el código:
   ```typescript
   // En frontend/src/features/auth/services/authService.ts
   redirectTo: "finanzapp://reset-password"
   ```

2. Verifica la configuración de Supabase:
   - Ve a **Authentication** > **URL Configuration**
   - Asegúrate de que `finanzapp://reset-password` esté en la lista de **Redirect URLs**

3. Prueba el enlace directamente:
   - Copia el enlace del email
   - Ábrelo en el navegador del dispositivo móvil
   - Debería redirigir automáticamente a la app

4. Si sigue sin funcionar:
   - Algunos clientes de correo modifican los enlaces por seguridad
   - Intenta abrir el email desde el cliente de correo nativo del dispositivo (no desde Outlook web o Gmail web)
   - O copia el enlace y ábrelo manualmente en el navegador

### Personalización

Si necesitas modificar colores o estilos, asegúrate de mantener los valores del tema de la app definidos en `frontend/src/styles/theme.ts`:

- Background: `rgb(19, 19, 19)`
- Primary: `rgb(40, 255, 100)`
- Error: `rgb(240, 39, 76)`
- Text: `rgb(255, 255, 255)`
- Text Secondary: `rgba(255, 255, 255, 0.7)`
