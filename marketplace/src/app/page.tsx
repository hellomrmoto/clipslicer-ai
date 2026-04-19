import Link from 'next/link'

const FEATURES = [
  {
    icon: '🔒',
    title: 'Escrow-protected payments',
    desc: 'Tokens are held in escrow until delivery is confirmed — neither buyer nor vendor can be scammed.',
  },
  {
    icon: '📱',
    title: 'QR & code verification',
    desc: 'Scan a QR code or enter a 6-digit code at handoff. Tokens release only when you confirm receipt.',
  },
  {
    icon: '🏡',
    title: 'Real local cooks',
    desc: 'Every vendor is a real person in your community — verified, rated, and accountable.',
  },
  {
    icon: '💰',
    title: 'Simple token wallet',
    desc: '1 token = $1. Buy with a card, spend on food, cash out anytime. No hidden fees.',
  },
  {
    icon: '⚡',
    title: 'Live order tracking',
    desc: 'Watch your order move from "accepted" to "ready" in real time without refreshing.',
  },
  {
    icon: '🛡️',
    title: '48-hour dispute window',
    desc: 'Something wrong? Open a dispute. A human admin reviews every case fairly.',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create your account', desc: 'Sign up as a buyer in 30 seconds. No credit card required to browse.' },
  { step: '02', title: 'Top up your wallet', desc: 'Buy tokens with a card via Stripe. 1 token = $1, always.' },
  { step: '03', title: 'Order from local cooks', desc: 'Browse listings, pick pickup or delivery, and place your order.' },
  { step: '04', title: 'Confirm at handoff', desc: 'Show your QR code or 6-digit code. Tokens release when you receive your food.' },
]

const VENDOR_PERKS = [
  'No storefront or POS system needed',
  'Set your own prices and schedule',
  'Tokens hit your wallet after every confirmed delivery',
  'Cash out to your bank anytime',
  'Build reputation with ratings and reviews',
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-orange-600 tracking-tight">FoodToken</Link>
        <div className="flex items-center gap-3">
          <Link href="/marketplace" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Browse food</Link>
          <Link href="/auth/vendor/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Vendor login</Link>
          <Link
            href="/auth/buyer/register"
            className="text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-medium"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 bg-gradient-to-b from-orange-50 to-white">
        <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
          Local food marketplace
        </span>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 max-w-3xl leading-tight mb-6">
          Homemade meals from cooks{' '}
          <span className="text-orange-600">in your neighbourhood</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mb-10 leading-relaxed">
          FoodToken connects you with talented local cooks. Every transaction is protected by our verified delivery system — tokens only release when you hold your food.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/marketplace"
            className="bg-orange-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-orange-700 shadow-md shadow-orange-200"
          >
            Browse local food
          </Link>
          <Link
            href="/auth/vendor/register"
            className="border-2 border-orange-600 text-orange-600 px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-orange-50"
          >
            Start selling
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-400">No credit card required · Cancel any time</p>

        {/* Trust bar */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { label: 'Verified vendors', value: '100+' },
            { label: 'Orders protected', value: '2,400+' },
            { label: 'Avg. rating', value: '4.8 ⭐' },
            { label: 'Disputes resolved', value: '99%' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">How it works</h2>
          <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
            From signup to first bite in four simple steps.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white font-bold text-sm flex items-center justify-center">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Built for trust</h2>
          <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
            Every feature was designed to protect both buyers and vendors. No loopholes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-3">
                <span className="text-3xl">{icon}</span>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="bg-orange-600 py-20 px-6 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Turn your kitchen into income</h2>
          <p className="text-orange-100 text-lg mb-8 leading-relaxed">
            Join hundreds of home cooks already earning on FoodToken. List your first item in under 5 minutes.
          </p>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-orange-100 mb-10">
            {VENDOR_PERKS.map(perk => (
              <li key={perk} className="flex items-center gap-2">
                <span className="text-orange-300">✓</span> {perk}
              </li>
            ))}
          </ul>
          <Link
            href="/auth/vendor/register"
            className="inline-block bg-white text-orange-600 px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-orange-50 shadow-lg"
          >
            Create your vendor account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-white font-bold text-lg">FoodToken</span>
          <div className="flex gap-6 text-sm">
            <Link href="/marketplace" className="hover:text-white">Marketplace</Link>
            <Link href="/auth/vendor/register" className="hover:text-white">Sell food</Link>
            <Link href="/auth/buyer/login" className="hover:text-white">Sign in</Link>
          </div>
          <p className="text-xs text-gray-500">© 2026 FoodToken. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
