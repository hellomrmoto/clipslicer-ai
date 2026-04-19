import Link from 'next/link'

const FEATURES = [
  { icon: '🔒', title: 'Escrow-protected', desc: 'Tokens lock in escrow on order. Release only on confirmed delivery.' },
  { icon: '📱', title: 'QR & code verify', desc: 'Scan a QR or enter a 6-digit code at handoff. Zero trust required.' },
  { icon: '🏡', title: 'Real local cooks', desc: 'Every vendor is verified, rated, and accountable to their community.' },
  { icon: '💰', title: 'Simple tokens', desc: '1 token = $1. Buy, spend, cash out. No hidden fees ever.' },
  { icon: '⚡', title: 'Live order tracking', desc: 'Watch your order status update in real time — no refresh needed.' },
  { icon: '🛡️', title: '48hr dispute window', desc: 'Something wrong? A human admin reviews every case, fairly.' },
]

const STEPS = [
  { n: '01', title: 'Create your account', desc: 'Sign up as a buyer in 30 seconds.' },
  { n: '02', title: 'Top up your wallet', desc: 'Buy tokens with a card via Stripe. 1 token = $1.' },
  { n: '03', title: 'Order from local cooks', desc: 'Browse listings, pick pickup or delivery.' },
  { n: '04', title: 'Confirm at handoff', desc: 'Show QR or code. Tokens release when you get your food.' },
]

const VENDOR_PERKS = [
  'No storefront or POS needed',
  'Set your own prices and hours',
  'Tokens paid out after every delivery',
  'Cash out to bank anytime',
  'Build ratings and grow your base',
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080808]">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-[#080808]/90 backdrop-blur border-b border-gray-900 px-6 py-4 flex items-center justify-between">
        <span className="text-2xl font-black text-white tracking-tight">PLATE</span>
        <div className="flex items-center gap-4">
          <Link href="/marketplace" className="text-sm text-gray-400 hover:text-white font-medium transition-colors">Browse food</Link>
          <Link href="/auth/vendor/login" className="text-sm text-gray-400 hover:text-white font-medium transition-colors">Vendor login</Link>
          <Link href="/auth/buyer/register"
            className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold uppercase tracking-wide transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-transparent pointer-events-none" />
        <span className="inline-block border border-red-800 text-red-400 text-xs font-bold px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase">
          Local food marketplace
        </span>
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white max-w-4xl leading-none mb-8 tracking-tight">
          THE ART OF<br />
          <span className="text-red-500">LOCAL FOOD.</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mb-12 leading-relaxed">
          PLATE connects you with talented local cooks. Every transaction is protected — tokens only release when you hold your food.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/marketplace"
            className="bg-red-600 text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-colors">
            Browse the menu
          </Link>
          <Link href="/auth/vendor/register"
            className="border border-gray-700 text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-colors">
            Start selling
          </Link>
        </div>

        {/* Trust stats */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 w-full max-w-2xl">
          {[
            { value: '100+', label: 'Verified vendors' },
            { value: '2,400+', label: 'Orders protected' },
            { value: '4.8 ★', label: 'Average rating' },
            { value: '99%', label: 'Disputes resolved' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-black text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-gray-900">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">Process</p>
          <h2 className="text-4xl font-black text-white mb-16">HOW IT WORKS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col gap-4">
                <div className="text-5xl font-black text-gray-800">{n}</div>
                <h3 className="font-black text-white text-lg uppercase tracking-tight">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-gray-900 bg-gray-950/50">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">Built for trust</p>
          <h2 className="text-4xl font-black text-white mb-16">ZERO LOOPHOLES.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3 hover:border-gray-700 transition-colors">
                <span className="text-3xl">{icon}</span>
                <h3 className="font-black text-white uppercase tracking-tight">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="py-24 px-6 border-t border-gray-900">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">For cooks</p>
            <h2 className="text-5xl font-black text-white leading-none mb-6">TURN YOUR KITCHEN INTO INCOME.</h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              List your first item in under 5 minutes. Join hundreds of home cooks already earning on PLATE.
            </p>
            <Link href="/auth/vendor/register"
              className="inline-block bg-red-600 text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-colors">
              Create vendor account
            </Link>
          </div>
          <ul className="flex flex-col gap-4">
            {VENDOR_PERKS.map(perk => (
              <li key={perk} className="flex items-center gap-4 text-gray-300">
                <span className="w-6 h-6 rounded-full bg-red-900 text-red-400 flex items-center justify-center text-xs font-black shrink-0">✓</span>
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xl font-black text-white">PLATE</span>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <Link href="/auth/vendor/register" className="hover:text-white transition-colors">Sell food</Link>
            <Link href="/auth/buyer/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
          <p className="text-xs text-gray-700">© 2026 PLATE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
