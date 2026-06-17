import { prisma } from '@/lib/prisma'
import CouponCard from '@/components/CouponCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STORE_LABELS: Record<string, string> = {
  shopee: 'Shopee',
  amazon: 'Amazon',
  mercadolivre: 'Mercado Livre',
  magalu: 'Magalu',
}

const STORE_COLORS: Record<string, string> = {
  shopee: 'border-orange-500',
  amazon: 'border-amber-500',
  mercadolivre: 'border-yellow-500',
  magalu: 'border-blue-500',
}

export default async function CuponsPage({
  searchParams,
}: {
  searchParams: Promise<{ loja?: string }>
}) {
  const params = await searchParams
  const activeFilter = params.loja || null

  // Buscar cupons ativos, opcionalmente filtrados por loja
  const where: Record<string, unknown> = { isActive: true }
  if (activeFilter) where.provider = activeFilter

  const coupons = await prisma.coupon.findMany({
    where: where as any,
    orderBy: [{ provider: 'asc' }, { createdAt: 'desc' }],
  })

  // Agrupar por loja
  const grouped: Record<string, typeof coupons> = {}
  for (const c of coupons) {
    if (!grouped[c.provider]) grouped[c.provider] = []
    grouped[c.provider].push(c)
  }

  // Lojas disponíveis
  const availableStores = Object.keys(STORE_LABELS)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="gradient-primary text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            🎫 Cupons de Desconto
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            Copie o código, vá para a loja e economize na sua compra!
          </p>
        </div>
      </section>

      {/* Filtro por loja */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/cupons"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !activeFilter
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            Todas as lojas
          </Link>
          {availableStores.map((store) => (
            <Link
              key={store}
              href={`/cupons?loja=${store}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                activeFilter === store
                  ? `${STORE_COLORS[store]} bg-white text-slate-800`
                  : 'border-transparent bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {STORE_LABELS[store]}
            </Link>
          ))}
        </div>
      </section>

      {/* Grid de cupons (agrupados por loja) */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        {coupons.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🎫</p>
            <p className="text-xl font-semibold text-slate-700 mb-2">
              Nenhum cupom encontrado
            </p>
            <p className="text-slate-500 mb-6">
              {activeFilter
                ? `Não há cupons ativos para ${STORE_LABELS[activeFilter]} no momento.`
                : 'Estamos atualizando nossa base de cupons. Volte em instantes!'}
            </p>
            {activeFilter && (
              <Link
                href="/cupons"
                className="text-primary font-medium hover:underline"
              >
                ← Ver cupons de todas as lojas
              </Link>
            )}
          </div>
        ) : activeFilter ? (
          // Visão filtrada: grid simples
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {coupons.map((c) => (
              <CouponCard key={c.id} coupon={c} />
            ))}
          </div>
        ) : (
          // Visão agrupada por loja
          <div className="space-y-10">
            {Object.entries(grouped).map(([provider, storeCoupons]) => (
              <div key={provider}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-slate-900">
                    {STORE_LABELS[provider] ?? provider}
                  </h2>
                  <span className="text-sm text-slate-500">
                    {storeCoupons.length} cupom(ns)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {storeCoupons.map((c) => (
                    <CouponCard key={c.id} coupon={c} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="gradient-primary rounded-3xl p-10 md:p-12 text-center text-white">
          <h2 className="text-2xl font-extrabold mb-3">
            Sempre tem cupom novo! 🔔
          </h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Nossos robôs buscam cupons atualizados todos os dias. Volte sempre para economizar mais!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-colors"
          >
            Ver ofertas em destaque →
          </Link>
        </div>
      </section>
    </div>
  )
}
