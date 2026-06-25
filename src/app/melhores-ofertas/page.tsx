import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import OfferCard from '@/components/OfferCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Melhores Ofertas da Semana — Descontos de até 90% OFF',
  description: 'As melhores ofertas da semana selecionadas a dedo. Smartphones, TVs, notebooks, eletrodomésticos e muito mais com os maiores descontos.',
  alternates: { canonical: '/melhores-ofertas' },
  openGraph: {
    title: 'Melhores Ofertas da Semana | Ofertafy',
    description: 'Seleção semanal das ofertas mais quentes.',
    url: '/melhores-ofertas',
  },
}

export default async function MelhoresOfertasPage() {
  const semana = new Date(); semana.setDate(semana.getDate() - 7)

  const ofertas = await prisma.offer.findMany({
    where: { price: { gt: 0 }, discountPct: { gte: 20 } },
    orderBy: [{ discountPct: 'desc' }, { clicks: 'desc' }],
    take: 48,
  })

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Melhores Ofertas' }]} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">🏆 Melhores Ofertas da Semana</h1>
        <p className="text-slate-500 mb-6">Seleção das ofertas com os maiores descontos. Produtos verificados e preços atualizados.</p>
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
