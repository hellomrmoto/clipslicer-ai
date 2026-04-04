import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import Card from '@/components/ui/Card'
import SideDrawer from '@/components/layout/SideDrawer'

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const { category, search } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('food_listings')
    .select('*, vendor_profiles(business_name, location_zone, avg_rating, is_verified)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data: listings } = await query

  const { data: wallet } = user
    ? await supabase.from('wallets').select('balance').eq('user_id', user.id).single()
    : { data: null }

  const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 'Drinks', 'Meal Prep']

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <Link href="/" className="text-xl font-bold text-orange-600">FoodToken</Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/buyer/dashboard/wallet"
                className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-200">
                {wallet?.balance ?? 0} tokens
              </Link>
              <Link href="/buyer/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Orders</Link>
            </>
          ) : (
            <Link href="/auth/buyer/login"
              className="text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
              Sign In
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        <main className="flex-1 p-6 max-w-5xl">
          {/* Search */}
          <form className="mb-6 flex gap-3">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search for food..."
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button type="submit"
              className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-700">
              Search
            </button>
          </form>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap mb-6">
            <Link href="/marketplace"
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                !category ? 'bg-orange-600 text-white border-orange-600' : 'border-gray-300 text-gray-600 hover:border-orange-400'
              }`}>
              All
            </Link>
            {CATEGORIES.map(cat => (
              <Link key={cat} href={`/marketplace?category=${cat}`}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  category === cat ? 'bg-orange-600 text-white border-orange-600' : 'border-gray-300 text-gray-600 hover:border-orange-400'
                }`}>
                {cat}
              </Link>
            ))}
          </div>

          {/* Listings grid */}
          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(listing => (
                <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                    {/* Food image */}
                    <div className="h-40 relative bg-gradient-to-br from-orange-100 to-orange-200">
                      {listing.image_url ? (
                        <Image src={listing.image_url} alt={listing.title} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl">🍽️</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{listing.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{listing.vendor_profiles?.business_name}</p>
                          <p className="text-xs text-gray-400">{listing.vendor_profiles?.location_zone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600">{listing.price_tokens} tokens</p>
                          <p className="text-xs text-gray-400">≈ ${listing.price_tokens}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {listing.offers_pickup && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Pickup</span>
                        )}
                        {listing.offers_delivery && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Delivery</span>
                        )}
                        {listing.vendor_profiles?.is_verified && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">✓ Verified</span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No food listings found</p>
              <p className="text-sm mt-1">Check back soon or try a different search</p>
            </div>
          )}
        </main>

        <SideDrawer role="buyer" />
      </div>
    </div>
  )
}
