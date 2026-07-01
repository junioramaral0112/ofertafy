import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import OfferCard from '@/components/OfferCard'
import { getHomeOffers } from '@/lib/fetcher'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const c = await prisma.campaign.findUnique({ where: { slug } })
  if (!c) return { title: 'Campanha não encontrada' }

  return {
    title: `${c.name} — Ofertas e Promoções | Ofertafy`,
    description: c.description || `Confira as melhores ofertas da campanha ${c.name}. Descontos imperdíveis!`,
    alternates: { canonical: `/promocoes/${slug}` },
    openGraph: {
      title: `${c.name} — Ofertafy`,
      description: c.description || `Ofertas da campanha ${c.name}`,
      url: `/promocoes/${slug}`,
    },
  }
}

export default async function CampanhaPage({ params }: Props) {
  const { slug } = await params
  const campaign = await prisma.campaign.findUnique({ where: { slug } })
  if (!campaign) notFound()

  const now = new Date()
  const isActive = campaign.startDate <= now && campaign.endDate >= now
  const isUpcoming = campaign.startDate > now
  const diffDays = Math.ceil((new Date(campaign.endDate).getTime() - now.getTime()) / (1000 * 3600 * 24))

  // Buscar ofertas da loja da campanha
  const { recentOffers } = await getHomeOffers().catch(() => ({ flashDeals: [], topOffers: [], recentOffers: [] }))
  const storeOffers = (recentOffers || []).filter((o: any) => o.store === campaign.store).slice(0, 15)

  const STORE_NAMES: Record<string, string> = {
    shopee: 'Shopee', mercadolivre: 'Mercado Livre', amazon: 'Amazon', magalu: 'Magalu',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-400 mb-6">
        <Link href="/promocoes" className="hover:text-primary">Promoções</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">{campaign.name}</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 md:p-10 text-white mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20">
            {STORE_NAMES[campaign.store] || campaign.store}
          </span>
          {isActive && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500 animate-pulse">
              🔥 AO VIVO
            </span>
          )}
          {isUpcoming && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500">
              ⏳ EM BREVE — {diffDays} dias
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-4xl font-extrabold mb-3">{campaign.name}</h1>
        <p className="text-white/70 mb-4">{campaign.description}</p>

        <div className="flex items-center gap-4 text-sm text-white/60">
          <span>📅 {new Date(campaign.startDate).toLocaleDateString('pt-BR')}</span>
          <span>→</span>
          <span>📅 {new Date(campaign.endDate).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4">❓ Sobre {campaign.name}</h2>
        <div className="space-y-3 text-sm text-slate-600">
          <p><strong>Quando começa?</strong> {new Date(campaign.startDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p>
          <p><strong>Quando termina?</strong> {new Date(campaign.endDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p>
          <p><strong>Quais produtos participam?</strong> Eletrônicos, moda, casa, beleza e muito mais. Confira as ofertas em destaque abaixo.</p>
          <p><strong>Vale a pena esperar?</strong> {isUpcoming ? 'Sim! Esta campanha historicamente oferece bons descontos.' : isActive ? 'As ofertas estão no ar — confira agora!' : 'Esta campanha já passou, mas fique atento à próxima edição.'}</p>
        </div>
      </div>

      {/* Ofertas relacionadas */}
      {storeOffers.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            {isActive ? '🔥 Ofertas em destaque' : '🛍 Produtos que costumam participar'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {storeOffers.map((offer: any) => <OfferCard key={offer.id} offer={offer} />)}
          </div>
        </section>
      )}

      <div className="mt-10 text-center">
        <Link href="/promocoes" className="text-sm text-primary hover:underline">
          ← Ver todas as campanhas
        </Link>
      </div>
    </div>
  )
}
