import type { Metadata } from 'next'
import { getHomeOffers, getStats } from '@/lib/fetcher'
import OfferSection from '@/components/OfferSection'
import HomeSidebar from '@/components/HomeSidebar'
import { CATEGORIES } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export const metadata: Metadata = {
  title: 'As Melhores Ofertas em um Só Lugar — Compare Preços e Economize',
  description: 'Encontre as melhores promoções do Mercado Livre, Magalu, Shopee e Amazon. Ofertas atualizadas a cada hora.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Ofertafy — Compare Preços e Economize',
    description: 'Milhares de ofertas do Mercado Livre, Magalu, Shopee e Amazon em um só lugar.',
    url: '/',
  },
}

export default async function HomePage() {
  const [data, stats] = await Promise.all([
    getHomeOffers().catch(() => ({ flashDeals: [] as any[], topOffers: [] as any[], recentOffers: [] as any[] })),
    getStats().catch(() => ({ totalOffers: 0, totalClicks: 0, stores: [] as { store: string; count: number }[] })),
  ])

  const all = [...(data.flashDeals || []), ...(data.recentOffers || []), ...(data.topOffers || [])]

  const emAlta = [...all].sort((a, b) => (b.scorePromocional || 0) - (a.scorePromocional || 0)).slice(0, 15)
  const maisClicados = [...all].sort((a, b) => b.clicks - a.clicks).slice(0, 15)
  const menoresPrecos = [...all].sort((a, b) => a.price - b.price).slice(0, 15)
  const maioresQuedas = [...all].sort((a, b) => b.discountPct - a.discountPct).slice(0, 15)

  const storeFilter = (store: string) => all.filter((o: any) => o.store === store).sort((a: any, b: any) => b.discountPct - a.discountPct).slice(0, 10)
  const ml = storeFilter('mercadolivre')
  const amazon = storeFilter('amazon')
  const shopee = storeFilter('shopee')

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* ═══════════ BARRA DE CATEGORIAS (full width) ═══════════ */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/categoria/${cat.slug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:text-primary hover:border-primary/30 transition-colors shrink-0">
                <span className="text-sm">{catIcon(cat.slug)}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ LAYOUT 3 COLUNAS ═══════════ */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-4">

          {/* ── SIDEBAR ESQUERDA ── */}
          <HomeSidebar side="left" trendingOffers={maioresQuedas} mostClicked={maisClicados} />

          {/* ── CONTEÚDO CENTRAL ── */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Ofertas em Alta — seção principal */}
            {emAlta.length > 0 && (
              <OfferSection
                icon="🔥"
                title="Ofertas em Alta"
                subtitle="Maior score promocional"
                offers={emAlta}
                cta={{ label: 'Ver todas →', href: '/melhores-ofertas' }}
              />
            )}

            {/* Menores preços */}
            {menoresPrecos.length > 0 && (
              <OfferSection
                icon="💰"
                title="Menores preços do dia"
                subtitle={`${menoresPrecos.length} ofertas`}
                offers={menoresPrecos}
                cta={{ label: 'Ver todas →', href: '/ofertas-do-dia' }}
              />
            )}

            {/* Por loja — scroll horizontal */}
            {ml.length > 0 && (
              <OfferSection icon="🟡" title="Mercado Livre" offers={ml} layout="scroll"
                cta={{ label: 'Ver loja →', href: '/loja/mercadolivre' }} />
            )}
            {amazon.length > 0 && (
              <OfferSection icon="🟠" title="Amazon" offers={amazon} layout="scroll"
                cta={{ label: 'Ver loja →', href: '/loja/amazon' }} />
            )}
            {shopee.length > 0 && (
              <OfferSection icon="🔴" title="Shopee" offers={shopee} layout="scroll"
                cta={{ label: 'Ver loja →', href: '/loja/shopee' }} />
            )}

            {/* CTA WhatsApp compacto */}
            <div className="bg-slate-100 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-slate-700">
                📱 <strong>Não perca nenhuma oferta!</strong> Entre no nosso grupo de WhatsApp.
              </p>
              <a href="https://chat.whatsapp.com/KiKjuB0AiMX0P5sVBteJpz" target="_blank" rel="noopener noreferrer"
                className="inline-block mt-2 px-5 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600 transition-colors">
                Entrar no Grupo →
              </a>
            </div>
          </div>

          {/* ── SIDEBAR DIREITA ── */}
          <HomeSidebar side="right" trendingOffers={maioresQuedas} mostClicked={maisClicados} />
        </div>
      </div>
    </div>
  )
}

function catIcon(slug: string): string {
  const map: Record<string, string> = {
    eletronicos: '📱', celulares: '📲', informatica: '💻', moda: '👕',
    casa: '🏠', eletrodomesticos: '🔌', esportes: '⚽', beleza: '💄',
    brinquedos: '🧸', pets: '🐾', livros: '📚', automotivo: '🚗',
  }
  return map[slug] || '🛍'
}
