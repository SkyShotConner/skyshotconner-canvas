import { createClient } from '@supabase/supabase-js'

type SendOptions = { force?: boolean }

type OrderItem = {
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  sku: string | null
  canvas_size: string | null
}

type OrderRecord = {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  created_at: string
  paid_at: string | null
  subtotal: number
  shipping: number
  total: number
  shipping_address: Record<string, unknown> | null
  order_items: OrderItem[]
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service configuration is missing')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function money(value: unknown) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function orderNumber(id: string) {
  return `SSC-${id.replaceAll('-', '').slice(0, 10).toUpperCase()}`
}

function itemSize(item: OrderItem) {
  if (item.canvas_size) return item.canvas_size
  const match = String(item.sku || '').match(/-(A[0-5])$/i)
  return match?.[1]?.toUpperCase() || ''
}

function addressLines(address: Record<string, unknown> | null) {
  if (!address) return []
  const unit = String(address.unit || '').trim()
  const street = String(address.address || '').trim()
  const city = String(address.city || '').trim()
  const province = String(address.province || '').trim()
  const postal = String(address.postal_code || address.postal || '').trim()
  const country = String(address.country || 'South Africa').trim()
  return [
    [unit, street].filter(Boolean).join(', '),
    [city, province, postal].filter(Boolean).join(', '),
    country,
  ].filter(Boolean)
}

