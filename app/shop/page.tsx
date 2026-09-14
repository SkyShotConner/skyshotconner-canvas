'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, ShoppingBag, User, Heart, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { createClient, storageUrl } from '@/lib/supabase/client'
import './shop.css'

type Orientation = 'landscape' | 'portrait'

type Product = {
  id: string
  name: string
  slug: string
  price: number
  short_description?: string | null
  description?: string | null
  orientation: Orientation
  category?: string | null
  images: string[]
}

const CANVAS_PRICES: Record<string, number> = { A5: 349, A4: 449, A3: 549, A2: 749, A1: 1099 }
const CANVAS_SIZES = ['A5', 'A4', 'A3', 'A2', 'A1']
const CATEGORY_FILTERS = ['All', 'Aviation Art', 'Nature Art', 'Wildlife Art']

function money(value: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value)
}

function imageFor(product: Product) {
  const first = product.images?.[0]
  if (!first) return ''
  return first.startsWith('http') ? first : storageUrl(first)
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size))
  return result
}

function ProductCard({ product }: { product: Product }) {
  return <a className={`ssc-shop-card ${product.orientation}`} href={`/product/${product.slug}`}><div className="ssc-shop-image-wrap">{imageFor(product) ? <img src={imageFor(product)} alt={product.name} loading="lazy" /> : <div className="ssc-shop-image-fallback" />}<span className="ssc-shop-image-index">01 / 01</span></div><div className="ssc-shop-meta"><div className="ssc-shop-name">{product.name}</div><div className="ssc-shop-sub">{product.short_description || 'Premium wall art photography'}</div><div className="ssc-shop-price-list">{CANVAS_SIZES.map(size => <span key={size}><b>{size}</b> {money(CANVAS_PRICES[size])}</span>)}</div><div className="ssc-shop-note">Canvas / five sizes · Frames available</div></div></a>
}

function DesktopRows({ products }: { products: Product[] }) {
  const landscapes = products.filter(product => product.orientation === 'landscape')
  const portraits = products.filter(product => product.orientation === 'portrait')
  const landscapeRows = chunks(landscapes, 2)
  const portraitRows = chunks(portraits, 3)
  const cycles = Math.max(landscapeRows.length, portraitRows.length)
  return <div className="ssc-shop-layout ssc-shop-desktop" aria-label="Product collection">{Array.from({ length: cycles }).map((_, cycle) => { const landscapeRow = landscapeRows[cycle] || []; const portraitRow = portraitRows[cycle] || []; return <div className="ssc-shop-cycle" key={`desktop-${cycle}`}>{landscapeRow.length > 0 && <div className="ssc-shop-row ssc-shop-row-landscape">{landscapeRow.map(product => <ProductCard key={product.id} product={product} />)}{Array.from({ length: 2 - landscapeRow.length }).map((_, index) => <div className="ssc-shop-placeholder" key={`landscape-placeholder-${cycle}-${index}`} aria-hidden="true" />)}</div>}{portraitRow.length > 0 && <div className="ssc-shop-row ssc-shop-row-portrait">{portraitRow.map(product => <ProductCard key={product.id} product={product} />)}{Array.from({ length: 3 - portraitRow.length }).map((_, index) => <div className="ssc-shop-placeholder" key={`portrait-placeholder-${cycle}-${index}`} aria-hidden="true" />)}</div>}</div> })}</div>
}

function MobileRows({ products }: { products: Product[] }) {
  const landscapes = products.filter(product => product.orientation === 'landscape')
  const portraits = products.filter(product => product.orientation === 'portrait')
  const landscapeRows = chunks(landscapes, 1)
  const portraitRows = chunks(portraits, 2)
  const cycles = Math.max(landscapeRows.length, portraitRows.length)
  return <div className="ssc-shop-layout ssc-shop-mobile" aria-label="Product collection">{Array.from({ length: cycles }).map((_, cycle) => { const landscapeRow = landscapeRows[cycle] || []; const portraitRow = portraitRows[cycle] || []; return <div className="ssc-shop-cycle" key={`mobile-${cycle}`}>{landscapeRow.length > 0 && <div className="ssc-shop-row ssc-shop-row-landscape">{landscapeRow.map(product => <ProductCard key={product.id} product={product} />)}</div>}{portraitRow.length > 0 && <div className="ssc-shop-row ssc-shop-row-portrait">{portraitRow.map(product => <ProductCard key={product.id} product={product} />)}{Array.from({ length: 2 - portraitRow.length }).map((_, index) => <div className="ssc-shop-placeholder" key={`mobile-portrait-placeholder-${cycle}-${index}`} aria-hidden="true" />)}</div>}</div> })}</div>
}

