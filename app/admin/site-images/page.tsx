'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import SiteImageManager from '../SiteImageManager'
import '../site-images.css'

export default function SiteImagesAdminPage(){
  const supabase = useMemo(() => createClient(), [])!
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    (async () => {
      if(!supabase){ setAllowed(false); return }
      const { data } = await supabase.auth.getUser()
      if(!data.user){ setAllowed(false); return }
      const { data: admin } = await supabase.rpc('is_admin')
      setAllowed(!!admin)
    })()
  }, [supabase])

  if(allowed === null) return <main className="admin-shell"><div className="admin-card"><span className="eyebrow">SkyShotConner / Control</span><h1>Checking access…</h1></div></main>
  if(!allowed) return <main className="admin-shell"><div className="admin-card"><span className="eyebrow">SkyShotConner / Control</span><h1>Access denied.</h1><p>Administrator access is required.</p><a className="admin-button" href="/admin">Back to admin</a></div></main>

  return <main className="admin-shell">
    <header className="admin-header">
      <div><span className="eyebrow">SkyShotConner / Control</span><h1>Website images</h1><p>Change the static photography used across the storefront.</p></div>
      <div className="admin-actions"><a className="admin-button secondary-admin" href="/admin">← Admin dashboard</a><a className="admin-link" href="/">View store ↗</a></div>
    </header>
    <SiteImageManager />
  </main>
}
