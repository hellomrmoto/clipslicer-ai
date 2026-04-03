import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import OrderVerificationPanel from './OrderVerificationPanel'
import DisputeButton from './DisputeButton'

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/buyer/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*, food_listings(title, description, price_tokens), vendor_profiles(business_name, location_zone), profiles(full_name)')
    .eq('id', orderId)
    .single()

  if (!order) notFound()

  // Only buyer or vendor can view this order
  if (order.buyer_id !== user.id && order.vendor_id !== user.id) notFound()

  const isVendor = order.vendor_id === user.id
  const isBuyer = order.buyer_id === user.id

  const statusSteps = ['pending', 'accepted', 'preparing', 'ready', 'delivered']
  const currentStep = statusSteps.indexOf(order.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href={isVendor ? '/vendor/dashboard/orders' : '/buyer/dashboard'}
          className="text-sm text-gray-500 hover:text-orange-600">
          ← Back to orders
        </Link>
        <span className="text-sm font-medium text-gray-500">Order #{orderId.slice(0, 8).toUpperCase()}</span>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Order status progress */}
        {!['cancelled', 'refunded', 'disputed'].includes(order.status) && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < currentStep ? 'bg-green-500 text-white' :
                    i === currentStep ? 'bg-orange-600 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs capitalize ${i === currentStep ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                    {step}
                  </span>
                  {i < statusSteps.length - 1 && (
                    <div className={`absolute h-0.5 w-full ${i < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Disputed/Cancelled banner */}
        {order.status === 'disputed' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 font-medium">Dispute Open</p>
            <p className="text-sm text-red-600 mt-1">{order.dispute_reason}</p>
            <p className="text-xs text-red-500 mt-1">Admin will review within 24 hours. Tokens are held safely.</p>
          </div>
        )}
        {order.status === 'delivered' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 font-medium">✓ Order Delivered</p>
            <p className="text-sm text-green-600 mt-1">Verified via {order.verification_method?.toUpperCase()}</p>
          </div>
        )}

        {/* Order details */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Order Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Item</p><p className="font-medium">{order.food_listings?.title}</p></div>
            <div><p className="text-gray-500">Quantity</p><p className="font-medium">{order.quantity}</p></div>
            <div><p className="text-gray-500">Fulfillment</p><p className="font-medium capitalize">{order.fulfillment_type}</p></div>
            <div><p className="text-gray-500">Payment</p><p className="font-medium capitalize">{order.payment_method}</p></div>
            {isBuyer && <div><p className="text-gray-500">Vendor</p><p className="font-medium">{order.vendor_profiles?.business_name}</p></div>}
            {isVendor && <div><p className="text-gray-500">Buyer</p><p className="font-medium">{order.profiles?.full_name}</p></div>}
            <div><p className="text-gray-500">Total</p><p className="font-bold text-orange-600">{order.price_tokens} tokens</p></div>
          </div>
          {order.delivery_address && (
            <div><p className="text-gray-500 text-sm">Delivery Address</p><p className="font-medium text-sm">{order.delivery_address}</p></div>
          )}
          {order.special_instructions && (
            <div><p className="text-gray-500 text-sm">Instructions</p><p className="text-sm italic">"{order.special_instructions}"</p></div>
          )}
        </Card>

        {/* Verification panel — shown when order is ready */}
        {order.status === 'ready' && (
          <OrderVerificationPanel
            orderId={orderId}
            otpCode={isBuyer ? order.otp_code : null}
            qrToken={isBuyer ? order.qr_code_token : null}
            isVendor={isVendor}
          />
        )}

        {/* Dispute button */}
        {isBuyer && ['accepted', 'preparing', 'ready', 'delivered'].includes(order.status) && (
          <DisputeButton orderId={orderId} />
        )}
      </div>
    </div>
  )
}
