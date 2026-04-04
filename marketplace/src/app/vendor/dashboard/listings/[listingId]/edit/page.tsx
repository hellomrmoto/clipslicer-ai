'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import ImageUpload from '@/components/ui/ImageUpload'

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 'Drinks', 'Meal Prep', 'Other']
const DIETARY_TAGS = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Halal', 'Kosher', 'Nut-Free', 'Dairy-Free', 'Spicy']

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.listingId as string

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price_tokens: '',
    lead_time_hours: '24',
    max_daily_orders: '',
    offers_pickup: true,
    offers_delivery: false,
    delivery_radius_miles: '',
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('food_listings')
        .select('*')
        .eq('id', listingId)
        .single()

      if (data) {
        setForm({
          title: data.title ?? '',
          description: data.description ?? '',
          category: data.category ?? '',
          price_tokens: String(data.price_tokens ?? ''),
          lead_time_hours: String(data.lead_time_hours ?? '24'),
          max_daily_orders: data.max_daily_orders ? String(data.max_daily_orders) : '',
          offers_pickup: data.offers_pickup ?? true,
          offers_delivery: data.offers_delivery ?? false,
          delivery_radius_miles: data.delivery_radius_miles ? String(data.delivery_radius_miles) : '',
        })
        setSelectedTags(data.dietary_tags ?? [])
        setImageUrl(data.image_url ?? '')
      }
      setFetching(false)
    }
    load()
  }, [listingId])

  function update(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('food_listings')
      .update({
        title: form.title,
        description: form.description,
        category: form.category,
        price_tokens: parseInt(form.price_tokens),
        lead_time_hours: parseInt(form.lead_time_hours),
        max_daily_orders: form.max_daily_orders ? parseInt(form.max_daily_orders) : null,
        offers_pickup: form.offers_pickup,
        offers_delivery: form.offers_delivery,
        delivery_radius_miles: form.delivery_radius_miles ? parseFloat(form.delivery_radius_miles) : null,
        dietary_tags: selectedTags,
        image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/vendor/dashboard/listings')
    router.refresh()
  }

  if (fetching) {
    return <div className="p-6 text-gray-400 text-sm">Loading...</div>
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Menu Item</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-6 space-y-4">
          <ImageUpload onUpload={url => setImageUrl(url)} currentUrl={imageUrl || undefined} />

          <Input id="title" label="Item Name" placeholder="e.g. Jerk Chicken Plate"
            value={form.title} onChange={e => update('title', e.target.value)} required />

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
            <textarea id="description" rows={3}
              value={form.description} onChange={e => update('description', e.target.value)}
              placeholder="What's in it? How is it made? Any special details..."
              className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="category" className="text-sm font-medium text-gray-700">Category</label>
            <select id="category" value={form.category} onChange={e => update('category', e.target.value)}
              required
              className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <Input id="price_tokens" label="Price (tokens)" type="number" min="1"
            value={form.price_tokens} onChange={e => update('price_tokens', e.target.value)} required />

          <div className="grid grid-cols-2 gap-4">
            <Input id="lead_time_hours" label="Lead Time (hours)" type="number" min="1"
              value={form.lead_time_hours} onChange={e => update('lead_time_hours', e.target.value)} />
            <Input id="max_daily_orders" label="Max Orders/Day" type="number" min="1" placeholder="Unlimited"
              value={form.max_daily_orders} onChange={e => update('max_daily_orders', e.target.value)} />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Fulfillment</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.offers_pickup}
                onChange={e => update('offers_pickup', e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500" />
              <span className="text-sm text-gray-700">Pickup</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.offers_delivery}
                onChange={e => update('offers_delivery', e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500" />
              <span className="text-sm text-gray-700">Delivery</span>
            </label>
          </div>
          {form.offers_delivery && (
            <Input id="delivery_radius" label="Delivery Radius (miles)" type="number" min="0.5" step="0.5"
              value={form.delivery_radius_miles} onChange={e => update('delivery_radius_miles', e.target.value)} />
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Dietary Tags</h2>
          <div className="flex flex-wrap gap-2">
            {DIETARY_TAGS.map(tag => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'border-gray-300 text-gray-600 hover:border-orange-400'
                }`}>
                {tag}
              </button>
            ))}
          </div>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading} size="lg" className="flex-1">
            Save Changes
          </Button>
          <Button type="button" variant="secondary" size="lg"
            onClick={() => router.push('/vendor/dashboard/listings')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
