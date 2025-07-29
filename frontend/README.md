<p align="center">
  <img src="src/assets/images/adaptive-icon.png" alt="Finanzapp logo" width="120" />
</p>

# Finanzapp – Frontend (Expo)

Aplicación móvil para gestionar finanzas personales. Usa **Expo + React Native** y se conecta a los micro-servicios del backend via HTTP.

---

## ⚙️ Requisitos mínimos

| Herramienta | Versión |
| ----------- | ------- |
| Node.js     | 18.x LTS |
| npm         | v9 |
| Expo CLI    | 7.x (`npm i -g expo-cli`) |
| Git         | 2.x |

---

## 🚀 Quick Start (4 pasos)

```bash
# 1. Clona el proyecto y entra al frontend
git clone https://github.com/Brollix/finanzapp.git
cd finanzapp/frontend

# 2. Instala dependencias
npm install

# 3. Configura variables de entorno
cp .env      # y rellena claves Supabase

# 4. Arranca en modo dev (bundler + cache clear)
npx expo start -c
```

Abre la app con **Expo Go** o un emulador (`a` para Android, `i` para iOS).

> Nota: asegúrate de que el backend esté arriba siguiendo [`backend/README.md`](../backend/README.md).

---

## 🌳 Estructura principal

```
app/                # Rutas (Expo Router)
  _layout.tsx       # Root stack
  index.tsx         # Redirección según auth
  (auth)/           # Pantallas de autenticación
  (tabs)/           # Navegación por pestañas

src/
  components/       # UI reutilizable
  features/         # Dominios: auth, ocr, ...
  lib/              # Helpers (supabase.ts, api.ts)
  styles/           # Theming global
```

---

## 📄 Más información

Para dudas de backend, endpoints y modelos IA revisa [`backend/README.md`](../backend/README.md).
>
  <img src="src/assets/images/adaptive-icon.png" alt="Finanzapp logo" width="120" />
</p>
 (Expo + React Native) para gestionar finanzas personales.

Este README está pensado para que cualquier desarrollador del equipo pueda clonar el proyecto y ejecutarlo en menos de 5 minutos.

---

## 📦 Stack técnico

| Capa           | Tecnología                                         |
| -------------- | -------------------------------------------------- |
| UI             | React Native + Expo Router (file-based navigation) |
| Estado global  | Context API (`AuthProvider`, `OcrProvider`)        |
| Backend        | Supabase (auth & base de datos)                    |
| Lenguaje       | TypeScript                                         |
| Lint & Formato | ESLint + Prettier                                  |

---

## 🖥️ Requisitos previos

| Herramienta    | Versión recomendada        |
| -------------- | -------------------------- |
| Node.js        | 18.x LTS (⩾18.16)         |
| npm            |  9.x                       |
| Expo CLI       |  7.x (`npm i -g expo-cli`) |
| Git            |  2.x                       |
| Android Studio | ⩾2022.1.1                  |

---

## 🚀 Primeros pasos

1. **Clonar y entrar**

   ```bash
   git clone https://github.com/Brollix/finanzapp.git
   cd finanzapp
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Variables de entorno**

   Tener el archivo `.env` en la raíz (nunca se sube al repo).

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```

4. **Arrancar en modo desarrollo**

   1. Inicia el bundler y limpia la caché (evita errores de rutas):

      ```bash
      npx expo start -c
      ```

   2. Escanea el QR con **Expo Go** (iOS/Android) o presiona `a` / `i` para abrir un emulador.

---

## 🏗️ Builds de producción

Expo SDK 50 funciona con **EAS Build**. Pasos básicos:

1. Login:
   ```bash
   npx expo login
   ```
2. Configurar el proyecto (crea `eas.json`):
   ```bash
   npx eas build:configure
   ```
3. Disparar la build:
   ```bash
   npx eas build --platform android   # o ios / all
   ```
4. Descarga el `.apk` / `.aab` / `.ipa` generado desde la web.

Para builds sin EAS (solo Javascript), se puede usar:

```bash
expo export:web   # PWA
```

---

## 🧰 VS Code – extensiones recomendadas

- **ESLint** – lint en tiempo real.
- **Prettier** – formato automático al guardar.
- **Expo Tools** – atajos para Expo.
- **DotEnv** – resaltado de `.env`.

---

## 📂 Estructura principal

```
app/                # Rutas manejadas por Expo Router
  _layout.tsx       # Root stack layout
  index.tsx         # Splash → redirect según auth
  (auth)/           # Flujo de login
  (tabs)/           # TabBar principal (home, capture, account)

src/
  components/       # UI reutilizable
  features/         # Dominio funcional (auth, ocr, …)
  lib/              # Helpers como `supabase.ts`
  providers/        # Providers globales
  styles/           # Theming & estilos
```

---

## 🛠 Scripts útiles

| Comando             | Descripción           |
| ------------------- | --------------------- |
| `npm run lint`      | Ejecuta ESLint        |
| `npm run format`    | Formatea con Prettier |
| `npm run typecheck` | `tsc --noEmit`        |

Agrega más scripts según lo necesites.

---

## 🐞 Problemas comunes

| Problema                            | Solución                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| _"missing default export"_ en rutas | Asegúrate de usar **imports relativos** dentro de `app/` y que cada archivo exporte `default`. |
| Supabase _"Invalid API key"_        | Revisa que `.env` tenga `EXPO_PUBLIC_` y reinicia `expo start -c`.                             |

---

## 🤝 Contribuir

1. Crea rama feature: `git checkout -b feat/nombre`
2. Commits atómicos + convencionales.
3. PR contra `master`.

Antes de PR ejecuta `npm run lint && npm run typecheck`.

---

## 📜 Licencia

MIT © Finanzapp Team
