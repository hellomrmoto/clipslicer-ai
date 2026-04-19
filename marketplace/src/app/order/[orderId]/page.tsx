import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import OrderVerificationPanel from './OrderVerificationPanel'
import DisputeButton from './DisputeButton'

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/buyer/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*, food_listings(title, description, price_tokens, image_url), vendor_profiles(business_name, location_zone), profiles(full_name)')
    .eq('id', orderId)
    .single()

  if (!order) notFound()
  if (order.buyer_id !== user.id && order.vendor_id !== user.id) notFound()

  const isVendor = order.vendor_id === user.id
  const isBuyer = order.buyer_id === user.id

  const statusSteps = ['pending', 'accepted', 'preparing', 'ready', 'delivered']
  const currentStep = statusSteps.indexOf(order.status)

  const STATUS_COLORS: Record<string, string> = {
    pending: 'text-yellow-400',
    accepted: 'text-blue-400',
    preparing: 'text-blue-400',
    ready: 'text-purple-400',
    delivered: 'text-green-400',
    disputed: 'text-red-400',
    cancelled: 'text-gray-500',
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Nav */}
      <header className="sticky top-0 z-20 bg-[#080808]/95 backdrop-blur border-b border-gray-900 px-6 py-4 flex items-center justify-between">
        <Link href={isVendor ? '/vendor/dashboard/orders' : '/buyer/dashboard'}
          className="text-sm text-gray-400 hover:text-white font-medium transition-colors">← Orders</Link>
        <Link href="/" className="text-xl font-black text-white">PLATE</Link>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">#{orderId.slice(0, 8).toUpperCase()}</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* ETA / Status hero */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          {order.status === 'delivered' ? (
            <>
              <div className="text-6xl mb-4">✅</div>
              <p className="text-4xl font-black text-green-400 uppercase">Delivered</p>
              <p className="text-gray-500 text-sm mt-2">Verified via {order.verification_method?.toUpperCase()}</p>
            </>
          ) : order.status === 'disputed' ? (
            <>
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-4xl font-black text-red-400 uppercase">Disputed</p>
              <p className="text-gray-500 text-sm mt-2">Admin review within 24 hours. Tokens are safe.</p>
            </>
          ) : order.status === 'cancelled' ? (
            <>
              <div className="text-6xl mb-4">❌</div>
              <p className="text-4xl font-black text-gray-500 uppercase">Cancelled</p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Current status</p>
              <p className={`text-5xl font-black uppercase tracking-tight ${STATUS_COLORS[order.status] ?? 'text-white'}`}>
                {order.status}
              </p>
              <p className="text-gray-600 text-sm mt-3">
                {order.status === 'pending' && 'Waiting for vendor to accept'}
                {order.status === 'accepted' && 'Vendor has accepted your order'}
                {order.status === 'preparing' && 'Your food is being prepared'}
                {order.status === 'ready' && 'Ready for pickup / delivery!'}
              </p>
            </>
          )}
        </div>

        {/* Progress bar */}
        {!['cancelled', 'refunded', 'disputed'].includes(order.status) && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                      i < currentStep ? 'bg-green-500 text-white' :
                      i === currentStep ? 'bg-red-600 text-white' :
                      'bg-gray-800 text-gray-600'
                    }`}>
                      {i < currentStep ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs capitalize font-bold uppercase tracking-wide ${
                      i === currentStep ? 'text-red-500' : i < currentStep ? 'text-green-500' : 'text-gray-700'
                    }`}>
                      {step}
                    </span>
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-green-500' : 'bg-gray-800'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dispute banner */}
        {order.status === 'disputed' && (
          <div className="bg-red-950 border border-red-900 rounded-2xl p-5">
            <p className="text-red-400 font-black uppercase tracking-wide">Dispute Open</p>
            <p className="text-sm text-red-300 mt-1">{order.dispute_reason}</p>
            <p className="text-xs text-red-600 mt-2">Tokens held safely in escrow until resolved.</p>
          </div>
        )}

        {/* Order details */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-5">Order details</p>
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-gray-500 text-sm">Item</span>
              <span className="text-white font-bold text-sm text-right max-w-xs">{order.food_listings?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Quantity</span>
              <span className="text-white font-bold text-sm">{order.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Fulfillment</span>
              <span className="text-white font-bold text-sm capitalize">{order.fulfillment_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Payment</span>
              <span className="text-white font-bold text-sm capitalize">{order.payment_method}</span>
            </div>
            {isBuyer && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Vendor</span>
                <span className="text-white font-bold text-sm">{order.vendor_profiles?.business_name}</span>
              </div>
            )}
            {isVendor && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Buyer</span>
                <span className="text-white font-bold text-sm">{order.profiles?.full_name}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-gray-800">
              <span className="text-gray-500 text-sm font-bold uppercase tracking-wide">Total</span>
              <span className="text-yellow-400 font-black text-lg">{order.price_tokens} tokens</span>
            </div>
          </div>

          {order.delivery_address && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-gray-600 text-xs uppercase tracking-widest mb-1">Delivery address</p>
              <p className="text-gray-300 text-sm">{order.delivery_address}</p>
            </div>
          )}
          {order.special_instructions && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-gray-600 text-xs uppercase tracking-widest mb-1">Instructions</p>
              <p className="text-gray-400 text-sm italic">"{order.special_instructions}"</p>
            </div>
          )}
        </div>

        {/* Verification panel */}
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
