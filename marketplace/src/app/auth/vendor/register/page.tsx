'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function VendorRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', business_name: '',
    food_specialty: '', location_zone: '', phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role: 'vendor' }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return }

    const supabase = createClient()
    await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    router.push('/vendor/dashboard')
    router.refresh()
  }

  const fields = [
    { key: 'full_name', label: 'Your Full Name', type: 'text', placeholder: 'Jane Smith' },
    { key: 'business_name', label: 'Business / Cook Name', type: 'text', placeholder: "Jane's Kitchen" },
    { key: 'food_specialty', label: 'Food Specialty', type: 'text', placeholder: 'Jamaican, Tamales, BBQ...' },
    { key: 'location_zone', label: 'Location / Neighborhood', type: 'text', placeholder: 'South Side, Chicago' },
    { key: 'phone', label: 'Phone (optional)', type: 'tel', placeholder: '+1 555 000 0000' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 characters' },
  ]

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-black text-white tracking-tight">PLATE</Link>
          <p className="mt-2 text-xs font-bold text-gray-600 uppercase tracking-widest">Create vendor account</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">{label}</label>
                <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
                  onChange={e => update(key, e.target.value)}
                  minLength={key === 'password' ? 8 : undefined}
                  required={key !== 'phone' && key !== 'food_specialty' && key !== 'location_zone'}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            ))}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button type="submit" disabled={loading}
              className="bg-red-600 text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-600 transition-colors flex items-center justify-center gap-2 mt-2">
              {loading && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Create Vendor Account
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/vendor/login" className="text-white font-bold hover:text-red-400 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
