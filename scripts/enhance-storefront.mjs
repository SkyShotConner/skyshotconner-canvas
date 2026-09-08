import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// Limited-edition support.
s=s.replace("orientation?:'portrait'|'landscape';images:string[]","orientation?:'portrait'|'landscape';limited_edition?:boolean;images:string[]")
s=s.replace("category_id,orientation,product_images(storage_path,sort_order,is_primary)","category_id,orientation,limited_edition,product_images(storage_path,sort_order,is_primary)")
s=s.replace("orientation:p.orientation||'landscape',images:","orientation:p.orientation||'landscape',limited_edition:!!p.limited_edition,images:")
s=s.replace("className={'product-image-wrap '+(p.orientation==='portrait'?'portrait':'landscape')}","className={'product-image-wrap '+(p.orientation==='portrait'?'portrait':'landscape')+(p.limited_edition?' limited-edition':'')}")

// Show a verified badge in the signed-in account when Supabase Auth reports email_confirmed_at.
s=s.replace("const [saving,setSaving]=useState(false);const [message,setMessage]=useState('');useEffect", "const [saving,setSaving]=useState(false);const [message,setMessage]=useState('');const emailVerified=!!user?.email_confirmed_at;useEffect")
s=s.replace('<label>Email address<input type="email" value={email}', '<label>Email address <span className={emailVerified?"verification-status verified":"verification-status"}>{emailVerified?"✓ Verified":"Not verified"}</span><input type="email" value={email}')

// Add a lightweight collection filter without changing the existing product ordering/layout.
const shopMarker='<div className="shop-grid">'
if(s.includes(shopMarker)&&!s.includes('collection-filter-bar')){
 const filters=`<div className="collection-filter-bar" role="group" aria-label="Filter collection"><button className="collection-filter active" onClick={()=>{document.querySelectorAll('.shop-grid .product-card').forEach((el:any)=>{el.style.display=''});document.querySelectorAll('.collection-filter').forEach((b:any)=>b.classList.remove('active'));(event?.currentTarget as HTMLElement)?.classList.add('active')}}>All</button><button className="collection-filter" onClick={()=>{document.querySelectorAll('.shop-grid .product-card').forEach((el:any)=>{el.style.display=el.querySelector('.product-image-wrap.landscape')?'':'none'});document.querySelectorAll('.collection-filter').forEach((b:any)=>b.classList.remove('active'));(event?.currentTarget as HTMLElement)?.classList.add('active')}}>Landscape</button><button className="collection-filter" onClick={()=>{document.querySelectorAll('.shop-grid .product-card').forEach((el:any)=>{el.style.display=el.querySelector('.product-image-wrap.portrait')?'':'none'});document.querySelectorAll('.collection-filter').forEach((b:any)=>b.classList.remove('active'));(event?.currentTarget as HTMLElement)?.classList.add('active')}}>Portrait</button><button className="collection-filter" onClick={()=>{document.querySelectorAll('.shop-grid .product-card').forEach((el:any)=>{el.style.display=el.querySelector('.product-image-wrap.limited-edition')?'':'none'});document.querySelectorAll('.collection-filter').forEach((b:any)=>b.classList.remove('active'));(event?.currentTarget as HTMLElement)?.classList.add('active')}}>Limited Edition</button></div>`
 s=s.replace(shopMarker,filters+shopMarker)
}

fs.writeFileSync(file,s)
console.log('Storefront enhancement patch applied')
