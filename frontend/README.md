# Finanzapp - Frontend

Aplicación móvil construida con **Expo** y **React Native**.

## 🚀 Quick Start

1.  **Instalar dependencias:**

    ```bash
    npm install
    ```

2.  **Configurar variables de entorno:**
    Crea un archivo `.env.local` en la raíz de `frontend/` con las siguientes variables:

    ```ini
    # URL de tu proyecto Supabase
    EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

    # Key anónima (pública) de Supabase
    EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
    ```

3.  **Correr la app:**
    ```bash
    npx expo start -c
    ```
    Usa la app **Expo Go** en tu celular o un emulador para escanear el QR.

## 📁 Estructura Clave

- `app/`: Rutas y navegación (Expo Router).
- `src/components/`: Componentes reutilizables.
- `src/features/`: Lógica de negocio (Auth, OCR, etc).
- `src/lib/`: Configuración de servicios (Supabase, API).
