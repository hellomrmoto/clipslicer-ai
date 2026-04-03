'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

const PRESETS = [10, 25, 50, 100, 200]

export default function TokenPurchaseForm() {
  const [amount, setAmount] = useState(25)
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const finalAmount = custom ? parseInt(custom) : amount

  async function handlePurchase() {
    if (!finalAmount || finalAmount < 1) {
      setError('Enter a valid amount')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/tokens/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens: finalAmount }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to start checkout')
      return
    }

    // Redirect to Stripe Checkout
    window.location.href = data.checkoutUrl
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">1 token = $1.00 USD · Powered by Stripe</p>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map(preset => (
          <button key={preset}
            onClick={() => { setAmount(preset); setCustom('') }}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              amount === preset && !custom
                ? 'bg-orange-600 text-white border-orange-600'
                : 'border-gray-300 text-gray-700 hover:border-orange-400'
            }`}>
            {preset} tokens
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          placeholder="Custom amount..."
          value={custom}
          onChange={e => setCustom(e.target.value)}
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div className="bg-gray-50 rounded-xl p-4 flex justify-between text-sm">
        <span className="text-gray-600">You pay</span>
        <span className="font-bold text-gray-900">${finalAmount || 0}.00 USD</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={handlePurchase} loading={loading} size="lg" className="w-full">
        Buy {finalAmount || 0} Tokens via Stripe
      </Button>

      <p className="text-xs text-gray-400 text-center">
        Secure payment via Stripe. Tokens are added instantly after payment.
      </p>
    </div>
  )
}
