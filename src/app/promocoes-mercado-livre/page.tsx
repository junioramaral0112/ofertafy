import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import OfferCard from '@/components/OfferCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Promoções Mercado Livre Hoje — Ofertas com Frete Grátis',
  description: 'As melhores promoções do Mercado Livre hoje. Produtos com frete grátis, desconto real e entrega rápida. Confira as ofertas!',
  alternates: { canonical: '/promocoes-mercado-livre' },
  openGraph: {
    title: 'Promoções Mercado Livre Hoje | Ofertafy',
    description: 'Ofertas do Mercado Livre com os maiores descontos.',
    url: '/promocoes-mercado-livre',
  },
}

export default async function PromocoesMLPage() {
  const ofertas = await prisma.offer.findMany({
    where: { store: 'mercadolivre', price: { gt: 0 } },
    orderBy: { discountPct: 'desc' },
    take: 48,
  })

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Promoções Mercado Livre' }]} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">🟡 Promoções Mercado Livre Hoje</h1>
        <p className="text-slate-500 mb-6">As melhores ofertas do Mercado Livre. Frete grátis, entrega rápida e descontos exclusivos.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          {ofertas.map((o) => <OfferCard key={o.id} offer={o} />)}
        </div>
        <div className="text-center mt-8 space-x-4">
          <Link href="/loja/mercadolivre" className="text-sm text-primary hover:underline">Todas as ofertas do ML →</Link>
          <Link href="/" className="text-sm text-slate-400 hover:underline">← Página inicial</Link>
        </div>
      </div>
    </div>
  )
}
