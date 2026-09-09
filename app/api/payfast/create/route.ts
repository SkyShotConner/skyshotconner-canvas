import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const SHIPPING = 95
const PAYFAST_LIVE = 'https://www.payfast.co.za/eng/process'
const PAYFAST_SANDBOX = 'https://sandbox.payfast.co.za/eng/process'

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

function payfastSignature(data: Record<string, string>, passphrase?: string) {
  const ordered = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`)
    .join('&')
  const withPassphrase = passphrase ? `${ordered}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : ordered
  return crypto.createHash('md5').update(withPassphrase).digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const orderId = String(body?.order_id || '')
    if (!orderId) return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })

    const supabaseUrl = required('NEXT_PUBLIC_SUPABASE_URL')
    const serviceKey = required('SUPABASE_SERVICE_ROLE_KEY')
    const merchantId = required('PAYFAST_MERCHANT_ID')
    const merchantKey = required('PAYFAST_MERCHANT_KEY')
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data: order, error } = await supabase.from('orders').select('id,total,customer_name,customer_email,payment_status').eq('id', orderId).single()
    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.payment_status === 'paid') return NextResponse.json({ error: 'Order is already paid' }, { status: 409 })

    const origin = new URL(request.url).origin
    const [firstName, ...rest] = String(order.customer_name || 'Customer').trim().split(/\s+/)
    const lastName = rest.join(' ') || firstName
    const sandbox = process.env.PAYFAST_SANDBOX === 'true'
    const passphrase = process.env.PAYFAST_PASSPHRASE || undefined

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${origin}/order-confirmation?order=${order.id}&payment=success`,
      cancel_url: `${origin}/checkout?payment=cancelled`,
      notify_url: `${origin}/api/payfast/itn`,
      name_first: firstName,
      name_last: lastName,
      email_address: String(order.customer_email),
      m_payment_id: String(order.id),
      amount: Number(order.total).toFixed(2),
      item_name: 'SkyShotConner Aviation Canvas',
      item_description: `SkyShotConner canvas order ${order.id}`,
    }

    fields.signature = payfastSignature(fields, passphrase)

    await supabase.from('orders').update({ payfast_reference: String(order.id) }).eq('id', order.id)

    return NextResponse.json({ action: sandbox ? PAYFAST_SANDBOX : PAYFAST_LIVE, fields })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not prepare PayFast payment' }, { status: 500 })
  }
}
