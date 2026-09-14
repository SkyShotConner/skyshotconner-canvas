'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { createClient, storageUrl } from '@/lib/supabase/client'
import '../special-collection.css'

type Location = { id:string; name:string; slug:string; description?:string|null; location_label?:string|null }
type Product = { id:string; name:string; slug:string; short_description?:string|null; orientation:'landscape'|'portrait'; images:string[]; exclusive:boolean; note?:string|null }

function Footer(){return <footer className="ssc-special-footer"><div className="ssc-special-footer-grid"><div><div className="ssc-special-brand">SKYSHOTCONNER</div><p style={{maxWidth:300}}>Aviation captured as art. Premium canvas pieces made for people who look up.</p></div><div><h3>Explore</h3><a href="/shop">Collection</a><br/><a href="/special-collection">Special Collection</a><br/><a href="/about">About</a></div><div><h3>Help</h3><a href="/contact">Contact</a><br/><a href="/faq">FAQ</a><br/><a href="/shipping-returns">Shipping</a></div><div><h3>Legal</h3><a href="/privacy">Privacy</a><br/><a href="/terms">Terms</a></div></div><div className="ssc-special-footer-bottom"><p>© {new Date().getFullYear()} SkyShotConner. The Art of Flight.</p></div></footer>}

export default function SpecialLocationPage({params}:{params:Promise<{slug:string}>}){
  const supabase=useMemo(()=>createClient(),[])
  const [slug,setSlug]=useState('')
  const [location,setLocation]=useState<Location|null>(null)
  const [products,setProducts]=useState<Product[]>([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{params.then(value=>setSlug(value.slug))},[params])

  useEffect(()=>{
    if(!supabase||!slug)return
    const client=supabase
    let active=true
    async function load(){
      const {data:locationData}=await client.from('special_locations').select('id,name,slug,description,location_label').eq('slug',slug).eq('is_active',true).maybeSingle()
      if(!active){return}
      if(!locationData){setLoading(false);return}
      setLocation(locationData as Location)

      const {data:links}=await client.from('special_collection_products').select('product_id,sort_order,is_exclusive,note').eq('location_id',locationData.id).order('sort_order',{ascending:true})
      const orderedLinks=links||[]
      const ids=orderedLinks.map((link:any)=>link.product_id)
      if(ids.length===0){setProducts([]);setLoading(false);return}

      const {data:productData}=await client.from('products').select('id,name,slug,short_description,orientation,product_images(storage_path,is_primary,sort_order)').in('id',ids).eq('is_active',true)
      const byId=new Map((productData||[]).map((product:any)=>[product.id,product]))
      const mapped:Product[]=orderedLinks.map((link:any)=>{
        const product:any=byId.get(link.product_id)
        if(!product)return null
        const images=(product.product_images||[]).slice().sort((a:any,b:any)=>Number(Boolean(b.is_primary))-Number(Boolean(a.is_primary))||(a.sort_order||0)-(b.sort_order||0)).map((image:any)=>image.storage_path)
        return {id:product.id,name:product.name,slug:product.slug,short_description:product.short_description,orientation:product.orientation,images,exclusive:Boolean(link.is_exclusive),note:link.note}
      }).filter(Boolean) as Product[]
      setProducts(mapped)
      setLoading(false)
    }
    load()
    return()=>{active=false}
  },[supabase,slug])

  const imageFor=(product:Product)=>{const image=product.images[0];return image?(image.startsWith('http')?image:storageUrl(image)):''}

  return <div className="ssc-special-page">
    <header className="ssc-special-nav"><a className="ssc-special-brand" href="/">SKYSHOTCONNER</a><nav className="ssc-special-links"><a href="/shop">Collection</a><a href="/special-collection">Special Collection</a><a href="/about">About</a></nav></header>
    <main className="ssc-special-shell">
      <a className="ssc-special-back" href="/special-collection"><ArrowLeft size={13}/> All special locations</a>
      {loading&&<div className="ssc-special-empty">Loading collection…</div>}
      {!loading&&!location&&<div className="ssc-special-empty">This special collection could not be found.</div>}
      {!loading&&location&&<><section className="ssc-location-hero"><div><div className="ssc-special-eyebrow">Special Collection / Location</div><h1>{location.name.toUpperCase()}.</h1></div><div><div className="ssc-location-label">{location.location_label}</div><p className="ssc-location-copy">{location.description}</p></div></section><section className="ssc-special-products"><div className="ssc-special-products-head"><h2>Available artworks.</h2><span>{products.length} pieces</span></div>{products.length>0?<div className="ssc-special-grid">{products.map(product=><a href={`/product/${product.slug}`} className={`ssc-special-product ${product.orientation}`} key={product.id}>{imageFor(product)?<img src={imageFor(product)} alt={product.name}/>:<div className="ssc-special-empty">Image unavailable</div>}<div className="ssc-special-product-meta"><div className="ssc-special-product-name">{product.name}</div><div className="ssc-special-product-note">{product.note||product.short_description||'Special collection artwork'}</div>{product.exclusive&&<div className="ssc-special-badge">Location Exclusive</div>}</div></a>)}</div>:<div className="ssc-special-empty">No artworks have been assigned to this location yet. Once a piece is added to the Special Collection, it will appear here automatically.</div>}</section></>}
    </main>
    <Footer/>
  </div>
}
