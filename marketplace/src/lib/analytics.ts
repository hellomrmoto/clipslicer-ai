import { SupabaseClient } from '@supabase/supabase-js'

export interface WeeklyPoint extends Record<string, string | number> {
  week: string
  tokens: number
}

export interface WeeklyCountPoint extends Record<string, string | number> {
  week: string
  count: number
}

/** Returns last N Monday-anchored week labels */
function getWeekLabels(n: number): { label: string; start: Date; end: Date }[] {
  const weeks = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now)
    start.setDate(now.getDate() - i * 7 - now.getDay())
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weeks.push({ label, start, end })
  }
  return weeks
}

/** Weekly vendor earnings from escrow_release transactions */
export async function getWeeklyEarnings(
  supabase: SupabaseClient,
  vendorId: string,
  weeks = 8
): Promise<WeeklyPoint[]> {
  const weekLabels = getWeekLabels(weeks)
  const since = weekLabels[0].start.toISOString()

  const { data } = await supabase
    .from('wallet_transactions')
    .select('amount_tokens, created_at')
    .eq('user_id', vendorId)
    .eq('type', 'escrow_release')
    .gte('created_at', since)

  return weekLabels.map(({ label, start, end }) => ({
    week: label,
    tokens: (data ?? [])
      .filter(tx => new Date(tx.created_at) >= start && new Date(tx.created_at) < end)
      .reduce((sum, tx) => sum + (tx.amount_tokens ?? 0), 0),
  }))
}

/** Weekly order count for a vendor */
export async function getWeeklyOrders(
  supabase: SupabaseClient,
  vendorId: string,
  weeks = 8
): Promise<WeeklyCountPoint[]> {
  const weekLabels = getWeekLabels(weeks)
  const since = weekLabels[0].start.toISOString()

  const { data } = await supabase
    .from('orders')
    .select('created_at')
    .eq('vendor_id', vendorId)
    .gte('created_at', since)

  return weekLabels.map(({ label, start, end }) => ({
    week: label,
    count: (data ?? []).filter(
      o => new Date(o.created_at) >= start && new Date(o.created_at) < end
    ).length,
  }))
}

/** Weekly platform revenue (platform_fee_tokens) from delivered orders */
export async function getWeeklyRevenue(
  supabase: SupabaseClient,
  weeks = 8
): Promise<WeeklyPoint[]> {
  const weekLabels = getWeekLabels(weeks)
  const since = weekLabels[0].start.toISOString()

  const { data } = await supabase
    .from('orders')
    .select('platform_fee_tokens, delivered_at')
    .eq('status', 'delivered')
    .gte('delivered_at', since)

  return weekLabels.map(({ label, start, end }) => ({
    week: label,
    tokens: (data ?? [])
      .filter(o => o.delivered_at && new Date(o.delivered_at) >= start && new Date(o.delivered_at) < end)
      .reduce((sum, o) => sum + (o.platform_fee_tokens ?? 0), 0),
  }))
}

/** Weekly new user signups */
export async function getWeeklySignups(
  supabase: SupabaseClient,
  weeks = 8
): Promise<WeeklyCountPoint[]> {
  const weekLabels = getWeekLabels(weeks)
  const since = weekLabels[0].start.toISOString()

  const { data } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', since)

  return weekLabels.map(({ label, start, end }) => ({
    week: label,
    count: (data ?? []).filter(
      p => new Date(p.created_at) >= start && new Date(p.created_at) < end
    ).length,
  }))
}
