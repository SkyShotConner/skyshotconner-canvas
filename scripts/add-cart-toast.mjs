import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// Add lightweight cart confirmation state to the storefront root.
if(!s.includes('const [cartToast,setCartToast]')){
  s=s.replace(
    "const [products,setProducts]=useState<Product[]>(demoProducts),[cart,setCart]=useState<CartItem[]>([]),",
    "const [products,setProducts]=useState<Product[]>(demoProducts),[cart,setCart]=useState<CartItem[]>([]),[cartToast,setCartToast]=useState<{name:string;size:string}|null>(null),"
  )
}

// Show a confirmation whenever an item is successfully added to the cart.
const oldAdd="const add=(p:Product,size=selectedSize,frame=selectedFrame)=>setCart(c=>{const price=canvasPrice(size,frame),key=p.id+size+frame,hit=c.find(x=>x.product.id+x.size+x.frame===key);return hit?c.map(x=>x===hit?{...x,quantity:x.quantity+1}:x):[...c,{product:p,size,frame,quantity:1,price}]})"
const newAdd="const add=(p:Product,size=selectedSize,frame=selectedFrame)=>{setCart(c=>{const price=canvasPrice(size,frame),key=p.id+size+frame,hit=c.find(x=>x.product.id+x.size+x.frame===key);return hit?c.map(x=>x===hit?{...x,quantity:x.quantity+1}:x):[...c,{product:p,size,frame,quantity:1,price}]});setCartToast({name:p.name,size});window.setTimeout(()=>setCartToast(null),3200)}"
if(s.includes(oldAdd)) s=s.replace(oldAdd,newAdd)

// Render the toast globally so it appears regardless of which page the customer is on.
if(!s.includes('<CartToast toast={cartToast}')){
  s=s.replace(
    "return <div><Nav cart={cart.reduce((n,i)=>n+i.quantity,0)}",
    "return <div><CartToast toast={cartToast} onClose={()=>setCartToast(null)} /><Nav cart={cart.reduce((n,i)=>n+i.quantity,0)}"
  )
}

// Add the reusable toast component before the navigation component.
if(!s.includes('function CartToast(')){
  const anchor='function Nav('
  const component="function CartToast({toast,onClose}:{toast:{name:string;size:string}|null;onClose:()=>void}){return <AnimatePresence>{toast&&<motion.div className=\"cart-toast\" initial={{opacity:0,x:28,y:-8}} animate={{opacity:1,x:0,y:0}} exit={{opacity:0,x:28}} transition={{duration:.22}} role=\"status\" aria-live=\"polite\"><div className=\"cart-toast-check\">✓</div><div className=\"cart-toast-copy\"><strong>Added to your bag</strong><span>{toast.name}</span><small>{toast.size} · Canvas</small></div><button onClick={onClose} aria-label=\"Dismiss notification\">×</button></motion.div>}</AnimatePresence>}\n"
  if(!s.includes(anchor)) throw new Error('Unable to locate navigation component')
  s=s.replace(anchor,component+anchor)
}

fs.writeFileSync(file,s)

const css=`
/* Cart confirmation toast */
.cart-toast{position:fixed;top:78px;right:22px;z-index:9500;width:min(360px,calc(100vw - 32px));display:flex;align-items:flex-start;gap:13px;padding:15px 14px 15px 15px;background:#11120f;color:#f5f4f0;border:1px solid rgba(245,244,240,.16);box-shadow:0 18px 45px rgba(0,0,0,.32);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}.cart-toast-check{width:24px;height:24px;flex:0 0 24px;border:1px solid rgba(245,244,240,.4);display:grid;place-items:center;font-size:12px;margin-top:1px}.cart-toast-copy{min-width:0;display:flex;flex-direction:column;gap:3px}.cart-toast-copy strong{font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:500}.cart-toast-copy span{font-size:13px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:255px;opacity:.82}.cart-toast-copy small{font-size:10px;letter-spacing:.08em;text-transform:uppercase;opacity:.48}.cart-toast>button{margin-left:auto;background:none;border:0;color:inherit;font-size:20px;line-height:1;padding:0 1px;opacity:.55;cursor:pointer}.cart-toast>button:hover{opacity:1}@media(max-width:600px){.cart-toast{top:68px;right:12px;width:calc(100vw - 24px);padding:14px}.cart-toast-copy span{max-width:calc(100vw - 125px)}}
`
const cssFile='app/performance.css'
let styles=fs.existsSync(cssFile)?fs.readFileSync(cssFile,'utf8'):''
if(!styles.includes('/* Cart confirmation toast */')) fs.writeFileSync(cssFile,styles+css)

console.log('Cart confirmation toast applied')
