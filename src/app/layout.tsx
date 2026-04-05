import { PregenSSEProvider } from '@/components/PregenSSEProvider/PregenSSEProvider'
import { ThemeProvider } from '@/components/ThemeProvider/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import type { Metadata } from 'next'
import { Literata } from 'next/font/google'
import './globals.css'

const literata = Literata({
  subsets: ['latin'],
  variable: '--font-literata',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'InkVoice',
  description: 'Local audiobook reader',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={literata.variable} suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <PregenSSEProvider>{children}</PregenSSEProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
