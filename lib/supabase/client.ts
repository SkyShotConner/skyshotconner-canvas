import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null
  return createBrowserClient<Database>(url, key)
}

export const storageUrl = (path: string, bucket = 'product-images') => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base || !path) return ''
  return `${base}/storage/v1/object/public/${bucket}/${path}`
}

export const siteImageUrl = (path: string) => storageUrl(path, 'site-images')
