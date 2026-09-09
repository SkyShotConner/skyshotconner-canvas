import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// Load lightweight performance/loading styles from the app-level stylesheet.
if(!s.includes("import '../performance.css'")) s=s.replace(/^'use client'\n/, "'use client'\n\nimport '../performance.css'\n")

// Keep all public imagery database-driven and prevent legacy/demo assets from returning.
s=s.replace(/const FALLBACK = ['\"][^'\"]+['\"]/,
  "const FALLBACK = ''")
s=s.replace(/const editorial = \{[^\n]+\}/,
  "const editorial = { commercial:'', military:'', historic:'', cockpit:'' }")
s=s.replace(/const demoProducts:Product\[\]=\[[\s\S]*?\n\]\nfunction imgFor/, "const demoProducts:Product[]=[]\nfunction imgFor")
s=s.replace(/const \[products,setProducts\]=useState<Product\[\]>\(demoProducts\)/,
  "const [products,setProducts]=useState<Product[]>([])")
s=s.replace(/products\.find\(p=>p\.slug===currentSlug\)\|\|demoProducts\.find\(p=>p\.slug===currentSlug\)/,
  "products.find(p=>p.slug===currentSlug)")

// Homepage wording and section cleanup.
s=s.replace('C O M M E R C I A L','M O D E R N')
s=s.replace(/<Scene title="C O C K P I T"[\s\S]*?\/>/g,'')
// Historic is rendered as one compact word so CSS letter-spacing cannot force it onto multiple lines.
s=s.replace('title="H I S T O R I C"','title="HISTORIC"')

// Give the three landing-page scenes explicit classes so mobile layout does not depend on fragile nth-of-type selectors.
s=s.replace("<section className=\"scene\"><img src={image}","<section className={'scene '+(title.includes('HISTORIC')?'scene-historic':'')}><img src={image}")
s=s.replace("<button className=\"wide\" onClick={()=>nav('/shop')}>{title}</button>","<button className={'wide '+(title.includes('HISTORIC')?'historic-title':'')} onClick={()=>nav('/shop')}>{title}</button>")

// Browser image optimizations: async decoding and eager loading for homepage imagery.
s=s.replace(/<img(?![^>]*loading=)([^>]*?)\/>/g, (match, attrs) => {
  const homepage = /hero-img|src=\{siteImage\(siteImages,'home_|src=\{image\}/.test(attrs)
  const eager = homepage || /hero-img/.test(attrs)
  const critical = homepage ? ' data-critical-image="true"' : ''
  return `<img${attrs}${critical}${eager?' loading="eager" fetchPriority="high"':' loading="lazy"'} decoding="async"/>`
})

// Keep the loading screen up until the browser is ready and all homepage critical images finish.
if(!/function SiteLoader\(/.test(s)){
  const anchor='function Nav('
  const loader="function SiteLoader({ready=true}:{ready?:boolean}){const [windowReady,setWindowReady]=useState(typeof document!=='undefined'&&document.readyState==='complete');const [imagesReady,setImagesReady]=useState(false);useEffect(()=>{if(document.readyState==='complete')setWindowReady(true);else{const done=()=>setWindowReady(true);window.addEventListener('load',done,{once:true});return()=>window.removeEventListener('load',done)}},[]);useEffect(()=>{if(!ready||!windowReady)return;let timer:number;const check=()=>{const images=Array.from(document.querySelectorAll<HTMLImageElement>('[data-critical-image]'));if(images.length&&images.every(img=>img.complete)){setImagesReady(true);return}timer=window.setTimeout(check,50)};check();return()=>window.clearTimeout(timer)},[ready,windowReady]);const show=!(windowReady&&ready&&imagesReady);return show?<div className=\"site-loader\" role=\"status\" aria-label=\"Loading SkyShotConner\"><div className=\"site-loader-mark\">SKYSHOTCONNER</div><div className=\"site-loader-line\"><span/></div></div>:null}\n"
  if(!s.includes(anchor)) throw new Error('Unable to locate navigation component')
  s=s.replace(anchor,loader+anchor)
  s=s.replace("return <div><Nav", "return <div><SiteLoader ready={path==='/'?siteImagesReady:true}/><Nav")
}

// Premium footer refresh: cleaner hierarchy on desktop and a compact stacked layout on mobile.
const oldFooter=/function Footer\(\{nav\}:\{nav:\(x:string\)=>void\}\)\{[\s\S]*?\}\n$/m
const newFooter=`function Footer({nav}:{nav:(x:string)=>void}){return <footer className="footer"><div className="container footer-top"><div className="footer-brand"><div className="brand">SKYSHOTCONNER</div><p>Aviation captured as art.<br/>Premium canvas pieces made for people who look up.</p><button className="footer-cta" onClick={()=>nav('/shop')}>Explore the collection <ArrowUpRight size={13}/></button></div><div className="footer-links"><div><h3>Explore</h3><button onClick={()=>nav('/shop')}>Collection</button><button onClick={()=>nav('/shop')}>Aircraft</button><button onClick={()=>nav('/about')}>About</button></div><div><h3>Support</h3><button onClick={()=>nav('/contact')}>Contact</button><button onClick={()=>nav('/faq')}>FAQ</button></div><div><h3>Follow</h3><a href="https://www.instagram.com/skyshotconner/" target="_blank" rel="noreferrer">Instagram</a></div></div></div><div className="container footer-bottom"><p>© {new Date().getFullYear()} SkyShotConner</p><div><button onClick={()=>nav('/privacy')}>Privacy</button><button onClick={()=>nav('/terms')}>Terms</button></div><span>The Art of Flight.</span></div></footer>}`
if(oldFooter.test(s)) s=s.replace(oldFooter,newFooter)

fs.writeFileSync(file,s)
console.log('Performance optimizations applied')
