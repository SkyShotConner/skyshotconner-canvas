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

s=s.replace(/<Home\s+nav=\{nav\}\s+products=\{products\}(?:\s+siteImages=\{siteImages\}\s+siteImagesReady=\{siteImagesReady\})?\s*\/>/g,'<Home nav={nav} products={products} siteImages={siteImages} siteImagesReady={siteImagesReady}/>')

if(!/function siteImage\(/.test(s)){
  const anchor="function imgFor(p:Product){"
  if(!s.includes(anchor)) throw new Error('Unable to locate image helper anchor')
  s=s.replace(anchor,"function siteImage(images:Record<string,string>,key:string,fallback:string){return images[key]||fallback}\n"+anchor)
}

// Never make the entire homepage depend on the site_images request completing.
s=s.replace(/\{if\(!siteImagesReady\)return <main className="site-loading" aria-label="Loading SkyShotConner"\/>;/g,'')

s=s.replace(
  "type Product={id:string;name:string;slug:string;price:number;short_description?:string|null;description?:string|null;category?:string|null;images:string[]}",
  "type Product={id:string;name:string;slug:string;price:number;short_description?:string|null;description?:string|null;category?:string|null;images:string[];orientation?:'landscape'|'portrait';limited_edition?:boolean}"
)
s=s.replace(
  "supabase.from('products').select('id,name,slug,price,short_description,description,category_id,product_images(storage_path)').eq('is_active',true)",
  "supabase.from('products').select('id,name,slug,price,short_description,description,category_id,orientation,limited_edition,product_images(storage_path)').eq('is_active',true)"
)
s=s.replace(
  "images:(p.product_images||[]).map((x:any)=>x.storage_path),price:349",
  "images:(p.product_images||[]).map((x:any)=>x.storage_path),orientation:p.orientation==='portrait'?'portrait':'landscape',limited_edition:!!p.limited_edition,price:Number(p.price)||349"
)

s=s.replace(
  "<div className=\"product-image-wrap\"><img src={imgFor(p)}",
  "<div className={'product-image-wrap '+(p.orientation==='portrait'?'portrait':'landscape')}><img src={imgFor(p)}"
)

// Deterministic editorial sequence: 2 landscape cards, then 3 portrait cards,
// repeating. Products are grouped by their saved orientation so the artwork is
// never stretched into the wrong card shape.
if(!/function orderCollectionProducts\(/.test(s)){
  const anchor='function Shop('
  const helper="function orderCollectionProducts(products:Product[]){const landscape=products.filter(p=>p.orientation!=='portrait'),portrait=products.filter(p=>p.orientation==='portrait');const out:Product[]=[];let l=0,r=0;while(l<landscape.length||r<portrait.length){for(let i=0;i<2&&l<landscape.length;i++)out.push(landscape[l++]);for(let i=0;i<3&&r<portrait.length;i++)out.push(portrait[r++]);}return out}\n"
  if(!s.includes(anchor)) throw new Error('Unable to locate Shop component')
  s=s.replace(anchor,helper+anchor)
}
s=s.replace("function Shop({products,nav,query,setQuery,filter,setFilter,filterOpen,setFilterOpen,categories}:{products:Product[];nav:(x:string)=>void;query:string;setQuery:(x:string)=>void;filter:string;setFilter:(x:string)=>void;filterOpen:boolean;setFilterOpen:(x:boolean)=>void;categories:string[]}){return <main", "function Shop({products,nav,query,setQuery,filter,setFilter,filterOpen,setFilterOpen,categories}:{products:Product[];nav:(x:string)=>void;query:string;setQuery:(x:string)=>void;filter:string;setFilter:(x:string)=>void;filterOpen:boolean;setFilterOpen:(x:boolean)=>void;categories:string[]}){const orderedProducts=orderCollectionProducts(products);return <main")
s=s.replace('{products.length?products.map(p=><ProductCard key={p.id} p={p} nav={nav}/>:<div className="notice empty-search">','{orderedProducts.length?orderedProducts.map(p=><ProductCard key={p.id} p={p} nav={nav}/>:<div className="notice empty-search">')

if(/siteImages=\{siteImages\}/.test(s) && !/\[siteImages,setSiteImages\]/.test(s)){
  const anchor="const [products,setProducts]=useState<Product[]>(demoProducts)"
  if(!s.includes(anchor)) throw new Error('Unable to locate storefront product state')
  s=s.replace(anchor,anchor+",[siteImages,setSiteImages]=useState<Record<string,string>>({}),[siteImagesReady,setSiteImagesReady]=useState(false)")
}

if(/siteImages=\{siteImages\}/.test(s) && !/siteImagesReady/.test(s.split('const subtotal=')[0])){
  const anchor=" useEffect(()=>{if(!supabase)return;supabase.from('products')"
  const pos=s.indexOf(anchor)
  if(pos<0) throw new Error('Unable to locate storefront product effect')
  const effect=" useEffect(()=>{if(!supabase){setSiteImagesReady(true);return}supabase.from('site_images').select('key,image_url').then(async({data,error})=>{if(error){console.error('site_images load failed',error);setSiteImagesReady(true);return}const images=Object.fromEntries((data||[]).filter((x:any)=>x.image_url).map((x:any)=>[x.key,x.image_url]));setSiteImages(images);await Promise.all(Object.values(images).map((src:any)=>new Promise<void>(resolve=>{const im=new Image();im.onload=()=>resolve();im.onerror=()=>resolve();im.src=src})));setSiteImagesReady(true)});},[supabase])\n"
  s=s.slice(0,pos)+effect+s.slice(pos)
}

fs.writeFileSync(file,s)
console.log('Storefront finalized')
