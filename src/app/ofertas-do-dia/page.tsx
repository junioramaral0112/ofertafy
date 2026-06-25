import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import OfferCard from '@/components/OfferCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ofertas do Dia — Melhores Promoções Atualizadas Hoje',
  description: 'Confira as melhores ofertas do dia no Mercado Livre, Amazon, Shopee e Magalu. Preços atualizados com descontos de até 90% OFF. Economize agora!',
  alternates: { canonical: '/ofertas-do-dia' },
  openGraph: {
    title: 'Ofertas do Dia — Melhores Promoções Atualizadas',
    description: 'As melhores ofertas de hoje reunidas em um só lugar.',
    url: '/ofertas-do-dia',
  },
}

export default async function OfertasDoDiaPage() {
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1)

  const ofertas = await prisma.offer.findMany({
    where: { price: { gt: 0 }, discountPct: { gte: 15 } },
    orderBy: { discountPct: 'desc' },
    take: 48,
  })

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Ofertas do Dia' }]} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">⚡ Ofertas do Dia</h1>
        <p className="text-slate-500 mb-6">As melhores promoções de hoje reunidas em um só lugar. Preços atualizados em tempo real.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          {ofertas.map((o) => <OfferCard key={o.id} offer={o} />)}
        </div>
        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-primary hover:underline">← Ver mais ofertas na página inicial</Link>
        </div>
      </div>
    </div>
  )
}
