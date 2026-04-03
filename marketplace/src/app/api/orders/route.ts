import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const PLATFORM_FEE_PERCENT = parseInt(process.env.PLATFORM_FEE_PERCENT ?? '10')

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateQrToken(orderId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return crypto.createHmac('sha256', secret).update(orderId).digest('hex').slice(0, 32)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listing_id, quantity, fulfillment_type, delivery_address, special_instructions, payment_method } = await request.json()

  if (!listing_id || !quantity || !fulfillment_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const service = serviceClient()

  // Fetch listing
  const { data: listing } = await service.from('food_listings').select('*').eq('id', listing_id).single()
  if (!listing || !listing.is_available) {
    return NextResponse.json({ error: 'Listing not available' }, { status: 400 })
  }

  const priceTokens = listing.price_tokens * quantity
  const platformFeeTokens = Math.ceil(priceTokens * PLATFORM_FEE_PERCENT / 100)
  const vendorPayoutTokens = priceTokens - platformFeeTokens
  const totalTokens = priceTokens  // buyer pays just the listing price; fee comes from that

  // For token payments: check and deduct buyer balance
  if (payment_method === 'tokens') {
    const { data: wallet } = await service.from('wallets').select('id, balance').eq('user_id', user.id).single()
    if (!wallet || wallet.balance < totalTokens) {
      return NextResponse.json({ error: 'Insufficient token balance' }, { status: 400 })
    }

    // Deduct from buyer wallet
    const { error: deductError } = await service.from('wallets')
      .update({ balance: wallet.balance - totalTokens })
      .eq('user_id', user.id)

    if (deductError) return NextResponse.json({ error: deductError.message }, { status: 500 })

    // Record debit transaction
    await service.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      user_id: user.id,
      type: 'escrow_hold',
      amount_tokens: -totalTokens,
      note: `Order payment held in escrow for: ${listing.title}`,
    })
  }

  // Generate OTP (6 digits) + QR token
  const otpCode = generateOtp()
  const otpExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()  // 2 hours

  // Create order
  const { data: order, error: orderError } = await service.from('orders').insert({
    buyer_id: user.id,
    vendor_id: listing.vendor_id,
    listing_id,
    quantity,
    price_tokens: priceTokens,
    platform_fee_tokens: platformFeeTokens,
    vendor_payout_tokens: vendorPayoutTokens,
    fulfillment_type,
    delivery_address: delivery_address ?? null,
    special_instructions: special_instructions ?? null,
    payment_method: payment_method ?? 'tokens',
    otp_code: otpCode,
    otp_expires_at: otpExpiresAt,
    status: 'pending',
  }).select('id').single()

  if (orderError || !order) {
    // Refund if token payment was deducted
    if (payment_method === 'tokens') {
      const { data: wallet } = await service.from('wallets').select('id, balance').eq('user_id', user.id).single()
      if (wallet) {
        await service.from('wallets').update({ balance: wallet.balance + totalTokens }).eq('user_id', user.id)
      }
    }
    return NextResponse.json({ error: orderError?.message ?? 'Failed to create order' }, { status: 500 })
  }

  // Set QR token (signed with order ID)
  const qrToken = generateQrToken(order.id)
  await service.from('orders').update({ qr_code_token: qrToken }).eq('id', order.id)

  // Create escrow record for token payments
  if (payment_method === 'tokens') {
    await service.from('escrow').insert({
      order_id: order.id,
      buyer_id: user.id,
      vendor_id: listing.vendor_id,
      amount_tokens: totalTokens,
      status: 'held',
    })
  }

  return NextResponse.json({ orderId: order.id })
}
