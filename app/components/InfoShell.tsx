'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Heart, Search, ShoppingBag, User } from 'lucide-react'

export default function InfoShell({children}:{children:React.ReactNode}){
 const router=useRouter()
 return <div className="info-shell">
  <header className="site-nav info-nav"><button className="brand" onClick={()=>router.push('/')}>SKYSHOTCONNER</button><nav className="navlinks"><Link href="/shop">Collection</Link><Link href="/shop">Aircraft</Link><Link href="/about">About</Link></nav><div className="navtools"><button aria-label="Search" onClick={()=>router.push('/search')}><Search size={14}/></button><button aria-label="Account" onClick={()=>router.push('/account')}><User size={14}/></button><button aria-label="Saved works" onClick={()=>router.push('/wishlist')}><Heart size={14}/></button><button aria-label="Shopping bag" onClick={()=>router.push('/cart')}><ShoppingBag size={14}/></button></div></header>
  {children}
  <footer className="info-footer"><div className="info-footer-top"><div><div className="eyebrow">SkyShotConner</div><div className="info-footer-title">THE ART<br/>OF FLIGHT.</div></div><div className="info-footer-links"><div><span className="eyebrow">Explore</span><Link href="/shop">Collection <ArrowUpRight size={12}/></Link><Link href="/about">About <ArrowUpRight size={12}/></Link><Link href="/faq">FAQ <ArrowUpRight size={12}/></Link></div><div><span className="eyebrow">Help</span><Link href="/contact">Contact <ArrowUpRight size={12}/></Link><Link href="/privacy">Privacy <ArrowUpRight size={12}/></Link><Link href="/terms">Terms <ArrowUpRight size={12}/></Link></div></div></div><div className="info-footer-bottom"><span>© {new Date().getFullYear()} SkyShotConner</span><span>Aviation photography · South Africa</span></div></footer>
 </div>
}
