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

  const navLinks = [
    { href: '/marketplace', label: 'Browse Food' },
    { href: '/buyer/dashboard', label: 'My Orders' },
    { href: '/buyer/dashboard/wallet', label: 'Wallet' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#080808]">
      <header className="bg-[#080808] border-b border-gray-900 px-6 py-4 flex items-center justify-between">
        <Link href="/marketplace" className="text-xl font-black text-white tracking-tight">PLATE</Link>
        <div className="flex items-center gap-4">
          <Link href="/buyer/dashboard/wallet"
            className="text-sm bg-gray-900 border border-gray-800 text-white px-3 py-1.5 rounded-lg font-bold hover:border-gray-700 transition-colors">
            {wallet?.balance ?? 0} tokens
          </Link>
          <span className="text-sm text-gray-500">{profile?.full_name}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="text-sm text-gray-600 hover:text-white transition-colors">Sign out</button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-48 border-r border-gray-900 py-6 px-3 flex flex-col gap-1 shrink-0">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className="px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-900 hover:text-white transition-colors font-medium">
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
