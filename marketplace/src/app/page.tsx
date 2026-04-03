import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-orange-600">FoodToken</span>
        <div className="flex gap-4">
          <Link href="/auth/buyer/login" className="text-sm text-gray-600 hover:text-gray-900">
            Sign in as Buyer
          </Link>
          <Link
            href="/auth/vendor/register"
            className="text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            Sell Food
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Local food, <span className="text-orange-600">real community</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mb-8">
          Buy homemade meals from local cooks. Pay with tokens. Every delivery is verified — no scams, ever.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/marketplace"
            className="bg-orange-600 text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-orange-700"
          >
            Browse Food
          </Link>
          <Link
            href="/auth/vendor/register"
            className="border border-orange-600 text-orange-600 px-8 py-3 rounded-xl text-lg font-medium hover:bg-orange-50"
          >
            Start Selling
          </Link>
        </div>
      </main>

      {/* How it works */}
      <section className="bg-white py-16 px-6">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How it works</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { step: '1', title: 'Buy tokens', desc: '1 token = $1. Purchase securely via Stripe.' },
            { step: '2', title: 'Order food', desc: 'Browse local cooks and order your favorites.' },
            { step: '3', title: 'Verify & enjoy', desc: 'Scan QR or enter your code at pickup/delivery.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 font-bold text-xl flex items-center justify-center">
                {step}
              </div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-100">
        FoodToken Marketplace — connecting local cooks with their community
      </footer>
    </div>
  )
}
