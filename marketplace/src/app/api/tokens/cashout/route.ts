import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tokens } = await request.json()
  if (!tokens || tokens < 10) {
    return NextResponse.json({ error: 'Minimum cashout is 10 tokens ($10)' }, { status: 400 })
  }

  const service = serviceClient()

  // Check vendor wallet balance
  const { data: wallet } = await service.from('wallets').select('balance').eq('user_id', user.id).single()
  if (!wallet || wallet.balance < tokens) {
    return NextResponse.json({ error: 'Insufficient token balance' }, { status: 400 })
  }

  // Deduct tokens
  const { error: walletError } = await service
    .from('wallets')
    .update({ balance: wallet.balance - tokens })
    .eq('user_id', user.id)

  if (walletError) return NextResponse.json({ error: walletError.message }, { status: 500 })

  // Record transaction
  const { data: walletRow } = await service.from('wallets').select('id').eq('user_id', user.id).single()
  await service.from('wallet_transactions').insert({
    wallet_id: walletRow?.id,
    user_id: user.id,
    type: 'cashout',
    amount_tokens: -tokens,
    note: `Cashout request: ${tokens} tokens ($${tokens})`,
  })

  // TODO: trigger Stripe payout to vendor's connected account
  // For now, return success and flag for manual payout processing
  return NextResponse.json({
    success: true,
    message: `Cashout of ${tokens} tokens ($${tokens}) requested. Payout will be processed within 1-2 business days.`,
  })
}
