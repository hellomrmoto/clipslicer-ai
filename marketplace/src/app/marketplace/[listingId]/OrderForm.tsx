'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PLATFORM_FEE_PERCENT = 10

export default function OrderForm({ listing, user, walletBalance }: {
  listing: any
  user: any
  walletBalance: number
}) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>(
    listing.offers_pickup ? 'pickup' : 'delivery'
  )
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'tokens' | 'cash'>('tokens')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = listing.price_tokens * quantity
  const platformFee = Math.ceil(subtotal * PLATFORM_FEE_PERCENT / 100)
  const total = subtotal + platformFee
  const canAfford = walletBalance >= total

  if (!user) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center space-y-4">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Place your order</p>
        <p className="text-gray-400 text-sm">Sign in to order from this cook</p>
        <Link href="/auth/buyer/login"
          className="block bg-red-600 text-white px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-colors">
          Sign In
        </Link>
        <Link href="/auth/buyer/register" className="block text-sm text-gray-500 hover:text-white transition-colors">
          Create account
        </Link>
      </div>
    )
  }

  async function handleOrder() {
    if (paymentMethod === 'tokens' && !canAfford) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listing.id,
        quantity,
        fulfillment_type: fulfillment,
        delivery_address: fulfillment === 'delivery' ? deliveryAddress : null,
        special_instructions: specialInstructions || null,
        payment_method: paymentMethod,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to place order')
      return
    }

    router.push(`/order/${data.orderId}`)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5 sticky top-24">
      <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Place your order</p>

      {/* Quantity */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quantity</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-full border border-gray-700 text-gray-300 hover:bg-gray-800 font-black text-lg flex items-center justify-center transition-colors">−</button>
          <span className="w-8 text-center font-black text-white">{quantity}</span>
          <button onClick={() => setQuantity(q => q + 1)}
            className="w-8 h-8 rounded-full border border-gray-700 text-gray-300 hover:bg-gray-800 font-black text-lg flex items-center justify-center transition-colors">+</button>
        </div>
      </div>

      {/* Fulfillment */}
      {listing.offers_pickup && listing.offers_delivery && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Fulfillment</p>
          <div className="flex gap-2">
            {(['pickup', 'delivery'] as const).map(type => (
              <button key={type} onClick={() => setFulfillment(type)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-black capitalize uppercase tracking-wide transition-colors ${
                  fulfillment === type
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                }`}>
                {type === 'pickup' ? '🏠 Pickup' : '🚗 Delivery'}
              </button>
            ))}
          </div>
        </div>
      )}

      {fulfillment === 'delivery' && (
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Delivery Address</label>
          <input
            placeholder="123 Main St, City, State"
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Special Instructions</label>
        <textarea rows={2} value={specialInstructions}
          onChange={e => setSpecialInstructions(e.target.value)}
          placeholder="Allergies, preferences..."
          className="block w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
      </div>

      {/* Payment */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment</p>
        <div className="flex gap-2">
          {(['tokens', 'cash'] as const).map(method => (
            <button key={method} onClick={() => setPaymentMethod(method)}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wide transition-colors ${
                paymentMethod === method
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
              }`}>
              {method === 'tokens' ? `Tokens (${walletBalance})` : 'Cash'}
            </button>
          ))}
        </div>
        {paymentMethod === 'tokens' && !canAfford && (
          <p className="text-xs text-red-500 mt-2">
            Not enough tokens.{' '}
            <Link href="/buyer/dashboard/wallet" className="underline hover:text-red-400">Buy more</Link>
          </p>
        )}
      </div>

      {/* Breakdown */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>{listing.price_tokens} × {quantity}</span>
          <span>{subtotal} tokens</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Platform fee (10%)</span>
          <span>{platformFee} tokens</span>
        </div>
        <div className="flex justify-between font-black text-white pt-2 border-t border-gray-700">
          <span className="uppercase tracking-wide">Total</span>
          <span className="text-yellow-400">
            {paymentMethod === 'cash' ? `$${subtotal} cash` : `${total} tokens`}
          </span>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleOrder}
        disabled={loading || (paymentMethod === 'tokens' && !canAfford)}
        className="w-full bg-red-600 text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-600 transition-colors flex items-center justify-center gap-2"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {paymentMethod === 'cash' ? 'Order — Pay Cash on Pickup' : 'Order & Pay with Tokens'}
      </button>

      <p className="text-xs text-gray-700 text-center">
        🔒 Tokens held in escrow until delivery is confirmed
      </p>
    </div>
  )
}
