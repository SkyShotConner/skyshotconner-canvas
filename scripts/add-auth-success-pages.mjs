import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

const signupUrl='https://skyshotconner.co.za/auth/verified'
const magicUrl='https://skyshotconner.co.za/auth/magic-link'

// Supabase only returns users to the requested destination when the auth call
// supplies an emailRedirectTo. Previously these flows fell back to Site URL.
s=s.replace(/supabase\.auth\.signUp\(\{\s*email\s*,\s*password\s*\}\)/g,`supabase.auth.signUp({email,password,options:{emailRedirectTo:'${signupUrl}'}})`)
s=s.replace(/supabase\.auth\.signUp\(\{\s*email\s*,\s*password\s*,\s*options:\s*\{[^}]*\}\s*\}\)/g,`supabase.auth.signUp({email,password,options:{emailRedirectTo:'${signupUrl}'}})`)
s=s.replace(/supabase\.auth\.signInWithOtp\(\{\s*email\s*\}\)/g,`supabase.auth.signInWithOtp({email,options:{emailRedirectTo:'${magicUrl}'}})`)
s=s.replace(/supabase\.auth\.signInWithOtp\(\{\s*email\s*,\s*options:\s*\{[^}]*\}\s*\}\)/g,`supabase.auth.signInWithOtp({email,options:{emailRedirectTo:'${magicUrl}'}})`)

// Route the three auth callbacks to explicit branded success pages.
const routeAnchor="path==='/forgot-password'?<Auth mode=\"forgot\" nav={nav} supabase={supabase}/>:"
const routes="path==='/auth/verified'?<AuthSuccess type=\"signup\" nav={nav}/>:path==='/auth/email-changed'?<AuthSuccess type=\"email_change\" nav={nav}/>:path==='/auth/magic-link'?<AuthSuccess type=\"magic\" nav={nav}/> :"
if(s.includes(routeAnchor) && !s.includes("path==='/auth/magic-link'?")) s=s.replace(routeAnchor,routes+routeAnchor)

// Supabase puts the auth type in the callback query/hash. Redirect before the
// normal storefront can render, so the customer never flashes the homepage.
const supabaseAnchor="const supabase=useMemo(()=>createClient(),[])"
if(s.includes(supabaseAnchor) && !s.includes('const authCallbackType')){
  const effect=`${supabaseAnchor}\n useEffect(()=>{const q=new URLSearchParams(window.location.search);const h=new URLSearchParams(window.location.hash.replace(/^#/,'').replace(/^\?/,'));const authCallbackType=q.get('type')||h.get('type');if(authCallbackType==='signup')router.replace('/auth/verified');else if(authCallbackType==='email_change')router.replace('/auth/email-changed');else if(authCallbackType==='magiclink')router.replace('/auth/magic-link')},[router])`
  s=s.replace(supabaseAnchor,effect)
}

// Add the success component if it does not already exist.
if(!s.includes('function AuthSuccess(')){
  const anchor='function Nav('
  const component=`function AuthSuccess({type,nav}:{type:'signup'|'email_change'|'magic';nav:(x:string)=>void}){const signup=type==='signup';const magic=type==='magic';return <main className="auth-page"><section className="auth-card auth-success-card"><div className="eyebrow">SkyShotConner / Account</div><div className="auth-success-icon">✓</div><h1>{signup?<>ACCOUNT<br/>VERIFIED.</>:magic?<>SIGN-IN<br/>SUCCESSFUL.</>:<>EMAIL<br/>UPDATED.</>}</h1><p className="auth-intro">{signup?'Your email address has been successfully verified. Your SkyShotConner account is now ready to use.':magic?'You have been securely signed in. Your SkyShotConner account is ready to use.':'Your new email address has been successfully confirmed and your account is updated.'}</p><button className="auth-submit" onClick={()=>nav('/account')}>Continue to account</button><button className="auth-secondary" onClick={()=>nav('/')}>Return to home</button><div className="auth-footer">THE ART OF FLIGHT.</div></section></main>}
`
  if(!s.includes(anchor)) throw new Error('Unable to locate navigation component')
  s=s.replace(anchor,component+anchor)
}

const cssFile='app/globals.css'
let css=fs.readFileSync(cssFile,'utf8')
const cssAdd=`\n\n/* Auth success pages */\n.auth-success-card{text-align:left}.auth-success-icon{width:46px;height:46px;border:1px solid #777;border-radius:50%;display:grid;place-items:center;font-size:18px;margin:10px 0 24px;color:#eee}.auth-secondary{width:100%;padding:15px;background:transparent;color:#eee;border:1px solid #30302c;letter-spacing:.18em;text-transform:uppercase;font-size:10px;margin-top:10px}.auth-secondary:hover{border-color:#777}\n`
if(!css.includes('/* Auth success pages */')) fs.writeFileSync(cssFile,css+cssAdd)

fs.writeFileSync(file,s)
console.log('Auth success pages and redirect destinations applied')
