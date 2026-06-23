import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IPO Predictor',
  description: 'ML-powered IPO underpricing prediction',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}