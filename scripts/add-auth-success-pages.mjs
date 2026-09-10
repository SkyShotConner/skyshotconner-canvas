import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// Give Supabase auth callbacks a clear, branded destination instead of silently
// dropping the user on the homepage. Supabase returns the auth event type in
// the callback fragment for email confirmation flows.
const routeAnchor="path==='/forgot-password'?<Auth mode=\"forgot\" nav={nav} supabase={supabase}/>:"
if(!s.includes("path==='/auth/verified'?<AuthSuccess type=\"signup\" nav={nav}/>") && s.includes(routeAnchor)){
  s=s.replace(routeAnchor,"path==='/auth/verified'?<AuthSuccess type=\"signup\" nav={nav}/>:path==='/auth/email-changed'?<AuthSuccess type=\"email_change\" nav={nav}/>:"+routeAnchor)
}

// Detect the callback before the normal homepage renders, then move it to the
// appropriate success page. This works for both hash and query-style callbacks.
const supabaseAnchor="const supabase=useMemo(()=>createClient(),[])"
if(!s.includes('const authCallbackHandled=useRef') && s.includes(supabaseAnchor)){
  s=s.replace("import { useEffect, useMemo, useState } from 'react'","import { useEffect, useMemo, useState, useRef } from 'react'")
  const effect=`${supabaseAnchor}\n useEffect(()=>{const readType=()=>{const query=new URLSearchParams(window.location.search).get('type');const hash=new URLSearchParams(window.location.hash.replace(/^#/,'')).get('type');return query||hash};const type=readType();if(type==='signup')router.replace('/auth/verified');else if(type==='email_change')router.replace('/auth/email-changed')},[router])`
  s=s.replace(supabaseAnchor,effect)
}

if(!s.includes('function AuthSuccess(')){
  const anchor='function Nav('
  const component=`function AuthSuccess({type,nav}:{type:'signup'|'email_change';nav:(x:string)=>void}){const signup=type==='signup';return <main className="auth-page"><section className="auth-card auth-success-card"><div className="eyebrow">SkyShotConner / Account</div><div className="auth-success-icon">✓</div><h1>{signup?<>ACCOUNT<br/>VERIFIED.</>:<>EMAIL<br/>UPDATED.</>}</h1><p className="auth-intro">{signup?'Your email address has been successfully verified. Your SkyShotConner account is now ready to use.':'Your new email address has been successfully confirmed and your account is updated.'}</p><button className="auth-submit" onClick={()=>nav('/account')}>Continue to account</button><button className="auth-secondary" onClick={()=>nav('/')}>Return to home</button><div className="auth-footer">THE ART OF FLIGHT.</div></section></main>}
`
  if(!s.includes(anchor)) throw new Error('Unable to locate navigation component')
  s=s.replace(anchor,component+anchor)
}

// Add lightweight styling to the existing auth design.
const cssFile='app/globals.css'
let css=fs.readFileSync(cssFile,'utf8')
const cssAdd=`\n\n/* Auth success pages */\n.auth-success-card{text-align:left}.auth-success-icon{width:46px;height:46px;border:1px solid #777;border-radius:50%;display:grid;place-items:center;font-size:18px;margin:10px 0 24px;color:#eee}.auth-secondary{width:100%;padding:15px;background:transparent;color:#eee;border:1px solid #30302c;letter-spacing:.18em;text-transform:uppercase;font-size:10px;margin-top:10px}.auth-secondary:hover{border-color:#777}\n`
if(!css.includes('/* Auth success pages */')) fs.writeFileSync(cssFile,css+cssAdd)

fs.writeFileSync(file,s)
console.log('Auth success pages applied')
