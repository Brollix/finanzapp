# Deploy Mobile App

Guía para compilar y publicar FinanzApp en Android/iOS.

## Setup Inicial

```bash
npm install -g eas-cli
eas login
cd frontend
eas build:configure
```

## Configurar Backend URL

Edita `frontend/.env`:

```env
EXPO_PUBLIC_BACKEND_URL=http://18.222.119.175:8080
EXPO_PUBLIC_SUPABASE_URL=tu_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_key
```

## Builds de Prueba

```bash
cd frontend

# Android APK
npm run build:android:preview

# iOS Simulator
npm run build:ios:preview
```

## Builds de Producción

### Android (Play Store)

```bash
npm run build:android   # Genera AAB
npm run submit:android  # Sube a Play Store
```

### iOS (App Store)

```bash
npm run build:ios      # Genera IPA
npm run submit:ios     # Sube a App Store
```

## Actualizar Versión

Edita `frontend/app.json`:

```json
{
	"expo": {
		"version": "0.1.4",
		"android": {
			"versionCode": 2
		},
		"ios": {
			"buildNumber": "2"
		}
	}
}
```

Luego:

```bash
npm run build:all
npm run submit:android
npm run submit:ios
```

## Requisitos

- **Android**: Cuenta Google Play Console ($25 único)
- **iOS**: Cuenta Apple Developer ($99/año)

## Ver Builds

```bash
eas build:list
```

O en: https://expo.dev
