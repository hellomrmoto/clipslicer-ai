import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SideDrawer from '@/components/layout/SideDrawer'

export default async function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/buyer/login')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role === 'vendor') redirect('/vendor/dashboard')

  const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/marketplace" className="text-xl font-bold text-orange-600">FoodToken</Link>
        <div className="flex items-center gap-4">
          <Link href="/buyer/dashboard/wallet"
            className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium">
            {wallet?.balance ?? 0} tokens
          </Link>
          <span className="text-sm text-gray-600">{profile?.full_name}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="text-sm text-gray-400 hover:text-gray-700">Sign out</button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-48 bg-white border-r border-gray-200 py-6 px-4 flex flex-col gap-1">
          {[
            { href: '/marketplace', label: 'Browse Food' },
            { href: '/buyer/dashboard', label: 'My Orders' },
            { href: '/buyer/dashboard/wallet', label: 'Wallet' },
          ].map(link => (
            <Link key={link.href} href={link.href}
              className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors">
              {link.label}
            </Link>
          ))}
        </aside>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 p-6 overflow-auto">{children}</main>
          <SideDrawer role="buyer" userId={user.id} />
        </div>
      </div>
    </div>
  )
}
