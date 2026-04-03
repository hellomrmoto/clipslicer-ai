'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function DisputeResolveForm({ orderId, buyerId, vendorId, escrowAmount, vendorPayout }: {
  orderId: string
  buyerId: string
  vendorId: string
  escrowAmount: number
  vendorPayout: number
}) {
  const router = useRouter()
  const [resolution, setResolution] = useState<'refund_buyer' | 'release_vendor' | ''>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleResolve() {
    if (!resolution) { setError('Select a resolution'); return }
    setLoading(true)
    setError('')

    const res = await fetch(`/api/admin/disputes/${orderId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution, notes }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to resolve dispute')
    } else {
      router.refresh()
    }
  }

  return (
    <div className="border-t border-gray-100 pt-4 space-y-3">
      <p className="text-sm font-medium text-gray-700">Admin Resolution</p>

      <div className="flex gap-3">
        <button onClick={() => setResolution('refund_buyer')}
          className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
            resolution === 'refund_buyer'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 text-gray-700 hover:border-blue-400'
          }`}>
          Refund Buyer ({escrowAmount} tokens)
        </button>
        <button onClick={() => setResolution('release_vendor')}
          className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
            resolution === 'release_vendor'
              ? 'bg-green-600 text-white border-green-600'
              : 'border-gray-300 text-gray-700 hover:border-green-400'
          }`}>
          Pay Vendor ({vendorPayout} tokens)
        </button>
      </div>

      <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Internal notes (optional)..."
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button onClick={handleResolve} loading={loading} size="sm" disabled={!resolution}>
        Confirm Resolution
      </Button>
    </div>
  )
}
