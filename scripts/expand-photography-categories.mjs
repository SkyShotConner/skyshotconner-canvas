import fs from 'node:fs'

const sitePath = 'app/[[...slug]]/page.tsx'
const adminPath = 'app/admin/page.tsx'

let site = fs.readFileSync(sitePath, 'utf8')

// Replace the shop filter list regardless of formatting introduced by earlier prebuild scripts.
site = site.replace(/const categories\s*=\s*\[[\s\S]*?\]\s*const filtered\s*=/, "const categories=['All','Aviation','Nature Art','Wildlife Art']\n const filtered=")

// Use category names from the Supabase relation instead of exposing category UUIDs in the storefront.
site = site.replace(/supabase\.from\('products'\)\.select\([\s\S]*?\)\.eq\('is_active',true\)\.then\(\(\{data\}\)=>\{[\s\S]*?\}\)/, "supabase.from('products').select('id,name,slug,price,short_description,description,category_id,categories(name),product_images(storage_path)').eq('is_active',true).then(({data,error})=>{if(data?.length&&!error){setProducts(data.map((p:any)=>({...p,category:p.categories?.name||null,images:(p.product_images||[]).map((x:any)=>x.storage_path)})))}}),[supabase])")

// Update the homepage copy directly. This is intentionally based on the visible copy rather than the full Home function,
// so changes made by the earlier prebuild scripts cannot make the transformation fail.
const replacements = [
  ['SkyShotConner / Aviation Art', 'SkyShotConner / Photography & Fine Art'],
  ['THE ART<br/>OF FLIGHT.', 'PHOTOGRAPHY.<br/>MADE ART.'],
  ['Premium aviation canvas artwork for those who live to fly.', 'Aviation, nature and wildlife photography transformed into premium canvas artwork.'],
  ['C O M M E R C I A L', 'A V I A T I O N'],
  ['M I L I T A R Y', 'N A T U R E'],
  ['H I S T O R I C', 'W I L D L I F E'],
  ['01 / Modern aviation', '01 / Aviation photography'],
  ['02 / Power & precision', '02 / Nature photography'],
  ['03 / Aviation heritage', '03 / Wildlife photography'],
  ['Icons of aviation.', 'Selected works.'],
  ['Selected works', 'Selected photography'],
  ['Four aviation artworks. Five canvas sizes. Each photograph is prepared as a piece of wall art.', 'Aviation, nature and wildlife photography. Each photograph is prepared as a piece of wall art.']
]
for (const [from,to] of replacements) site = site.replaceAll(from,to)

// Ensure demo products and generic category copy use the new taxonomy.
site = site.replaceAll("category:'Commercial'", "category:'Aviation'")
site = site.replaceAll("category:'Historic'", "category:'Aviation'")
site = site.replaceAll("category:'Cockpit'", "category:'Aviation'")
site = site.replaceAll("{product.category||'Aviation Art'}", "{product.category||'Photography & Fine Art'}")

// Do not fail the whole deployment just because a previous script has already changed one piece of copy.
if (!site.includes('PHOTOGRAPHY.<br/>MADE ART.')) {
  console.warn('Photography hero copy was not found; leaving existing hero unchanged.')
}
fs.writeFileSync(sitePath, site)

let admin = fs.readFileSync(adminPath, 'utf8')
admin = admin.replace("const SIZES = [['A5',349],['A4',449],['A3',549],['A2',749],['A1',1099],['A0',1799]] as const", "const SIZES = [['A5',349],['A4',449],['A3',549],['A2',749],['A1',1099],['A0',1799]] as const\nconst CATEGORIES: {id:string;name:string}[] = [{id:'50013bc3-d3a9-4576-990b-50047b76470c',name:'Aviation'},{id:'36596cab-fe01-480d-a20c-85e6efefd8ed',name:'Nature Art'},{id:'d85bf24c-a09d-492f-94a5-cba5e723212e',name:'Wildlife Art'}]")
admin = admin.replace("type Product={id:string;name:string;slug:string;description:string|null;short_description:string|null;price:number;compare_at_price:number|null;is_active:boolean;is_featured:boolean;orientation:'portrait'|'landscape';limited_edition:boolean;images:ProductImage[]}", "type Product={id:string;name:string;slug:string;description:string|null;short_description:string|null;price:number;compare_at_price:number|null;category_id:string|null;is_active:boolean;is_featured:boolean;orientation:'portrait'|'landscape';limited_edition:boolean;images:ProductImage[]}")
admin = admin.replace("[showNew,setShowNew]=useState(false),[newProduct,setNewProduct]=useState({name:'',slug:'',short_description:'',description:'',price:349,orientation:'landscape' as 'portrait'|'landscape',limited_edition:false})", "[showNew,setShowNew]=useState(false),[newProduct,setNewProduct]=useState({name:'',slug:'',short_description:'',description:'',price:349,category_id:CATEGORIES[0].id,orientation:'landscape' as 'portrait'|'landscape',limited_edition:false})")
admin = admin.replace("select('id,name,slug,description,short_description,price,compare_at_price,is_active,is_featured,orientation,limited_edition,product_images", "select('id,name,slug,description,short_description,price,compare_at_price,category_id,is_active,is_featured,orientation,limited_edition,product_images")
admin = admin.replace("insert({name:newProduct.name,slug,short_description:newProduct.short_description,description:newProduct.description,price:Number(newProduct.price)||349,orientation:newProduct.orientation", "insert({name:newProduct.name,slug,short_description:newProduct.short_description,description:newProduct.description,price:Number(newProduct.price)||349,category_id:newProduct.category_id,orientation:newProduct.orientation")
admin = admin.replace("select('id,name,slug,description,short_description,price,compare_at_price,is_active,is_featured,orientation,limited_edition').single()", "select('id,name,slug,description,short_description,price,compare_at_price,category_id,is_active,is_featured,orientation,limited_edition').single()")
admin = admin.replace("setNewProduct({name:'',slug:'',short_description:'',description:'',price:349,orientation:'landscape',limited_edition:false})", "setNewProduct({name:'',slug:'',short_description:'',description:'',price:349,category_id:CATEGORIES[0].id,orientation:'landscape',limited_edition:false})")
admin = admin.replace("update({name:selected.name,slug:selected.slug,description:selected.description,short_description:selected.short_description,price:Number(selected.price)||0,compare_at_price", "update({name:selected.name,slug:selected.slug,description:selected.description,short_description:selected.short_description,price:Number(selected.price)||0,category_id:selected.category_id,compare_at_price")
admin = admin.replace("<label>Orientation<select value={newProduct.orientation}", "<label>Category<select value={newProduct.category_id} onChange={e=>setNewProduct({...newProduct,category_id:e.target.value})}>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Orientation<select value={newProduct.orientation}")
admin = admin.replace("<label>Orientation<select value={selected.orientation}", "<label>Category<select value={selected.category_id||CATEGORIES[0].id} onChange={e=>setSelected({...selected,category_id:e.target.value})}>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Orientation<select value={selected.orientation}")
admin = admin.replace("{p.is_active?'Published':'Hidden'} · {p.orientation}", "{p.is_active?'Published':'Hidden'} · {CATEGORIES.find(c=>c.id===p.category_id)?.name||'Uncategorised'} · {p.orientation}")
fs.writeFileSync(adminPath, admin)

console.log('Expanded SkyShotConner categories to Aviation, Nature Art and Wildlife Art.')
