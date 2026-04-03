'use client'

import { useEffect, useRef, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Props {
  orderId: string
  otpCode: string | null
  qrToken: string | null
  isVendor: boolean
}

export default function OrderVerificationPanel({ orderId, otpCode, qrToken, isVendor }: Props) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  // Generate QR code on buyer's canvas
  useEffect(() => {
    if (!qrToken || isVendor || !qrCanvasRef.current) return

    async function renderQr() {
      const QRCode = (await import('qrcode')).default
      await QRCode.toCanvas(qrCanvasRef.current!, qrToken!, {
        width: 220,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
    }
    renderQr()
  }, [qrToken, isVendor])

  function copyOtp() {
    if (otpCode) {
      navigator.clipboard.writeText(otpCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // BUYER VIEW: show QR + OTP code
  if (!isVendor) {
    return (
      <Card className="p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">Your order is ready!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Show your QR code or give your delivery code to the vendor
          </p>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-gray-700">Scan QR (Primary)</p>
          <div className="p-3 border-2 border-orange-200 rounded-2xl bg-white">
            <canvas ref={qrCanvasRef} />
          </div>
          <p className="text-xs text-gray-400">Ask the vendor to scan this with their phone</p>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or use your backup code</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* OTP Code */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-gray-700">Delivery Code (Backup)</p>
          <div
            className="flex items-center gap-3 bg-orange-50 border-2 border-orange-200 rounded-2xl px-6 py-4 cursor-pointer hover:bg-orange-100"
            onClick={copyOtp}
          >
            <span className="text-3xl font-bold tracking-[0.3em] text-orange-700 font-mono">
              {otpCode}
            </span>
            <span className="text-xs text-orange-400">{copied ? '✓ Copied' : 'Tap to copy'}</span>
          </div>
          <p className="text-xs text-gray-400">Read this code aloud to your vendor at handoff</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
          🔒 Your tokens are held safely in escrow and will be released to the vendor once they scan your code.
        </div>
      </Card>
    )
  }

  // VENDOR VIEW: scan QR or enter OTP — handled in VendorOrderActions
  return null
}
