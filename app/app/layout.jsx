import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata = {
  title: 'El Método Dari',
  description: 'Tu mejor versión, sin excusas.',
  manifest: '/manifest.json',
  themeColor: '#0f172a',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans bg-dari-bg text-dari-dark antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
