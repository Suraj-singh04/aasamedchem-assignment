import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AasaMedChem — B2B Pharma Procurement",
  description: "Trusted B2B marketplace for pharmaceutical and chemical API procurement",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}