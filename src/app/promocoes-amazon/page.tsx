import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import OfferCard from '@/components/OfferCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Promoções Amazon Hoje — Ofertas e Descontos Atualizados',
  description: 'As melhores promoções da Amazon Brasil hoje. Eletrônicos, livros, casa, beleza e muito mais com descontos exclusivos. Links de afiliado atualizados.',
  alternates: { canonical: '/promocoes-amazon' },
  openGraph: {
    title: 'Promoções Amazon Hoje | Ofertafy',
    description: 'Ofertas exclusivas da Amazon Brasil atualizadas em tempo real.',
    url: '/promocoes-amazon',
  },
}

export default async function PromocoesAmazonPage() {
  const ofertas = await prisma.offer.findMany({
    where: { store: 'amazon', price: { gt: 0 } },
    orderBy: { discountPct: 'desc' },
    take: 48,
  })

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Promoções Amazon' }]} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">🟠 Promoções Amazon Hoje</h1>
        <p className="text-slate-500 mb-6">As melhores ofertas da Amazon Brasil. Frete grátis para Prime e preços com desconto real.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          {ofertas.map((o) => <OfferCard key={o.id} offer={o} />)}
        </div>
        <div className="text-center mt-8 space-x-4">
          <Link href="/loja/amazon" className="text-sm text-primary hover:underline">Todas as ofertas da Amazon →</Link>
          <Link href="/" className="text-sm text-slate-400 hover:underline">← Página inicial</Link>
        </div>
      </div>
    </div>
  )
}
