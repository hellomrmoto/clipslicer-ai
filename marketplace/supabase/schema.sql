-- ============================================================
-- FoodToken Marketplace — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'vendor', 'admin')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VENDOR PROFILES
-- ============================================================
CREATE TABLE vendor_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  bio TEXT,
  food_specialty TEXT,
  location_zone TEXT,
  banner_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 100,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TOKEN WALLETS
-- ============================================================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),  -- stored in cents (tokens * 100)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- FOOD LISTINGS
-- ============================================================
CREATE TABLE food_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_tokens INT NOT NULL CHECK (price_tokens > 0),  -- 1 token = $1
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  max_daily_orders INT,
  lead_time_hours INT DEFAULT 24,
  dietary_tags TEXT[] DEFAULT '{}',
  offers_pickup BOOLEAN DEFAULT TRUE,
  offers_delivery BOOLEAN DEFAULT FALSE,
  delivery_radius_miles NUMERIC(4,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id),
  listing_id UUID NOT NULL REFERENCES food_listings(id),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_tokens INT NOT NULL,          -- total tokens for this order
  platform_fee_tokens INT NOT NULL,   -- platform cut (10%)
  vendor_payout_tokens INT NOT NULL,  -- vendor receives this amount
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('pickup', 'delivery')),
  delivery_address TEXT,
  special_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'preparing', 'ready', 'delivered', 'disputed', 'cancelled', 'refunded')
  ),
  payment_method TEXT NOT NULL DEFAULT 'tokens' CHECK (payment_method IN ('tokens', 'cash')),
  -- Verification fields
  qr_code_token TEXT UNIQUE,          -- signed token embedded in QR
  otp_code TEXT,                      -- 6-digit fallback code
  otp_expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verification_method TEXT CHECK (verification_method IN ('qr', 'otp', 'admin')),
  -- Dispute
  dispute_opened_at TIMESTAMPTZ,
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolution TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- ============================================================
-- ESCROW LEDGER
-- ============================================================
CREATE TABLE escrow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id),
  amount_tokens INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
  held_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  UNIQUE(order_id)
);

-- ============================================================
-- WALLET TRANSACTIONS (audit trail)
-- ============================================================
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN (
    'token_purchase', 'order_payment', 'escrow_hold',
    'escrow_release', 'escrow_refund', 'cashout', 'platform_fee'
  )),
  amount_tokens INT NOT NULL,   -- positive = credit, negative = debit
  order_id UUID REFERENCES orders(id),
  stripe_payment_intent_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RATINGS & REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, only update their own
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Vendor profiles: public read, vendor updates own
CREATE POLICY "Vendor profiles are public" ON vendor_profiles FOR SELECT USING (true);
CREATE POLICY "Vendors update own profile" ON vendor_profiles FOR UPDATE USING (auth.uid() = id);

-- Wallets: users see only their own
CREATE POLICY "Users see own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages wallets" ON wallets FOR ALL USING (auth.role() = 'service_role');

-- Food listings: public read, vendor manages own
CREATE POLICY "Listings are public" ON food_listings FOR SELECT USING (true);
CREATE POLICY "Vendors manage own listings" ON food_listings FOR ALL USING (auth.uid() = vendor_id);

-- Orders: buyer or vendor can see their own orders
CREATE POLICY "Order parties can view" ON orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = vendor_id);
CREATE POLICY "Service role manages orders" ON orders FOR ALL USING (auth.role() = 'service_role');

-- Escrow: only service role
CREATE POLICY "Service role manages escrow" ON escrow FOR ALL USING (auth.role() = 'service_role');

-- Wallet transactions: users see own
CREATE POLICY "Users see own transactions" ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Service role manages transactions" ON wallet_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- Reviews: public read
CREATE POLICY "Reviews are public" ON reviews FOR SELECT USING (true);
CREATE POLICY "Buyers create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- ============================================================
-- FUNCTION: auto-create wallet + profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Profile is created via app code with role info
  -- Wallet is auto-created when profile is inserted
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: create wallet when profile is created
CREATE OR REPLACE FUNCTION create_wallet_for_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance) VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_wallet_for_profile();

-- ============================================================
-- FUNCTION: update vendor avg rating
-- ============================================================
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendor_profiles
  SET avg_rating = (
    SELECT ROUND(AVG(rating)::NUMERIC, 2)
    FROM reviews
    WHERE vendor_id = NEW.vendor_id
  )
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_vendor_rating();
