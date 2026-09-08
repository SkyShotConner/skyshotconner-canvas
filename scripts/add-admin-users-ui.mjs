import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

if(!s.includes('function AdminUsersPanel(')){
  const panel=`function AdminUsersPanel({nav,supabase}:{nav:(x:string)=>void;supabase:any}){const [users,setUsers]=useState<any[]>([]);const [loading,setLoading]=useState(true);const [search,setSearch]=useState('');const [editing,setEditing]=useState<any>(null);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const load=async()=>{if(!supabase)return;setLoading(true);setMessage('');const {data,error}=await supabase.functions.invoke('admin-user-management',{method:'GET',headers:{'Content-Type':'application/json'}});if(error)setMessage(error.message||'Could not load users.');else setUsers(data?.users||[]);setLoading(false)};useEffect(()=>{load()},[supabase]);const action=async(method:'PATCH'|'DELETE',body:any)=>{setBusy(true);setMessage('');const {data,error}=await supabase.functions.invoke('admin-user-management',{method,body});if(error||data?.error){setMessage(error?.message||data?.error||'Action failed.')}else{setEditing(null);await load()}setBusy(false)};const filtered=users.filter(u=>(u.email+' '+u.full_name+' '+u.phone).toLowerCase().includes(search.toLowerCase()));return <main className="admin-users-page container"><div className="admin-users-head"><div><div className="eyebrow">Administration</div><h1 className="page-title">USERS.</h1><p>Manage registered SkyShotConner customer accounts.</p></div><button className="secondary admin-users-back" onClick={()=>nav('/admin')}>← Admin panel</button></div><div className="admin-users-toolbar"><div><strong>{users.length}</strong> registered users</div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="SEARCH USERS"/></div>{message&&<div className="notice admin-users-message">{message}</div>}{loading?<div className="notice">Loading users…</div>:<div className="admin-users-table"><div className="admin-users-row admin-users-header"><span>User</span><span>Contact</span><span>Status</span><span>Created</span><span>Actions</span></div>{filtered.map(u=><div className="admin-users-row" key={u.id}><div><strong>{u.full_name||'Unnamed customer'}</strong><small>{u.email}</small></div><div><span>{u.phone||'—'}</span></div><div><span className={u.email_confirmed_at?'user-status verified':'user-status'}>{u.email_confirmed_at?'Verified':'Unverified'}</span>{u.banned_until&&<span className="user-status banned">Disabled</span>}</div><div>{u.created_at?new Date(u.created_at).toLocaleDateString('en-ZA'): '—'}</div><div className="admin-user-actions"><button onClick={()=>setEditing({...u})}>Edit</button><button onClick={()=>action('PATCH',{id:u.id,action:u.banned_until?'unban':'ban'})}>{u.banned_until?'Enable':'Disable'}</button><button className="danger" onClick={()=>{if(confirm('Permanently delete this user account? This cannot be undone.'))action('DELETE',{id:u.id})}}>Delete</button></div></div>)}</div>}{editing&&<div className="admin-user-modal"><div className="admin-user-modal-card"><div className="eyebrow">Edit customer</div><h2>{editing.email}</h2><label>Full name<input value={editing.full_name||''} onChange={e=>setEditing({...editing,full_name:e.target.value})}/></label><label>Email<input type="email" value={editing.email||''} onChange={e=>setEditing({...editing,email:e.target.value})}/></label><label>Phone<input value={editing.phone||''} onChange={e=>setEditing({...editing,phone:e.target.value})}/></label><div className="admin-user-modal-actions"><button className="secondary" onClick={()=>setEditing(null)}>Cancel</button><button className="primary" disabled={busy} onClick={()=>action('PATCH',{id:editing.id,action:'update',full_name:editing.full_name,email:editing.email,phone:editing.phone})}>{busy?'Saving…':'Save changes'}</button></div></div></div>}</main>}
`
  const footer=s.indexOf('function Footer(')
  if(footer<0) throw new Error('Footer component not found')
  s=s.slice(0,footer)+panel+s.slice(footer)
}

if(!s.includes("path==='/admin/users'")){
  const accountRoute="path.startsWith('/account')?<Account user={user} nav={nav} supabase={supabase}/>"
  if(!s.includes(accountRoute)) throw new Error('Account route not found')
  s=s.replace(accountRoute,"path==='/admin/users'?<AdminUsersPanel nav={nav} supabase={supabase}/>:"+accountRoute)
}

// Put a prominent Users button inside the existing admin page by wrapping its component when available.
if(!s.includes('function AdminLegacy(')&&s.includes('function Admin(')){
  s=s.replace('function Admin(', 'function AdminLegacy(')
  const legacyStart=s.indexOf('function AdminLegacy(')
  const next=s.indexOf('function ',legacyStart+10)
  const wrapper=`function Admin(props:any){const [showUsers,setShowUsers]=useState(false);if(showUsers)return <AdminUsersPanel nav={props.nav} supabase={props.supabase}/>;return <div className="admin-shell-wrap"><AdminLegacy {...props}/><div className="admin-users-launch"><div><span className="eyebrow">Customer accounts</span><h2>User management</h2><p>View, edit, disable or delete registered customer accounts.</p></div><button className="primary" onClick={()=>setShowUsers(true)}>Manage users →</button></div></div>}
`
  s=s.slice(0,next)+wrapper+s.slice(next)
}

fs.writeFileSync(file,s)
console.log('Admin user management UI added')
