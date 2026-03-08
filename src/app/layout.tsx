import type { Metadata } from 'next'
import Link from 'next/link'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vitamin Tracker',
  description: 'Track your daily vitamins and supplements',
}

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/add', label: 'Add Supplement' },
  { href: '/regimen', label: 'My Regimen' },
  { href: '/history', label: 'History' },
  { href: '/products', label: 'Products' },
  { href: '/insights', label: 'Insights' },
  { href: '/trends', label: 'Trends' },
  { href: '/settings', label: 'Settings' },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-base font-body">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:p-4 focus:bg-black focus:text-white">
          Skip to content
        </a>
        <nav className="border-b" style={{ borderColor: 'var(--border-warm)', background: 'rgba(15, 15, 14, 0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="font-display text-xl tracking-wide" style={{ color: 'var(--accent)' }}>
                Vitamin Tracker
              </Link>
              <div className="flex gap-5">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="nav-link text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
        <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        <footer className="border-t mt-auto py-6" style={{ borderColor: 'var(--border-warm)' }}>
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              This application is for informational purposes only and does not constitute medical advice.
              Always consult with a healthcare provider before making changes to your supplement regimen.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
