import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

const signupUrl='https://skyshotconner.co.za/auth/verified'
const magicUrl='https://skyshotconner.co.za/auth/magic-link'

// Route the auth callbacks to branded success pages instead of the Site URL.
const routeAnchor="path==='/forgot-password'?<Auth mode=\"forgot\" nav={nav} supabase={supabase}/>:"
const routes="path==='/auth/verified'?<AuthSuccess type=\"signup\" nav={nav}/>:path==='/auth/email-changed'?<AuthSuccess type=\"email_change\" nav={nav}/>:path==='/auth/magic-link'?<AuthSuccess type=\"magic\" nav={nav}/>:"
if(s.includes(routeAnchor) && !s.includes("path==='/auth/verified'?")) s=s.replace(routeAnchor,routes+routeAnchor)

// Catch callback types from both Supabase implicit-flow hash fragments and query strings.
const supabaseAnchor="const supabase=useMemo(()=>createClient(),[])"
if(s.includes(supabaseAnchor) && !s.includes('const authCallbackType')){
  const effect=`${supabaseAnchor}\n useEffect(()=>{const q=new URLSearchParams(window.location.search);const h=new URLSearchParams(window.location.hash.replace(/^#/,'').replace(/^\?/,'));const authCallbackType=q.get('type')||h.get('type');if(authCallbackType==='signup')router.replace('/auth/verified');else if(authCallbackType==='email_change')router.replace('/auth/email-changed');else if(authCallbackType==='magiclink')router.replace('/auth/magic-link')},[router])`
  s=s.replace(supabaseAnchor,effect)
}

// Replace the generated auth form with one that explicitly requests the correct
// post-email destinations. This is important because Supabase otherwise uses Site URL.
const authStart=s.indexOf('function Auth(')
const authEnd=s.indexOf('function Wishlist(',authStart)
if(authStart>=0&&authEnd>authStart){
  const authFn=`function Auth({mode,nav,supabase}:{mode:'login'|'signup'|'forgot';nav:(x:string)=>void;supabase:any}){const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[msg,setMsg]=useState('');const [busy,setBusy]=useState(false);async function go(e:any){e.preventDefault();if(!supabase){setMsg('Connect Supabase first.');return}setBusy(true);setMsg('');let r;if(mode==='login')r=await supabase.auth.signInWithPassword({email,password});else if(mode==='signup')r=await supabase.auth.signUp({email,password,options:{emailRedirectTo:'${signupUrl}',data:{full_name:name}}});else r=await supabase.auth.resetPasswordForEmail(email,{redirectTo:'https://skyshotconner.co.za/reset-password'});if(r.error)setMsg(r.error.message);else{setMsg(mode==='forgot'?'Check your email for the reset link.':mode==='signup'?'Check your email to verify your account.':'Signed in.');if(mode==='login')nav('/account')}setBusy(false)}async function magic(){if(!supabase)return;setBusy(true);setMsg('');const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:'${magicUrl}',shouldCreateUser:false}});setMsg(error?error.message:'Check your email for your secure sign-in link.');setBusy(false)}return <main className="page container"><div className="form-wrap"><div className="eyebrow">SkyShotConner</div><h1 className="page-title">{mode==='login'?'WELCOME BACK':mode==='signup'?'JOIN THE FLIGHT':'RESET ACCESS'}</h1><form className="form" onSubmit={go}>{mode==='signup'&&<Field label="Full name" value={name} set={setName}/>}<Field label="Email" value={email} set={setEmail} type="email"/>{mode!=='forgot'&&<Field label="Password" value={password} set={setPassword} type="password"/>}{msg&&<div className="notice">{msg}</div>}<button className="primary" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':mode==='signup'?'Create account':'Send reset link'}</button></form>{mode==='login'&&<button className="auth-magic-link" disabled={busy||!email} onClick={magic}>Email me a secure sign-in link</button>}<div className="auth-links">{mode==='login'?<><button onClick={()=>nav('/forgot-password')}>Forgot password?</button><button onClick={()=>nav('/signup')}>Create account</button></>:<button onClick={()=>nav('/login')}>Already have an account? Sign in</button>}</div></div></main>}
`
  s=s.slice(0,authStart)+authFn+s.slice(authEnd)
}

if(!s.includes('function AuthSuccess(')){
  const anchor='function Nav('
  const component=`function AuthSuccess({type,nav}:{type:'signup'|'email_change'|'magic';nav:(x:string)=>void}){const signup=type==='signup';const magic=type==='magic';return <main className="auth-page"><section className="auth-card auth-success-card"><div className="eyebrow">SkyShotConner / Account</div><div className="auth-success-icon">✓</div><h1>{signup?<>ACCOUNT<br/>VERIFIED.</>:magic?<>SIGN-IN<br/>SUCCESSFUL.</>:<>EMAIL<br/>UPDATED.</>}</h1><p className="auth-intro">{signup?'Your email address has been successfully verified. Your SkyShotConner account is now ready to use.':magic?'You have been securely signed in. Your SkyShotConner account is ready to use.':'Your new email address has been successfully confirmed and your account is updated.'}</p><button className="auth-submit" onClick={()=>nav('/account')}>Continue to account</button><button className="auth-secondary" onClick={()=>nav('/')}>Return to home</button><div className="auth-footer">THE ART OF FLIGHT.</div></section></main>}
`
  if(!s.includes(anchor)) throw new Error('Unable to locate navigation component')
  s=s.replace(anchor,component+anchor)
}

const cssFile='app/globals.css'
let css=fs.readFileSync(cssFile,'utf8')
const cssAdd=`\n\n/* Auth success pages */\n.auth-success-card{text-align:left}.auth-success-icon{width:46px;height:46px;border:1px solid #777;border-radius:50%;display:grid;place-items:center;font-size:18px;margin:10px 0 24px;color:#eee}.auth-secondary{width:100%;padding:15px;background:transparent;color:#eee;border:1px solid #30302c;letter-spacing:.18em;text-transform:uppercase;font-size:10px;margin-top:10px}.auth-secondary:hover{border-color:#777}.auth-magic-link{width:100%;padding:14px;background:transparent;color:#eee;border:1px solid #30302c;letter-spacing:.12em;text-transform:uppercase;font-size:10px;margin-top:12px}.auth-magic-link:hover{border-color:#777}\n`
if(!css.includes('/* Auth success pages */')) fs.writeFileSync(cssFile,css+cssAdd)

fs.writeFileSync(file,s)
console.log('Auth success pages and explicit email redirects applied')
