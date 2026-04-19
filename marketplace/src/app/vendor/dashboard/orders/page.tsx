import { createClient } from '@/lib/supabase/server'
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
    <div className="max-w-3xl space-y-8">
      <h1 className="text-3xl font-black text-white uppercase tracking-tight">Orders</h1>

      <section>
        <p className="text-xs font-black text-gray-600 uppercase tracking-widest mb-4">Active ({pending.length})</p>
        {pending.length > 0 ? (
          <div className="flex flex-col gap-4">
            {pending.map(order => <OrderCard key={order.id} order={order} active />)}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center text-gray-600 text-sm">
            No active orders
          </div>
        )}
      </section>

      <section>
        <p className="text-xs font-black text-gray-600 uppercase tracking-widest mb-4">History</p>
        {completed.length > 0 ? (
          <div className="flex flex-col gap-3">
            {completed.map(order => <OrderCard key={order.id} order={order} active={false} />)}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-600 text-sm">
            No completed orders yet
          </div>
        )}
      </section>
    </div>
  )
}

function OrderCard({ order, active }: { order: any; active: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-black text-white uppercase tracking-tight">{order.food_listings?.title}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {order.profiles?.full_name}
            {order.profiles?.phone && ` · ${order.profiles.phone}`}
          </p>
          <p className="text-xs text-gray-700 mt-1">
            {new Date(order.created_at).toLocaleString()} · {order.fulfillment_type} · {order.payment_method}
          </p>
          {order.delivery_address && (
            <p className="text-xs text-gray-600 mt-1">📍 {order.delivery_address}</p>
          )}
          {order.special_instructions && (
            <p className="text-xs text-gray-600 mt-1 italic">"{order.special_instructions}"</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-black text-yellow-400 text-lg">{order.vendor_payout_tokens}</p>
          <p className="text-xs text-gray-600">tokens after fee</p>
          <StatusBadge status={order.status} />
        </div>
      </div>
      {active && <VendorOrderActions order={order} />}
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
    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-black capitalize uppercase tracking-wide ${colors[status] ?? 'bg-gray-800 text-gray-500'}`}>
      {status}
    </span>
  )
}
