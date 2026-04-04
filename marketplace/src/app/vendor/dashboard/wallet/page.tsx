import { createClient } from '@/lib/supabase/server'
import Card from '@/components/ui/Card'
import VendorCashoutForm from './VendorCashoutForm'

export default async function VendorWalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: wallet }, { data: transactions }] = await Promise.all([
    supabase.from('wallets').select('balance').eq('user_id', user!.id).single(),
    supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const balance = wallet?.balance ?? 0

  const totalEarned = (transactions ?? [])
    .filter(t => t.type === 'escrow_release')
    .reduce((sum, t) => sum + t.amount_tokens, 0)

  const totalCashedOut = Math.abs(
    (transactions ?? [])
      .filter(t => t.type === 'cashout')
      .reduce((sum, t) => sum + t.amount_tokens, 0)
  )

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>

      {/* Balance card */}
      <Card className="p-8 text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <p className="text-sm text-orange-600 font-medium uppercase tracking-wide">Available Balance</p>
        <p className="text-5xl font-bold text-orange-700 mt-2">{balance}</p>
        <p className="text-orange-500 mt-1">tokens ≈ ${balance}</p>
      </Card>

      {/* Earnings summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Earned</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totalEarned}</p>
          <p className="text-xs text-gray-400">tokens</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Cashed Out</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">{totalCashedOut}</p>
          <p className="text-xs text-gray-400">tokens</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Available</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{balance}</p>
          <p className="text-xs text-gray-400">tokens</p>
        </Card>
      </div>

      {/* Cashout form */}
      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Request Payout</h2>
        <VendorCashoutForm balance={balance} />
      </Card>

      {/* Transaction history */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Transaction History</h2>
        </div>
        {transactions && transactions.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {transactions.map(tx => (
              <li key={tx.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {tx.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</p>
                  {tx.note && <p className="text-xs text-gray-500 mt-0.5">{tx.note}</p>}
                </div>
                <span className={`text-sm font-bold ${tx.amount_tokens > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount_tokens > 0 ? '+' : ''}{tx.amount_tokens} tokens
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">
            No transactions yet. Complete orders to earn tokens.
          </p>
        )}
      </Card>
    </div>
  )
}
