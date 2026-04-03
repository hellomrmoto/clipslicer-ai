import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tokens } = await request.json()
  if (!tokens || tokens < 1) {
    return NextResponse.json({ error: 'Invalid token amount' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${tokens} FoodToken${tokens > 1 ? 's' : ''}`,
          description: '1 token = $1. Use to order food on FoodToken Marketplace.',
        },
        unit_amount: 100,  // $1.00 in cents
      },
      quantity: tokens,
    }],
    metadata: {
      user_id: user.id,
      tokens: String(tokens),
    },
    success_url: `${appUrl}/buyer/dashboard/wallet?purchase=success`,
    cancel_url: `${appUrl}/buyer/dashboard/wallet`,
  })

  return NextResponse.json({ checkoutUrl: session.url })
}
