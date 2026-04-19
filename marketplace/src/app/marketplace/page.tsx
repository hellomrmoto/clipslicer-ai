import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import SideDrawer from '@/components/layout/SideDrawer'

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Breakfast', value: 'Breakfast' },
  { label: 'Lunch', value: 'Lunch' },
  { label: 'Dinner', value: 'Dinner' },
  { label: 'Desserts', value: 'Desserts' },
  { label: 'Snacks', value: 'Snacks' },
  { label: 'Drinks', value: 'Drinks' },
  { label: 'Meal Prep', value: 'Meal Prep' },
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

  return (
    <div className="min-h-screen flex flex-col bg-[#080808]">
      {/* Nav */}
      <header className="sticky top-0 z-20 bg-[#080808]/95 backdrop-blur border-b border-gray-900 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-white tracking-tight">PLATE</Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/buyer/dashboard/wallet"
                className="text-sm bg-gray-900 border border-gray-800 text-white px-3 py-1.5 rounded-lg font-bold hover:border-gray-700 transition-colors">
                {wallet?.balance ?? 0} tokens
              </Link>
              <Link href="/buyer/dashboard" className="text-sm text-gray-400 hover:text-white font-medium transition-colors">
                My orders
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/buyer/login" className="text-sm text-gray-400 hover:text-white font-medium transition-colors">Sign in</Link>
              <Link href="/auth/buyer/register"
                className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold uppercase tracking-wide transition-colors">
                Join free
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero bar */}
      <div className="border-b border-gray-900 px-6 py-8 bg-gradient-to-r from-red-950/30 to-transparent">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-1">
            {search ? `"${search}"` : category ? category.toUpperCase() : 'THE MENU'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {listings?.length ?? 0} item{listings?.length === 1 ? '' : 's'} · Tokens held in escrow until delivery
          </p>
          <form className="flex gap-2 max-w-lg">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search tacos, biryani, lasagna..."
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {category && <input type="hidden" name="category" value={category} />}
            <button type="submit"
              className="bg-red-600 text-white font-bold uppercase tracking-wide px-5 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors shrink-0">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-1">
        <main className="flex-1 px-6 py-6 max-w-5xl w-full mx-auto">
          {/* Category pills */}
          <div className="flex gap-2 flex-wrap mb-8">
            {CATEGORIES.map(cat => {
              const isActive = (category ?? '') === cat.value
              return (
                <Link
                  key={cat.value}
                  href={cat.value ? `/marketplace?category=${cat.value}` : '/marketplace'}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-colors ${
                    isActive
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-transparent border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  {cat.label}
                </Link>
              )
            })}
          </div>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(listing => (
                <Link key={listing.id} href={`/marketplace/${listing.id}`} className="group">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden h-full flex flex-col group-hover:border-gray-700 transition-all">
                    {/* Image */}
                    <div className="h-48 relative bg-gray-800 shrink-0 overflow-hidden">
                      {listing.image_url ? (
                        <Image
                          src={listing.image_url}
                          alt={listing.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-5xl">🍽️</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {listing.vendor_profiles?.is_verified && (
                        <span className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          ✓ Verified
                        </span>
                      )}
                      {listing.category && (
                        <span className="absolute top-3 left-3 bg-black/70 text-gray-300 text-xs px-2 py-0.5 rounded-full font-medium">
                          {listing.category}
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-black text-white text-base uppercase tracking-tight leading-tight">{listing.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">{listing.description}</p>

                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <p className="text-xs text-gray-600 font-medium">{listing.vendor_profiles?.business_name}</p>
                          <p className="text-xs text-gray-700">{listing.vendor_profiles?.location_zone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-yellow-400">{listing.price_tokens}</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">tokens</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2">
                        {listing.offers_pickup && (
                          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">Pickup</span>
                        )}
                        {listing.offers_delivery && (
                          <span className="text-xs bg-gray-800 text-blue-400 px-2 py-0.5 rounded-full">Delivery</span>
                        )}
                        {listing.vendor_profiles?.avg_rating > 0 && (
                          <span className="ml-auto text-xs text-gray-500">★ {listing.vendor_profiles.avg_rating}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="text-6xl mb-6 opacity-20">🍽️</div>
              <h3 className="text-2xl font-black text-white uppercase mb-2">Nothing here yet</h3>
              <p className="text-gray-600 text-sm mb-8 max-w-sm">
                {search ? `No food matched "${search}". Try a different search.` : 'No food in this category right now. Check back soon.'}
              </p>
              <Link href="/marketplace"
                className="text-sm bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 font-bold uppercase tracking-widest transition-colors">
                Browse all food
              </Link>
            </div>
          )}
        </main>

        <SideDrawer role="buyer" />
      </div>

      {!user && (
        <div className="border-t border-gray-900 px-6 py-4 flex items-center justify-between gap-4 flex-wrap bg-gray-950">
          <p className="text-sm text-gray-400">
            <span className="font-bold text-white">Ready to order?</span> Create a free account and top up your wallet.
          </p>
          <Link href="/auth/buyer/register"
            className="text-xs bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 font-bold uppercase tracking-widest shrink-0 transition-colors">
            Get started free
          </Link>
        </div>
      )}
    </div>
  )
}
