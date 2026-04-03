'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
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
      <Card className="p-6 text-center space-y-4">
        <p className="text-gray-600">Sign in to place an order</p>
        <Link href="/auth/buyer/login"
          className="block bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-orange-700">
          Sign In
        </Link>
        <Link href="/auth/buyer/register" className="block text-sm text-orange-600 hover:underline">
          Create account
        </Link>
      </Card>
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
    <Card className="p-6 space-y-5 sticky top-24">
      <h2 className="font-semibold text-gray-900 text-lg">Place Order</h2>

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Quantity</label>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">−</button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <button onClick={() => setQuantity(q => q + 1)}
            className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">+</button>
        </div>
      </div>

      {/* Fulfillment */}
      {listing.offers_pickup && listing.offers_delivery && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Fulfillment</label>
          <div className="flex gap-2">
            {(['pickup', 'delivery'] as const).map(type => (
              <button key={type} onClick={() => setFulfillment(type)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-colors ${
                  fulfillment === type
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'border-gray-300 text-gray-700 hover:border-orange-400'
                }`}>
                {type === 'pickup' ? '🏠 Pickup' : '🚗 Delivery'}
              </button>
            ))}
          </div>
        </div>
      )}

      {fulfillment === 'delivery' && (
        <Input id="address" label="Delivery Address" placeholder="123 Main St, City, State"
          value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} required />
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="instructions" className="text-sm font-medium text-gray-700">Special Instructions</label>
        <textarea id="instructions" rows={2} value={specialInstructions}
          onChange={e => setSpecialInstructions(e.target.value)}
          placeholder="Allergies, preferences..."
          className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
      </div>

      {/* Payment method */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Payment</label>
        <div className="flex gap-2">
          {(['tokens', 'cash'] as const).map(method => (
            <button key={method} onClick={() => setPaymentMethod(method)}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                paymentMethod === method
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'border-gray-300 text-gray-700 hover:border-orange-400'
              }`}>
              {method === 'tokens' ? `🪙 Tokens (${walletBalance})` : '💵 Cash'}
            </button>
          ))}
        </div>
        {paymentMethod === 'tokens' && !canAfford && (
          <p className="text-xs text-red-600 mt-1">
            Not enough tokens.{' '}
            <Link href="/buyer/dashboard/wallet" className="underline">Buy more</Link>
          </p>
        )}
      </div>

      {/* Price breakdown */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>{listing.price_tokens} tokens × {quantity}</span>
          <span>{subtotal} tokens</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Platform fee (10%)</span>
          <span>{platformFee} tokens</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>{paymentMethod === 'cash' ? `$${subtotal} cash` : `${total} tokens`}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        onClick={handleOrder}
        loading={loading}
        disabled={paymentMethod === 'tokens' && !canAfford}
        size="lg"
        className="w-full"
      >
        {paymentMethod === 'cash' ? 'Place Order (Pay Cash on Pickup)' : 'Place Order & Pay with Tokens'}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        🔒 Tokens held in escrow until delivery is confirmed
      </p>
    </Card>
  )
}
