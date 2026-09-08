import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// Use Next.js routing for real client-side navigation. This prevents the
// catch-all storefront page from rendering a placeholder when navigating to
// dedicated routes such as /contact, /faq, /terms and /privacy.
s=s.replace("import { useEffect, useMemo, useState } from 'react'", "import { useEffect, useMemo, useState } from 'react'\nimport { useRouter } from 'next/navigation'")
s=s.replace("export default function Site(){\n", "function siteImage(images:Record<string,string>,key:string,fallback:string){return images[key]||fallback}\n\nexport default function Site(){\n const router=useRouter()\n")
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

// Load editable website imagery from Supabase. Product imagery remains in the
// product-images system and is intentionally not included here.
s=s.replace("const [products,setProducts]=useState<Product[]>(demoProducts)", "const [products,setProducts]=useState<Product[]>(demoProducts),[siteImages,setSiteImages]=useState<Record<string,string>>({})")
s=s.replace("useEffect(()=>{if(!supabase)return;supabase.from('products').select('id,name,slug,price,short_description,description,category_id,product_images(storage_path)').eq('is_active',true).then(({data})=>", "useEffect(()=>{if(!supabase)return;supabase.from('site_images').select('key,image_url').then(({data})=>{if(data)setSiteImages(Object.fromEntries(data.filter((x:any)=>x.image_url).map((x:any)=>[x.key,x.image_url])))});supabase.from('products').select('id,name,slug,price,short_description,description,category_id,product_images(storage_path)').eq('is_active',true).then(({data})=>")

// Pass the loaded site images into image-using storefront pages.
s=s.replace("<Home nav={nav} products={products}/>", "<Home nav={nav} products={products} siteImages={siteImages}/>")
s=s.replace("function Home({nav,products}:{nav:(x:string)=>void;products:Product[]})", "function Home({nav,products,siteImages}:{nav:(x:string)=>void;products:Product[];siteImages:Record<string,string>})")
s=s.replace("<About/>", "<About siteImages={siteImages}/>")

s=s.replace("src={siteImage('home_hero',FALLBACK)}", "src={siteImage(siteImages,'home_hero',FALLBACK)}")
s=s.replace("image={siteImage('home_commercial',editorial.commercial)}", "image={siteImage(siteImages,'home_commercial',editorial.commercial)}")
s=s.replace("image={siteImage('home_military',editorial.military)}", "image={siteImage(siteImages,'home_military',editorial.military)}")
s=s.replace("image={siteImage('home_historic',editorial.historic)}", "image={siteImage(siteImages,'home_historic',editorial.historic)}")
s=s.replace("image={siteImage('home_cockpit',editorial.cockpit)}", "image={siteImage(siteImages,'home_cockpit',editorial.cockpit)}")
s=s.replace("src={siteImage('home_editorial',FALLBACK)}", "src={siteImage(siteImages,'home_editorial',FALLBACK)}")

// Replace the old About-page localStorage image editor with the same Supabase
// website-image system used by the homepage. This keeps all non-product images
// editable from one admin area and removes browser-local-only settings.
s=s.replace(/function About\(\)\{.*?\}function SimplePage/s, `function About({siteImages}:{siteImages:Record<string,string>}){return <main><section className="hero about-hero"><img className="hero-img" src={siteImage(siteImages,'about_hero',editorial.historic)} alt="SkyShotConner aviation story"/><div className="hero-copy"><div className="eyebrow">About SkyShotConner</div><h1 className="display">WHY<br/>WE FLY.</h1></div></section><section className="paper about-paper"><div className="container"><div className="about-story"><div className="editorial-copy"><div className="eyebrow">The photography</div><h2>Moments become objects.</h2><p>SkyShotConner turns the split second of an aircraft in light, motion and atmosphere into collectible wall art. The aim is simple: make aviation feel as powerful in a room as it feels in the sky.</p></div><img src={siteImage(siteImages,'about_main',FALLBACK)} alt="SkyShotConner aviation photography"/></div><div className="about-story second"><img src={siteImage(siteImages,'about_secondary',editorial.military)} alt="Aviation photography"/><div className="editorial-copy"><div className="eyebrow">Your story</div><h2>Built around the aircraft you love.</h2><p>Your photography belongs here. Every image can be replaced from the Website Images section of the admin panel.</p></div></div></div></section></main>}function SimplePage`)

fs.writeFileSync(file,s)
console.log('Storefront enhancement patch applied')
