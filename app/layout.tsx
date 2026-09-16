import type { Metadata } from 'next'
import './globals.css'
import './storefront-overrides.css'
import './product-card-orientation.css'
import './info-pages.css'
import './collection-rebuild.css'
import './admin-users.css'
import './mobile-landing-fixes.css'
import './about-editorial.css'
import ProductCardOrientation from './components/ProductCardOrientation'
import FaviconSync from './components/FaviconSync'

export const metadata: Metadata = {
  title: 'SkyShotConner — Aviation, Wildlife & Nature Photography',
  description: 'SkyShotConner photography and wall art featuring aviation, wildlife and nature.',
  openGraph: {
    title: 'SkyShotConner — Aviation, Wildlife & Nature Photography',
    description: 'Photography and wall art by SkyShotConner, spanning aviation, wildlife and nature.'
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><FaviconSync/><ProductCardOrientation/>{children}</body></html>
}
