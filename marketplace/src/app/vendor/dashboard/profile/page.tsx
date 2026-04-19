'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function VendorProfilePage() {
  const [form, setForm] = useState({
    full_name: '', phone: '', business_name: '', bio: '', food_specialty: '', location_zone: '',
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

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
  const labelCls = "text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5"

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-black text-white uppercase tracking-tight">Edit Profile</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          <p className="text-xs font-black text-gray-600 uppercase tracking-widest">Personal Info</p>
          <div><label className={labelCls}>Full Name</label><input className={inputCls} value={form.full_name} onChange={e => update('full_name', e.target.value)} required /></div>
          <div><label className={labelCls}>Phone</label><input type="tel" className={inputCls} value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          <p className="text-xs font-black text-gray-600 uppercase tracking-widest">Vendor Info</p>
          <div><label className={labelCls}>Business / Cook Name</label><input className={inputCls} value={form.business_name} onChange={e => update('business_name', e.target.value)} required /></div>
          <div><label className={labelCls}>Food Specialty</label><input className={inputCls} placeholder="Jamaican, Soul Food, Tamales..." value={form.food_specialty} onChange={e => update('food_specialty', e.target.value)} /></div>
          <div><label className={labelCls}>Neighborhood / Zone</label><input className={inputCls} placeholder="South Side, Chicago" value={form.location_zone} onChange={e => update('location_zone', e.target.value)} /></div>
          <div>
            <label className={labelCls}>Bio</label>
            <textarea rows={4} value={form.bio} onChange={e => update('bio', e.target.value)}
              placeholder="Tell buyers about yourself and your food..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {saved && <p className="text-sm text-green-400 font-bold">Saved!</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-red-600 text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-600 transition-colors flex items-center justify-center gap-2">
          {loading && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
          Save Changes
        </button>
      </form>
    </div>
  )
}
