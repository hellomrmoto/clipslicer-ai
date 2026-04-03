import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/vendor/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold">FoodToken Admin</span>
        <div className="flex gap-6 text-sm">
          <Link href="/admin" className="hover:text-orange-400">Overview</Link>
          <Link href="/admin/disputes" className="hover:text-orange-400">Disputes</Link>
          <Link href="/admin/vendors" className="hover:text-orange-400">Vendors</Link>
        </div>
      </header>
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  )
}
