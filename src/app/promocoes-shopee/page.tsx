import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import OfferCard from '@/components/OfferCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Promoções Shopee Hoje — Cupons e Ofertas com Desconto',
  description: 'As melhores promoções da Shopee Brasil. Produtos baratos, cupons de desconto e ofertas relâmpago. Economize na Shopee!',
  alternates: { canonical: '/promocoes-shopee' },
  openGraph: {
    title: 'Promoções Shopee Hoje | Ofertafy',
    description: 'Ofertas da Shopee com preços imperdíveis.',
    url: '/promocoes-shopee',
  },
}

export default async function PromocoesShopeePage() {
  const ofertas = await prisma.offer.findMany({
    where: { store: 'shopee', price: { gt: 0 } },
    orderBy: { discountPct: 'desc' },
    take: 48,
  })

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Promoções Shopee' }]} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">🔴 Promoções Shopee Hoje</h1>
        <p className="text-slate-500 mb-6">As melhores ofertas da Shopee Brasil. Preços baixos, cupons e frete grátis.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          {ofertas.map((o) => <OfferCard key={o.id} offer={o} />)}
        </div>
        <div className="text-center mt-8 space-x-4">
          <Link href="/loja/shopee" className="text-sm text-primary hover:underline">Todas as ofertas da Shopee →</Link>
          <Link href="/" className="text-sm text-slate-400 hover:underline">← Página inicial</Link>
        </div>
      </div>
    </div>
  )
}
