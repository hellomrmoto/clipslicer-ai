import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const tokens = parseInt(session.metadata?.tokens ?? '0')

    if (!userId || !tokens) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = serviceClient()

    // Credit buyer's wallet
    const { data: wallet } = await supabase
      .from('wallets').select('id, balance').eq('user_id', userId).single()

    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 400 })

    await supabase.from('wallets')
      .update({ balance: wallet.balance + tokens })
      .eq('user_id', userId)

    await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      user_id: userId,
      type: 'token_purchase',
      amount_tokens: tokens,
      stripe_payment_intent_id: session.payment_intent as string,
      note: `Purchased ${tokens} tokens via Stripe`,
    })
  }

  return NextResponse.json({ received: true })
}
