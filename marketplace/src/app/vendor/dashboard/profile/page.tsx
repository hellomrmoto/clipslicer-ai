'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function VendorProfilePage() {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    business_name: '',
    bio: '',
    food_specialty: '',
    location_zone: '',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { data: vendor }] = await Promise.all([
        supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
        supabase.from('vendor_profiles').select('business_name, bio, food_specialty, location_zone').eq('id', user.id).single(),
      ])

      if (profile && vendor) {
        setForm({
          full_name: profile.full_name ?? '',
          phone: profile.phone ?? '',
          business_name: vendor.business_name ?? '',
          bio: vendor.bio ?? '',
          food_specialty: vendor.food_specialty ?? '',
          location_zone: vendor.location_zone ?? '',
        })
      }
    }
    load()
  }, [])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, vendorRes] = await Promise.all([
      supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone }).eq('id', user.id),
      supabase.from('vendor_profiles').update({
        business_name: form.business_name,
        bio: form.bio,
        food_specialty: form.food_specialty,
        location_zone: form.location_zone,
      }).eq('id', user.id),
    ])

    if (profileRes.error || vendorRes.error) {
      setError(profileRes.error?.message ?? vendorRes.error?.message ?? 'Failed to save')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }

    setLoading(false)
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>

      <form onSubmit={handleSave}>
        <Card className="p-6 space-y-5">
          <h2 className="font-semibold text-gray-700">Personal Info</h2>
          <Input id="full_name" label="Full Name" value={form.full_name}
            onChange={e => update('full_name', e.target.value)} required />
          <Input id="phone" label="Phone" type="tel" value={form.phone}
            onChange={e => update('phone', e.target.value)} />
        </Card>

        <Card className="p-6 space-y-5 mt-4">
          <h2 className="font-semibold text-gray-700">Vendor Info</h2>
          <Input id="business_name" label="Business / Cook Name" value={form.business_name}
            onChange={e => update('business_name', e.target.value)} required />
          <Input id="food_specialty" label="Food Specialty" placeholder="Jamaican, Soul Food, Tamales..."
            value={form.food_specialty} onChange={e => update('food_specialty', e.target.value)} />
          <Input id="location_zone" label="Neighborhood / Zone" placeholder="South Side, Chicago"
            value={form.location_zone} onChange={e => update('location_zone', e.target.value)} />
          <div className="flex flex-col gap-1">
            <label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</label>
            <textarea
              id="bio"
              rows={4}
              value={form.bio}
              onChange={e => update('bio', e.target.value)}
              placeholder="Tell buyers about yourself and your food..."
              className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </Card>

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        {saved && <p className="text-sm text-green-600 mt-2">Profile saved!</p>}

        <Button type="submit" loading={loading} size="lg" className="mt-4 w-full">
          Save Changes
        </Button>
      </form>
    </div>
  )
}
