import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

s=s.replace("import { useEffect, useMemo, useState } from 'react'", "import { useEffect, useMemo, useState } from 'react'\nimport { useRouter } from 'next/navigation'")
s=s.replace("export default function Site(){\n", "function siteImage(images:Record<string,string>,key:string,fallback:string){return images[key]||fallback}\n\nexport default function Site(){\n const router=useRouter()\n")
s=s.replace("const nav=(to:string)=>{window.history.pushState({},'',to);setPath(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}", "const nav=(to:string)=>{router.push(to);setPath(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}")

s=s.replace("orientation?:'portrait'|'landscape';images:string[]","orientation?:'portrait'|'landscape';limited_edition?:boolean;images:string[]")
s=s.replace("category_id,orientation,product_images(storage_path,sort_order,is_primary)","category_id,orientation,limited_edition,product_images(storage_path,sort_order,is_primary)")
s=s.replace("orientation:p.orientation||'landscape',images:","orientation:p.orientation||'landscape',limited_edition:!!p.limited_edition,images:")
s=s.replace("className={'product-image-wrap '+(p.orientation==='portrait'?'portrait':'landscape')}","className={'product-image-wrap '+(p.orientation==='portrait'?'portrait':'landscape')+(p.limited_edition?' limited-edition':'')}")

s=s.replace("const [saving,setSaving]=useState(false);const [message,setMessage]=useState('');useEffect", "const [saving,setSaving]=useState(false);const [message,setMessage]=useState('');const emailVerified=!!user?.email_confirmed_at;useEffect")
s=s.replace('<label>Email address<input type="email" value={email}', '<label>Email address <span className={emailVerified?"verification-status verified":"verification-status"}>{emailVerified?"✓ Verified":"Not verified"}</span><input type="email" value={email}')

s=s.replace(/<div className="filter-wrap">.*?<\/div><\/div><\/div><div className="shop-grid">/s, '</div></div><div className="shop-grid">')
s=s.replace(/<button[^>]*nav\(['\"]\/shipping-returns['\"]\)[^>]*>[^<]*shipping[^<]*<\/button>\s*<br\s*\/?>/gi,'')
s=s.replace(/<a[^>]*href=['\"]\/shipping-returns['\"][^>]*>[^<]*shipping[^<]*<\/a>\s*<br\s*\/?>/gi,'')
s=s.replace(/<button[^>]*nav\(['\"]\/shipping-returns['\"]\)[^>]*>[^<]*shipping[^<]*<\/button>/gi,'')
s=s.replace(/<a[^>]*href=['\"]\/shipping-returns['\"][^>]*>[^<]*shipping[^<]*<\/a>/gi,'')

s=s.replace("const [products,setProducts]=useState<Product[]>(demoProducts)", "const [products,setProducts]=useState<Product[]>(demoProducts),[siteImages,setSiteImages]=useState<Record<string,string>>({})")
s=s.replace("useEffect(()=>{if(!supabase)return;supabase.from('products').select('id,name,slug,price,short_description,description,category_id,product_images(storage_path)').eq('is_active',true).then(({data})=>", "useEffect(()=>{if(!supabase)return;supabase.from('site_images').select('key,image_url').then(({data,error})=>{if(error)console.error('site_images load failed',error);else if(data)setSiteImages(Object.fromEntries(data.filter((x:any)=>x.image_url).map((x:any)=>[x.key,x.image_url])))});supabase.from('products').select('id,name,slug,price,short_description,description,category_id,product_images(storage_path)').eq('is_active',true).then(({data})=>")

s=s.replace("<Home nav={nav} products={products}/>", "<Home nav={nav} products={products} siteImages={siteImages}/>")
s=s.replace("function Home({nav,products}:{nav:(x:string)=>void;products:Product[]})", "function Home({nav,products,siteImages}:{nav:(x:string)=>void;products:Product[];siteImages:Record<string,string>})")
s=s.replace("<About/>", "<About siteImages={siteImages}/>")

// Replace the actual homepage fallback/editorial image references with editable site-image slots.
s=s.replace("src={FALLBACK} alt=\"Harvard aircraft turning through golden sunset\"", "src={siteImage(siteImages,'home_hero',FALLBACK)} alt=\"Harvard aircraft turning through golden sunset\"")
s=s.replace("image={editorial.commercial} eyebrow=\"01 / Modern aviation\"", "image={siteImage(siteImages,'home_commercial',editorial.commercial)} eyebrow=\"01 / Modern aviation\"")
s=s.replace("image={editorial.military} eyebrow=\"02 / Power & precision\"", "image={siteImage(siteImages,'home_military',editorial.military)} eyebrow=\"02 / Power & precision\"")
s=s.replace("image={editorial.historic} eyebrow=\"03 / Aviation heritage\"", "image={siteImage(siteImages,'home_historic',editorial.historic)} eyebrow=\"03 / Aviation heritage\"")
s=s.replace("image={editorial.cockpit} eyebrow=\"04 / Where flight begins\"", "image={siteImage(siteImages,'home_cockpit',editorial.cockpit)} eyebrow=\"04 / Where flight begins\"")
s=s.replace("<img src={FALLBACK} alt=\"Classic aircraft in cinematic light\"", "<img src={siteImage(siteImages,'home_editorial',FALLBACK)} alt=\"Classic aircraft in cinematic light\"")

// Robustly replace the entire About component regardless of its current prop signature.
const aboutStart=s.indexOf('function About(')
const simpleStart=s.indexOf('function SimplePage(',aboutStart)
if(aboutStart>=0&&simpleStart>aboutStart){
  const aboutFn=`function About({siteImages}:{siteImages:Record<string,string>}){return <main><section className="hero about-hero"><img className="hero-img" src={siteImage(siteImages,'about_hero',editorial.historic)} alt="SkyShotConner aviation story"/><div className="hero-copy"><div className="eyebrow">About SkyShotConner</div><h1 className="display">WHY<br/>WE FLY.</h1></div></section><section className="paper about-paper"><div className="container"><div className="about-story"><div className="editorial-copy"><div className="eyebrow">The photography</div><h2>Moments become objects.</h2><p>SkyShotConner turns the split second of an aircraft in light, motion and atmosphere into collectible wall art. The aim is simple: make aviation feel as powerful in a room as it feels in the sky.</p></div><img src={siteImage(siteImages,'about_main',FALLBACK)} alt="SkyShotConner aviation photography"/></div><div className="about-story second"><img src={siteImage(siteImages,'about_secondary',editorial.military)} alt="Aviation photography"/><div className="editorial-copy"><div className="eyebrow">Your story</div><h2>Built around the aircraft you love.</h2><p>Your photography can be replaced from the Website Images section of the admin panel.</p></div></div></div></section></main>}`
  s=s.slice(0,aboutStart)+aboutFn+s.slice(simpleStart)
}

fs.writeFileSync(file,s)
console.log('Storefront enhancement patch applied')