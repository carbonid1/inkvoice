import { ThemeCycler, ThemeProvider, Toaster } from '@carbonid1/design-system'
import type { Metadata } from 'next'
import { Literata } from 'next/font/google'
import { BuildInfo } from '@/components/BuildInfo/BuildInfo'
import { PregenSSEProvider } from '@/components/PregenSSEProvider/PregenSSEProvider'
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
          <BuildInfo />
          <ThemeCycler />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
