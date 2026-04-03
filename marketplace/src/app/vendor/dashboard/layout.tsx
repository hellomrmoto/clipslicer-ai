import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SideDrawer from '@/components/layout/SideDrawer'

const navLinks = [
  { href: '/vendor/dashboard', label: 'Overview' },
  { href: '/vendor/dashboard/orders', label: 'Orders' },
  { href: '/vendor/dashboard/listings', label: 'My Menu' },
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
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-orange-600">FoodToken</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{profile.full_name}</span>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-sm text-gray-400 hover:text-gray-700">Sign out</button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 py-6 px-4 flex flex-col gap-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Vendor Panel</p>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </aside>

        {/* Main content + eye-frame side drawer */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 p-6 overflow-auto">{children}</main>
          <SideDrawer role="vendor" />
        </div>
      </div>
    </div>
  )
}
