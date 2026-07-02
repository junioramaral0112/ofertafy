import type { Metadata } from 'next'
import { getHomeOffers, getStats } from '@/lib/fetcher'
import OfferSection from '@/components/OfferSection'
import SwiperCarousel from '@/components/SwiperCarousel'
import HomeSidebar from '@/components/HomeSidebar'
import { CATEGORIES } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export const metadata: Metadata = {
  title: 'As Melhores Ofertas em um Só Lugar — Compare Preços e Economize',
  description: 'Encontre as melhores promoções do Mercado Livre, Magalu, Shopee e Amazon.',
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

  const ofertasDoDia = (data.recentOffers || []).slice(0, 8)
  const maioresQuedas = [...all].sort((a, b) => b.discountPct - a.discountPct).slice(0, 8)
  const maisClicados = [...all].sort((a, b) => b.clicks - a.clicks).slice(0, 8)
  const emTendencia = [...all].sort((a, b) => (b.scorePromocional || 0) - (a.scorePromocional || 0)).slice(0, 8)

  const carouselOffers = (data.recentOffers || data.flashDeals || data.topOffers || []).slice(0, 5)

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* ═══════════ CATEGORIAS (full width bar) ═══════════ */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/categoria/${cat.slug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-100 text-xs font-medium text-slate-600 hover:text-primary transition-colors shrink-0">
                <span className="text-sm">{catIcon(cat.slug)}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ LAYOUT 3 COLUNAS ═══════════ */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex gap-5">

          {/* ── COLUNA ESQUERDA ── */}
          <HomeSidebar side="left" trendingOffers={emTendencia} mostClicked={maisClicados} maioresQuedas={maioresQuedas} />

          {/* ── COLUNA CENTRAL ── */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Carrossel Swiper */}
            <SwiperCarousel offers={carouselOffers} />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon="🏷️" value={stats.totalOffers.toLocaleString()} label="Ofertas ativas" />
              <StatCard icon="🏪" value={String(stats.stores.length)} label="Lojas parceiras" />
              <StatCard icon="💰" value={stats.totalClicks.toLocaleString()} label="Economia gerada" />
              <StatCard icon="🔄" value="5 min" label="Atualizado há" />
            </div>

            {/* Ofertas do Dia — Grid 4 colunas */}
            {ofertasDoDia.length > 0 && (
              <OfferSection
                icon="🔥"
                title="Ofertas do Dia"
                subtitle={`${ofertasDoDia.length} promoções ativas`}
                offers={ofertasDoDia}
                cta={{ label: 'Ver todas →', href: '/ofertas-do-dia' }}
              />
            )}

            {/* Por loja — scroll horizontal */}
            <PorLoja all={all} />
          </div>

          {/* ── COLUNA DIREITA ── */}
          <RightSidebar mostClicked={maisClicados} />
        </div>
      </div>
    </div>
  )
}

/** Cards de estatísticas */
function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 text-center shadow-sm">
      <span className="text-xl">{icon}</span>
      <p className="text-lg font-extrabold text-slate-900 mt-1">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  )
}

/** Seção de lojas em scroll horizontal */
function PorLoja({ all }: { all: any[] }) {
  const stores = [
    { key: 'amazon', icon: '🟠', name: 'Amazon', slug: 'amazon' },
    { key: 'mercadolivre', icon: '🟡', name: 'Mercado Livre', slug: 'mercadolivre' },
    { key: 'shopee', icon: '🔴', name: 'Shopee', slug: 'shopee' },
    { key: 'magalu', icon: '🔵', name: 'Magalu', slug: 'magalu' },
    { key: 'shein', icon: '👗', name: 'SHEIN', slug: 'shein' },
  ]

  return (
    <div className="space-y-5">
      {stores.map((s) => {
        const items = all.filter((o: any) => o.store === s.key).slice(0, 10)
        if (items.length === 0) return null
        return (
          <OfferSection
            key={s.key}
            icon={s.icon}
            title={s.name}
            offers={items}
            layout="scroll"
            cta={{ label: 'Ver loja →', href: `/loja/${s.slug}` }}
          />
        )
      })}
    </div>
  )
}

/** Sidebar Direita */
function RightSidebar({ mostClicked }: { mostClicked: any[] }) {
  return (
    <aside className="hidden lg:block w-56 shrink-0 space-y-4">
      {/* Mais acessados */}
      <MiniList title="👁 Mais acessados" offers={mostClicked.slice(0, 8)} />

      {/* Instagram Banner */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-5 text-white text-center">
        <p className="text-2xl mb-1">📸</p>
        <p className="font-bold text-sm mb-1">Siga no Instagram</p>
        <p className="text-xs text-white/70 mb-3">Ofertas diárias nos stories</p>
        <a href="https://www.instagram.com/ofertafy.br" target="_blank" rel="noopener noreferrer"
          className="inline-block bg-white text-purple-600 font-bold text-xs px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors">
          Seguir →
        </a>
      </div>

      {/* Newsletter Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-center">
        <p className="text-2xl mb-1">📧</p>
        <p className="font-bold text-sm text-slate-800 mb-1">Receba por e-mail</p>
        <p className="text-xs text-slate-500 mb-3">As melhores ofertas do dia</p>
        <input type="email" placeholder="seu@email.com"
          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 mb-2 text-center" />
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs py-2 rounded-lg transition-colors">
          Cadastrar →
        </button>
      </div>
    </aside>
  )
}

/** Lista vertical compacta */
function MiniList({ title, offers }: { title: string; offers: any[] }) {
  if (!offers || offers.length === 0) return null
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3">
      <h3 className="text-xs font-bold text-slate-700 mb-2">{title}</h3>
      <div className="space-y-2">
        {offers.map((offer: any) => (
          <Link key={offer.id} href={`/produto/${offer.id}`}
            className="flex items-center gap-2 group hover:bg-slate-50 rounded-lg p-1 -mx-1 transition-colors">
            <img src={offer.imageUrl} alt={offer.title}
              className="w-10 h-10 rounded-lg object-cover shrink-0" loading="lazy" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-700 truncate group-hover:text-primary transition-colors leading-tight">
                {offer.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-bold text-slate-900">R$ {offer.price.toFixed(2)}</span>
                {offer.discountPct >= 10 && (
                  <span className="text-[10px] text-green-600 font-bold">-{offer.discountPct}%</span>
                )}
              </div>
            </div>
          </Link>
        ))}
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
