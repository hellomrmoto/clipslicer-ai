'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface LiveOrder {
  id: string
  status: string
  created_at: string
  food_listings?: { title: string } | null
}

interface SideDrawerProps {
  role: 'vendor' | 'buyer'
  userId?: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-900 text-yellow-400',
  accepted: 'bg-blue-900 text-blue-400',
  preparing: 'bg-blue-900 text-blue-400',
  ready: 'bg-purple-900 text-purple-400',
  delivered: 'bg-green-900 text-green-400',
  disputed: 'bg-red-900 text-red-400',
  cancelled: 'bg-gray-800 text-gray-500',
}

export default function SideDrawer({ role, userId }: SideDrawerProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'orders' | 'tips'>('orders')
  const [orders, setOrders] = useState<LiveOrder[]>([])
  const [newOrderPulse, setNewOrderPulse] = useState(false)

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const filterCol = role === 'vendor' ? 'vendor_id' : 'buyer_id'
    const activeStatuses = ['pending', 'accepted', 'preparing', 'ready']

    supabase
      .from('orders')
      .select('id, status, created_at, food_listings(title)')
      .eq(filterCol, userId)
      .in('status', activeStatuses)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          const normalized = data.map(o => ({
            ...o,
            food_listings: Array.isArray(o.food_listings) ? o.food_listings[0] ?? null : o.food_listings,
          })) as LiveOrder[]
          setOrders(normalized)
        }
      })

    const channel = supabase
      .channel(`drawer-orders-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `${filterCol}=eq.${userId}` },
        payload => {
          const updated = payload.new as LiveOrder & { [key: string]: unknown }
          setOrders(prev => {
            const exists = prev.find(o => o.id === updated.id)
            if (!exists && activeStatuses.includes(updated.status)) {
              setNewOrderPulse(true)
              setTimeout(() => setNewOrderPulse(false), 3000)
              return [updated, ...prev].slice(0, 10)
            }
            if (!activeStatuses.includes(updated.status)) return prev.filter(o => o.id !== updated.id)
            return prev.map(o => o.id === updated.id ? { ...o, ...updated } : o)
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, role])

  const orderDetailBase = role === 'vendor' ? '/vendor/dashboard/orders' : '/buyer/dashboard'

  return (
    <>
      <button
        onClick={() => setOpen(prev => !prev)}
        className={clsx(
          'fixed right-0 top-1/2 -translate-y-1/2 z-40 text-white rounded-l-xl px-2 py-4 shadow-lg transition-colors',
          newOrderPulse ? 'bg-yellow-600 animate-pulse' : 'bg-red-600 hover:bg-red-700'
        )}
        aria-label={open ? 'Close panel' : 'Open panel'}
      >
        <span className="[writing-mode:vertical-lr] text-xs font-bold tracking-widest uppercase">
          {open ? '▶ Close' : `◀ Live${orders.length > 0 ? ` (${orders.length})` : ''}`}
        </span>
      </button>

      <aside
        className={clsx(
          'fixed right-0 top-0 h-full w-80 bg-[#080808] border-l border-gray-800 shadow-2xl z-30 flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <h2 className="font-bold text-white uppercase tracking-widest text-xs">Live Panel</h2>
          <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="flex border-b border-gray-800">
          {(['orders', 'tips'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors',
                activeTab === tab ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {tab === 'orders'
                ? `${role === 'vendor' ? 'Incoming' : 'My Orders'}${orders.length > 0 ? ` (${orders.length})` : ''}`
                : 'Tips'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-3">
              {orders.length === 0 ? (
                <p className="text-xs text-gray-600 text-center mt-8">
                  {role === 'vendor' ? 'New orders will appear here in real time' : 'Your active orders will appear here'}
                </p>
              ) : (
                orders.map(order => (
                  <Link key={order.id} href={orderDetailBase}>
                    <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 hover:border-red-800 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white flex-1 truncate">
                          {order.food_listings?.title ?? 'Order'}
                        </p>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-bold capitalize shrink-0 uppercase tracking-wide', STATUS_COLORS[order.status] ?? 'bg-gray-800 text-gray-500')}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'tips' && (
            <ul className="flex flex-col gap-3 mt-2">
              {role === 'vendor' ? (
                <>
                  <TipCard tip="Confirm orders within 30 minutes to keep your completion rate high." />
                  <TipCard tip="Add photos to your listings — vendors with photos get 3× more orders." />
                  <TipCard tip="Ask for the 6-digit code or scan the buyer's QR at handoff to release tokens." />
                </>
              ) : (
                <>
                  <TipCard tip="Your tokens are held safely in escrow until you receive your food." />
                  <TipCard tip="Show your QR code or delivery code to the vendor at pickup or delivery." />
                  <TipCard tip="You have 48 hours to dispute an order if something goes wrong." />
                </>
              )}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}

function TipCard({ tip }: { tip: string }) {
  return (
    <li className="bg-gray-900 rounded-xl p-3 text-sm text-gray-400 border border-gray-800">
      {tip}
    </li>
  )
}
