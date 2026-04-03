import { createClient } from '@/lib/supabase/server'
import Card from '@/components/ui/Card'
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
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>

      <section>
        <h2 className="font-semibold text-gray-700 mb-3">Active Orders ({active.length})</h2>
        {active.length > 0 ? (
          <div className="flex flex-col gap-4">
            {active.map(order => (
              <Link key={order.id} href={`/order/${order.id}`}>
                <Card className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{order.food_listings?.title}</p>
                      <p className="text-sm text-gray-500">from {order.vendor_profiles?.business_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleString()} · {order.fulfillment_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{order.price_tokens} tokens</p>
                      <StatusBadge status={order.status} />
                      {order.status === 'ready' && (
                        <p className="text-xs text-orange-600 font-medium mt-1">Tap for your code →</p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-400 mb-3">No active orders</p>
            <Link href="/marketplace" className="text-orange-600 text-sm font-medium hover:underline">Browse food →</Link>
          </Card>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-gray-700 mb-3">Order History</h2>
        {history.length > 0 ? (
          <div className="flex flex-col gap-3">
            {history.map(order => (
              <Link key={order.id} href={`/order/${order.id}`}>
                <Card className="p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.food_listings?.title}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{order.price_tokens} tokens</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center text-gray-400 text-sm">No order history yet</Card>
        )}
      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    disputed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
    refunded: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full font-medium capitalize ${colors[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}
