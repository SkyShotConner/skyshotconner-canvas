import fs from 'node:fs'

const file = 'app/[[...slug]]/page.tsx'
let s = fs.readFileSync(file, 'utf8')

// The database is the source of truth for product/site imagery.
// Remove the old hardcoded Unsplash/demo image catalogue from the generated storefront.
s = s.replace(/const FALLBACK = ['\"][^'\"]+['\"]/,
  "const FALLBACK = ''")
s = s.replace(/const editorial = \{[^\n]+\}/,
  "const editorial = { commercial:'', military:'', historic:'', cockpit:'' }")

// Never render demo products while the real Supabase catalogue is loading.
s = s.replace(/const demoProducts:Product\[\]=\[[\s\S]*?\n\]\nfunction imgFor/, "const demoProducts:Product[]=[]\nfunction imgFor")
s = s.replace(/const \[products,setProducts\]=useState<Product\[\]>\(demoProducts\)/,
  "const [products,setProducts]=useState<Product[]>([])")
s = s.replace(/products\.find\(p=>p\.slug===currentSlug\)\|\|demoProducts\.find\(p=>p\.slug===currentSlug\)/,
  "products.find(p=>p.slug===currentSlug)")

// Replace homepage hardcoded imagery with the managed site_images records.
s = s.replace(/src=\{FALLBACK\}/g, "src={siteImage(siteImages,'home_hero','')}")
s = s.replace(/image=\{editorial\.commercial\}/g, "image={siteImage(siteImages,'home_commercial','')}")
s = s.replace(/image=\{editorial\.military\}/g, "image={siteImage(siteImages,'home_military','')}")
s = s.replace(/image=\{editorial\.historic\}/g, "image={siteImage(siteImages,'home_historic','')}")
s = s.replace(/image=\{editorial\.cockpit\}/g, "image={siteImage(siteImages,'home_cockpit','')}")

// Do not duplicate a single product image just to create a fake gallery count.
s = s.replace(/\[\.\.\.product\.images,\.\.\.product\.images\]\.slice\(0,2\)/g, "product.images.slice(0,2)")
s = s.replace(/<span className=\"image-index\">01 \/ 02<\/span>/g, "<span className=\"image-index\">01 \/ {Math.max(1,p.images.length).toString().padStart(2,'0')}<\/span>")

fs.writeFileSync(file, s)
console.log('Legacy storefront imagery removed')
