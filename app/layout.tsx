import type { Metadata } from 'next'
import './globals.css'
import './storefront-overrides.css'
import './info-pages.css'
import './collection-rebuild.css'
import './admin-users.css'

export const metadata: Metadata = {
  title: 'SkyShotConner — The Art of Flight',
  description: 'Premium aviation canvas artwork by SkyShotConner.',
  openGraph: { title: 'SkyShotConner — The Art of Flight', description: 'A cinematic collection of aviation art.' }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
