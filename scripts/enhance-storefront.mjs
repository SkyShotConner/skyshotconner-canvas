import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// Stable App Router navigation: keep the router for push() and derive the current route from Next.
s=s.replace("import { useRouter } from 'next/navigation'", "import { useRouter, usePathname } from 'next/navigation'")
s=s.replace("const [path,setPath]=useState(typeof window!=='undefined'?window.location.pathname:'/'),[menu,setMenu]=useState(false)", "const router=useRouter(),path=usePathname(),[menu,setMenu]=useState(false)")
s=s.replace("const [path,setPath]=useState(typeof window!=='undefined'?window.location.pathname:'/'),", "const router=useRouter(),path=usePathname(),")
s=s.replace(" useEffect(()=>{const on=()=>setPath(window.location.pathname);window.addEventListener('popstate',on);return()=>window.removeEventListener('popstate',on)},[])", "")
s=s.replace("const nav=(to:string)=>{window.history.pushState({},'',to);setPath(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}", "const nav=(to:string)=>{router.push(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}")

// Site-image loading: preload custom images before the homepage renders so fallback/old images never flash first.
const oldState="const [siteImages,setSiteImages]=useState<Record<string,string>>({})"
const newState="const [siteImages,setSiteImages]=useState<Record<string,string>>({}),[siteImagesReady,setSiteImagesReady]=useState(false)"
s=s.replace(oldState,newState)
const oldEffect="useEffect(()=>{if(!supabase)return;supabase.from('site_images').select('key,image_url').then(({data,error})=>{if(error)console.error('site_images load failed',error);else if(data)setSiteImages(Object.fromEntries(data.filter((x:any)=>x.image_url).map((x:any)=>[x.key,x.image_url])))});},[supabase])"
const newEffect="useEffect(()=>{if(!supabase){setSiteImagesReady(true);return}supabase.from('site_images').select('key,image_url').then(async({data,error})=>{if(error){console.error('site_images load failed',error);setSiteImagesReady(true);return}const images=Object.fromEntries((data||[]).filter((x:any)=>x.image_url).map((x:any)=>[x.key,x.image_url]));setSiteImages(images);await Promise.all(Object.values(images).map((src:any)=>new Promise<void>(resolve=>{const im=new Image();im.onload=()=>resolve();im.onerror=()=>resolve();im.src=src})));setSiteImagesReady(true)});},[supabase])"
s=s.replace(oldEffect,newEffect)

s=s.replace('<Home nav={nav} products={products} siteImages={siteImages}/>','<Home nav={nav} products={products} siteImages={siteImages} siteImagesReady={siteImagesReady}/>')
s=s.replace('function Home({nav,products,siteImages}:{nav:(x:string)=>void;products:Product[];siteImages:Record<string,string>})','function Home({nav,products,siteImages,siteImagesReady}:{nav:(x:string)=>void;products:Product[];siteImages:Record<string,string>;siteImagesReady:boolean})')

const hs=s.indexOf('function Home(')
const ss=s.indexOf('function Scene(',hs)
if(hs>=0&&ss>hs){
  const home=`function Home({nav,products,siteImages,siteImagesReady}:{nav:(x:string)=>void;products:Product[];siteImages:Record<string,string>;siteImagesReady:boolean}){if(!siteImagesReady)return <main className="site-loading" aria-label="Loading SkyShotConner"/>;return <main><section className="hero"><img className="hero-img" src={siteImage(siteImages,'home_hero',FALLBACK)} alt="Harvard aircraft turning through golden sunset"/><div className="hero-copy"><div className="eyebrow">SkyShotConner Canvas</div><h1 className="display">THE ART<br/>OF FLIGHT.</h1><button className="hero-cta" onClick={()=>nav('/shop')}>Explore collection <ArrowUpRight size={16}/></button></div></section><Scene title="C O M M E R C I A L" image={siteImage(siteImages,'home_commercial',editorial.commercial)} eyebrow="01 / Modern aviation" nav={nav}/><Scene title="M I L I T A R Y" image={siteImage(siteImages,'home_military',editorial.military)} eyebrow="02 / Power & precision" nav={nav}/><Scene title="H I S T O R I C" image={siteImage(siteImages,'home_historic',editorial.historic)} eyebrow="03 / Aviation heritage" nav={nav}/><Scene title="C O C K P I T" image={siteImage(siteImages,'home_cockpit',editorial.cockpit)} eyebrow="04 / Where flight begins" nav={nav}/><section className="paper"><div className="container"><div className="editorial-feature"><div className="editorial-feature-copy"><div className="eyebrow">The collection</div><h2>Aircraft, frozen in time.</h2><p>Fine-art aviation photography printed on premium canvas and made to live with.</p><button className="text-link" onClick={()=>nav('/shop')}>View all works <ArrowUpRight size={16}/></button></div><img src={siteImage(siteImages,'home_editorial',FALLBACK)} alt="Classic aircraft in cinematic light"/></div></div></section></main>}
`
  s=s.slice(0,hs)+home+s.slice(ss)
}

// Remove the obsolete Shipping link in any common markup form.
s=s.replace(/<button[^>]*>\s*Shipping\s*<\/button>/gi,'')
s=s.replace(/<a[^>]*(?:href=["']\/shipping["'][^>]*)>\s*Shipping\s*<\/a>/gi,'')
s=s.replace(/<[^>]+onClick=\{\(\)=>nav\(["']\/shipping["']\)\}[^>]*>\s*Shipping\s*<\/[^>]+>/gi,'')

fs.writeFileSync(file,s)
console.log('Storefront image pipeline rebuilt')
