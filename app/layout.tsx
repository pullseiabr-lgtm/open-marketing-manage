import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Open Soluções — Sistema de Gestão Inteligente',
  description: 'Gestão inteligente de marketing para Open Soluções Industriais',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
