import { createClient } from '@/lib/supabase/server'
import TokenPurchaseForm from './TokenPurchaseForm'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: wallet }, { data: transactions }] = await Promise.all([
    supabase.from('wallets').select('balance').eq('user_id', user!.id).single(),
    supabase.from('wallet_transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const balance = wallet?.balance ?? 0

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-black text-white uppercase tracking-tight">My Wallet</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-red-900 to-red-950 border border-red-800 rounded-2xl p-8 text-center">
        <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Token Balance</p>
        <p className="text-7xl font-black text-white mt-3">{balance}</p>
        <p className="text-red-400 mt-2 text-sm">tokens · ≈ ${balance}</p>
      </div>

      {/* Buy tokens */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-5">Buy Tokens</p>
        <TokenPurchaseForm />
      </div>

      {/* Transaction history */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Transaction History</p>
        </div>
        {transactions && transactions.length > 0 ? (
          <ul className="divide-y divide-gray-800">
            {transactions.map(tx => (
              <li key={tx.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white capitalize">{tx.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-600">{new Date(tx.created_at).toLocaleString()}</p>
                  {tx.note && <p className="text-xs text-gray-500 mt-0.5">{tx.note}</p>}
                </div>
                <span className={`text-sm font-black ${tx.amount_tokens > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.amount_tokens > 0 ? '+' : ''}{tx.amount_tokens} tokens
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-8 text-sm text-gray-600 text-center">No transactions yet</p>
        )}
      </div>
    </div>
  )
}
