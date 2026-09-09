import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const reference = new URL(request.url).searchParams.get('reference') || ''
    if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 })

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Paystack is not configured' }, { status: 500 })

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    })
    const result = await response.json()
    if (!response.ok || !result?.status) return NextResponse.json({ status: 'pending' })

    const transaction = result.data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: order } = await supabase
      .from('orders')
      .select('id,total,payment_status')
      .eq('paystack_reference', reference)
      .single()

    if (!order) return NextResponse.json({ status: 'pending' })

    const amountMatches = Math.abs(Number(transaction.amount || 0) / 100 - Number(order.total)) <= 0.01
    const currencyMatches = String(transaction.currency || '').toUpperCase() === 'ZAR'

    if (transaction.status === 'success' && amountMatches && currencyMatches) {
      await supabase.from('orders').update({
        payment_provider: 'paystack',
        payment_status: 'paid',
        status: 'paid',
        paystack_payment_id: transaction.id || null,
        paid_at: new Date().toISOString(),
      }).eq('id', order.id)
      return NextResponse.json({ status: 'paid', order_id: order.id })
    }

    return NextResponse.json({ status: transaction.status || 'pending', order_id: order.id })
  } catch (error) {
    console.error('Paystack verification error', error)
    return NextResponse.json({ status: 'pending' })
  }
}
