'use client'

import { useState } from 'react'
import { clsx } from 'clsx'

interface SideDrawerProps {
  role: 'vendor' | 'buyer'
}

export default function SideDrawer({ role }: SideDrawerProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'orders' | 'tips'>('orders')

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-orange-600 text-white rounded-l-xl px-2 py-4 shadow-lg hover:bg-orange-700 transition-colors"
        aria-label={open ? 'Close panel' : 'Open panel'}
      >
        <span className="[writing-mode:vertical-lr] text-xs font-medium tracking-wide">
          {open ? '▶ Close' : '◀ Live'}
        </span>
      </button>

      {/* Drawer */}
      <aside
        className={clsx(
          'fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-30 flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Live Panel</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['orders', 'tips'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex-1 py-2 text-sm font-medium capitalize transition-colors',
                activeTab === tab
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab === 'orders' ? (role === 'vendor' ? 'Incoming' : 'My Orders') : 'Tips'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-400 text-center mt-4">
                {role === 'vendor'
                  ? 'New orders will appear here in real time'
                  : 'Your active orders will appear here'}
              </p>
              {/* Real-time order cards will be injected here via Supabase Realtime */}
            </div>
          )}
          {activeTab === 'tips' && (
            <ul className="flex flex-col gap-3 mt-2">
              {role === 'vendor' ? (
                <>
                  <TipCard tip="Always confirm orders within 30 minutes to keep your completion rate high." />
                  <TipCard tip="Add photos to your listings — vendors with photos get 3× more orders." />
                  <TipCard tip="Scan the buyer QR code at handoff to instantly release your tokens." />
                </>
              ) : (
                <>
                  <TipCard tip="Your tokens are held safely in escrow until you receive your food." />
                  <TipCard tip="Show your QR code to the vendor at pickup or delivery." />
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
    <li className="bg-orange-50 rounded-xl p-3 text-sm text-orange-900 border border-orange-100">
      {tip}
    </li>
  )
}
