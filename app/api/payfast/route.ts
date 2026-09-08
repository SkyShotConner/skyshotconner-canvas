import { NextResponse } from 'next/server'

/** PayFast integration boundary. Never accept payment success from the browser.
 * Configure PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY and PAYFAST_PASSPHRASE on the server,
 * then generate the signed PayFast request here and verify ITN callbacks server-side.
 */
export async function POST(req: Request) {
  const configured = Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY)
  if (!configured) return NextResponse.json({ enabled:false, message:'PayFast is not configured yet.' }, { status: 503 })
  const body = await req.json().catch(()=>null)
  return NextResponse.json({ enabled:true, status:'ready', orderId:body?.orderId ?? null, message:'Payment adapter ready for signed PayFast request generation.' })
}
