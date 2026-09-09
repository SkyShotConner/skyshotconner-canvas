import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function signature(data: Record<string, string>, passphrase?: string) {
  const ordered = Object.entries(data)
    .filter(([key, value]) => key !== 'signature' && value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`)
    .join('&')
  const payload = passphrase ? `${ordered}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : ordered
  return crypto.createHash('md5').update(payload).digest('hex')
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a || '')
  const bb = Buffer.from(b || '')
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb)
}

async function validateWithPayfast(data: Record<string, string>) {
  const payload = new URLSearchParams()
  for (const [key, value] of Object.entries(data)) payload.append(key, value)
  const response = await fetch('https://www.payfast.co.za/eng/query/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
    cache: 'no-store',
  })
  return (await response.text()).trim() === 'VALID'
}

export async function POST(request: Request) {
  try {
    const raw = await request.text()
    const params = new URLSearchParams(raw)
    const data: Record<string, string> = {}
    params.forEach((value, key) => { data[key] = value })

    const received = data.signature || ''
    const expected = signature(data, process.env.PAYFAST_PASSPHRASE || undefined)
    if (!safeEqual(received, expected)) return new NextResponse('Invalid signature', { status: 400 })

    const merchantId = process.env.PAYFAST_MERCHANT_ID
    if (!merchantId || data.merchant_id !== merchantId) return new NextResponse('Invalid merchant', { status: 400 })

    const allowedIps = (process.env.PAYFAST_ALLOWED_IPS || '').split(',').map(x => x.trim()).filter(Boolean)
    const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
    const sourceIp = forwarded.split(',')[0].trim()
    if (allowedIps.length && sourceIp && !allowedIps.includes(sourceIp)) return new NextResponse('Invalid source', { status: 403 })

    if (!(await validateWithPayfast(data))) return new NextResponse('PayFast validation failed', { status: 400 })

    const orderId = data.m_payment_id
    if (!orderId) return new NextResponse('Missing order reference', { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: order, error } = await supabase.from('orders').select('id,total,payment_status').eq('id', orderId).single()
    if (error || !order) return new NextResponse('Order not found', { status: 404 })

    const receivedAmount = Number(data.amount_gross || data.amount || 0)
    if (Math.abs(receivedAmount - Number(order.total)) > 0.01) return new NextResponse('Amount mismatch', { status: 400 })

    const status = String(data.payment_status || '').toLowerCase()
    if (status === 'complete') {
      await supabase.from('orders').update({
        payment_status: 'paid',
        status: 'paid',
        payfast_payment_id: data.pf_payment_id || data.m_payment_id,
        paid_at: new Date().toISOString(),
      }).eq('id', order.id)
    } else if (['failed', 'cancelled'].includes(status)) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        status: 'cancelled',
        payfast_payment_id: data.pf_payment_id || null,
      }).eq('id', order.id)
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('PayFast ITN error', error)
    return new NextResponse('Server error', { status: 500 })
  }
}
