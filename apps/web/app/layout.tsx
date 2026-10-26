import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'AIB SITAC',
  description:
    'Independent tactical situation map for wildfires (incendi boschivi). Unofficial volunteer tool — not affiliated with public institutions.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={cn('dark font-sans', geist.variable)}>
      <body className="bg-aib-canvas-inverse text-aib-fg-inverse antialiased">
        {children}
      </body>
    </html>
  )
}
