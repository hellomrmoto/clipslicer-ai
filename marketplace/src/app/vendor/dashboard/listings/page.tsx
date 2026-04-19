import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
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
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">My Menu</h1>
        <Link href="/vendor/dashboard/listings/new"
          className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors">
          + Add Item
        </Link>
      </div>

      {listings && listings.length > 0 ? (
        <div className="flex flex-col gap-3">
          {listings.map(listing => (
            <div key={listing.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 shrink-0 relative">
                {listing.image_url ? (
                  <Image src={listing.image_url} alt={listing.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🍽️</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white uppercase tracking-tight truncate">{listing.title}</h3>
                  {!listing.is_available && (
                    <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">Off</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{listing.description}</p>
                <div className="flex gap-3 mt-1 text-xs text-gray-600">
                  <span className="text-yellow-400 font-black">{listing.price_tokens} tokens</span>
                  <span>·</span>
                  <span className="capitalize">{listing.category}</span>
                  {listing.offers_pickup && <span>· Pickup</span>}
                  {listing.offers_delivery && <span>· Delivery</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/vendor/dashboard/listings/${listing.id}/edit`}
                  className="text-xs border border-gray-700 text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-800 hover:text-white transition-colors font-bold uppercase tracking-wide">
                  Edit
                </Link>
                <ToggleListingButton listingId={listing.id} isAvailable={listing.is_available} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-14 text-center">
          <p className="text-gray-600 mb-5 text-sm">No menu items yet.</p>
          <Link href="/vendor/dashboard/listings/new"
            className="bg-red-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors">
            Add your first item
          </Link>
        </div>
      )}
    </div>
  )
}
