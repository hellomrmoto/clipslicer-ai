import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/marketplace" className="text-sm text-gray-500 hover:text-orange-600">← Back to marketplace</Link>
        {user && (
          <Link href="/buyer/dashboard/wallet"
            className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium">
            {wallet?.balance ?? 0} tokens
          </Link>
        )}
      </header>

      <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: listing details */}
        <div>
          <div className="h-56 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-7xl">🍽️</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
          <p className="text-2xl font-bold text-orange-600 mt-1">{listing.price_tokens} tokens <span className="text-base text-gray-400 font-normal">≈ ${listing.price_tokens}</span></p>

          {listing.description && (
            <p className="text-gray-600 mt-4 leading-relaxed">{listing.description}</p>
          )}

          {listing.dietary_tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.dietary_tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-2">
            {listing.offers_pickup && (
              <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">🏠 Pickup</span>
            )}
            {listing.offers_delivery && (
              <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">🚗 Delivery {listing.delivery_radius_miles && `(${listing.delivery_radius_miles}mi)`}</span>
            )}
          </div>

          <Card className="mt-6 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold">
                {listing.vendor_profiles?.business_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{listing.vendor_profiles?.business_name}</p>
                <p className="text-sm text-gray-500">{listing.vendor_profiles?.location_zone}</p>
              </div>
              {listing.vendor_profiles?.avg_rating > 0 && (
                <div className="ml-auto text-sm text-gray-600">
                  ⭐ {listing.vendor_profiles.avg_rating}
                </div>
              )}
            </div>
            {listing.vendor_profiles?.bio && (
              <p className="text-sm text-gray-500 mt-3">{listing.vendor_profiles.bio}</p>
            )}
          </Card>
        </div>

        {/* Right: order form */}
        <div>
          <OrderForm listing={listing} user={user} walletBalance={wallet?.balance ?? 0} />
        </div>
      </div>
    </div>
  )
}
