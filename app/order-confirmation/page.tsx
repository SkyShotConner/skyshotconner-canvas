'use client'

import { useEffect, useState } from 'react'
import { sendGAEvent } from '@next/third-parties/google'
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
        const transactionId=String(result.order_id||reference)
        setOrder(transactionId)
        setStatus(result.status==='paid'?'paid':result.status==='failed'?'failed':'pending')

        if(result.status==='paid'){
          try{
            const rawCart=localStorage.getItem('ssc-cart')
            const cart=rawCart?JSON.parse(rawCart):[]
            const items=Array.isArray(cart)?cart.map((item:any)=>({
              item_id:String(item?.product?.id||''),
              item_name:String(item?.product?.name||'Artwork'),
              item_category:String(item?.product?.category||'Photography Art'),
              item_variant:`${item?.size||''} / ${item?.frame||''}`,
              price:Number(item?.price)||0,
              quantity:Number(item?.quantity)||1,
            })).filter((item:any)=>item.item_id):[]
            const merchandiseValue=items.reduce((sum:number,item:any)=>sum+(Number(item.price)||0)*(Number(item.quantity)||1),0)
            const purchaseKey=`ssc-ga-purchase:${transactionId}`

            if(!localStorage.getItem(purchaseKey)){
              sendGAEvent('event','purchase',{
                transaction_id:transactionId,
                currency:'ZAR',
                value:merchandiseValue>0?merchandiseValue:Math.max(0,(Number(result.order_total)||0)-95),
                shipping:items.length?95:0,
                items,
              })
              localStorage.setItem(purchaseKey,new Date().toISOString())
            }
          }catch(error){
            console.error('Could not prepare GA4 purchase event',error)
          }
          localStorage.removeItem('ssc-cart')
        }
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
