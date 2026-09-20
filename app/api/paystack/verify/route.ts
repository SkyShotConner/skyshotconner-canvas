import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOrderEmails } from '@/lib/orders/order-confirmation-email'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const reference = new URL(request.url).searchParams.get('reference') || ''
    if (!reference || reference.length > 200) {
      return NextResponse.json({ error: 'Invalid or missing reference' }, { status: 400 })
    }

    const secret = process.env.PAYSTACK_SECRET_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!secret || !supabaseUrl || !serviceRoleKey) {
      console.error('Paystack verification is missing server configuration')
      return NextResponse.json({ status: 'pending' }, { status: 500 })
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    })
    const result = await response.json()
    if (!response.ok || !result?.status || !result?.data) {
      return NextResponse.json({ status: 'pending' })
    }

    const transaction = result.data
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id,total,payment_status,paystack_reference')
      .eq('paystack_reference', reference)
      .maybeSingle()

    if (orderError) {
      console.error('Could not load order for Paystack verification', orderError)
      return NextResponse.json({ status: 'pending' }, { status: 500 })
    }
    if (!order) return NextResponse.json({ status: 'pending' })

    // Never trust the browser redirect alone. Confirm Paystack's verified
    // transaction matches the exact order, amount, currency and reference.
    const referenceMatches = String(transaction.reference || '') === reference && order.paystack_reference === reference
    const expectedAmount = Math.round(Number(order.total) * 100)
    const amountMatches = Number.isFinite(expectedAmount) && expectedAmount > 0 && Number(transaction.amount) === expectedAmount
    const currencyMatches = String(transaction.currency || '').toUpperCase() === 'ZAR'
    const metadataOrderId = transaction.metadata?.order_id
    const metadataMatches = metadataOrderId != null && String(metadataOrderId) === String(order.id)

    if (transaction.status === 'success' && referenceMatches && amountMatches && currencyMatches && metadataMatches) {
      if (order.payment_status === 'paid') {
        const emailResult = await sendOrderEmails(order.id).catch(error => {
          console.error('Order confirmation email retry failed', error)
          return { customer: { sent: false }, admin: { sent: false }, error: String(error) }
        })
        return NextResponse.json({ status: 'paid', order_id: order.id, confirmation_email: emailResult.customer?.sent ? 'sent' : 'pending', admin_notification: emailResult.admin?.sent ? 'sent' : 'pending' })
      }

      const { error: updateError } = await supabase.from('orders').update({
        payment_provider: 'paystack',
        payment_status: 'paid',
        status: 'paid',
        paystack_payment_id: transaction.id == null ? null : String(transaction.id),
        paid_at: transaction.paid_at || new Date().toISOString(),
      }).eq('id', order.id).neq('payment_status', 'paid')

      if (updateError) {
        console.error('Could not mark verified Paystack order as paid', updateError)
        return NextResponse.json({ status: 'pending' }, { status: 500 })
      }
      const emailResult = await sendOrderEmails(order.id).catch(error => {
        console.error('Order confirmation email failed after verification', error)
        return { customer: { sent: false }, admin: { sent: false }, error: String(error) }
      })
      return NextResponse.json({ status: 'paid', order_id: order.id, confirmation_email: emailResult.customer?.sent ? 'sent' : 'pending', admin_notification: emailResult.admin?.sent ? 'sent' : 'pending' })
    }

    if (transaction.status === 'success') {
      console.error('Paystack verification mismatch', {
        orderId: order.id,
        referenceMatches,
        amountMatches,
        currencyMatches,
        metadataMatches,
      })
      return NextResponse.json({ status: 'verification_failed', order_id: order.id }, { status: 400 })
    }

    return NextResponse.json({ status: transaction.status || 'pending', order_id: order.id })
  } catch (error) {
    console.error('Paystack verification error', error)
    return NextResponse.json({ status: 'pending' }, { status: 500 })
  }
}
