# FinanzApp Website

Landing page para FinanzApp construida con Next.js 14, TypeScript y Tailwind CSS.

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

# Ejecutar build de producción
npm start
```

## 🐳 Docker

```bash
# Construir imagen
docker build -t finanzapp-website .

# Ejecutar contenedor
docker run -p 3000:3000 finanzapp-website
```

## 📋 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Ejecuta la aplicación en modo producción
- `npm run lint` - Ejecuta el linter
- `npm run type-check` - Verifica tipos TypeScript

## 🏗️ Estructura

```
website/
├── app/              # Páginas y layouts (App Router)
│   ├── layout.tsx    # Layout principal
│   ├── page.tsx      # Página principal (landing)
│   └── globals.css   # Estilos globales
├── components/       # Componentes React
│   ├── Hero.tsx      # Sección hero
│   ├── Features.tsx  # Características
│   ├── HowItWorks.tsx # Cómo funciona
│   ├── Testimonials.tsx # Testimonios
│   ├── FAQ.tsx       # Preguntas frecuentes
│   └── Footer.tsx   # Footer
├── public/           # Assets estáticos
│   └── logo_finanzapp.png
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


