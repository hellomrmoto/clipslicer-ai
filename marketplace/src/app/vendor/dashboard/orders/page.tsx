import { createClient } from '@/lib/supabase/server'
import Card from '@/components/ui/Card'
import VendorOrderActions from './VendorOrderActions'

export default async function VendorOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, food_listings(title, price_tokens), profiles(full_name, phone)')
    .eq('vendor_id', user!.id)
    .order('created_at', { ascending: false })

  const pending = orders?.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)) ?? []
  const completed = orders?.filter(o => ['delivered', 'cancelled', 'refunded', 'disputed'].includes(o.status)) ?? []

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      <section>
        <h2 className="font-semibold text-gray-700 mb-3">Active ({pending.length})</h2>
        {pending.length > 0 ? (
          <div className="flex flex-col gap-4">
            {pending.map(order => <OrderCard key={order.id} order={order} active />)}
          </div>
        ) : (
          <Card className="p-8 text-center text-gray-400 text-sm">No active orders</Card>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-gray-700 mb-3">History</h2>
        {completed.length > 0 ? (
          <div className="flex flex-col gap-3">
            {completed.map(order => <OrderCard key={order.id} order={order} active={false} />)}
          </div>
        ) : (
          <Card className="p-8 text-center text-gray-400 text-sm">No completed orders yet</Card>
        )}
      </section>
    </div>
  )
}

function OrderCard({ order, active }: { order: any; active: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900">{order.food_listings?.title}</p>
          <p className="text-sm text-gray-500">
            Buyer: {order.profiles?.full_name}
            {order.profiles?.phone && ` · ${order.profiles.phone}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(order.created_at).toLocaleString()} · {order.fulfillment_type} · {order.payment_method}
          </p>
          {order.delivery_address && (
            <p className="text-xs text-gray-500 mt-1">📍 {order.delivery_address}</p>
          )}
          {order.special_instructions && (
            <p className="text-xs text-gray-600 mt-1 italic">"{order.special_instructions}"</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">{order.vendor_payout_tokens} tokens</p>
          <p className="text-xs text-gray-400">after platform fee</p>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {active && <VendorOrderActions order={order} />}
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
    <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full font-medium capitalize ${colors[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}
