'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type OrderItem={
  id:string
  product_name:string
  sku:string|null
  canvas_size:string|null
  quantity:number
  unit_price:number
  line_total:number
}

type Order={
  id:string
  created_at:string
  updated_at:string
  paid_at:string|null
  customer_name:string
  customer_email:string
  customer_phone:string|null
  shipping_address:Record<string,any>|null
  subtotal:number
  shipping:number
  total:number
  status:string
  payment_status:string
  payment_provider:string|null
  paystack_reference:string|null
  order_confirmation_status:string
  order_confirmation_sent_at:string|null
  order_confirmation_error:string|null
  new_order_notification_status:string
  new_order_notification_sent_at:string|null
  new_order_notification_error:string|null
  order_items:OrderItem[]
}

const ORDER_STATUSES=['paid','processing','ready','shipped','completed','cancelled'] as const

function money(value:number){
  return new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value||0))
}
function orderNumber(id:string){return 'SSC-'+id.replaceAll('-','').slice(0,10).toUpperCase()}
function date(value:string|null){
  if(!value)return '—'
  return new Intl.DateTimeFormat('en-ZA',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Johannesburg'}).format(new Date(value))
}
function sizeFor(item:OrderItem){
  if(item.canvas_size)return item.canvas_size
  return String(item.sku||'').match(/-(A[0-5])$/i)?.[1]?.toUpperCase()||''
}

export default function OrdersAdminPage(){
  const supabase=useMemo(()=>createClient(),[])
  const [allowed,setAllowed]=useState<boolean|null>(null)
  const [orders,setOrders]=useState<Order[]>([])
  const [selectedId,setSelectedId]=useState<string|null>(null)
  const [query,setQuery]=useState('')
  const [filter,setFilter]=useState('all')
  const [busy,setBusy]=useState<string|null>(null)
  const [message,setMessage]=useState('')

  async function loadOrders(preferredId?:string|null){
    if(!supabase)return
    const {data,error}=await supabase
      .from('orders')
      .select('id,created_at,updated_at,paid_at,customer_name,customer_email,customer_phone,shipping_address,subtotal,shipping,total,status,payment_status,payment_provider,paystack_reference,order_confirmation_status,order_confirmation_sent_at,order_confirmation_error,new_order_notification_status,new_order_notification_sent_at,new_order_notification_error,order_items(id,product_name,sku,canvas_size,quantity,unit_price,line_total)')
      .order('created_at',{ascending:false})
    if(error){setMessage(error.message);return}
    const next=(data||[]).map((o:any)=>({...o,order_items:o.order_items||[]})) as Order[]
    setOrders(next)
    const wanted=preferredId||selectedId
    if(wanted&&next.some(o=>o.id===wanted))setSelectedId(wanted)
    else if(next.length&&!selectedId)setSelectedId(next[0].id)
  }

  useEffect(()=>{(async()=>{
    if(!supabase){setAllowed(false);return}
    const {data}=await supabase.auth.getUser()
    if(!data.user){setAllowed(false);return}
    const {data:admin}=await supabase.rpc('is_admin')
    setAllowed(!!admin)
    if(admin)await loadOrders()
  })()},[supabase])

  const filtered=orders.filter(order=>{
    const text=(order.id+' '+orderNumber(order.id)+' '+order.customer_name+' '+order.customer_email).toLowerCase()
    const matchesQuery=text.includes(query.trim().toLowerCase())
    const matchesFilter=filter==='all'||order.status===filter||order.payment_status===filter
    return matchesQuery&&matchesFilter
  })
  const selected=orders.find(o=>o.id===selectedId)||null

  async function updateStatus(order:Order,status:string){
    if(!supabase)return
    setBusy(order.id)
    setMessage('')
    const {error}=await supabase.from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',order.id)
    if(error)setMessage(error.message)
    else{setMessage(`${orderNumber(order.id)} updated to ${status}.`);await loadOrders(order.id)}
    setBusy(null)
  }

  async function resend(order:Order){
    setBusy('email-'+order.id)
    setMessage('')
    try{
      const response=await fetch(`/api/admin/orders/${order.id}/resend-confirmation`,{method:'POST'})
      const result=await response.json()
      if(!response.ok)throw new Error(result.error||'Could not send email')
      setMessage(`Order confirmation resent to ${order.customer_email}.`)
      await loadOrders(order.id)
    }catch(error:any){setMessage(error?.message||'Could not send email')}
    setBusy(null)
  }

  if(allowed===null)return <main className="admin-shell"><div className="admin-card"><h1>Checking access…</h1></div></main>
  if(!allowed)return <main className="admin-shell"><div className="admin-card"><h1>Access denied.</h1><a className="admin-button" href="/admin">Back to admin</a></div></main>

  return <main className="admin-shell orders-admin">
    <header className="admin-header">
      <div><span className="eyebrow">SkyShotConner / Control</span><h1>Manage orders</h1><p>Review customer orders, payment status, delivery details and fulfilment progress.</p></div>
      <div className="admin-actions"><button className="admin-button secondary-admin" onClick={()=>loadOrders(selectedId)}>Refresh</button><a className="admin-link" href="/">View store ↗</a></div>
    </header>

    <div className="orders-toolbar">
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search order, customer or email…" aria-label="Search orders"/>
      <select value={filter} onChange={e=>setFilter(e.target.value)}>
        <option value="all">All orders</option>
        <option value="paid">Paid</option>
        <option value="processing">Processing</option>
        <option value="ready">Ready</option>
        <option value="shipped">Shipped</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
        <option value="pending">Payment pending</option>
      </select>
      <span>{filtered.length} order{filtered.length===1?'':'s'}</span>
    </div>

    {message&&<div className="orders-message">{message}</div>}

    <section className="orders-layout">
      <div className="admin-card orders-list">
        <div className="admin-card-head"><div><span className="eyebrow">Orders</span><h2>Recent orders</h2></div></div>
        {filtered.length?filtered.map(order=><button key={order.id} className={'order-row '+(selected?.id===order.id?'selected':'')} onClick={()=>setSelectedId(order.id)}>
          <div>
            <strong>{orderNumber(order.id)}</strong>
            <span>{order.customer_name}</span>
            <small>{date(order.created_at)}</small>
          </div>
          <div className="order-row-right">
            <b>{money(order.total)}</b>
            <span className={'order-status status-'+order.status}>{order.status}</span>
            <small className={'payment-'+order.payment_status}>{order.payment_status}</small>
          </div>
        </button>):<div className="admin-empty compact"><p>No orders match your search.</p></div>}
      </div>

      <div className="admin-card order-detail">
        {selected?<OrderDetail order={selected} busy={busy} updateStatus={updateStatus} resend={resend}/>:<div className="admin-empty"><span className="eyebrow">Order details</span><h2>Select an order.</h2></div>}
      </div>
    </section>
  </main>
}

function OrderDetail({order,busy,updateStatus,resend}:{order:Order;busy:string|null;updateStatus:(order:Order,status:string)=>void;resend:(order:Order)=>void}){
  const a=order.shipping_address||{}
  return <>
    <div className="admin-card-head order-detail-head">
      <div><span className="eyebrow">Order</span><h2>{orderNumber(order.id)}</h2><p>Placed {date(order.created_at)}</p></div>
      <span className={'order-status large status-'+order.status}>{order.status}</span>
    </div>

    <div className="order-summary-grid">
      <div><span>Customer</span><strong>{order.customer_name}</strong><small>{order.customer_email}</small>{order.customer_phone&&<small>{order.customer_phone}</small>}</div>
      <div><span>Payment</span><strong>{order.payment_status}</strong><small>{order.payment_provider||'—'}</small><small>{order.paid_at?'Paid '+date(order.paid_at):'Not paid yet'}</small></div>
      <div><span>Total</span><strong>{money(order.total)}</strong><small>Subtotal {money(order.subtotal)}</small><small>Shipping {money(order.shipping)}</small></div>
      <div><span>Customer email</span><strong>{order.order_confirmation_status||'pending'}</strong><small>{order.order_confirmation_sent_at?'Sent '+date(order.order_confirmation_sent_at):'Not sent yet'}</small></div>
      <div><span>Store alert</span><strong>{order.new_order_notification_status||'pending'}</strong><small>{order.new_order_notification_sent_at?'Sent '+date(order.new_order_notification_sent_at):order.new_order_notification_status==='skipped'?'Existing order — not sent':'Not sent yet'}</small></div>
    </div>

    <div className="order-section">
      <span className="eyebrow">Items</span>
      <div className="order-items">{order.order_items.map(item=><div className="order-item" key={item.id}>
        <div><strong>{item.product_name}</strong><small>{sizeFor(item)?`Canvas ${sizeFor(item)} · `:''}Qty {item.quantity}</small></div>
        <div><small>{money(item.unit_price)} each</small><strong>{money(item.line_total)}</strong></div>
      </div>)}</div>
    </div>

    <div className="order-section">
      <span className="eyebrow">Delivery address</span>
      <div className="order-address">
        {a.unit&&<div>{a.unit}</div>}
        <div>{a.address||'—'}</div>
        <div>{[a.city,a.province,a.postal_code||a.postal].filter(Boolean).join(', ')}</div>
        <div>{a.country||'South Africa'}</div>
      </div>
    </div>

    <div className="order-section">
      <span className="eyebrow">Fulfilment status</span>
      <div className="order-status-actions">{ORDER_STATUSES.map(status=><button key={status} disabled={busy===order.id||order.status===status} className={order.status===status?'active':''} onClick={()=>updateStatus(order,status)}>{status}</button>)}</div>
    </div>

    <div className="order-section">
      <span className="eyebrow">Store notification</span>
      <div className="email-status-box">
        <div><strong>{order.new_order_notification_status||'pending'}</strong><p>{order.new_order_notification_error||'A new paid-order notification is sent to conneraviation18@gmail.com when payment is verified.'}</p></div>
      </div>
    </div>

    <div className="order-section">
      <span className="eyebrow">Customer email</span>
      <div className="email-status-box">
        <div><strong>{order.order_confirmation_status||'pending'}</strong><p>{order.order_confirmation_error||'The confirmation email contains the order number, purchased artwork, canvas sizes, totals and delivery address.'}</p></div>
        <button className="admin-button secondary-admin" disabled={busy==='email-'+order.id||order.payment_status!=='paid'} onClick={()=>resend(order)}>{busy==='email-'+order.id?'Sending…':'Resend confirmation'}</button>
      </div>
    </div>

    {order.paystack_reference&&<div className="order-reference"><span>Paystack reference</span><code>{order.paystack_reference}</code></div>}
  </>
}
