import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// Make the password visibility control deterministic after every prebuild transformation.
s=s.replace("import { Heart, Search, ShoppingBag, User, ArrowUpRight, Menu, X, Trash2, Minus, Plus, ChevronDown, SlidersHorizontal } from 'lucide-react'","import { Heart, Search, ShoppingBag, User, ArrowUpRight, Menu, X, Trash2, Minus, Plus, ChevronDown, SlidersHorizontal, Eye, EyeOff } from 'lucide-react'")
s=s.replace("import { Heart, Search, ShoppingBag, User, ArrowUpRight, Menu, X, Trash2, Minus, Plus, ChevronDown, SlidersHorizontal, Eye, EyeOff, Eye, EyeOff } from 'lucide-react'","import { Heart, Search, ShoppingBag, User, ArrowUpRight, Menu, X, Trash2, Minus, Plus, ChevronDown, SlidersHorizontal, Eye, EyeOff } from 'lucide-react'")

const authStart=s.indexOf('function Auth(')
const authEnd=s.indexOf('function Wishlist(',authStart)
if(authStart>=0&&authEnd>authStart){
 const authFn=`function Auth({mode,nav,supabase}:{mode:'login'|'signup'|'forgot';nav:(x:string)=>void;supabase:any}){const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[msg,setMsg]=useState(''),[showPassword,setShowPassword]=useState(false),[busy,setBusy]=useState(false);async function go(e:any){e.preventDefault();if(!supabase){setMsg('Connect Supabase first.');return}setBusy(true);setMsg('');let r;if(mode==='login')r=await supabase.auth.signInWithPassword({email,password});else if(mode==='signup')r=await supabase.auth.signUp({email,password,options:{emailRedirectTo:'https://skyshotconner.co.za/auth/verified',data:{full_name:name}}});else r=await supabase.auth.resetPasswordForEmail(email,{redirectTo:'https://skyshotconner.co.za/reset-password'});if(r.error)setMsg(r.error.message);else{setMsg(mode==='forgot'?'Check your email for the reset link.':mode==='signup'?'Check your email to verify your account.':'Signed in.');if(mode==='login')nav('/account')}setBusy(false)}return <main className=\"page container\"><div className=\"form-wrap\"><div className=\"eyebrow\">SkyShotConner</div><h1 className=\"page-title\">{mode==='login'?'WELCOME BACK':mode==='signup'?'JOIN THE FLIGHT':'RESET ACCESS'}</h1><form className=\"form\" onSubmit={go}>{mode==='signup'&&<Field label=\"Full name\" value={name} set={setName}/>}<Field label=\"Email\" value={email} set={setEmail} type=\"email\"/>{mode!=='forgot'&&<div className=\"password-field\"><label>Password</label><div className=\"password-input-wrap\"><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='login'?'current-password':'new-password'}/><button type=\"button\" className=\"password-toggle\" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></div>}{msg&&<div className=\"notice\">{msg}</div>}<button className=\"primary\" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':mode==='signup'?'Create account':'Send reset link'}</button></form><div className=\"auth-links\">{mode==='login'?<><button onClick={()=>nav('/forgot-password')}>Forgot password?</button><button onClick={()=>nav('/signup')}>Create account</button></>:<button onClick={()=>nav('/login')}>Already have an account? Sign in</button>}</div></div></main>}`
 s=s.slice(0,authStart)+authFn+s.slice(authEnd)
}

fs.writeFileSync(file,s)
console.log('Final auth UI applied')
