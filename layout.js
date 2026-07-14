import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'El Método Dari',
  description: 'PWA completa de El Método Dari',
  manifest: '/manifest.json',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}