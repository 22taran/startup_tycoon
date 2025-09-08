import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navigation } from '@/components/navigation'
import { PerformanceMonitor } from '@/components/performance-monitor'
// import { auth } from '@/auth' // Not needed since Navigation handles session client-side

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  preload: true,
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Startup Tycoon - The Investor Game',
  description: 'A game-like evaluation system for team projects where students pitch ideas and invest in peer projects.',
  keywords: ['startup', 'tycoon', 'investor', 'game', 'evaluation', 'education'],
  authors: [{ name: 'Startup Tycoon Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Session is now handled client-side by Navigation component
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${inter.variable}`}>
        <Providers>
          <PerformanceMonitor />
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  )
}
