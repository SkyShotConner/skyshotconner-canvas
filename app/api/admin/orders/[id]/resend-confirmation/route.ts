import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendOrderConfirmation } from '@/lib/orders/order-confirmation-email'

export const runtime = 'nodejs'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
    if (adminError || !isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })

    const result = await sendOrderConfirmation(id, { force: true })
    if (!result.sent) {
      return NextResponse.json({ error: result.error || 'Confirmation email could not be sent' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Admin resend order confirmation failed', error)
    return NextResponse.json({ error: error?.message || 'Could not resend confirmation' }, { status: 500 })
  }
}
