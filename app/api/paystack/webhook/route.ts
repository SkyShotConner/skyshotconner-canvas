import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a || '')
  const bb = Buffer.from(b || '')
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb)
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature') || ''
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return new NextResponse('Paystack is not configured', { status: 500 })

    const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
    if (!safeEqual(signature, expected)) return new NextResponse('Invalid signature', { status: 401 })

    const event = JSON.parse(rawBody)
    if (event?.event !== 'charge.success') return new NextResponse('OK', { status: 200 })

    const data = event.data || {}
    const reference = String(data.reference || '')
    if (!reference) return new NextResponse('Missing reference', { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: order, error } = await supabase
      .from('orders')
      .select('id,total,payment_status')
      .eq('paystack_reference', reference)
      .single()

    if (error || !order) return new NextResponse('Order not found', { status: 404 })
    if (order.payment_status === 'paid') return new NextResponse('OK', { status: 200 })

    const receivedAmount = Number(data.amount || 0) / 100
    if (Math.abs(receivedAmount - Number(order.total)) > 0.01) {
      return new NextResponse('Amount mismatch', { status: 400 })
    }

    if (String(data.currency || '').toUpperCase() !== 'ZAR') {
      return new NextResponse('Currency mismatch', { status: 400 })
    }

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    })
    const verification = await verifyResponse.json()
    if (!verifyResponse.ok || !verification?.status || verification?.data?.status !== 'success') {
      return new NextResponse('Payment verification failed', { status: 400 })
    }

    await supabase.from('orders').update({
      payment_provider: 'paystack',
      payment_status: 'paid',
      status: 'paid',
      paystack_payment_id: verification.data.id || data.id || null,
      paid_at: new Date().toISOString(),
    }).eq('id', order.id)

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Paystack webhook error', error)
    return new NextResponse('Server error', { status: 500 })
  }
}
