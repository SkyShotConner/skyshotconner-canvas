import fs from 'node:fs'

const file = 'app/[[...slug]]/page.tsx'
let s = fs.readFileSync(file, 'utf8')

if (!s.includes("import { sendGAEvent } from '@next/third-parties/google'")) {
  const anchor = "import { createClient, storageUrl } from '@/lib/supabase/client'"
  if (!s.includes(anchor)) throw new Error('Unable to locate storefront import anchor for GA4 ecommerce')
  s = s.replace(anchor, "import { sendGAEvent } from '@next/third-parties/google'\n" + anchor)
}

if (!s.includes('function gaItem(')) {
  const anchor = "function canvasPrice(size:string,frame:string){return (CANVAS_PRICES[size]||99.99)+(FRAME_PRICES[frame]||0)}"
  if (!s.includes(anchor)) throw new Error('Unable to locate canvas price helper for GA4 ecommerce')
  const helpers = "\nfunction gaItem(product:Product,size:string,frame:string,price:number,quantity=1){return {item_id:product.id,item_name:product.name,item_category:product.category||'Photography Art',item_variant:`${size} / ${frame}`,price,quantity}}\nfunction gaItems(cart:CartItem[]){return cart.map(item=>gaItem(item.product,item.size,item.frame,item.price,item.quantity))}\n"
  s = s.replace(anchor, anchor + helpers)
}

if (!s.includes("sendGAEvent('event','add_to_cart'")) {
  const toastPrefix = "const add=(p:Product,size=selectedSize,frame=selectedFrame)=>{setCart("
  if (s.includes(toastPrefix)) {
    s = s.replace(toastPrefix, "const add=(p:Product,size=selectedSize,frame=selectedFrame)=>{const trackedPrice=canvasPrice(size,frame);setCart(")
    const toastEnd = "window.setTimeout(()=>setCartToast(null),3200)}"
    if (!s.includes(toastEnd)) throw new Error('Unable to locate cart toast end for GA4 add_to_cart')
    s = s.replace(toastEnd, "window.setTimeout(()=>setCartToast(null),3200);sendGAEvent('event','add_to_cart',{currency:'ZAR',value:trackedPrice,items:[gaItem(p,size,frame,trackedPrice,1)]})}")
  } else {
    const plainAdd = "const add=(p:Product,size=selectedSize,frame=selectedFrame)=>setCart(c=>{const price=canvasPrice(size,frame),key=p.id+size+frame,hit=c.find(x=>x.product.id+x.size+x.frame===key);return hit?c.map(x=>x===hit?{...x,quantity:x.quantity+1}:x):[...c,{product:p,size,frame,quantity:1,price}]})"
    if (!s.includes(plainAdd)) throw new Error('Unable to locate add-to-cart handler for GA4 ecommerce')
    const trackedAdd = "const add=(p:Product,size=selectedSize,frame=selectedFrame)=>{const trackedPrice=canvasPrice(size,frame);setCart(c=>{const price=trackedPrice,key=p.id+size+frame,hit=c.find(x=>x.product.id+x.size+x.frame===key);return hit?c.map(x=>x===hit?{...x,quantity:x.quantity+1}:x):[...c,{product:p,size,frame,quantity:1,price}]});sendGAEvent('event','add_to_cart',{currency:'ZAR',value:trackedPrice,items:[gaItem(p,size,frame,trackedPrice,1)]})}"
    s = s.replace(plainAdd, trackedAdd)
  }
}

if (!s.includes("sendGAEvent('event','view_item'")) {
  const productStart = "function ProductPage({product,selectedSize,setSelectedSize,selectedFrame,setSelectedFrame,add,wished,toggleWish}:{product:Product;selectedSize:string;setSelectedSize:(x:string)=>void;selectedFrame:string;setSelectedFrame:(x:string)=>void;add:(p:Product)=>void;wished:boolean;toggleWish:()=>void}){const total=canvasPrice(selectedSize,selectedFrame);return "
  if (!s.includes(productStart)) throw new Error('Unable to locate product page for GA4 view_item')
  const trackedProductStart = "function ProductPage({product,selectedSize,setSelectedSize,selectedFrame,setSelectedFrame,add,wished,toggleWish}:{product:Product;selectedSize:string;setSelectedSize:(x:string)=>void;selectedFrame:string;setSelectedFrame:(x:string)=>void;add:(p:Product)=>void;wished:boolean;toggleWish:()=>void}){const total=canvasPrice(selectedSize,selectedFrame);useEffect(()=>{sendGAEvent('event','view_item',{currency:'ZAR',value:total,items:[gaItem(product,selectedSize,selectedFrame,total,1)]})},[product.id]);return "
  s = s.replace(productStart, trackedProductStart)
}

if (!s.includes("sendGAEvent('event','begin_checkout'")) {
  const checkoutButton = '<button className="primary" onClick={()=>nav(\'/checkout\')}>Proceed to checkout</button>'
  if (!s.includes(checkoutButton)) throw new Error('Unable to locate checkout button for GA4 begin_checkout')
  const trackedCheckoutButton = '<button className="primary" onClick={()=>{sendGAEvent(\'event\',\'begin_checkout\',{currency:\'ZAR\',value:subtotal,items:gaItems(cart)});nav(\'/checkout\')}}>Proceed to checkout</button>'
  s = s.replace(checkoutButton, trackedCheckoutButton)
}

fs.writeFileSync(file, s)
console.log('GA4 ecommerce storefront events applied')
