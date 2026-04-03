import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function generateQrToken(orderId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return crypto.createHmac('sha256', secret).update(orderId).digest('hex').slice(0, 32)
}

async function releaseEscrow(orderId: string, service: ReturnType<typeof serviceClient>) {
  const { data: order } = await service.from('orders').select('*').eq('id', orderId).single()
  if (!order) return

  if (order.payment_method === 'tokens') {
    const { data: escrow } = await service.from('escrow').select('*').eq('order_id', orderId).single()
    if (!escrow || escrow.status !== 'held') return

    // Credit vendor wallet
    const { data: vendorWallet } = await service.from('wallets').select('id, balance').eq('user_id', order.vendor_id).single()
    if (vendorWallet) {
      await service.from('wallets')
        .update({ balance: vendorWallet.balance + order.vendor_payout_tokens })
        .eq('user_id', order.vendor_id)

      await service.from('wallet_transactions').insert([
        {
          wallet_id: vendorWallet.id,
          user_id: order.vendor_id,
          type: 'escrow_release',
          amount_tokens: order.vendor_payout_tokens,
          order_id: orderId,
          note: 'Delivery confirmed — tokens released from escrow',
        },
      ])
    }

    // Mark escrow released
    await service.from('escrow').update({
      status: 'released',
      released_at: new Date().toISOString(),
    }).eq('order_id', orderId)
  }

  // Mark order delivered
  await service.from('orders').update({
    status: 'delivered',
    delivered_at: new Date().toISOString(),
  }).eq('id', orderId)

  // Update vendor stats
  await service.from('vendor_profiles').update({
    total_orders: service.rpc('increment', { row_id: order.vendor_id, column_name: 'total_orders' }),
  }).eq('id', order.vendor_id)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { method, code } = await request.json()
  const service = serviceClient()

  const { data: order } = await service.from('orders').select('*').eq('id', orderId).single()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (order.status !== 'ready') {
    return NextResponse.json({ error: 'Order is not ready for verification' }, { status: 400 })
  }

  // Only vendor can verify delivery
  if (order.vendor_id !== user.id) {
    return NextResponse.json({ error: 'Only the vendor can verify delivery' }, { status: 403 })
  }

  if (method === 'otp') {
    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    if (order.otp_code !== code.trim()) {
      return NextResponse.json({ error: 'Invalid code. Ask the buyer for their 6-digit delivery code.' }, { status: 400 })
    }
    if (order.otp_expires_at && new Date(order.otp_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Code has expired. Buyer must request a new one.' }, { status: 400 })
    }
  } else if (method === 'qr') {
    const expectedToken = generateQrToken(orderId)
    if (code !== expectedToken) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 })
    }
  } else {
    return NextResponse.json({ error: 'Invalid verification method' }, { status: 400 })
  }

  // Mark verification method
  await service.from('orders').update({
    verification_method: method,
    verified_at: new Date().toISOString(),
  }).eq('id', orderId)

  // Release escrow and mark delivered
  await releaseEscrow(orderId, service)

  return NextResponse.json({ success: true, message: 'Delivery verified! Tokens released to vendor.' })
}
