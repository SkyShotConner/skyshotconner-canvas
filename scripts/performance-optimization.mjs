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

// Browser image optimizations: async decoding and lazy-loading for non-hero images.
s=s.replace(/<img(?![^>]*loading=)([^>]*?)\/>/g, (match, attrs) => {
  const eager = /hero-img/.test(attrs)
  return `<img${attrs}${eager?' loading="eager" fetchPriority="high"':' loading="lazy"'} decoding="async"/>`
})

// Lightweight site loading veil; it is time-bounded so it can never trap the user.
if(!/function SiteLoader\(/.test(s)){
  const anchor='function Nav('
  const loader="function SiteLoader(){const [show,setShow]=useState(true);useEffect(()=>{const done=()=>window.setTimeout(()=>setShow(false),180);if(document.readyState==='complete')done();else window.addEventListener('load',done,{once:true});const fallback=window.setTimeout(()=>setShow(false),1800);return()=>{window.removeEventListener('load',done);window.clearTimeout(fallback)}},[]);return show?<div className=\"site-loader\" role=\"status\" aria-label=\"Loading SkyShotConner\"><div className=\"site-loader-mark\">SKYSHOTCONNER</div><div className=\"site-loader-line\"><span/></div></div>:null}\n"
  if(!s.includes(anchor)) throw new Error('Unable to locate navigation component')
  s=s.replace(anchor,loader+anchor)
  s=s.replace("return <div><Nav", "return <div><SiteLoader/><Nav")
}

fs.writeFileSync(file,s)
console.log('Performance optimizations applied')
