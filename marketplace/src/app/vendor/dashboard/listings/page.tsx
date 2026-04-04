import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import Card from '@/components/ui/Card'
import ToggleListingButton from './ToggleListingButton'

export default async function VendorListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: listings } = await supabase
    .from('food_listings')
    .select('*')
    .eq('vendor_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Menu</h1>
        <Link href="/vendor/dashboard/listings/new"
          className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-700">
          + Add Item
        </Link>
      </div>

      {listings && listings.length > 0 ? (
        <div className="flex flex-col gap-4">
          {listings.map(listing => (
            <Card key={listing.id} className="p-5 flex items-center gap-4">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-orange-100 shrink-0 relative">
                {listing.image_url ? (
                  <Image src={listing.image_url} alt={listing.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🍽️</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                  {!listing.is_available && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Unavailable</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{listing.description}</p>
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span>{listing.price_tokens} tokens</span>
                  <span>·</span>
                  <span className="capitalize">{listing.category}</span>
                  {listing.offers_pickup && <span>· Pickup</span>}
                  {listing.offers_delivery && <span>· Delivery</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/vendor/dashboard/listings/${listing.id}/edit`}
                  className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50">
                  Edit
                </Link>
                <ToggleListingButton listingId={listing.id} isAvailable={listing.is_available} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-gray-400 mb-4">No menu items yet.</p>
          <Link href="/vendor/dashboard/listings/new"
            className="bg-orange-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-orange-700">
            Add your first item
          </Link>
        </Card>
      )}
    </div>
  )
}
