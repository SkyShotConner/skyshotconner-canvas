'use client'

import { useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FaviconSync(){
  const supabase=useMemo(()=>createClient(),[])
  useEffect(()=>{
    if(!supabase)return
    let active=true
    ;(async()=>{
      const {data}=await supabase.from('site_images').select('image_url').eq('key','favicon').maybeSingle()
      if(!active||!data?.image_url)return
      let link=document.querySelector("link[rel~='icon']") as HTMLLinkElement|null
      if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link)}
      link.href=data.image_url
    })()
    return()=>{active=false}
  },[supabase])
  return null
}
