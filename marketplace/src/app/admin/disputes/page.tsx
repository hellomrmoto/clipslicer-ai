import { createClient } from '@/lib/supabase/server'
import Card from '@/components/ui/Card'
import DisputeResolveForm from './DisputeResolveForm'

export default async function AdminDisputesPage() {
  const supabase = await createClient()

  const { data: disputes } = await supabase
    .from('orders')
    .select('*, food_listings(title), vendor_profiles(business_name), profiles(full_name, email), escrow(amount_tokens, status)')
    .eq('status', 'disputed')
    .order('dispute_opened_at', { ascending: true })

  const { data: resolved } = await supabase
    .from('orders')
    .select('*, food_listings(title)')
    .not('dispute_resolved_at', 'is', null)
    .order('dispute_resolved_at', { ascending: false })
    .limit(10)

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>

      <section>
        <h2 className="font-semibold text-gray-700 mb-3">Open Disputes ({disputes?.length ?? 0})</h2>
        {disputes && disputes.length > 0 ? (
          <div className="flex flex-col gap-5">
            {disputes.map(order => (
              <Card key={order.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{order.food_listings?.title}</p>
                    <p className="text-sm text-gray-500">
                      Buyer: {order.profiles?.full_name} ({order.profiles?.email})
                    </p>
                    <p className="text-sm text-gray-500">
                      Vendor: {order.vendor_profiles?.business_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Opened: {new Date(order.dispute_opened_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{order.escrow?.amount_tokens ?? order.price_tokens} tokens</p>
                    <p className="text-xs text-orange-600">in escrow</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-sm font-medium text-yellow-800">Dispute reason:</p>
                  <p className="text-sm text-yellow-700 mt-1">{order.dispute_reason}</p>
                </div>

                <DisputeResolveForm
                  orderId={order.id}
                  buyerId={order.buyer_id}
                  vendorId={order.vendor_id}
                  escrowAmount={order.escrow?.amount_tokens ?? order.price_tokens}
                  vendorPayout={order.vendor_payout_tokens}
                />
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-gray-400 text-sm">No open disputes</Card>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-gray-700 mb-3">Recently Resolved</h2>
        {resolved && resolved.length > 0 ? (
          <div className="flex flex-col gap-3">
            {resolved.map(order => (
              <Card key={order.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.food_listings?.title}</p>
                    <p className="text-xs text-gray-400">{new Date(order.dispute_resolved_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{order.dispute_resolution}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'refunded' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center text-gray-400 text-sm">No resolved disputes</Card>
        )}
      </section>
    </div>
  )
}
