import './globals.css'
import { Inter } from 'next/font/google'

// Configuración de la fuente Inter
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'El Método Dari',
  description: 'Tu mejor versión, sin excusas. Entrenamiento personalizado.',
  manifest: '/manifest.json',
  themeColor: '#0f172a', // Azul oscuro corporativo
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans bg-dari-bg text-dari-dark min-h-screen">
        {children}
      </body>
    </html>
  )
}
