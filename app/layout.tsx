import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: { default: 'Changelogly', template: '%s | Changelogly' },
  description: 'Auto-generate beautiful changelogs from your GitHub commits.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Changelogly',
    description: 'Auto-generate beautiful changelogs from your GitHub commits.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased`} suppressHydrationWarning>
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-fg)',
                  border: '1px solid var(--toast-border)',
                  borderRadius: '10px',
                  fontSize: '14px',
                },
              }}
            />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
