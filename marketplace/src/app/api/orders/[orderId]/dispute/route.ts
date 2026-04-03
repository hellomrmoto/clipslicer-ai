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

  const { reason } = await request.json()
  if (!reason) return NextResponse.json({ error: 'Dispute reason is required' }, { status: 400 })

  const service = serviceClient()

  const { data: order } = await service.from('orders').select('*').eq('id', orderId).single()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Only buyer or vendor can dispute
  if (order.buyer_id !== user.id && order.vendor_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (order.status === 'disputed') {
    return NextResponse.json({ error: 'Dispute already open' }, { status: 400 })
  }

  const allowedStatuses = ['accepted', 'preparing', 'ready', 'delivered']
  if (!allowedStatuses.includes(order.status)) {
    return NextResponse.json({ error: `Cannot dispute an order with status: ${order.status}` }, { status: 400 })
  }

  await service.from('orders').update({
    status: 'disputed',
    dispute_opened_at: new Date().toISOString(),
    dispute_reason: reason,
  }).eq('id', orderId)

  return NextResponse.json({ success: true, message: 'Dispute opened. Admin will review within 24 hours.' })
}
