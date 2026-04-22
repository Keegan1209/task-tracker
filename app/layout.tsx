import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CMS Job Tracker',
  description: 'Internal dev queue and priority manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body style={{ fontFamily: 'Tahoma, Verdana, Geneva, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
