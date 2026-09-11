import fs from 'node:fs'
const p='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(p,'utf8')
s=s.replace("const categories=['All',...Array.from(new Set(products.map(p=>p.category).filter(Boolean) as string[]))]","const categories=['All','Aviation','Nature Art','Wildlife Art']")
s=s.replace("category:p.category_id","category:p.categories?.name||null")
s=s.replace("category_id,product_images(storage_path)","category_id,categories(name),product_images(storage_path)")
s=s.replace('C O M M E R C I A L','A V I A T I O N').replace('M I L I T A R Y','N A T U R E').replace('H I S T O R I C','W I L D L I F E')
s=s.replace('01 / Modern aviation','01 / Aviation photography').replace('02 / Power & precision','02 / Nature photography').replace('03 / Aviation heritage','03 / Wildlife photography')
s=s.replace('SkyShotConner / Aviation Art','SkyShotConner / Photography & Fine Art').replace('THE ART<br/>OF FLIGHT.','PHOTOGRAPHY.<br/>MADE ART.').replace('Premium aviation canvas artwork for those who live to fly.','Aviation, nature and wildlife photography transformed into premium canvas artwork.')
s=s.replace('Four aviation artworks. Five canvas sizes. Each photograph is prepared as a piece of wall art.','Aviation, nature and wildlife photography. Each photograph is prepared as a piece of wall art.')
s=s.replace('Icons of aviation.','Selected works.').replace('Every SkyShotConner canvas begins with a moment in flight — frozen, refined and made tangible. From airliners to warbirds, each piece is photographed with the intention of becoming art.','Every SkyShotConner canvas begins with a moment worth remembering — frozen, refined and made tangible. From aircraft to landscapes and wildlife, each photograph is created with the intention of becoming art.')
s=s.replace("category:'Commercial'","category:'Aviation'").replace("category:'Historic'","category:'Aviation'").replace("category:'Cockpit'","category:'Aviation'")
s=s.replace("<div className=\"eyebrow\">Account</div><h1 className=\"page-title\">{user?'YOUR<br/>FLIGHT LOG.':'SIGN IN TO<br/>CONTINUE.'}</h1>","<div className=\"eyebrow\">Account</div><h1 className=\"page-title\">{user?'YOUR<br/>FLIGHT LOG.':'SIGN IN TO<br/>CONTINUE.'}</h1>{user&&<div className=\"notice\" style={{marginBottom:24}}><b>{user.email_confirmed_at?'✓ Email verified':'Email not verified'}</b><br/><small>{user.email}</small></div>}")
fs.writeFileSync(p,s)