function buildHtml(order: OrderRecord) {
  const number = orderNumber(order.id)
  const firstName = String(order.customer_name || '').trim().split(/\s+/)[0] || 'there'
  const lines = addressLines(order.shipping_address)
  const items = order.order_items || []

  const itemRows = items.map(item => {
    const size = itemSize(item)
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #e7e5df;">
          <div style="font-weight:600;color:#161614;">${escapeHtml(item.product_name)}</div>
          <div style="margin-top:4px;font-size:13px;color:#73716b;">${size ? `Canvas size: ${escapeHtml(size)} · ` : ''}Qty: ${item.quantity}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #e7e5df;text-align:right;color:#161614;white-space:nowrap;">${money(item.line_total)}</td>
      </tr>`
  }).join('')

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f2f0eb;color:#161614;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:680px;margin:0 auto;padding:36px 18px;">
      <div style="background:#0a0a09;color:#fff;padding:28px 30px;">
        <div style="font-size:18px;letter-spacing:.14em;text-transform:uppercase;">SkyShotConner</div>
        <div style="margin-top:8px;font-size:12px;color:#b8b6af;letter-spacing:.08em;text-transform:uppercase;">Order confirmation</div>
      </div>
      <div style="background:#fff;padding:34px 30px;">
        <h1 style="margin:0;font-size:32px;line-height:1.1;font-weight:500;">Thanks for your order, ${escapeHtml(firstName)}.</h1>
        <p style="margin:18px 0 0;color:#5e5c57;line-height:1.7;">Your payment has been received and your SkyShotConner order is confirmed. We’ll prepare your artwork and keep you updated as the order progresses.</p>

        <div style="margin:28px 0;padding:18px;background:#f7f6f2;border:1px solid #e6e3dc;">
          <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#77746d;">Order number</div>
          <div style="margin-top:6px;font-size:19px;font-weight:600;">${number}</div>
        </div>

        <h2 style="font-size:18px;margin:30px 0 8px;">Order details</h2>
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
          ${itemRows}
          <tr><td style="padding:15px 0 5px;color:#706e68;">Subtotal</td><td style="padding:15px 0 5px;text-align:right;">${money(order.subtotal)}</td></tr>
          <tr><td style="padding:5px 0;color:#706e68;">Shipping</td><td style="padding:5px 0;text-align:right;">${money(order.shipping)}</td></tr>
          <tr><td style="padding:12px 0 0;font-weight:700;font-size:16px;">Total paid</td><td style="padding:12px 0 0;text-align:right;font-weight:700;font-size:16px;">${money(order.total)}</td></tr>
        </table>

        ${lines.length ? `
        <h2 style="font-size:18px;margin:34px 0 8px;">Delivery address</h2>
        <p style="margin:0;color:#5e5c57;line-height:1.7;">${lines.map(line => escapeHtml(line)).join('<br/>')}</p>` : ''}

        <p style="margin:34px 0 0;padding-top:24px;border-top:1px solid #e7e5df;color:#77746d;font-size:13px;line-height:1.6;">If you have a question about this order, reply to this email and include your order number <strong>${number}</strong>.</p>
      </div>
      <div style="padding:20px 30px;color:#77746d;font-size:11px;line-height:1.6;text-align:center;">© ${new Date().getFullYear()} SkyShotConner · Photography made tangible.</div>
    </div>
  </body>
</html>`
}

function buildText(order: OrderRecord) {
  const number = orderNumber(order.id)
  const firstName = String(order.customer_name || '').trim().split(/\s+/)[0] || 'there'
  const items = (order.order_items || []).map(item => {
    const size = itemSize(item)
    return `- ${item.product_name}${size ? ` (${size})` : ''} x${item.quantity}: ${money(item.line_total)}`
  }).join('\n')
  const address = addressLines(order.shipping_address).join('\n')

  return `SkyShotConner — Order confirmation

Thanks for your order, ${firstName}.

Your payment has been received and your order is confirmed.

Order number: ${number}

Order details:
${items}

Subtotal: ${money(order.subtotal)}
Shipping: ${money(order.shipping)}
Total paid: ${money(order.total)}
${address ? `\nDelivery address:\n${address}\n` : ''}
If you have a question about this order, reply to this email and include ${number}.
`
}

async function markFailed(supabase: ReturnType<typeof serviceClient>, orderId: string, error: string) {
  await supabase.from('orders').update({
    order_confirmation_status: 'failed',
    order_confirmation_error: error.slice(0, 1000),
    order_confirmation_updated_at: new Date().toISOString(),
  }).eq('id', orderId)
}

export async function sendOrderConfirmation(orderId: string, options: SendOptions = {}) {
  const supabase = serviceClient()

  if (options.force) {
    await supabase.from('orders').update({
      order_confirmation_status: 'pending',
      order_confirmation_error: null,
      order_confirmation_updated_at: new Date().toISOString(),
    }).eq('id', orderId).eq('payment_status', 'paid')
  }

  const { data: claimed, error: claimError } = await supabase
    .from('orders')
    .update({
      order_confirmation_status: 'sending',
      order_confirmation_error: null,
      order_confirmation_updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('payment_status', 'paid')
    .in('order_confirmation_status', ['pending', 'failed'])
    .select('id')
    .maybeSingle()

  if (claimError) throw claimError
  if (!claimed) {
    const { data: existing } = await supabase.from('orders').select('order_confirmation_status').eq('id', orderId).maybeSingle()
    return { sent: existing?.order_confirmation_status === 'sent', skipped: true }
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.ORDER_EMAIL_FROM?.trim() || 'SkyShotConner <orders@skyshotconner.co.za>'
  if (!apiKey) {
    const error = 'RESEND_API_KEY is not configured'
    await markFailed(supabase, orderId, error)
    return { sent: false, error }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,customer_name,customer_email,customer_phone,created_at,paid_at,subtotal,shipping,total,shipping_address,order_items(product_name,quantity,unit_price,line_total,sku,canvas_size)')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    const error = orderError?.message || 'Order not found'
    await markFailed(supabase, orderId, error)
    return { sent: false, error }
  }

  const record = order as unknown as OrderRecord
  const payload: Record<string, unknown> = {
    from,
    to: [record.customer_email],
    subject: `Order confirmed — ${orderNumber(record.id)}`,
    html: buildHtml(record),
    text: buildText(record),
  }
  const replyTo = process.env.ORDER_EMAIL_REPLY_TO?.trim()
  if (replyTo) payload.reply_to = replyTo

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const result = await response.json().catch(() => ({}))

    if (!response.ok || !result?.id) {
      const error = String(result?.message || result?.error || `Email provider returned HTTP ${response.status}`)
      await markFailed(supabase, orderId, error)
      return { sent: false, error }
    }

    await supabase.from('orders').update({
      order_confirmation_status: 'sent',
      order_confirmation_sent_at: new Date().toISOString(),
      order_confirmation_provider_id: String(result.id),
      order_confirmation_error: null,
      order_confirmation_updated_at: new Date().toISOString(),
    }).eq('id', orderId)

    return { sent: true, id: String(result.id) }
  } catch (error: any) {
    const message = String(error?.message || 'Could not send order confirmation')
    await markFailed(supabase, orderId, message)
    return { sent: false, error: message }
  }
}
