'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function DisputeButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submitDispute() {
    if (!reason.trim()) { setError('Please describe the issue'); return }
    setLoading(true)
    const res = await fetch(`/api/orders/${orderId}/dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to open dispute')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-sm text-red-500 hover:text-red-700 hover:underline text-center py-2"
      >
        Have a problem with this order? Open a dispute
      </button>
    )
  }

  return (
    <div className="border border-red-200 bg-red-50 rounded-2xl p-5 space-y-3">
      <h3 className="font-semibold text-red-700">Open a Dispute</h3>
      <p className="text-sm text-red-600">Describe what went wrong. Tokens remain in escrow until resolved.</p>
      <textarea
        rows={3}
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="e.g. I never received my food, the item was completely different..."
        className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={submitDispute} variant="danger" loading={loading} size="sm">
          Submit Dispute
        </Button>
        <Button onClick={() => setOpen(false)} variant="ghost" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  )
}
