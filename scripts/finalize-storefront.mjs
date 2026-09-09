import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

s=s.replace(/^'use client'\s*\n?/m,'')
s=s.replace(/^import\s*\{[^}]*\}\s*from ['"]next\/navigation['"];?\s*\n?/m,'')
s="'use client'\n\nimport { useRouter, usePathname } from 'next/navigation'\n"+s.replace(/^\s*\n/,'')

const pathPattern=/const \[path,setPath\]=useState\(typeof window!=='undefined'\?window\.location\.pathname:'\/'\)/
if(pathPattern.test(s)) s=s.replace(pathPattern,"const router=useRouter(),path=usePathname()")
else if(!/const router=useRouter\(\),path=usePathname\(\)/.test(s)) throw new Error('Unable to establish App Router navigation state')

s=s.replace(/\s*useEffect\(\(\)=>\{const on=\(\)=>setPath\(window\.location\.pathname\);window\.addEventListener\('popstate',on\);return\(\)=>window\.removeEventListener\('popstate',on\)\},\[\]\)/,'')
s=s.replace(/const nav=\(to:string\)=>\{window\.history\.pushState\(\{\},'',to\);setPath\(to\);setMenu\(false\);setSearchOpen\(false\);window\.scrollTo\(0,0\)\}/,"const nav=(to:string)=>{router.push(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}")
s=s.replace(/const nav=\(to:string\)=>\{router\.push\(to\);setMenu\(false\);setSearchOpen\(false\);window\.scrollTo\(0,0\)\}/,"const nav=(to:string)=>{router.push(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}")

const stateAnchor="const [products,setProducts]=useState<Product[]>(demoProducts)"
if(!/\[siteImages,setSiteImages\]/.test(s)){
  if(!s.includes(stateAnchor)) throw new Error('Unable to locate storefront product state')
  s=s.replace(stateAnchor,stateAnchor+",[siteImages,setSiteImages]=useState<Record<string,string>>({}),[siteImagesReady,setSiteImagesReady]=useState(false)")
}

if(!/supabase\.from\('site_images'\)/.test(s)){
  const anchor=" useEffect(()=>{if(!supabase)return;supabase.from('products')"
  const pos=s.indexOf(anchor)
  if(pos<0) throw new Error('Unable to locate storefront product effect')
  const effect=" useEffect(()=>{if(!supabase){setSiteImagesReady(true);return}supabase.from('site_images').select('key,image_url').then(({data,error})=>{if(error){console.error('site_images load failed',error);setSiteImagesReady(true);return}setSiteImages(Object.fromEntries((data||[]).filter((x:any)=>x.image_url).map((x:any)=>[x.key,x.image_url])));setSiteImagesReady(true)},()=>setSiteImagesReady(true))},[supabase])\n"
  s=s.slice(0,pos)+effect+s.slice(pos)
}

s=s.replace('<Home nav={nav} products={products}/>','<Home nav={nav} products={products} siteImages={siteImages} siteImagesReady={siteImagesReady}/>')
s=s.replace('<Home nav={nav} products={products} siteImages={siteImages}/>','<Home nav={nav} products={products} siteImages={siteImages} siteImagesReady={siteImagesReady}/>')
s=s.replace(/\{if\(!siteImagesReady\)return <main className="site-loading" aria-label="Loading SkyShotConner"\/>;/g,'')
s=s.replace(/function Home\(([^\n]+)\)return /, 'function Home($1){return ')

if(!/function siteImage\(/.test(s)){
  const anchor="function imgFor(p:Product){"
  if(!s.includes(anchor)) throw new Error('Unable to locate image helper anchor')
  s=s.replace(anchor,"function siteImage(images:Record<string,string>,key:string,fallback:string){return images[key]||fallback}\n"+anchor)
}

s=s.replace("type Product={id:string;name:string;slug:string;price:number;short_description?:string|null;description?:string|null;category?:string|null;images:string[]}","type Product={id:string;name:string;slug:string;price:number;short_description?:string|null;description?:string|null;category?:string|null;images:string[];orientation?:'landscape'|'portrait';limited_edition?:boolean}")
s=s.replace("supabase.from('products').select('id,name,slug,price,short_description,description,category_id,product_images(storage_path)').eq('is_active',true)","supabase.from('products').select('id,name,slug,price,short_description,description,category_id,orientation,limited_edition,category:categories(name),product_images(storage_path)').eq('is_active',true)")
s=s.replace("images:(p.product_images||[]).map((x:any)=>x.storage_path),price:349","images:(p.product_images||[]).map((x:any)=>x.storage_path),orientation:p.orientation==='portrait'?'portrait':'landscape',limited_edition:!!p.limited_edition,price:Number(p.price)||349")
s=s.replace("category:p.category_id,orientation:p.orientation||'landscape'","category:p.category?.name||'Aviation Art',orientation:p.orientation||'landscape'")

s=s.replace("function ProductCard({p,nav,small=false}:{p:Product;nav:(x:string)=>void;small?:boolean})","function ProductCard({p,nav,small=false,layout}:{p:Product;nav:(x:string)=>void;small?:boolean;layout?:'landscape'|'portrait'})")
s=s.replace("(p.orientation==='portrait'?'portrait':'landscape')","(layout||p.orientation||'landscape')")

if(!/function orderCollectionProducts\(/.test(s)){
  const anchor='function Shop('
  const helper="function orderCollectionProducts(products:Product[]){const landscape=products.filter(p=>p.orientation!=='portrait'),portrait=products.filter(p=>p.orientation==='portrait');const out:Product[]=[];let l=0,r=0;while(l<landscape.length||r<portrait.length){for(let i=0;i<2&&l<landscape.length;i++)out.push(landscape[l++]);for(let i=0;i<3&&r<portrait.length;i++)out.push(portrait[r++]);}return out}\n"
  if(!s.includes(anchor)) throw new Error('Unable to locate Shop component')
  s=s.replace(anchor,helper+anchor)
}
s=s.replace("function Shop({products,nav,query,setQuery,filter,setFilter,filterOpen,setFilterOpen,categories}:{products:Product[];nav:(x:string)=>void;query:string;setQuery:(x:string)=>void;filter:string;setFilter:(x:string)=>void;filterOpen:boolean;setFilterOpen:(x:boolean)=>void;categories:string[]}){return <main", "function Shop({products,nav,query,setQuery,filter,setFilter,filterOpen,setFilterOpen,categories}:{products:Product[];nav:(x:string)=>void;query:string;setQuery:(x:string)=>void;filter:string;setFilter:(x:string)=>void;filterOpen:boolean;setFilterOpen:(x:boolean)=>void;categories:string[]}){const orderedProducts=orderCollectionProducts(products);return <main")
s=s.replace('{products.length?products.map(p=><ProductCard key={p.id} p={p} nav={nav}/>:<div className="notice empty-search">','{orderedProducts.length?orderedProducts.map((p,i)=><ProductCard key={p.id} p={p} nav={nav} layout={i%5<2?\'landscape\':\'portrait\'}/>):<div className="notice empty-search">')

const aboutStart=s.indexOf('function About(')
const simpleStart=s.indexOf('function SimplePage(',aboutStart)
if(aboutStart>=0&&simpleStart>aboutStart){
  const aboutFn=`function About(){const [images,setImages]=useState<Record<string,string>>({});const [ready,setReady]=useState(false);const supabase=useMemo(()=>createClient(),[]);useEffect(()=>{if(!supabase){setReady(true);return}supabase.from('site_images').select('key,image_url').in('key',['about_hero','about_main','about_secondary']).then(({data})=>{setImages(Object.fromEntries((data||[]).filter((x:any)=>x.image_url).map((x:any)=>[x.key,x.image_url])));setReady(true)},()=>setReady(true))},[supabase]);if(!ready)return <main className="site-loading" aria-label="Loading SkyShotConner"/>;return <main><section className="hero about-hero"><img className="hero-img" src={images.about_hero||FALLBACK} alt="SkyShotConner aviation story"/><div className="hero-copy"><div className="eyebrow">About SkyShotConner</div><h1 className="display">WHY<br/>WE FLY.</h1></div></section><section className="paper about-paper"><div className="container"><div className="about-story"><div className="editorial-copy"><div className="eyebrow">The photography</div><h2>Moments become objects.</h2><p>SkyShotConner turns the split second of an aircraft in light, motion and atmosphere into collectible wall art. The aim is simple: make aviation feel as powerful in a room as it feels in the sky.</p></div><img src={images.about_main||FALLBACK} alt="SkyShotConner aviation photography"/></div><div className="about-story second"><img src={images.about_secondary||FALLBACK} alt="Aviation photography"/><div className="editorial-copy"><div className="eyebrow">Your story</div><h2>Built around the aircraft you love.</h2><p>Every SkyShotConner canvas begins with original aviation photography and is prepared as premium wall art for aviation enthusiasts and collectors.</p></div></div></div></section></main>}`
  s=s.slice(0,aboutStart)+aboutFn+s.slice(simpleStart)
}

s=s.replace(/<button[^>]*>\s*Shipping\s*<\/button>/gi,'')
s=s.replace(/<a[^>]*(?:href=["']\/shipping["'][^>]*)>\s*Shipping\s*<\/a>/gi,'')
s=s.replace(/<[^>]+onClick=\{\(\)=>nav\(["']\/shipping["']\)\}[^>]*>\s*Shipping\s*<\/[^>]+>/gi,'')

fs.writeFileSync(file,s)
console.log('Storefront finalized')
