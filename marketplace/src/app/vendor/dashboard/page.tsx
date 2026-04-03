import { createClient } from '@/lib/supabase/server'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export default async function VendorOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: vendor }, { data: wallet }, { data: recentOrders }] = await Promise.all([
    supabase.from('vendor_profiles').select('*, profiles(full_name)').eq('id', user!.id).single(),
    supabase.from('wallets').select('balance').eq('user_id', user!.id).single(),
    supabase.from('orders')
      .select('*, food_listings(title)')
      .eq('vendor_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const pendingCount = recentOrders?.filter(o => o.status === 'pending').length ?? 0
  const balance = wallet?.balance ?? 0

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {vendor?.profiles?.full_name ?? 'Vendor'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {vendor?.business_name} · {vendor?.location_zone ?? 'Location not set'}
          {vendor?.is_verified && (
            <span className="ml-2 text-green-600 text-xs font-medium">✓ Verified</span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Token Balance" value={`${balance} tokens`} sub={`≈ $${balance}`} />
        <StatCard label="Pending Orders" value={String(pendingCount)} sub="Need your attention" highlight={pendingCount > 0} />
        <StatCard label="Rating" value={vendor?.avg_rating ? `${vendor.avg_rating} / 5` : 'No ratings yet'} sub={`${vendor?.total_orders ?? 0} total orders`} />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/vendor/dashboard/listings/new"
          className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-700">
          + Add Food Item
        </Link>
        <Link href="/vendor/dashboard/orders"
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
          View Orders
        </Link>
        <Link href="/vendor/dashboard/profile"
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
          Edit Profile
        </Link>
      </div>

      {/* Recent orders */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
        </div>
        {recentOrders && recentOrders.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {recentOrders.map(order => (
              <li key={order.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.food_listings?.title}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()} · {order.fulfillment_type}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{order.price_tokens} tokens</span>
                  <StatusBadge status={order.status} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No orders yet. Add items to your menu to start receiving orders.</p>
        )}
      </Card>
    </div>
  )
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </Card>
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
    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${colors[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}
