'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const SLOTS = [
  ['home_hero', 'Homepage Hero', 'The large full-screen image at the top of the homepage.'],
  ['home_commercial', 'Commercial Section', 'Commercial aviation section image.'],
  ['home_military', 'Military Section', 'Military aviation section image.'],
  ['home_historic', 'Historic Section', 'Historic aviation section image.'],
  ['home_cockpit', 'Cockpit Section', 'Cockpit / flight deck section image.'],
  ['home_editorial', 'Homepage Editorial Image', 'The editorial image above the selected works section.'],
  ['about_hero', 'About Hero', 'The large image at the top of the About page.'],
  ['about_main', 'About Main Image', 'The first editorial image on the About page.'],
  ['about_secondary', 'About Secondary Image', 'The second editorial image on the About page.'],
] as const

type SiteImage = { key: string; label: string; image_url: string | null; storage_path: string | null }

export default function SiteImageManager(){
  const supabase = useMemo(() => createClient(), [])!
  const [images, setImages] = useState<Record<string, SiteImage>>({})
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  async function load(){
    if(!supabase) return
    const { data, error } = await supabase.from('site_images').select('key,label,image_url,storage_path').order('key')
    if(error){ setMessage(error.message); return }
    setImages(Object.fromEntries((data || []).map((x: SiteImage) => [x.key, x])))
  }

  useEffect(() => { load() }, [])

  async function save(slot: typeof SLOTS[number][0]){
    if(!supabase) return
    const file = files[slot]
    if(!file) return
    setBusy(slot); setMessage('')
    const old = images[slot]
    const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-')
    const path = `site/${slot}-${Date.now()}-${safe}`
    const upload = await supabase.storage.from('site-images').upload(path, file, { upsert: false, contentType: file.type || 'image/jpeg' })
    if(upload.error){ setMessage(upload.error.message); setBusy(null); return }

    const publicUrl = supabase.storage.from('site-images').getPublicUrl(path).data.publicUrl
    const { error } = await supabase.from('site_images').upsert({
      key: slot,
      label: SLOTS.find(x => x[0] === slot)?.[1] || slot,
      image_url: publicUrl,
      storage_path: path,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })
    if(error){ await supabase.storage.from('site-images').remove([path]); setMessage(error.message); setBusy(null); return }

    if(old?.storage_path && old.storage_path !== path) await supabase.storage.from('site-images').remove([old.storage_path])
    setFiles(f => ({...f, [slot]: null}))
    await load()
    setMessage('Website image updated successfully. Refresh the storefront to see it.')
    setBusy(null)
  }

  return <section className="admin-card site-image-manager">
    <div className="admin-card-head">
      <div><span className="eyebrow">Website imagery</span><h2>Static images</h2><p>Replace the images used throughout the website without editing code. Product images are managed separately.</p></div>
      <button className="admin-button secondary-admin" onClick={load}>Refresh</button>
    </div>
    <div className="site-image-grid">
      {SLOTS.map(([key, label, description]) => {
        const image = images[key]
        const selected = files[key]
        const preview = selected ? URL.createObjectURL(selected) : image?.image_url || ''
        return <div className="site-image-item" key={key}>
          <div className="site-image-preview">{preview ? <img src={preview} alt={label}/> : <span>No image</span>}</div>
          <div className="site-image-info"><span className="eyebrow">{label}</span><p>{description}</p></div>
          <label className="site-image-file">Choose new image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e => setFiles(f => ({...f, [key]: e.target.files?.[0] || null}))}/></label>
          {selected && <button className="admin-button" disabled={busy===key} onClick={() => save(key)}>{busy===key ? 'Uploading…' : 'Save image'}</button>}
        </div>
      })}
    </div>
    {message && <p className="admin-message">{message}</p>}
  </section>
}
