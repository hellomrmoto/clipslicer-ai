import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SideDrawer from '@/components/layout/SideDrawer'

const navLinks = [
  { href: '/vendor/dashboard', label: 'Overview' },
  { href: '/vendor/dashboard/orders', label: 'Orders' },
  { href: '/vendor/dashboard/listings', label: 'My Menu' },
  { href: '/vendor/dashboard/wallet', label: 'Wallet' },
  { href: '/vendor/dashboard/profile', label: 'Profile' },
]

export default async function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/vendor/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'vendor') redirect('/marketplace')

  return (
    <div className="min-h-screen flex flex-col bg-[#080808]">
      <header className="bg-[#080808] border-b border-gray-900 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-white tracking-tight">PLATE</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{profile.full_name}</span>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-sm text-gray-600 hover:text-white transition-colors">Sign out</button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-52 border-r border-gray-900 py-6 px-3 flex flex-col gap-1 shrink-0">
          <p className="text-xs font-black text-gray-700 uppercase tracking-widest mb-4 px-3">Vendor Panel</p>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className="px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-900 hover:text-white transition-colors font-medium">
              {link.label}
            </Link>
          ))}
        </aside>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 p-6 overflow-auto">{children}</main>
          <SideDrawer role="vendor" userId={user.id} />
        </div>
      </div>
    </div>
  )
}
