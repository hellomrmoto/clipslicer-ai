import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import OrderForm from './OrderForm'

export default async function ListingPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params
  const supabase = await createClient()

  const [{ data: listing }, { data: { user } }] = await Promise.all([
    supabase.from('food_listings')
      .select('*, vendor_profiles(*, profiles(full_name, phone))')
      .eq('id', listingId)
      .single(),
    supabase.auth.getUser(),
  ])

  if (!listing) notFound()

  const { data: wallet } = user
    ? await supabase.from('wallets').select('balance').eq('user_id', user.id).single()
    : { data: null }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Nav */}
      <header className="sticky top-0 z-20 bg-[#080808]/95 backdrop-blur border-b border-gray-900 px-6 py-4 flex items-center justify-between">
        <Link href="/marketplace" className="text-sm text-gray-400 hover:text-white font-medium transition-colors">← Back</Link>
        <Link href="/" className="text-xl font-black text-white tracking-tight">PLATE</Link>
        {user ? (
          <Link href="/buyer/dashboard/wallet"
            className="text-sm bg-gray-900 border border-gray-800 text-white px-3 py-1.5 rounded-lg font-bold hover:border-gray-700 transition-colors">
            {wallet?.balance ?? 0} tokens
          </Link>
        ) : (
          <Link href="/auth/buyer/login"
            className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold uppercase tracking-wide transition-colors">
            Sign in
          </Link>
        )}
      </header>

      {/* Full-width hero image */}
      <div className="relative h-72 md:h-96 bg-gray-900">
        {listing.image_url ? (
          <Image src={listing.image_url} alt={listing.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex gap-2 mb-3">
            {listing.category && (
              <span className="bg-black/60 text-gray-300 text-xs px-3 py-1 rounded-full font-medium uppercase tracking-wide">
                {listing.category}
              </span>
            )}
            {listing.vendor_profiles?.is_verified && (
              <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold">✓ Verified</span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">
            {listing.title}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left: details */}
        <div className="md:col-span-3 flex flex-col gap-6">
          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-black text-yellow-400">{listing.price_tokens}</span>
            <span className="text-gray-500 text-sm uppercase tracking-wide">tokens · ≈ ${listing.price_tokens}</span>
          </div>

          {/* Description */}
          {listing.description && (
            <p className="text-gray-400 leading-relaxed">{listing.description}</p>
          )}

          {/* Dietary tags */}
          {listing.dietary_tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {listing.dietary_tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-green-900 text-green-400 px-3 py-1 rounded-full font-medium">{tag}</span>
              ))}
            </div>
          )}

          {/* Fulfillment options */}
          <div className="flex gap-2">
            {listing.offers_pickup && (
              <span className="text-sm bg-gray-900 border border-gray-800 text-gray-300 px-4 py-2 rounded-xl">🏠 Pickup</span>
            )}
            {listing.offers_delivery && (
              <span className="text-sm bg-gray-900 border border-gray-800 text-gray-300 px-4 py-2 rounded-xl">
                🚗 Delivery {listing.delivery_radius_miles && `(${listing.delivery_radius_miles}mi)`}
              </span>
            )}
          </div>

          {/* Vendor card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">The cook</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-900 flex items-center justify-center text-red-400 font-black text-lg">
                {listing.vendor_profiles?.business_name?.[0]}
              </div>
              <div className="flex-1">
                <p className="font-black text-white uppercase tracking-tight">{listing.vendor_profiles?.business_name}</p>
                <p className="text-sm text-gray-500">{listing.vendor_profiles?.location_zone}</p>
              </div>
              {listing.vendor_profiles?.avg_rating > 0 && (
                <div className="text-yellow-400 font-black">★ {listing.vendor_profiles.avg_rating}</div>
              )}
            </div>
            {listing.vendor_profiles?.bio && (
              <p className="text-sm text-gray-500 mt-4 leading-relaxed">{listing.vendor_profiles.bio}</p>
            )}
          </div>
        </div>

        {/* Right: order form */}
        <div className="md:col-span-2">
          <OrderForm listing={listing} user={user} walletBalance={wallet?.balance ?? 0} />
        </div>
      </div>
    </div>
  )
}
