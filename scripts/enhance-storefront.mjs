import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// Use Next.js routing for real client-side navigation. This prevents the
// catch-all storefront page from rendering a placeholder when navigating to
// dedicated routes such as /contact, /faq, /terms and /privacy.
s=s.replace("import { useEffect, useMemo, useState } from 'react'", "import { useEffect, useMemo, useState } from 'react'\nimport { useRouter } from 'next/navigation'")
s=s.replace("export default function Site(){\n", "export default function Site(){\n const router=useRouter()\n")
s=s.replace("const nav=(to:string)=>{window.history.pushState({},'',to);setPath(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}", "const nav=(to:string)=>{router.push(to);setPath(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}")

s=s.replace("orientation?:'portrait'|'landscape';images:string[]","orientation?:'portrait'|'landscape';limited_edition?:boolean;images:string[]")
s=s.replace("category_id,orientation,product_images(storage_path,sort_order,is_primary)","category_id,orientation,limited_edition,product_images(storage_path,sort_order,is_primary)")
s=s.replace("orientation:p.orientation||'landscape',images:","orientation:p.orientation||'landscape',limited_edition:!!p.limited_edition,images:")
s=s.replace("className={'product-image-wrap '+(p.orientation==='portrait'?'portrait':'landscape')}","className={'product-image-wrap '+(p.orientation==='portrait'?'portrait':'landscape')+(p.limited_edition?' limited-edition':'')}")

s=s.replace("const [saving,setSaving]=useState(false);const [message,setMessage]=useState('');useEffect", "const [saving,setSaving]=useState(false);const [message,setMessage]=useState('');const emailVerified=!!user?.email_confirmed_at;useEffect")
s=s.replace('<label>Email address<input type="email" value={email}', '<label>Email address <span className={emailVerified?"verification-status verified":"verification-status"}>{emailVerified?"✓ Verified":"Not verified"}</span><input type="email" value={email}')

// Remove the redundant toolbar Filter control because the collection already
// has the dedicated All / Landscape / Portrait / Limited Edition controls.
s=s.replace(/<div className="filter-wrap">.*?<\/div><\/div><\/div><div className="shop-grid">/s, '</div></div><div className="shop-grid">')

// Remove every legacy Shipping / Shipping & Returns footer link, allowing for
// capitalization and minor JSX formatting differences.
s=s.replace(/<button[^>]*nav\(['\"]\/shipping-returns['\"]\)[^>]*>[^<]*shipping[^<]*<\/button>\s*<br\s*\/?>/gi,'')
s=s.replace(/<a[^>]*href=['\"]\/shipping-returns['\"][^>]*>[^<]*shipping[^<]*<\/a>\s*<br\s*\/?>/gi,'')
s=s.replace(/<button[^>]*nav\(['\"]\/shipping-returns['\"]\)[^>]*>[^<]*shipping[^<]*<\/button>/gi,'')
s=s.replace(/<a[^>]*href=['\"]\/shipping-returns['\"][^>]*>[^<]*shipping[^<]*<\/a>/gi,'')

// Load static website imagery from Supabase so administrators can replace
// homepage photography without changing source code.
s=s.replace("const [products,setProducts]=useState<Product[]>(demoProducts)", "const [products,setProducts]=useState<Product[]>(demoProducts),[siteImages,setSiteImages]=useState<Record<string,string>>({})")
s=s.replace("useEffect(()=>{if(!supabase)return;supabase.from('products').select('id,name,slug,price,short_description,description,category_id,product_images(storage_path)').eq('is_active',true).then(({data})=>", "useEffect(()=>{if(!supabase)return;supabase.from('site_images').select('key,image_url').then(({data})=>{if(data)setSiteImages(Object.fromEntries(data.filter((x:any)=>x.image_url).map((x:any)=>[x.key,x.image_url])))});supabase.from('products').select('id,name,slug,price,short_description,description,category_id,product_images(storage_path)').eq('is_active',true).then(({data})=>")
s=s.replace("const nav=(to:string)=>", "const siteImage=(key:string,fallback:string)=>siteImages[key]||fallback\n const nav=(to:string)=>")
s=s.replace("<img className=\"hero-img\" src={FALLBACK}", "<img className=\"hero-img\" src={siteImage('home_hero',FALLBACK)}")
s=s.replace("<Scene title=\"C O M M E R C I A L\" image={editorial.commercial}", "<Scene title=\"C O M M E R C I A L\" image={siteImage('home_commercial',editorial.commercial)}")
s=s.replace("<Scene title=\"M I L I T A R Y\" image={editorial.military}", "<Scene title=\"M I L I T A R Y\" image={siteImage('home_military',editorial.military)}")
s=s.replace("<Scene title=\"H I S T O R I C\" image={editorial.historic}", "<Scene title=\"H I S T O R I C\" image={siteImage('home_historic',editorial.historic)}")
s=s.replace("<Scene title=\"C O C K P I T\" image={editorial.cockpit}", "<Scene title=\"C O C K P I T\" image={siteImage('home_cockpit',editorial.cockpit)}")
s=s.replace("<img src={FALLBACK} alt=\"Classic aircraft in cinematic light\"", "<img src={siteImage('home_editorial',FALLBACK)} alt=\"Classic aircraft in cinematic light\"")

fs.writeFileSync(file,s)
console.log('Storefront enhancement patch applied')
