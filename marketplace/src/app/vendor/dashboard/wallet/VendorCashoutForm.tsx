'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

const PRESETS = [10, 25, 50, 100]

export default function VendorCashoutForm({ balance }: { balance: number }) {
  const router = useRouter()
  const [amount, setAmount] = useState(0)
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const finalAmount = custom ? parseInt(custom) : amount
  const canCashout = finalAmount >= 10 && finalAmount <= balance

  async function handleCashout() {
    if (!canCashout) return
    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/tokens/cashout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens: finalAmount }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Cashout failed')
    } else {
      setSuccess(data.message ?? `Cashout of ${finalAmount} tokens requested!`)
      setAmount(0)
      setCustom('')
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Minimum cashout: 10 tokens ($10) · Processed within 1–2 business days</p>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map(preset => (
          <button
            key={preset}
            onClick={() => { setAmount(preset); setCustom('') }}
            disabled={preset > balance}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              amount === preset && !custom
                ? 'bg-orange-600 text-white border-orange-600'
                : 'border-gray-300 text-gray-700 hover:border-orange-400'
            }`}
          >
            {preset} tokens
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          min="10"
          max={balance}
          placeholder="Custom amount..."
          value={custom}
          onChange={e => { setCustom(e.target.value); setAmount(0) }}
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {finalAmount > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 flex justify-between text-sm">
          <span className="text-gray-600">You will receive</span>
          <span className="font-bold text-gray-900">${finalAmount}.00 USD</span>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Button
        onClick={handleCashout}
        loading={loading}
        disabled={!canCashout}
        size="lg"
        className="w-full"
      >
        Request Payout of {finalAmount || 0} Tokens
      </Button>

      {balance < 10 && (
        <p className="text-xs text-gray-400 text-center">
          Complete more orders to reach the 10 token minimum for cashout.
        </p>
      )}
    </div>
  )
}
