import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import GalleryClient, { type GalleryPhoto } from './GalleryClient'
import './images.css'

export const metadata: Metadata = {
  title: 'Images — SkyShotConner',
  description: 'A collection of aviation, wildlife and nature photography by SkyShotConner.',
}
export const revalidate = 0

export default async function ImagesPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('gallery_images')
    .select('id, display_path, original_path, alt_text, width, height, display_order')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  const photos: GalleryPhoto[] = []
  for (const item of data || []) {
    const [{ data: display }, { data: original }] = await Promise.all([
      supabase.storage.from('gallery-images').createSignedUrl(item.display_path, 3600),
      supabase.storage.from('gallery-images').createSignedUrl(item.original_path, 3600),
    ])
    if (display?.signedUrl && original?.signedUrl) {
      photos.push({
        id: item.id,
        src: display.signedUrl,
        full: original.signedUrl,
        alt: item.alt_text || 'SkyShotConner photograph',
        width: item.width || 1200,
        height: item.height || 800,
      })
    }
  }

  return (
    <main className="images-page">
      <header className="images-topbar">
        <Link href="/" aria-label="SkyShotConner home">SKYSHOTCONNER</Link>
        <Link href="/" className="images-back">Back to website ↗</Link>
      </header>
      <GalleryClient photos={photos} />
    </main>
  )
}
