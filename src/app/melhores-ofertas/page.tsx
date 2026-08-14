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

export default async function MelhoresOfertasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const min = typeof sp.min === 'string' && sp.min !== '' ? parseFloat(sp.min) : undefined
  const max = typeof sp.max === 'string' && sp.max !== '' ? parseFloat(sp.max) : undefined

  // Filtro de faixa de preço (CTA dos blocos da Home)
  const priceWhere: Record<string, number> = { gt: 0 }
  if (min !== undefined && !isNaN(min)) priceWhere.gte = min
  if (max !== undefined && !isNaN(max)) priceWhere.lte = max

  const ofertas = await prisma.offer.findMany({
    where: { price: priceWhere, discountPct: { gte: 20 } },
    orderBy: [{ discountPct: 'desc' }, { clicks: 'desc' }],
    take: 48,
  })

  const faixaTitulo =
    min !== undefined && max !== undefined ? `de R$ ${min} a R$ ${max}` :
    min !== undefined ? `acima de R$ ${min}` :
    max !== undefined ? `até R$ ${max}` : null

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Melhores Ofertas' }]} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
          {faixaTitulo ? `💰 Ofertas ${faixaTitulo}` : '🏆 Melhores Ofertas da Semana'}
        </h1>
        <p className="text-slate-500 mb-6">
          {faixaTitulo
            ? `Seleção das ofertas ${faixaTitulo} com os maiores descontos. Produtos verificados e preços atualizados.`
            : 'Seleção das ofertas com os maiores descontos. Produtos verificados e preços atualizados.'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          {ofertas.map((o) => <OfferCard key={o.id} offer={o} />)}
        </div>
        {ofertas.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Nenhuma oferta encontrada nessa faixa de preço.
            <div className="mt-2">
              <Link href="/melhores-ofertas" className="text-sm text-primary hover:underline">Ver todas as melhores ofertas →</Link>
            </div>
          </div>
        )}
        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-primary hover:underline">← Ver mais ofertas na página inicial</Link>
        </div>
      </div>
    </div>
  )
}
