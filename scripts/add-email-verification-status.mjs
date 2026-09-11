import fs from 'node:fs'

const path = 'app/[[...slug]]/page.tsx'
let s = fs.readFileSync(path, 'utf8')
const marker = "<div className=\"eyebrow\">Account</div><h1 className=\"page-title\">{user?'YOUR<br/>FLIGHT LOG.':'SIGN IN TO<br/>CONTINUE.'}</h1>"
const addition = "{user&&<div className=\"notice\" style={{marginBottom:24}}><b>{user.email_confirmed_at?'✓ Email verified':'Email not verified'}</b><br/><small>{user.email}</small></div>}"
if (s.includes(marker) && !s.includes('user.email_confirmed_at')) s = s.replace(marker, marker + addition)
fs.writeFileSync(path, s)
console.log('Email verification status applied')
