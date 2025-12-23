import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FinanzApp - Automatiza el registro de tus gastos',
  description: 'Aplicación móvil que automatiza el registro de gastos mediante escaneo inteligente de tickets. Utiliza OCR e IA para extraer y estructurar información de compras.',
  keywords: ['finanzas', 'gastos', 'ahorro', 'OCR', 'tickets', 'compras', 'presupuesto'],
  authors: [{ name: 'Agustín Brollo' }],
  openGraph: {
    title: 'FinanzApp - Automatiza el registro de tus gastos',
    description: 'Aplicación móvil que automatiza el registro de gastos mediante escaneo inteligente de tickets.',
    type: 'website',
    locale: 'es_AR',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}


