import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'AIB SITAC',
  description:
    'Mappa di situazione tattica per incendi boschivi. Strumento indipendente e non ufficiale — non affiliato a istituzioni pubbliche.',
  icons: {
    icon: '/aib-assets/favicon.png',
    apple: '/aib-assets/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={cn('dark h-full font-sans', geist.variable)}>
      <body className="flex h-dvh flex-col overflow-hidden bg-aib-canvas-inverse text-aib-fg-inverse antialiased">
        {children}
      </body>
    </html>
  )
}
