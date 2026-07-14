import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata = {
  title: 'El Método Dari',
  description: 'Tu mejor versión, sin excusas.',
  manifest: '/manifest.json',
  themeColor: '#0f172a',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans bg-white text-[#0f172a] min-h-screen">
        {children}
      </body>
    </html>
  )
}
