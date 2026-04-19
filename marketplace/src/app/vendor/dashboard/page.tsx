import { createClient } from '@/lib/supabase/server'
import { getWeeklyEarnings, getWeeklyOrders } from '@/lib/analytics'
import { AreaChartWidget, BarChartWidget } from '@/components/ui/SimpleChart'
import Link from 'next/link'

export default async function VendorOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: vendor },
    { data: wallet },
    { data: recentOrders },
    weeklyEarnings,
    weeklyOrders,
  ] = await Promise.all([
    supabase.from('vendor_profiles').select('*, profiles(full_name)').eq('id', user!.id).single(),
    supabase.from('wallets').select('balance').eq('user_id', user!.id).single(),
    supabase.from('orders')
      .select('*, food_listings(title)')
      .eq('vendor_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
    getWeeklyEarnings(supabase, user!.id),
    getWeeklyOrders(supabase, user!.id),
  ])

  const pendingCount = recentOrders?.filter(o => o.status === 'pending').length ?? 0
  const balance = wallet?.balance ?? 0
  const totalEarned = weeklyEarnings.reduce((s, w) => s + w.tokens, 0)

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          {vendor?.business_name ?? 'Dashboard'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {vendor?.location_zone ?? 'Location not set'}
          {vendor?.is_verified && (
            <span className="ml-3 text-green-400 text-xs font-bold">✓ Verified</span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Token Balance" value={String(balance)} sub={`≈ $${balance}`} />
        <StatCard label="Pending Orders" value={String(pendingCount)} sub="Need attention" highlight={pendingCount > 0} />
        <StatCard label="Rating" value={vendor?.avg_rating ? `${vendor.avg_rating}` : '—'} sub={`${vendor?.total_orders ?? 0} total orders`} />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/vendor/dashboard/listings/new"
          className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors">
          + Add Item
        </Link>
        <Link href="/vendor/dashboard/orders"
          className="border border-gray-800 text-gray-400 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
          View Orders
        </Link>
        <Link href="/vendor/dashboard/profile"
          className="border border-gray-800 text-gray-400 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
          Edit Profile
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black text-white uppercase tracking-widest">Earnings</p>
            <span className="text-xs text-gray-600">{totalEarned} tokens / 8 wks</span>
          </div>
          <AreaChartWidget data={weeklyEarnings} xKey="week" valueKey="tokens" label="tokens" color="#dc2626" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black text-white uppercase tracking-widest">Orders</p>
            <span className="text-xs text-gray-600">last 8 weeks</span>
          </div>
          <BarChartWidget data={weeklyOrders} xKey="week" valueKey="count" label="orders" color="#ef4444" />
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <p className="text-xs font-black text-gray-600 uppercase tracking-widest">Recent Orders</p>
        </div>
        {recentOrders && recentOrders.length > 0 ? (
          <ul className="divide-y divide-gray-800">
            {recentOrders.map(order => (
              <li key={order.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{order.food_listings?.title}</p>
                  <p className="text-xs text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()} · {order.fulfillment_type}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-yellow-400">{order.price_tokens}</span>
                  <StatusBadge status={order.status} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-8 text-sm text-gray-600 text-center">No orders yet. Add items to your menu.</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <p className="text-xs font-black text-gray-600 uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-black mt-2 ${highlight ? 'text-red-500' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-1">{sub}</p>
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
    <span className={`text-xs px-2 py-0.5 rounded-full font-black capitalize uppercase tracking-wide ${colors[status] ?? 'bg-gray-800 text-gray-500'}`}>
      {status}
    </span>
  )
}
