'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AssetKey='favicon'|'brand_logo'|'loading_mascot'
type AssetState={image_url:string;storage_path:string}

const assets:{key:AssetKey;label:string;eyebrow:string;description:string;recommendation:string}[]=[
  {key:'favicon',label:'Favicon',eyebrow:'Browser icon',description:'Shown in browser tabs and bookmarks.',recommendation:'Use a square PNG, WebP or ICO. 512 × 512 is ideal.'},
  {key:'brand_logo',label:'Scout fallback logo',eyebrow:'Loading backup',description:'Used only as a backup loading image when no dedicated Scout loading-screen image is set. The website header always uses the SkyShotConner text wordmark.',recommendation:'Use a transparent PNG or WebP with Scout centred and a little breathing room.'},
  {key:'loading_mascot',label:'Scout loading screen',eyebrow:'Loading experience',description:'Shown on the branded loading screen while the storefront prepares the page.',recommendation:'A transparent PNG or WebP works best. You can use the same Scout artwork as the logo or a separate pose.'}
]

export default function BrandingAdminPage(){
  const supabase=useMemo(()=>createClient(),[])
  const [allowed,setAllowed]=useState<boolean|null>(null)
  const [current,setCurrent]=useState<Partial<Record<AssetKey,AssetState>>>({})
  const [files,setFiles]=useState<Partial<Record<AssetKey,File|null>>>({})
  const [busy,setBusy]=useState<AssetKey|null>(null)
  const [messages,setMessages]=useState<Partial<Record<AssetKey,string>>>({})

  useEffect(()=>{(async()=>{
    if(!supabase){setAllowed(false);return}
    const {data}=await supabase.auth.getUser()
    if(!data.user){setAllowed(false);return}
    const {data:admin}=await supabase.rpc('is_admin')
    setAllowed(!!admin)
    if(admin){
      const {data:rows}=await supabase.from('site_images').select('key,image_url,storage_path').in('key',assets.map(a=>a.key))
      const next:Partial<Record<AssetKey,AssetState>>={}
      for(const row of rows||[]){
        if(assets.some(a=>a.key===row.key)) next[row.key as AssetKey]={image_url:row.image_url||'',storage_path:row.storage_path||''}
      }
      setCurrent(next)
    }
  })()},[supabase])

  async function save(key:AssetKey){
    const file=files[key]
    if(!supabase||!file)return
    setBusy(key)
    setMessages(m=>({...m,[key]:''}))
    const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-')
    const path=`site/${key}-${Date.now()}-${safe}`
    const upload=await supabase.storage.from('site-images').upload(path,file,{upsert:false,contentType:file.type||'image/png'})
    if(upload.error){setMessages(m=>({...m,[key]:upload.error.message}));setBusy(null);return}
    const url=supabase.storage.from('site-images').getPublicUrl(path).data.publicUrl
    const label=assets.find(a=>a.key===key)?.label||key
    const {error}=await supabase.from('site_images').upsert({key,label,image_url:url,storage_path:path,updated_at:new Date().toISOString()},{onConflict:'key'})
    if(error){
      await supabase.storage.from('site-images').remove([path])
      setMessages(m=>({...m,[key]:error.message}));setBusy(null);return
    }
    const previous=current[key]?.storage_path
    if(previous&&previous!==path)await supabase.storage.from('site-images').remove([previous])
    setCurrent(c=>({...c,[key]:{image_url:url,storage_path:path}}))
    setFiles(f=>({...f,[key]:null}))
    setMessages(m=>({...m,[key]:`${label} updated successfully.`}))
    setBusy(null)
  }

  if(allowed===null)return <main className="admin-shell"><div className="admin-card"><h1>Checking access…</h1></div></main>
  if(!allowed)return <main className="admin-shell"><div className="admin-card"><h1>Access denied.</h1><a className="admin-button" href="/admin">Back to admin</a></div></main>

  return <main className="admin-shell">
    <header className="admin-header"><div><span className="eyebrow">SkyShotConner / Control</span><h1>Site branding</h1><p>Manage the browser icon and Scout loading-screen artwork. The main website header uses the SkyShotConner text wordmark.</p></div><a className="admin-link" href="/">View store ↗</a></header>
    <div style={{display:'grid',gap:18}}>
      {assets.map(asset=>{
        const item=current[asset.key]
        const selected=files[asset.key]
        return <section className="admin-card" key={asset.key}>
          <div className="admin-card-head"><div><span className="eyebrow">{asset.eyebrow}</span><h2>{asset.label}</h2><p>{asset.description}</p></div></div>
          <div className="admin-form">
            {item?.image_url&&<div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',minWidth:120,minHeight:120,padding:16,background:'#0a0a09',border:'1px solid #30302b'}}><img src={item.image_url} alt={`Current ${asset.label}`} style={{width:asset.key==='favicon'?96:140,height:asset.key==='favicon'?96:140,objectFit:'contain'}}/></div>}
            <p style={{margin:0,opacity:.72,fontSize:13}}>{asset.recommendation}</p>
            <label>Choose image<input type="file" accept="image/png,image/webp,image/jpeg,.ico" onChange={e=>setFiles(f=>({...f,[asset.key]:e.target.files?.[0]||null}))}/></label>
            {selected&&<p className="admin-message">Selected: {selected.name}</p>}
            <button className="admin-button" disabled={!selected||busy!==null} onClick={()=>save(asset.key)}>{busy===asset.key?'Uploading…':`Save ${asset.label}`}</button>
            {messages[asset.key]&&<p className="admin-message">{messages[asset.key]}</p>}
          </div>
        </section>
      })}
    </div>
  </main>
}
