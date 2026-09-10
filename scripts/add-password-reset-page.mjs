import fs from 'node:fs'

const file = 'app/[[...slug]]/page.tsx'
let s = fs.readFileSync(file, 'utf8')

// Route the reset link to a real password-change page.
s = s.replace("path==='/forgot-password'?<Auth mode=\"forgot\" nav={nav} supabase={supabase}/>", "path==='/forgot-password'?<Auth mode=\"forgot\" nav={nav} supabase={supabase}/>:path==='/reset-password'?<ResetPassword nav={nav} supabase={supabase}/>")

if (!s.includes('function ResetPassword(')) {
  const anchor = 'function Nav('
  const component = `function ResetPassword({nav,supabase}:{nav:(x:string)=>void;supabase:any}){
 const [ready,setReady]=useState(false),[recovery,setRecovery]=useState(false),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[saving,setSaving]=useState(false)
 useEffect(()=>{
  if(!supabase){setError('Unable to connect to account services.');setReady(true);return}
  let mounted=true
  const check=async()=>{
   try{
    const params=new URLSearchParams(window.location.search)
    const code=params.get('code')
    if(code){const {error}=await supabase.auth.exchangeCodeForSession(code);if(error){if(mounted)setError('This password reset link is invalid or has expired.');if(mounted)setReady(true);return}}
    const {data}=await supabase.auth.getSession()
    if(!mounted)return
    setRecovery(!!data.session)
    setReady(true)
   }catch{if(mounted){setError('This password reset link is invalid or has expired.');setReady(true)}}
  }
  check()
  const {data}=supabase.auth.onAuthStateChange((event:any,session:any)=>{if(!mounted)return;if(event==='PASSWORD_RECOVERY'||session){setRecovery(!!session);setReady(true)}})
  return()=>{mounted=false;data.subscription.unsubscribe()}
 },[supabase])
 const submit=async(e:any)=>{e.preventDefault();setError('');setMessage('');if(password.length<8){setError('Your password must be at least 8 characters.');return}if(password!==confirm){setError('The passwords do not match.');return}setSaving(true);const {error}=await supabase.auth.updateUser({password});setSaving(false);if(error){setError(error.message);return}setMessage('Your password has been updated successfully.');setPassword('');setConfirm('')}
 if(!ready)return <main className=\"auth-page\"><section className=\"auth-card\"><div className=\"eyebrow\">SkyShotConner / Account security</div><h1>VERIFYING<br/>YOUR LINK.</h1><p className=\"auth-intro\">Please wait while we securely verify your password reset request.</p></section></main>
 if(!recovery)return <main className=\"auth-page\"><section className=\"auth-card\"><div className=\"eyebrow\">SkyShotConner / Password recovery</div><h1>RESET LINK<br/>EXPIRED.</h1><p className=\"auth-intro\">This password reset link is invalid or has already been used. Request a new reset email to continue.</p><button className=\"auth-submit\" onClick={()=>nav('/forgot-password')}>Request a new link</button></section></main>
 return <main className=\"auth-page\"><section className=\"auth-card\"><div className=\"eyebrow\">SkyShotConner / Account security</div><h1>CHOOSE A<br/>NEW PASSWORD.</h1><p className=\"auth-intro\">Create a new password for your SkyShotConner account.</p>{error&&<div className=\"auth-message error\">{error}</div>}{message&&<div className=\"auth-message success\">{message}</div>}{!message&&<form className=\"auth-form\" onSubmit={submit}><label>New password<input type=\"password\" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required autoComplete=\"new-password\"/></label><label>Confirm password<input type=\"password\" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={8} required autoComplete=\"new-password\"/></label><button className=\"auth-submit\" disabled={saving}>{saving?'Updating password…':'Update password'}</button></form>}{message&&<button className=\"auth-submit\" onClick={()=>nav('/login')}>Return to sign in</button>}<div className=\"auth-footer\">THE ART OF FLIGHT.</div></section></main>
}
`
  if (!s.includes(anchor)) throw new Error('Unable to locate navigation component')
  s = s.replace(anchor, component + anchor)
}

fs.writeFileSync(file, s)
console.log('Password reset page applied')
