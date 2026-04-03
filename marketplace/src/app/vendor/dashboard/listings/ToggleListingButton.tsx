'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ToggleListingButton({ listingId, isAvailable }: { listingId: string; isAvailable: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('food_listings').update({ is_available: !isAvailable }).eq('id', listingId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
        isAvailable
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {isAvailable ? 'Live' : 'Off'}
    </button>
  )
}
