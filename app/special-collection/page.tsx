'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import './special-collection.css'

type SpecialLocation = {
  id: string
  name: string
  slug: string
  short_description?: string | null
  location_label?: string | null
  sort_order: number
}

function Footer() {
  return <footer className="ssc-special-footer"><div className="ssc-special-footer-grid"><div><div className="ssc-special-brand">SKYSHOTCONNER</div><p style={{maxWidth:300}}>Aviation captured as art. Premium canvas pieces made for people who look up.</p></div><div><h3>Explore</h3><a href="/shop">Collection</a><br/><a href="/special-collection">Special Collection</a><br/><a href="/about">About</a></div><div><h3>Help</h3><a href="/contact">Contact</a><br/><a href="/faq">FAQ</a><br/><a href="/shipping-returns">Shipping</a></div><div><h3>Legal</h3><a href="/privacy">Privacy</a><br/><a href="/terms">Terms</a></div></div><div className="ssc-special-footer-bottom"><p>© {new Date().getFullYear()} SkyShotConner. The Art of Flight.</p></div></footer>
}

export default function SpecialCollectionPage() {
  const supabase = useMemo(() => createClient(), [])
  const [locations, setLocations] = useState<SpecialLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.from('special_locations').select('id,name,slug,short_description,location_label,sort_order').eq('is_active', true).order('sort_order', { ascending: true }).then(({ data }) => {
      setLocations((data || []) as SpecialLocation[])
      setLoading(false)
    })
  }, [supabase])

  return <div className="ssc-special-page">
    <header className="ssc-special-nav"><a className="ssc-special-brand" href="/">SKYSHOTCONNER</a><nav className="ssc-special-links"><a href="/shop">Collection</a><a href="/special-collection">Special Collection</a><a href="/about">About</a></nav></header>
    <main className="ssc-special-shell">
      <section className="ssc-special-hero"><div><div className="ssc-special-eyebrow">SkyShotConner / Selected Locations</div><h1>SPECIAL<br/>COLLECTION.</h1></div><p>A curated series of SkyShotConner artworks available through selected museums, partners and physical locations. Choose a location to discover the pieces connected to it.</p></section>
      <section className="ssc-locations" aria-label="Special collection locations">
        {loading && <div className="ssc-special-empty">Loading locations…</div>}
        {!loading && locations.map((location, index) => <a className="ssc-location-card" href={`/special-collection/${location.slug}`} key={location.id}><div className="ssc-location-index">{String(index + 1).padStart(2, '0')}</div><div><h2>{location.name}</h2><p>{location.short_description}</p></div><div className="ssc-location-meta"><ArrowUpRight size={18}/><span>{location.location_label}</span></div></a>)}
        {!loading && locations.length === 0 && <div className="ssc-special-empty">No special locations are published yet.</div>}
      </section>
    </main>
    <Footer/>
  </div>
}
