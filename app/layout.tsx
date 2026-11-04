import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Public_Sans } from 'next/font/google'
import './globals.css'

const titulo = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--f-titulo',
})
const corpo = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--f-corpo',
})

export const viewport: Viewport = { viewportFit: 'cover', themeColor: '#1f3a2c' }

export const metadata: Metadata = {
  title: 'Gestão Fazenda',
  description: 'Gado, cavalos Mangalarga Marchador, ração e silagem da fazenda.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${corpo.variable}`}>
      <body>{children}</body>
    </html>
  )
}
