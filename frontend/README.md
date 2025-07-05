# 📱 Finanzapp – App Mobile

App de microfinanzas personales que permite capturar tickets físicos, recortarlos y extraer datos para registrar gastos automáticamente. Desarrollada con Expo y orientada a un uso móvil rápido y eficiente.

---

## 🛠️ Tecnologías

- **Expo + React Native + TypeScript**
- **Supabase** (auth + DB)

---

## 🧾 Estructura

```
client/
├── app/            # Screens y rutas
├── components/     # UI reutilizable
├── styles/         # Temas y fuente global
├── lib/            # Configs como Supabase
```

---

## 🚀 Iniciar proyecto

```bash
npm install
npx expo start
```

- Funciona en Android (Expo Go), navegador (`w`) y eventualmente iOS.

---

## ✅ Estado actual

- Login con Supabase y registro automático
- Captura de imagen con recorte
- Ruteo mobile funcional
- En desarrollo: envío a backend y análisis OCR/IA

---

## 👤 Autor

Creado por [Agustín (Brollix)](https://github.com/Brollix) como proyecto técnico y solución personal para digitalizar el control de gastos diarios.
