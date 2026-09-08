import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// Keep the client directive first, then provide the navigation hooks exactly once.
s=s.replace(/^'use client'\s*\n?/m,'')
s=s.replace(/^import\s*\{[^}]*\}\s*from ['"]next\/navigation['"];?\s*\n?/m,'')
s="'use client'\n\nimport { useRouter, usePathname } from 'next/navigation'\n"+s.replace(/^\s*\n/,'')

// The generated storefront must always have a router and a pathname.
const pathPattern=/const \[path,setPath\]=useState\(typeof window!=='undefined'\?window\.location\.pathname:'\/'\)/
if(pathPattern.test(s)){
  s=s.replace(pathPattern,"const router=useRouter(),path=usePathname()")
}else if(!/const router=useRouter\(\),path=usePathname\(\)/.test(s)){
  throw new Error('Unable to establish App Router navigation state')
}

// Remove the obsolete popstate listener left by the legacy client-side router.
s=s.replace(/\s*useEffect\(\(\)=>\{const on=\(\)=>setPath\(window\.location\.pathname\);window\.addEventListener\('popstate',on\);return\(\)=>window\.removeEventListener\('popstate',on\)\},\[\]\)/,'')

// Ensure navigation uses Next.js routing instead of mutating browser history.
s=s.replace(/const nav=\(to:string\)=>\{window\.history\.pushState\(\{\},'',to\);setPath\(to\);setMenu\(false\);setSearchOpen\(false\);window\.scrollTo\(0,0\)\}/,"const nav=(to:string)=>{router.push(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}")
s=s.replace(/const nav=\(to:string\)=>\{router\.push\(to\);setMenu\(false\);setSearchOpen\(false\);window\.scrollTo\(0,0\)\}/,"const nav=(to:string)=>{router.push(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}")

// Home is generated with the site-image props. Keep its call site in sync.
s=s.replace(/<Home\s+nav=\{nav\}\s+products=\{products\}(?:\s+siteImages=\{siteImages\}\s+siteImagesReady=\{siteImagesReady\})?\s*\/>/g,'<Home nav={nav} products={products} siteImages={siteImages} siteImagesReady={siteImagesReady}/>')

// If the image state was not inserted by the enhancer, add the minimal state/effect
// required by the generated Home component.
if(/siteImages=\{siteImages\}/.test(s) && !/\[siteImages,setSiteImages\]/.test(s)){
  const anchor="const [products,setProducts]=useState<Product[]>(demoProducts)"
  if(!s.includes(anchor)) throw new Error('Unable to locate storefront product state')
  s=s.replace(anchor,anchor+",[siteImages,setSiteImages]=useState<Record<string,string>>({}),[siteImagesReady,setSiteImagesReady]=useState(false)")
}

if(/siteImages=\{siteImages\}/.test(s) && !/siteImagesReady/.test(s.split('const subtotal=')[0])){
  const anchor=' useEffect(()=>{if(!supabase)return;supabase.from(\'products\')'
  const pos=s.indexOf(anchor)
  if(pos<0) throw new Error('Unable to locate storefront product effect')
  const effect=" useEffect(()=>{if(!supabase){setSiteImagesReady(true);return}supabase.from('site_images').select('key,image_url').then(async({data,error})=>{if(error){console.error('site_images load failed',error);setSiteImagesReady(true);return}const images=Object.fromEntries((data||[]).filter((x:any)=>x.image_url).map((x:any)=>[x.key,x.image_url]));setSiteImages(images);await Promise.all(Object.values(images).map((src:any)=>new Promise<void>(resolve=>{const im=new Image();im.onload=()=>resolve();im.onerror=()=>resolve();im.src=src})));setSiteImagesReady(true)});},[supabase])\n"
  s=s.slice(0,pos)+effect+s.slice(pos)
}

fs.writeFileSync(file,s)
console.log('Storefront finalized')
