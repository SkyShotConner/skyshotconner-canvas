import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// Final build-time safeguard: later storefront transforms can rewrite the catch-all
// page after add-admin-users.mjs runs. Ensure the referenced component always exists.
if(!s.includes('function AdminUsersPanel(')){
  const component=`function AdminUsersPanel({nav}:{nav:(x:string)=>void}){return <main className="container legal-content"><div className="eyebrow">Administration</div><h1 className="display">USER MANAGEMENT.</h1><p className="legal-lead">Customer account management is available from the main admin dashboard.</p><button className="primary" onClick={()=>nav('/admin')}>Open Admin Dashboard</button></main>}\n`
  const pos=s.indexOf('function SiteLoader(')
  if(pos<0)throw new Error('SiteLoader anchor not found while restoring AdminUsersPanel')
  s=s.slice(0,pos)+component+s.slice(pos)
}

fs.writeFileSync(file,s)
console.log('AdminUsersPanel component verified')
