import { createClient } from '@/lib/supabase/server'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [
    { count: totalOrders },
    { count: disputedOrders },
    { count: totalVendors },
    { count: totalBuyers },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'disputed'),
    supabase.from('vendor_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'buyer'),
  ])

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={String(totalOrders ?? 0)} />
        <StatCard label="Open Disputes" value={String(disputedOrders ?? 0)} highlight={!!disputedOrders && disputedOrders > 0} />
        <StatCard label="Vendors" value={String(totalVendors ?? 0)} />
        <StatCard label="Buyers" value={String(totalBuyers ?? 0)} />
      </div>

      {disputedOrders && disputedOrders > 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-red-700">{disputedOrders} open dispute{disputedOrders > 1 ? 's' : ''} need attention</p>
            <p className="text-sm text-red-600">Tokens are held in escrow until resolved</p>
          </div>
          <Link href="/admin/disputes"
            className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700">
            Review Disputes
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
    </Card>
  )
}
