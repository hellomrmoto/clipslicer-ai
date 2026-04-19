import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BuyerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, food_listings(title, price_tokens), vendor_profiles(business_name)')
    .eq('buyer_id', user!.id)
    .order('created_at', { ascending: false })

  const active = orders?.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)) ?? []
  const history = orders?.filter(o => ['delivered', 'cancelled', 'refunded', 'disputed'].includes(o.status)) ?? []

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-3xl font-black text-white uppercase tracking-tight">My Orders</h1>

      <section>
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">
          Active ({active.length})
        </p>
        {active.length > 0 ? (
          <div className="flex flex-col gap-3">
            {active.map(order => (
              <Link key={order.id} href={`/order/${order.id}`}>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-white uppercase tracking-tight">{order.food_listings?.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">from {order.vendor_profiles?.business_name}</p>
                      <p className="text-xs text-gray-700 mt-1">
                        {new Date(order.created_at).toLocaleString()} · {order.fulfillment_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-yellow-400 text-lg">{order.price_tokens}</p>
                      <p className="text-xs text-gray-600 mb-1">tokens</p>
                      <StatusBadge status={order.status} />
                      {order.status === 'ready' && (
                        <p className="text-xs text-red-400 font-bold mt-1">Show your code →</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <p className="text-gray-600 mb-4 text-sm">No active orders</p>
            <Link href="/marketplace"
              className="text-xs bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 font-black uppercase tracking-widest transition-colors">
              Browse food
            </Link>
          </div>
        )}
      </section>

      <section>
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">Order History</p>
        {history.length > 0 ? (
          <div className="flex flex-col gap-2">
            {history.map(order => (
              <Link key={order.id} href={`/order/${order.id}`}>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{order.food_listings?.title}</p>
                    <p className="text-xs text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-gray-400">{order.price_tokens} tokens</span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-600 text-sm">
            No order history yet
          </div>
        )}
      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-900 text-yellow-400',
    accepted: 'bg-blue-900 text-blue-400',
    preparing: 'bg-blue-900 text-blue-400',
    ready: 'bg-purple-900 text-purple-400',
    delivered: 'bg-green-900 text-green-400',
    disputed: 'bg-red-900 text-red-400',
    cancelled: 'bg-gray-800 text-gray-500',
    refunded: 'bg-gray-800 text-gray-500',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-black capitalize uppercase tracking-wide ${colors[status] ?? 'bg-gray-800 text-gray-500'}`}>
      {status}
    </span>
  )
}
