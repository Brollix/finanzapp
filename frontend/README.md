# FinanzApp Frontend

Aplicación móvil React Native con Expo para FinanzApp.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI para builds (`npm install -g eas-cli`)

### Installation

```bash
npm install
```

### Environment Variables

Crea un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Development

```bash
# Start Expo dev server
npm start

# Start with tunnel (for testing on physical devices)
npm run start:local

# Platform-specific
npm run android
npm run ios
npm run web
```

## 📁 Estructura del Proyecto

```
app/                    # Expo Router (file-based routing)
├── (tabs)/            # Tab navigation screens
│   ├── index.tsx      # Dashboard
│   ├── tickets.tsx    # Receipts list
│   ├── discounts.tsx  # Discounts analysis
│   └── profile.tsx    # User profile
├── auth/              # Authentication screens
└── ...

src/
├── components/        # Reusable components
│   ├── dashboard/     # Dashboard components
│   ├── modals/        # Modal components
│   └── ui/            # UI primitives
├── context/           # React Context providers
├── features/          # Feature modules
│   └── auth/          # Authentication feature
├── hooks/             # Custom React hooks
├── services/          # API services
├── styles/            # Theme and styles
└── utils/             # Utility functions
```

## 🏗️ Build Profiles

### Development

```bash
npm run build:android:preview
npm run build:ios:preview
```

### Production

```bash
npm run build:android
npm run build:ios
npm run build:all
```

Los perfiles están configurados en `eas.json`:

- **development**: Development client con hot reload
- **preview**: Build interno para testing
- **production**: Build para App Store/Play Store

## 🔍 Code Quality

```bash
# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check
```

## 📱 Features

- **Receipt Scanning**: Captura y procesamiento de tickets con OCR
- **Manual Entry**: Entrada manual de tickets
- **Dashboard**: Estadísticas y análisis de gastos
- **Discounts Analysis**: Análisis de descuentos por supermercado
- **User Profile**: Gestión de perfil de usuario

## 🎨 Styling

El proyecto usa un sistema de temas centralizado en `src/styles/theme.ts`. 

**IMPORTANTE**: Siempre usar el objeto `theme` para colores, fuentes, spacing y border radius. Nunca usar colores hardcodeados.

```typescript
import { theme } from "@/styles/theme";

// ✅ GOOD
<View style={{ backgroundColor: theme.colors.primary }}>

// ❌ BAD
<View style={{ backgroundColor: "#FF5733" }}>
```

## 🚢 Deployment

### EAS Build

```bash
# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Environment Variables en EAS

Las variables de entorno se configuran en `eas.json` por perfil. Para producción, asegúrate de tener:

- `EXPO_PUBLIC_BACKEND_URL`: URL del backend en producción
- `EXPO_PUBLIC_SUPABASE_URL`: URL de Supabase
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Anon key de Supabase (seguro para frontend)

## 📝 License

MIT

