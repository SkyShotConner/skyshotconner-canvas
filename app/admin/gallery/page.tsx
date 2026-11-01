'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import GalleryManager from './GalleryManager'
import '../gallery.css'

export default function AdminGalleryPage() {
  const supabase = useMemo(() => createClient(), [])
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!supabase) { if (alive) setAllowed(false); return }
      const { data } = await supabase.auth.getUser()
      if (!data.user) { if (alive) setAllowed(false); return }
      const { data: admin } = await supabase.rpc('is_admin')
      if (alive) setAllowed(!!admin)
    })()
    return () => { alive = false }
  }, [supabase])

  if (allowed === null) return <main className="admin-shell"><div className="admin-card"><h1>Checking access…</h1></div></main>
  if (!allowed) return <main className="admin-shell"><div className="admin-card"><h1>Access denied.</h1><p>Administrator access is required.</p><a className="admin-button" href="/admin">Back to admin</a></div></main>

  return <main className="admin-shell">
    <header className="admin-header">
      <div><span className="eyebrow">SkyShotConner / Control</span><h1>Photography gallery</h1><p>Upload, arrange and publish the photographs shown on /images.</p></div>
      <div className="admin-actions"><a className="admin-button secondary-admin" href="/admin">← Admin dashboard</a><a className="admin-link" href="/images" target="_blank" rel="noreferrer">View gallery ↗</a></div>
    </header>
    <GalleryManager />
  </main>
}
