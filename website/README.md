# FinanzApp Website

Landing page para FinanzApp construida con React + Vite, TypeScript y Tailwind CSS.

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Build

```bash
# Build de producción
npm run build

# Preview del build de producción
npm run preview
```

## 🐳 Docker

```bash
# Construir imagen
docker build -t finanzapp-website .

# Ejecutar contenedor
docker run -p 80:80 finanzapp-website
```

## 📋 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo (Vite)
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Preview del build de producción
- `npm run lint` - Ejecuta el linter
- `npm run type-check` - Verifica tipos TypeScript

## 🏗️ Estructura

```
website/
├── src/              # Código fuente
│   ├── components/   # Componentes React
│   │   ├── Hero.tsx      # Sección hero
│   │   ├── Features.tsx  # Características
│   │   ├── HowItWorks.tsx # Cómo funciona
│   │   ├── FAQ.tsx       # Preguntas frecuentes
│   │   └── Footer.tsx   # Footer
│   ├── App.tsx       # Componente principal
│   ├── main.tsx      # Entry point
│   └── index.css     # Estilos globales
├── public/           # Assets estáticos
│   ├── fonts/        # Fuentes Space Grotesk
│   └── logo_finanzapp.png
├── index.html        # HTML principal
├── vite.config.ts    # Configuración Vite
├── tailwind.config.js # Configuración Tailwind
└── Dockerfile        # Configuración Docker
```

## 🎨 Tema

El sitio usa los mismos colores que la app móvil (definidos en `tailwind.config.js`):

- **Primary**: `rgb(40, 255, 100)` - Verde brillante
- **Secondary**: `rgb(145, 40, 255)` - Morado
- **Background**: `rgb(19, 19, 19)` - Fondo oscuro

## 📚 Documentación

Para instrucciones de deployment, ver [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🔗 Enlaces

- **Sitio en producción**: [https://finanzapp.info](https://finanzapp.info)
- **Repositorio**: [GitHub](https://github.com)
