'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BrandingAdminPage(){
  const supabase=useMemo(()=>createClient(),[])
  const [allowed,setAllowed]=useState<boolean|null>(null)
  const [file,setFile]=useState<File|null>(null)
  const [currentUrl,setCurrentUrl]=useState('')
  const [currentPath,setCurrentPath]=useState('')
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  useEffect(()=>{(async()=>{
    if(!supabase){setAllowed(false);return}
    const {data}=await supabase.auth.getUser()
    if(!data.user){setAllowed(false);return}
    const {data:admin}=await supabase.rpc('is_admin')
    setAllowed(!!admin)
    if(admin){
      const {data:row}=await supabase.from('site_images').select('image_url,storage_path').eq('key','favicon').maybeSingle()
      setCurrentUrl(row?.image_url||'')
      setCurrentPath(row?.storage_path||'')
    }
  })()},[supabase])

  async function save(){
    if(!supabase||!file)return
    setBusy(true);setMessage('')
    const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-')
    const path=`site/favicon-${Date.now()}-${safe}`
    const upload=await supabase.storage.from('site-images').upload(path,file,{upsert:false,contentType:file.type||'image/png'})
    if(upload.error){setMessage(upload.error.message);setBusy(false);return}
    const url=supabase.storage.from('site-images').getPublicUrl(path).data.publicUrl
    const {error}=await supabase.from('site_images').upsert({key:'favicon',label:'Website Favicon',image_url:url,storage_path:path,updated_at:new Date().toISOString()},{onConflict:'key'})
    if(error){setMessage(error.message);setBusy(false);return}
    if(currentPath)await supabase.storage.from('site-images').remove([currentPath])
    setCurrentUrl(url);setCurrentPath(path);setFile(null);setMessage('Favicon updated successfully.');setBusy(false)
  }

  if(allowed===null)return <main className="admin-shell"><div className="admin-card"><h1>Checking access…</h1></div></main>
  if(!allowed)return <main className="admin-shell"><div className="admin-card"><h1>Access denied.</h1><a className="admin-button" href="/admin">Back to admin</a></div></main>

  return <main className="admin-shell">
    <header className="admin-header"><div><span className="eyebrow">SkyShotConner / Control</span><h1>Site branding</h1><p>Manage the favicon shown in browser tabs.</p></div><a className="admin-link" href="/">View store ↗</a></header>
    <section className="admin-card"><div className="admin-card-head"><div><span className="eyebrow">Browser icon</span><h2>Favicon</h2><p>For best results, use a square transparent PNG around 512 × 512 pixels.</p></div></div><div className="admin-form">{currentUrl&&<img src={currentUrl} alt="Current favicon" style={{width:96,height:96,objectFit:'contain'}}/>}<label>Choose favicon<input type="file" accept="image/png,image/webp,image/jpeg,.ico" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button className="admin-button" disabled={!file||busy} onClick={save}>{busy?'Uploading…':'Save favicon'}</button>{message&&<p className="admin-message">{message}</p>}</div></section>
  </main>
}
