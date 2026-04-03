import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { resolution, notes } = await request.json()
  if (!['refund_buyer', 'release_vendor'].includes(resolution)) {
    return NextResponse.json({ error: 'Invalid resolution' }, { status: 400 })
  }

  const service = serviceClient()

  const { data: order } = await service.from('orders').select('*').eq('id', orderId).single()
  if (!order || order.status !== 'disputed') {
    return NextResponse.json({ error: 'Order not found or not disputed' }, { status: 404 })
  }

  const { data: escrow } = await service.from('escrow').select('*').eq('order_id', orderId).single()

  if (resolution === 'refund_buyer' && order.payment_method === 'tokens' && escrow?.status === 'held') {
    // Refund to buyer
    const { data: buyerWallet } = await service.from('wallets').select('id, balance').eq('user_id', order.buyer_id).single()
    if (buyerWallet) {
      await service.from('wallets').update({ balance: buyerWallet.balance + escrow.amount_tokens }).eq('user_id', order.buyer_id)
      await service.from('escrow').update({ status: 'refunded', released_at: new Date().toISOString() }).eq('order_id', orderId)
      await service.from('wallet_transactions').insert({
        wallet_id: buyerWallet.id,
        user_id: order.buyer_id,
        type: 'escrow_refund',
        amount_tokens: escrow.amount_tokens,
        order_id: orderId,
        note: `Admin dispute resolved in buyer's favor`,
      })
    }
    await service.from('orders').update({
      status: 'refunded',
      dispute_resolved_at: new Date().toISOString(),
      dispute_resolution: `Refunded to buyer. ${notes ?? ''}`.trim(),
      verification_method: 'admin',
    }).eq('id', orderId)
  }

  if (resolution === 'release_vendor' && order.payment_method === 'tokens' && escrow?.status === 'held') {
    // Release to vendor
    const { data: vendorWallet } = await service.from('wallets').select('id, balance').eq('user_id', order.vendor_id).single()
    if (vendorWallet) {
      await service.from('wallets').update({ balance: vendorWallet.balance + order.vendor_payout_tokens }).eq('user_id', order.vendor_id)
      await service.from('escrow').update({ status: 'released', released_at: new Date().toISOString() }).eq('order_id', orderId)
      await service.from('wallet_transactions').insert({
        wallet_id: vendorWallet.id,
        user_id: order.vendor_id,
        type: 'escrow_release',
        amount_tokens: order.vendor_payout_tokens,
        order_id: orderId,
        note: `Admin dispute resolved in vendor's favor`,
      })
    }
    await service.from('orders').update({
      status: 'delivered',
      dispute_resolved_at: new Date().toISOString(),
      dispute_resolution: `Released to vendor. ${notes ?? ''}`.trim(),
      verification_method: 'admin',
    }).eq('id', orderId)
  }

  return NextResponse.json({ success: true })
}
