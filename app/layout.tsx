import type { Metadata } from 'next'
import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'

const placa = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--f-placa',
})
const corpo = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--f-corpo',
})
const dado = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--f-dado',
})

export const metadata: Metadata = {
  title: 'Gestão Fazenda',
  description: 'Gestão de bovinos e criação de equinos Mangalarga Marchador.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${placa.variable} ${corpo.variable} ${dado.variable}`}>
      <body>{children}</body>
    </html>
  )
}
