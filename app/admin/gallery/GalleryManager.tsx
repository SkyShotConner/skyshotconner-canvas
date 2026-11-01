'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Photo = { id:string; original_path:string; display_path:string; alt_text:string; width:number|null; height:number|null; is_published:boolean; display_order:number; preview?:string; private_note?:string }

async function makeDisplayImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 2200 / bitmap.width)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not prepare the display image.')
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not create the WebP preview.')), 'image/webp', 0.86))
  return { blob, width, height }
}

export default function GalleryManager() {
  const supabase = useMemo(() => createClient(), [])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [altText, setAltText] = useState('')
  const [privateNote, setPrivateNote] = useState('')

  const load = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('gallery_images').select('id,original_path,display_path,alt_text,width,height,is_published,display_order').order('display_order').order('created_at', { ascending:false })
    if (error) { setMessage(error.message); return }
    const { data: notes } = await supabase.from('gallery_image_notes').select('image_id,private_note')
    const noteMap = new Map((notes || []).map((n:any) => [n.image_id, n.private_note]))
    const rows = await Promise.all((data || []).map(async (item:any) => {
      const { data: signed } = await supabase.storage.from('gallery-images').createSignedUrl(item.display_path, 3600)
      return { ...item, preview:signed?.signedUrl || '', private_note:noteMap.get(item.id) || '' }
    }))
    setPhotos(rows)
  }, [supabase])

  useEffect(() => { void load() }, [load])

  async function upload() {
    if (!supabase || !files.length) return
    setBusy(true); setMessage('')
    const uploaded: string[] = []
    const createdIds: string[] = []
    try {
      for (const file of files) {
        if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error(`${file.name}: use JPEG, PNG or WebP.`)
        if (file.size > 20 * 1024 * 1024) throw new Error(`${file.name}: maximum file size is 20 MB.`)
        const prepared = await makeDisplayImage(file)
        const id = crypto.randomUUID()
        const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/\.[^.]+$/, '')
        const originalPath = `original/${id}-${safe}`
        const displayPath = `display/${id}.webp`
        const originalUpload = await supabase.storage.from('gallery-images').upload(originalPath, file, { upsert:false, contentType:file.type })
        if (originalUpload.error) throw originalUpload.error
        uploaded.push(originalPath)
        const displayUpload = await supabase.storage.from('gallery-images').upload(displayPath, prepared.blob, { upsert:false, contentType:'image/webp' })
        if (displayUpload.error) throw displayUpload.error
        uploaded.push(displayPath)
        const { data: row, error } = await supabase.from('gallery_images').insert({
          original_path:originalPath, display_path:displayPath,
          alt_text:altText.trim() || file.name.replace(/\.[^.]+$/, ''),
          width:prepared.width, height:prepared.height, is_published:false,
          display_order:photos.length + uploaded.length
        }).select('id').single()
        if (error) throw error
        createdIds.push(row.id)
        if (privateNote.trim()) {
          const noteResult = await supabase.from('gallery_image_notes').insert({ image_id:row.id, private_note:privateNote.trim() })
          if (noteResult.error) throw noteResult.error
        }
      }
      setFiles([]); setAltText(''); setPrivateNote('')
      await load()
      setMessage('Photographs uploaded as drafts. Publish each one when you are ready.')
    } catch (error:any) {
      setMessage(error?.message || 'Upload failed.')
      if (createdIds.length) await supabase.from('gallery_images').delete().in('id', createdIds)
      if (uploaded.length) await supabase.storage.from('gallery-images').remove(uploaded)
    } finally { setBusy(false) }
  }

  async function updatePhoto(photo:Photo, patch:Partial<Photo>) {
    if (!supabase) return
    setBusy(true); setMessage('')
    const { error } = await supabase.from('gallery_images').update({
      ...(patch.is_published !== undefined ? {is_published:patch.is_published} : {}),
      ...(patch.display_order !== undefined ? {display_order:patch.display_order} : {}),
      ...(patch.alt_text !== undefined ? {alt_text:patch.alt_text} : {}),
      updated_at:new Date().toISOString()
    }).eq('id',photo.id)
    if (error) setMessage(error.message)
    else { await load(); setMessage('Gallery updated.') }
    setBusy(false)
  }

  async function movePhoto(index:number, direction:-1|1) {
    if (!supabase) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= photos.length) return
    const current = photos[index], neighbor = photos[targetIndex]
    setBusy(true); setMessage('')
    const results = await Promise.all([
      supabase.from('gallery_images').update({display_order:neighbor.display_order}).eq('id',current.id),
      supabase.from('gallery_images').update({display_order:current.display_order}).eq('id',neighbor.id),
    ])
    const error = results.find(result => result.error)?.error
    if (error) setMessage(error.message)
    else { await load(); setMessage('Photograph order updated.') }
    setBusy(false)
  }

  async function saveNote(photo:Photo) {
    if (!supabase) return
    setBusy(true)
    const { error } = await supabase.from('gallery_image_notes').upsert({image_id:photo.id,private_note:photo.private_note || '',updated_at:new Date().toISOString()},{onConflict:'image_id'})
    setMessage(error?.message || 'Private note saved.')
    setBusy(false)
  }

  async function removePhoto(photo:Photo) {
    if (!supabase || !window.confirm('Permanently delete this photograph and its stored files?')) return
    setBusy(true)
    const { error } = await supabase.storage.from('gallery-images').remove([photo.original_path,photo.display_path])
    if (error) { setMessage(error.message); setBusy(false); return }
    const { error: rowError } = await supabase.from('gallery_images').delete().eq('id',photo.id)
    setMessage(rowError?.message || 'Photograph deleted.')
    await load(); setBusy(false)
  }

  return <section className="admin-card gallery-manager">
    <div className="admin-card-head"><div><span className="eyebrow">Image library</span><h2>Manage photographs</h2><p>Original files are preserved. A smaller WebP copy is used in the public gallery. Uploads start unpublished.</p></div><button className="admin-button secondary-admin" onClick={() => void load()}>Refresh</button></div>
    <div className="gallery-upload">
      <label>Choose photographs<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>setFiles(Array.from(e.target.files || []))}/></label>
      <label>Accessibility text (optional)<input value={altText} onChange={e=>setAltText(e.target.value)} placeholder="Describe the selected photographs"/></label>
      <label>Private admin note (optional)<textarea value={privateNote} onChange={e=>setPrivateNote(e.target.value)} placeholder="Visible only to administrators"/></label>
      <button className="admin-button" disabled={busy || !files.length} onClick={() => void upload()}>{busy?'Working…':`Upload ${files.length || ''} photograph${files.length===1?'':'s'}`}</button>
      {files.length>0 && <small>{files.length} file(s) selected. Maximum 20 MB each.</small>}
    </div>
    {photos.length===0 ? <div className="admin-empty"><h2>No photographs yet.</h2><p>Upload your first images to begin building the gallery.</p></div> : <div className="gallery-admin-list">
      {photos.map((photo,index)=><article className="gallery-admin-item" key={photo.id}>
        <div className="gallery-admin-preview">{photo.preview && <img src={photo.preview} alt={photo.alt_text}/>}</div>
        <div className="gallery-admin-details">
          <div className="gallery-admin-status"><span>{photo.is_published?'Published':'Draft'}</span><span>Position {index+1}</span></div>
          <label>Alt text<input value={photo.alt_text} onChange={e=>setPhotos(rows=>rows.map(row=>row.id===photo.id?{...row,alt_text:e.target.value}:row))}/></label>
          <label>Private note<textarea value={photo.private_note || ''} onChange={e=>setPhotos(rows=>rows.map(row=>row.id===photo.id?{...row,private_note:e.target.value}:row))}/></label>
          <div className="gallery-admin-actions">
            <button className="admin-button secondary-admin" disabled={busy || index===0} onClick={()=>void movePhoto(index,-1)}>Move up</button>
            <button className="admin-button secondary-admin" disabled={busy || index===photos.length-1} onClick={()=>void movePhoto(index,1)}>Move down</button>
            <button className="admin-button secondary-admin" disabled={busy} onClick={()=>void updatePhoto(photo,{alt_text:photo.alt_text})}>Save alt text</button>
            <button className="admin-button secondary-admin" disabled={busy} onClick={()=>void saveNote(photo)}>Save note</button>
            <button className="admin-button" disabled={busy} onClick={()=>void updatePhoto(photo,{is_published:!photo.is_published})}>{photo.is_published?'Unpublish':'Publish'}</button>
            <button className="admin-button danger-admin" disabled={busy} onClick={()=>void removePhoto(photo)}>Delete</button>
          </div>
        </div>
      </article>)}
    </div>}
    {message && <p className="admin-message">{message}</p>}
  </section>
}
