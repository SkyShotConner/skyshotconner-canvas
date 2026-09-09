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

fs.writeFileSync(file,s)
console.log('Performance optimizations applied')
