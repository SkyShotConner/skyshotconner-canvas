import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export async function POST(request: Request) {
  try {
    const authClient = await createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in before checkout.' }, { status: 401 })

    const body = await request.json()
    const orderId = String(body?.order_id || '')
    if (!orderId) return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })

    const supabase = createClient(
      required('NEXT_PUBLIC_SUPABASE_URL'),
      required('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: order, error } = await supabase
      .from('orders')
      .select('id,user_id,total,customer_name,customer_email,payment_status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.payment_status === 'paid') return NextResponse.json({ error: 'Order is already paid' }, { status: 409 })

    const total = Number(order.total)
    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: 'Order total is invalid' }, { status: 400 })
    }

    const email = String(order.customer_email || user.email || '').trim()
    if (!email) return NextResponse.json({ error: 'A customer email is required for payment.' }, { status: 400 })

    // Paystack requires a unique reference for every initialization attempt.
    // A fresh reference also allows a customer to retry an abandoned/expired checkout safely.
    const reference = `SSC-${order.id}-${Date.now()}`
    const origin = new URL(request.url).origin

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${required('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(total * 100),
        currency: 'ZAR',
        reference,
        callback_url: `${origin}/order-confirmation?reference=${encodeURIComponent(reference)}`,
        metadata: {
          order_id: String(order.id),
          customer_name: String(order.customer_name || ''),
          cancel_action: `${origin}/checkout?payment=cancelled`,
        },
      }),
      cache: 'no-store',
    })

    const result = await response.json()
    if (!response.ok || !result?.status || !result?.data?.authorization_url || !result?.data?.reference) {
      console.error('Paystack initialization failed', result)
      return NextResponse.json({ error: result?.message || 'Paystack could not initialize the payment.' }, { status: 502 })
    }

    const paystackReference = String(result.data.reference)
    if (paystackReference !== reference) {
      console.error('Paystack returned an unexpected transaction reference')
      return NextResponse.json({ error: 'Payment reference validation failed.' }, { status: 502 })
    }

    const { error: updateError } = await supabase.from('orders').update({
      payment_provider: 'paystack',
      paystack_reference: paystackReference,
    }).eq('id', order.id)

    if (updateError) {
      console.error('Could not save Paystack reference', updateError)
      return NextResponse.json({ error: 'Could not save payment session.' }, { status: 500 })
    }

    return NextResponse.json({
      authorization_url: result.data.authorization_url,
      reference: paystackReference,
    })
  } catch (error: any) {
    console.error('Paystack initialize error', error)
    return NextResponse.json({ error: error?.message || 'Could not start Paystack payment.' }, { status: 500 })
  }
}
