'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function VendorRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    business_name: '',
    food_specialty: '',
    location_zone: '',
    phone: '',
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

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    // Sign in after registration
    const supabase = createClient()
    await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    router.push('/vendor/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <Link href="/" className="text-2xl font-bold text-orange-600">FoodToken</Link>
          <p className="mt-1 text-sm text-gray-500">Create your vendor account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="full_name" label="Your Full Name" placeholder="Jane Smith"
            value={form.full_name} onChange={e => update('full_name', e.target.value)} required />

          <Input id="business_name" label="Business / Cook Name" placeholder="Jane's Kitchen"
            value={form.business_name} onChange={e => update('business_name', e.target.value)} required />

          <Input id="food_specialty" label="Food Specialty" placeholder="Jamaican, Tamales, BBQ..."
            value={form.food_specialty} onChange={e => update('food_specialty', e.target.value)} />

          <Input id="location_zone" label="Location / Neighborhood" placeholder="South Side, Chicago"
            value={form.location_zone} onChange={e => update('location_zone', e.target.value)} />

          <Input id="phone" label="Phone (optional)" type="tel" placeholder="+1 555 000 0000"
            value={form.phone} onChange={e => update('phone', e.target.value)} />

          <Input id="email" label="Email" type="email" placeholder="you@example.com"
            value={form.email} onChange={e => update('email', e.target.value)} required />

          <Input id="password" label="Password" type="password" placeholder="Min 8 characters"
            value={form.password} onChange={e => update('password', e.target.value)}
            minLength={8} required />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
            Create Vendor Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/auth/vendor/login" className="text-orange-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
