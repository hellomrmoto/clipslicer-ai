import { createClient as createServerClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Uses service role to bypass RLS for initial profile creation
function getServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password, full_name, phone, role, business_name, food_specialty, location_zone } = body

  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 400 })
  }

  const userId = authData.user.id

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    role,
    full_name,
    email,
    phone: phone || null,
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Create vendor profile if role is vendor
  if (role === 'vendor') {
    const { error: vendorError } = await supabase.from('vendor_profiles').insert({
      id: userId,
      business_name: business_name || full_name,
      food_specialty: food_specialty || null,
      location_zone: location_zone || null,
    })

    if (vendorError) {
      return NextResponse.json({ error: vendorError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, userId })
}
