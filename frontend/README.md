# Finanzapp - Frontend

Aplicación móvil construida con **Expo** y **React Native**.

## Quick Start

1.  **Instalar dependencias:**

    ```bash
    npm install
    ```

2.  **Configurar variables de entorno:**
    Crea un archivo `.env.local` en la raíz de `frontend/` con las siguientes variables:

    ```ini
    # Backend API URL (opcional - solo para producción)
    # Para desarrollo local: dejar comentado (auto-detecta el backend en tu red)
    # Para producción/EC2: descomentar y configurar con la IP pública de tu servidor
    # EXPO_PUBLIC_BACKEND_URL=http://54.123.45.67:8080

    # URL de tu proyecto Supabase
    EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

    # Key anónima (pública) de Supabase
    EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
    ```

    **Nota:** Puedes copiar `.env.example` como punto de partida.

3.  **Correr la app:**
    ```bash
    npx expo start -c
    ```
    Usa la app **Expo Go** en tu celular o un emulador para escanear el QR.

## Estructura Clave

- `app/`: Rutas y navegación (Expo Router).
- `src/components/`: Componentes reutilizables.
- `src/features/`: Lógica de negocio (Auth, OCR, etc).
- `src/lib/`: Configuración de servicios (Supabase, API).
