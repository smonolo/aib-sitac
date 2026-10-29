import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import { themeBootScript } from '@/lib/theme'
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
  appleWebApp: {
    capable: true,
    title: 'AIB SITAC',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F5F5' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="it"
      className={cn('h-full font-sans', geist.variable)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex h-dvh flex-col overflow-hidden bg-aib-canvas text-aib-fg antialiased dark:bg-aib-canvas-inverse dark:text-aib-fg-inverse">
        {children}
      </body>
    </html>
  )
}
