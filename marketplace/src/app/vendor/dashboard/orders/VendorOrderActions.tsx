'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function VendorOrderActions({ order }: { order: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [otpError, setOtpError] = useState('')

  async function updateOrderStatus(newStatus: string) {
    setLoading(true)
    const res = await fetch(`/api/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setLoading(false)
    if (res.ok) router.refresh()
  }

  async function verifyOtp() {
    setLoading(true)
    setOtpError('')
    const res = await fetch(`/api/orders/${order.id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'otp', code: otpInput }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setOtpError(data.error ?? 'Invalid code')
    } else {
      router.refresh()
    }
  }

  if (order.status === 'pending') {
    return (
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <Button onClick={() => updateOrderStatus('accepted')} loading={loading} size="sm">
          Accept Order
        </Button>
        <Button onClick={() => updateOrderStatus('cancelled')} variant="danger" size="sm" loading={loading}>
          Decline
        </Button>
      </div>
    )
  }

  if (order.status === 'accepted') {
    return (
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <Button onClick={() => updateOrderStatus('preparing')} loading={loading} size="sm">
          Start Preparing
        </Button>
      </div>
    )
  }

  if (order.status === 'preparing') {
    return (
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <Button onClick={() => updateOrderStatus('ready')} loading={loading} size="sm">
          Mark Ready
        </Button>
      </div>
    )
  }

  if (order.status === 'ready') {
    return (
      <div className="pt-3 border-t border-gray-100 space-y-3">
        <p className="text-sm font-medium text-gray-700">Verify delivery to complete order & receive tokens</p>

        {/* OTP fallback */}
        {order.payment_method === 'cash' || true ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={otpInput}
              onChange={e => setOtpInput(e.target.value.toUpperCase())}
              placeholder="Enter buyer's 6-digit code"
              maxLength={6}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-mono tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <Button onClick={verifyOtp} loading={loading} size="sm">
              Verify Code
            </Button>
          </div>
        ) : null}

        {otpError && <p className="text-xs text-red-600">{otpError}</p>}

        <p className="text-xs text-gray-400">
          Ask the buyer for their 6-digit delivery code, or scan their QR code.
        </p>
      </div>
    )
  }

  return null
}
