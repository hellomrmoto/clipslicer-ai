export type UserRole = 'buyer' | 'vendor' | 'admin'

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'disputed'
  | 'cancelled'
  | 'refunded'

export type FulfillmentType = 'pickup' | 'delivery'
export type PaymentMethod = 'tokens' | 'cash'
export type VerificationMethod = 'qr' | 'otp' | 'admin'
export type EscrowStatus = 'held' | 'released' | 'refunded'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  created_at: string
}

export interface VendorProfile {
  id: string
  business_name: string
  bio?: string
  food_specialty?: string
  location_zone?: string
  banner_url?: string
  is_verified: boolean
  is_active: boolean
  avg_rating: number
  total_orders: number
  completion_rate: number
  stripe_account_id?: string
  created_at: string
  // joined from profiles
  profiles?: Profile
}

export interface Wallet {
  id: string
  user_id: string
  balance: number  // in tokens (= dollars)
  created_at: string
  updated_at: string
}

export interface FoodListing {
  id: string
  vendor_id: string
  title: string
  description?: string
  category: string
  price_tokens: number
  image_url?: string
  is_available: boolean
  max_daily_orders?: number
  lead_time_hours: number
  dietary_tags: string[]
  offers_pickup: boolean
  offers_delivery: boolean
  delivery_radius_miles?: number
  created_at: string
  // joined
  vendor_profiles?: VendorProfile
}

export interface Order {
  id: string
  buyer_id: string
  vendor_id: string
  listing_id: string
  quantity: number
  price_tokens: number
  platform_fee_tokens: number
  vendor_payout_tokens: number
  fulfillment_type: FulfillmentType
  delivery_address?: string
  special_instructions?: string
  status: OrderStatus
  payment_method: PaymentMethod
  qr_code_token?: string
  otp_code?: string
  otp_expires_at?: string
  verified_at?: string
  verification_method?: VerificationMethod
  dispute_opened_at?: string
  dispute_reason?: string
  created_at: string
  accepted_at?: string
  ready_at?: string
  delivered_at?: string
  // joined
  food_listings?: FoodListing
  profiles?: Profile
  vendor_profiles?: VendorProfile
}

export interface CartItem {
  listing: FoodListing
  quantity: number
  fulfillment_type: FulfillmentType
  delivery_address?: string
  special_instructions?: string
}
