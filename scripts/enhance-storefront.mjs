import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// Use Next.js routing for real client-side navigation. This prevents the
// catch-all storefront page from rendering a placeholder when navigating to
// dedicated routes such as /contact, /faq, /terms and /privacy.
s=s.replace("import { useEffect, useMemo, useState } from 'react'", "import { useEffect, useMemo, useState } from 'react'\nimport { useRouter } from 'next/navigation'")
s=s.replace("export default function Site(){\n", "export default function Site(){\n const router=useRouter()\n")
s=s.replace("const nav=(to:string)=>{window.history.pushState({},'',to);setPath(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}", "const nav=(to:string)=>{router.push(to);setPath(to);setMenu(false);setSearchOpen(false);window.scrollTo(0,0)}")

s=s.replace("orientation?:'portrait'|'landscape';images:string[]","orientation?:'portrait'|'landscape';limited_edition?:boolean;images:string[]")
s=s.replace("category_id,orientation,product_images(storage_path,sort_order,is_primary)","category_id,orientation,limited_edition,product_images(storage_path,sort_order,is_primary)")
s=s.replace("orientation:p.orientation||'landscape',images:","orientation:p.orientation||'landscape',limited_edition:!!p.limited_edition,images:")
s=s.replace("className={'product-image-wrap '+(p.orientation==='portrait'?'portrait':'landscape')}","className={'product-image-wrap '+(p.orientation==='portrait'?'portrait':'landscape')+(p.limited_edition?' limited-edition':'')}")

s=s.replace("const [saving,setSaving]=useState(false);const [message,setMessage]=useState('');useEffect", "const [saving,setSaving]=useState(false);const [message,setMessage]=useState('');const emailVerified=!!user?.email_confirmed_at;useEffect")
s=s.replace('<label>Email address<input type="email" value={email}', '<label>Email address <span className={emailVerified?"verification-status verified":"verification-status"}>{emailVerified?"✓ Verified":"Not verified"}</span><input type="email" value={email}')

// Remove every legacy Shipping / Shipping & Returns footer link, allowing for
// capitalization and minor JSX formatting differences.
s=s.replace(/<button[^>]*nav\(['\"]\/shipping-returns['\"]\)[^>]*>[^<]*shipping[^<]*<\/button>\s*<br\s*\/?>/gi,'')
s=s.replace(/<a[^>]*href=['\"]\/shipping-returns['\"][^>]*>[^<]*shipping[^<]*<\/a>\s*<br\s*\/?>/gi,'')
s=s.replace(/<button[^>]*nav\(['\"]\/shipping-returns['\"]\)[^>]*>[^<]*shipping[^<]*<\/button>/gi,'')
s=s.replace(/<a[^>]*href=['\"]\/shipping-returns['\"][^>]*>[^<]*shipping[^<]*<\/a>/gi,'')

fs.writeFileSync(file,s)
console.log('Storefront enhancement patch applied')
