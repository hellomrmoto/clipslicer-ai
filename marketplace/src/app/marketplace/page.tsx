import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import Card from '@/components/ui/Card'
import SideDrawer from '@/components/layout/SideDrawer'

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: '🌅 Breakfast', value: 'Breakfast' },
  { label: '🥗 Lunch', value: 'Lunch' },
  { label: '🍛 Dinner', value: 'Dinner' },
  { label: '🧁 Desserts', value: 'Desserts' },
  { label: '🥨 Snacks', value: 'Snacks' },
  { label: '🥤 Drinks', value: 'Drinks' },
  { label: '📦 Meal Prep', value: 'Meal Prep' },
]

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

  const activeCategory = CATEGORIES.find(c => c.value === (category ?? '')) ?? CATEGORIES[0]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Sticky nav */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-orange-600 tracking-tight">FoodToken</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/buyer/dashboard/wallet"
                className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-200"
              >
                {wallet?.balance ?? 0} tokens
              </Link>
              <Link href="/buyer/dashboard" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                My orders
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/buyer/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                Sign in
              </Link>
              <Link
                href="/auth/buyer/register"
                className="text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-medium"
              >
                Join free
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            {search
              ? `Results for "${search}"`
              : category
              ? `${activeCategory.label} near you`
              : "What's cooking today?"}
          </h1>
          <p className="text-orange-100 mb-6 text-sm">
            {listings?.length ?? 0} listing{listings?.length === 1 ? '' : 's'} available · Tokens held in escrow until delivery
          </p>

          {/* Search form */}
          <form className="flex gap-2 max-w-xl">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search tacos, biryani, lasagna..."
              className="flex-1 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            {category && <input type="hidden" name="category" value={category} />}
            <button
              type="submit"
              className="bg-white text-orange-600 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-orange-50 shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-1">
        <main className="flex-1 px-6 py-6 max-w-5xl w-full mx-auto">
          {/* Category filter pills */}
          <div className="flex gap-2 flex-wrap mb-6 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => {
              const isActive = (category ?? '') === cat.value
              return (
                <Link
                  key={cat.value}
                  href={cat.value ? `/marketplace?category=${cat.value}` : '/marketplace'}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    isActive
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600'
                  }`}
                >
                  {cat.label}
                </Link>
              )
            })}
          </div>

          {/* Grid */}
          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map(listing => (
                <Link key={listing.id} href={`/marketplace/${listing.id}`} className="group">
                  <Card className="overflow-hidden h-full flex flex-col group-hover:shadow-md group-hover:border-orange-200 transition-all">
                    {/* Food image */}
                    <div className="h-44 relative bg-gradient-to-br from-orange-100 to-orange-200 shrink-0">
                      {listing.image_url ? (
                        <Image
                          src={listing.image_url}
                          alt={listing.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-5xl">🍽️</div>
                      )}
                      {/* Category badge */}
                      {listing.category && (
                        <span className="absolute top-3 left-3 bg-white/90 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
                          {listing.category}
                        </span>
                      )}
                      {listing.vendor_profiles?.is_verified && (
                        <span className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-900 text-base leading-snug">{listing.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">{listing.description}</p>

                      {/* Vendor */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-200 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {listing.vendor_profiles?.business_name?.[0] ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 font-medium truncate">{listing.vendor_profiles?.business_name}</p>
                          <p className="text-xs text-gray-400 truncate">{listing.vendor_profiles?.location_zone}</p>
                        </div>
                        {listing.vendor_profiles?.avg_rating > 0 && (
                          <span className="text-xs text-gray-500 shrink-0">⭐ {listing.vendor_profiles.avg_rating}</span>
                        )}
                      </div>

                      {/* Footer row */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {listing.offers_pickup && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Pickup</span>
                          )}
                          {listing.offers_delivery && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Delivery</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600 text-base">{listing.price_tokens} <span className="text-xs font-normal text-gray-400">tokens</span></p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm">
                {search
                  ? `No food matched "${search}". Try a different search or browse all categories.`
                  : 'No food available in this category right now. Check back soon!'}
              </p>
              <Link
                href="/marketplace"
                className="text-sm bg-orange-600 text-white px-5 py-2.5 rounded-xl hover:bg-orange-700 font-medium"
              >
                Browse all food
              </Link>
            </div>
          )}
        </main>

        <SideDrawer role="buyer" />
      </div>

      {/* Bottom CTA for non-signed-in users */}
      {!user && (
        <div className="bg-orange-50 border-t border-orange-100 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Ready to order?</span> Create a free account and top up your token wallet.
          </p>
          <Link
            href="/auth/buyer/register"
            className="text-sm bg-orange-600 text-white px-5 py-2.5 rounded-xl hover:bg-orange-700 font-medium shrink-0"
          >
            Get started free
          </Link>
        </div>
      )}
    </div>
  )
}
