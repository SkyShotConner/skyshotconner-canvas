'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ArrowUpRight } from 'lucide-react'

export default function OrderConfirmation(){
  const [order,setOrder]=useState('')
  useEffect(()=>{const params=new URLSearchParams(window.location.search);setOrder(params.get('order')||'');if(params.get('payment')==='success')localStorage.removeItem('ssc-cart')},[])
  return <main className="page container" style={{minHeight:'70vh',display:'grid',placeItems:'center'}}>
    <div style={{maxWidth:680,textAlign:'center'}}>
      <CheckCircle2 size={42} strokeWidth={1.2}/>
      <div className="eyebrow" style={{marginTop:28}}>SkyShotConner Canvas</div>
      <h1 className="page-title" style={{marginTop:10}}>THANK<br/>YOU.</h1>
      <p style={{maxWidth:520,margin:'0 auto 28px',lineHeight:1.7}}>Your payment has been sent to PayFast. We are confirming the transaction and will begin preparing your aviation artwork once the payment notification is received.</p>
      {order&&<div className="notice" style={{margin:'0 auto 28px'}}>Order reference · {order}</div>}
      <button className="hero-cta" onClick={()=>window.location.href='/shop'}>Continue shopping <ArrowUpRight size={14}/></button>
    </div>
  </main>
}
