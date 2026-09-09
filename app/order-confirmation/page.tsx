'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ArrowUpRight } from 'lucide-react'

export default function OrderConfirmation(){
  const [order,setOrder]=useState('')
  const [status,setStatus]=useState<'checking'|'paid'|'pending'|'failed'>('checking')

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const reference=params.get('reference')||''
    if(!reference){setStatus('pending');return}

    let active=true
    fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .then(r=>r.json())
      .then(result=>{
        if(!active)return
        setOrder(result.order_id||reference)
        setStatus(result.status==='paid'?'paid':result.status==='failed'?'failed':'pending')
        if(result.status==='paid')localStorage.removeItem('ssc-cart')
      })
      .catch(()=>active&&setStatus('pending'))

    return()=>{active=false}
  },[])

  const title=status==='paid'?'THANK\nYOU.':'PAYMENT\nPROCESSING.'
  const message=status==='paid'
    ? 'Your Paystack payment has been confirmed. Your SkyShotConner aviation artwork order is now being prepared.'
    : 'We have received your return from Paystack. We are confirming the transaction securely. Your order will only be marked paid after Paystack confirms the payment.'

  return <main className="page container" style={{minHeight:'70vh',display:'grid',placeItems:'center'}}>
    <div style={{maxWidth:680,textAlign:'center'}}>
      <CheckCircle2 size={42} strokeWidth={1.2}/>
      <div className="eyebrow" style={{marginTop:28}}>SkyShotConner Canvas</div>
      <h1 className="page-title" style={{marginTop:10,whiteSpace:'pre-line'}}>{title}</h1>
      <p style={{maxWidth:520,margin:'0 auto 28px',lineHeight:1.7}}>{message}</p>
      {order&&<div className="notice" style={{margin:'0 auto 28px'}}>Order reference · {order}</div>}
      <button className="hero-cta" onClick={()=>window.location.href='/shop'}>Continue shopping <ArrowUpRight size={14}/></button>
    </div>
  </main>
}