export default function ShopPage() {
  const supabase = useMemo(() => createClient(), [])
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [filterOpen, setFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadProducts() {
      if (!supabase) { if (active) { setError('Store connection is unavailable.'); setLoading(false) } return }
      const { data, error: loadError } = await supabase.from('products').select('id,name,slug,price,short_description,description,orientation,created_at,category:categories(name),product_images(storage_path,is_primary,sort_order)').eq('is_active', true).order('created_at', { ascending: true })
      if (!active) return
      if (loadError) { setError('Could not load the collection. Please refresh and try again.'); setLoading(false); return }
      const mapped: Product[] = (data || []).filter((product: any) => product.orientation === 'landscape' || product.orientation === 'portrait').map((product: any) => ({ id: product.id, name: product.name, slug: product.slug, price: Number(product.price || 349), short_description: product.short_description, description: product.description, orientation: product.orientation, category: product.category?.name === 'Aviation' ? 'Aviation Art' : product.category?.name || null, images: (product.product_images || []).slice().sort((a: any, b: any) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) || (a.sort_order || 0) - (b.sort_order || 0)).map((image: any) => image.storage_path) }))
      setProducts(mapped); setLoading(false)
    }
    loadProducts(); return () => { active = false }
  }, [supabase])

  const filteredProducts = products.filter(product => { const text = `${product.name} ${product.short_description || ''} ${product.category || ''}`.toLowerCase(); return text.includes(query.trim().toLowerCase()) && (filter === 'All' || product.category === filter) })
  const go = (path: string) => { window.location.href = path }

  return <div className="ssc-shop-page"><header className="ssc-shop-nav"><a className="ssc-shop-brand" href="/">SKYSHOTCONNER</a><nav className="ssc-shop-links" aria-label="Main navigation"><a href="/shop">Collection</a><a href="/special-collection">Special Collection</a><a href="/about">About</a></nav><div className="ssc-shop-tools"><a href="/wishlist" aria-label="Saved works"><Heart size={15} /></a><a href="/account" aria-label="Account"><User size={15} /></a><a href="/cart" aria-label="Shopping bag"><ShoppingBag size={15} /></a></div></header><main className="ssc-shop-shell"><section className="ssc-shop-intro"><div><div className="ssc-shop-eyebrow">SkyShotConner / Photography Art</div><h1>THE<br />COLLECTION.</h1></div><p>Original photography prepared as premium canvas artwork.</p></section><div className="ssc-shop-toolbar"><span>{filteredProducts.length} artworks</span><div className="ssc-shop-controls"><label className="ssc-shop-search"><Search size={14} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="SEARCH THE COLLECTION" aria-label="Search the collection" /></label><div className="ssc-shop-filter-wrap"><button className="ssc-shop-filter-button" onClick={() => setFilterOpen(open => !open)} aria-expanded={filterOpen}><SlidersHorizontal size={14} /> {filter === 'All' ? 'Filter' : filter} <ChevronDown size={12} /></button>{filterOpen && <div className="ssc-shop-filter-menu">{CATEGORY_FILTERS.map(category => <button key={category} className={filter === category ? 'active' : ''} onClick={() => { setFilter(category); setFilterOpen(false) }}>{category}</button>)}</div>}</div></div></div>{loading && <div className="ssc-shop-status">Loading collection…</div>}{!loading && error && <div className="ssc-shop-status">{error}</div>}{!loading && !error && filteredProducts.length === 0 && <div className="ssc-shop-status">No artworks match your search or filter.</div>}{!loading && !error && filteredProducts.length > 0 && <><DesktopRows products={filteredProducts} /><MobileRows products={filteredProducts} /></>}</main><footer className="footer"><div className="container footer-grid"><div><div className="brand">SKYSHOTCONNER</div><p style={{ maxWidth: 300 }}>Photography captured as art. Premium canvas pieces made for people who notice the moment.</p></div><div><h3>Explore</h3><button onClick={() => go('/shop')}>Collection</button><br /><button onClick={() => go('/special-collection')}>Special Collection</button><br /><button onClick={() => go('/about')}>About</button></div><div><h3>Help</h3><button onClick={() => go('/contact')}>Contact</button><br /><button onClick={() => go('/faq')}>FAQ</button><br /><button onClick={() => go('/shipping-returns')}>Shipping</button></div><div><h3>Legal</h3><button onClick={() => go('/privacy')}>Privacy</button><br /><button onClick={() => go('/terms')}>Terms</button></div></div><div className="container footer-bottom"><p>© {new Date().getFullYear()} SkyShotConner. The Art of Flight.</p></div></footer></div>
}
