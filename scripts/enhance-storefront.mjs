import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// Navigation and image helpers
if(!s.includes("from 'next/navigation'")){
  s=s.replace("import { useEffect, useMemo, useState } from 'react'", "import { useEffect, useMemo, useState } from 'react'\nimport { useRouter } from 'next/navigation'")
}
if(!s.includes('function siteImage(')){
  s=s.replace('export default function Site(){', "function siteImage(images:Record<string,string>,key:string,fallback:string){return images[key]||fallback}\n\nexport default function Site(){")
}
if(!s.includes('const router=useRouter()')){
  s=s.replace('export default function Site(){\n', 'export default function Site(){\n const router=useRouter()\n')
}
s=s.replace("const nav=(to:string)=>{window.history.pushState({},'',to);setPath(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}", "const nav=(to:string)=>{router.push(to);setPath(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}")

// Site-image state
if(!s.includes('const [siteImages,setSiteImages]')){
  s=s.replace("const supabase=useMemo(()=>createClient(),[])", "const supabase=useMemo(()=>createClient(),[])\n const [siteImages,setSiteImages]=useState<Record<string,string>>({})")
}

// Site-image query as a standalone effect
const siteImageEffect = "useEffect(()=>{if(!supabase)return;supabase.from('site_images').select('key,image_url').then(({data,error})=>{if(error)console.error('site_images load failed',error);else if(data)setSiteImages(Object.fromEntries(data.filter((x:any)=>x.image_url).map((x:any)=>[x.key,x.image_url])))});},[supabase])"
if(!s.includes("select('key,image_url')")){
  const anchor=" const [siteImages,setSiteImages]=useState<Record<string,string>>({})"
  s=s.replace(anchor, anchor+"\n "+siteImageEffect)
}

s=s.replace('<Home nav={nav} products={products}/>','<Home nav={nav} products={products} siteImages={siteImages}/>')
s=s.replace('function Home({nav,products}:{nav:(x:string)=>void;products:Product[]})','function Home({nav,products,siteImages}:{nav:(x:string)=>void;products:Product[];siteImages:Record<string,string>})')
s=s.replace('<About/>','<About siteImages={siteImages}/>')
// Make About accept the siteImages prop. The component can ignore it safely until its custom images are used.
s=s.replace('function About(){','function About({siteImages}:{siteImages:Record<string,string>}){')
s=s.replace('function About({siteImages}:{siteImages:Record<string,string>}){','function About({siteImages}:{siteImages:Record<string,string>}){')

// Replace Home component cleanly, preserving the existing Scene component and everything after it.
const hs=s.indexOf('function Home(')
const ss=s.indexOf('function Scene(',hs)
if(hs>=0&&ss>hs){
  const home=`function Home({nav,products,siteImages}:{nav:(x:string)=>void;products:Product[];siteImages:Record<string,string>}){return <main><section className="hero"><img className="hero-img" src={siteImage(siteImages,'home_hero',FALLBACK)} alt="Harvard aircraft turning through golden sunset"/><div className="hero-copy"><div className="eyebrow">SkyShotConner Canvas</div><h1 className="display">THE ART<br/>OF FLIGHT.</h1><button className="hero-cta" onClick={()=>nav('/shop')}>Explore collection <ArrowUpRight size={16}/></button></div></section><Scene title="C O M M E R C I A L" image={siteImage(siteImages,'home_commercial',editorial.commercial)} eyebrow="01 / Modern aviation" nav={nav}/><Scene title="M I L I T A R Y" image={siteImage(siteImages,'home_military',editorial.military)} eyebrow="02 / Power & precision" nav={nav}/><Scene title="H I S T O R I C" image={siteImage(siteImages,'home_historic',editorial.historic)} eyebrow="03 / Aviation heritage" nav={nav}/><Scene title="C O C K P I T" image={siteImage(siteImages,'home_cockpit',editorial.cockpit)} eyebrow="04 / Where flight begins" nav={nav}/><section className="paper"><div className="container"><div className="editorial-feature"><div className="editorial-feature-copy"><div className="eyebrow">The collection</div><h2>Aircraft, frozen in time.</h2><p>Fine-art aviation photography printed on premium canvas and made to live with.</p><button className="text-link" onClick={()=>nav('/shop')}>View all works <ArrowUpRight size={16}/></button></div><img src={siteImage(siteImages,'home_editorial',FALLBACK)} alt="Classic aircraft in cinematic light"/></div></div></section></main>}
`
  s=s.slice(0,hs)+home+s.slice(ss)
}

fs.writeFileSync(file,s)
console.log('Storefront image pipeline rebuilt')