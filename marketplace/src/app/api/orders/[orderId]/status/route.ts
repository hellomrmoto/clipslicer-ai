import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: [],  // only via verify endpoint
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await request.json()
  const service = serviceClient()

  const { data: order } = await service.from('orders').select('*').eq('id', orderId).single()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Only vendor can update status
  if (order.vendor_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allowed = VALID_TRANSITIONS[order.status] ?? []
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: `Cannot transition from ${order.status} to ${status}` }, { status: 400 })
  }

  const updates: Record<string, string> = { status }
  if (status === 'accepted') updates.accepted_at = new Date().toISOString()
  if (status === 'ready') updates.ready_at = new Date().toISOString()

  // If cancelling a token order, refund escrow to buyer
  if (status === 'cancelled' && order.payment_method === 'tokens') {
    const { data: escrow } = await service.from('escrow').select('*').eq('order_id', orderId).single()
    if (escrow && escrow.status === 'held') {
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
          note: 'Order cancelled — tokens refunded from escrow',
        })
      }
    }
  }

  await service.from('orders').update(updates).eq('id', orderId)

  return NextResponse.json({ success: true })
}
