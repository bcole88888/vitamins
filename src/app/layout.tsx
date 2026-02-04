import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vitamin Tracker',
  description: 'Track your daily vitamins and supplements',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-xl font-bold text-blue-600">
                Vitamin Tracker
              </Link>
              <div className="flex gap-6">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/add"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Add Supplement
                </Link>
                <Link
                  href="/regimen"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  My Regimen
                </Link>
                <Link
                  href="/history"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  History
                </Link>
                <Link
                  href="/products"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Products
                </Link>
                <Link
                  href="/insights"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Insights
                </Link>
                <Link
                  href="/trends"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Trends
                </Link>
                <Link
                  href="/settings"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-auto py-6">
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-center text-sm text-gray-500">
              This application is for informational purposes only and does not constitute medical advice.
              Always consult with a healthcare provider before making changes to your supplement regimen.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
