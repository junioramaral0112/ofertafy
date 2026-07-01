import type { Metadata } from 'next'
import { getHomeOffers, getStats } from '@/lib/fetcher'
import OfferSection from '@/components/OfferSection'
import HeroCarousel from '@/components/HeroCarousel'
import HomeSidebar from '@/components/HomeSidebar'
import SearchBar from '@/components/SearchBar'
import { CATEGORIES } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export const metadata: Metadata = {
  title: 'As Melhores Ofertas em um Só Lugar — Compare Preços e Economize',
  description:
    'Encontre as melhores promoções do Mercado Livre, Magalu, Shopee e Amazon. Ofertas atualizadas a cada hora com links de afiliado.',
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

  const allOffers = [
    ...(data.flashDeals || []),
    ...(data.recentOffers || []),
    ...(data.topOffers || []),
  ]

  // Derivar blocos a partir dos dados existentes
  const menoresPrecos = [...allOffers].sort((a, b) => a.price - b.price).slice(0, 15)
  const maioresQuedas = [...allOffers].sort((a, b) => b.discountPct - a.discountPct).slice(0, 15)
  const maisClicados = [...allOffers].sort((a, b) => b.clicks - a.clicks).slice(0, 15)
  const freteGratis = allOffers.filter((o) => o.freeShipping).slice(0, 15)
  const ofertasRecentes = [...allOffers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 15)
  const ate50 = allOffers.filter((o) => o.price <= 50).slice(0, 15)
  const ate100 = allOffers.filter((o) => o.price > 50 && o.price <= 100).slice(0, 15)
  const ate300 = allOffers.filter((o) => o.price > 100 && o.price <= 300).slice(0, 15)

  return (
    <div>
      {/* ═══════════ HERO CAROUSEL ═══════════ */}
      <HeroCarousel offers={data.recentOffers || data.flashDeals || data.topOffers || []} />

      {/* ═══════════ SEARCH + STATS ═══════════ */}
      <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 md:p-6">
          <div className="max-w-xl mx-auto mb-4">
            <SearchBar large placeholder="O que você quer economizar hoje?" />
          </div>
          <div className="flex justify-center gap-6 md:gap-10 text-center">
            <div>
              <p className="text-xl md:text-2xl font-extrabold text-slate-900">{stats.totalOffers.toLocaleString()}</p>
              <p className="text-[10px] md:text-xs text-slate-400">Ofertas ativas</p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-extrabold text-slate-900">{stats.stores.length}</p>
              <p className="text-[10px] md:text-xs text-slate-400">Lojas</p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-extrabold text-slate-900">{stats.totalClicks.toLocaleString()}</p>
              <p className="text-[10px] md:text-xs text-slate-400">Economias geradas</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CATEGORIAS ═══════════ */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
            >
              <span className="text-2xl">{categoryIcon(cat.slug)}</span>
              <span className="text-xs font-medium text-slate-600 group-hover:text-primary text-center leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════ CONTEÚDO PRINCIPAL COM SIDEBARS ═══════════ */}
      <div className="max-w-7xl mx-auto px-4 mt-10">
        <div className="flex gap-8">
          {/* Sidebar Esquerda */}
          <HomeSidebar
            side="left"
            trendingOffers={maioresQuedas}
            mostClicked={maisClicados}
          />

          {/* Conteúdo Central */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* 🔥 Menores preços */}
            <OfferSection
              icon="🔥"
              title="Menores preços do dia"
              subtitle={`${menoresPrecos.length} ofertas`}
              offers={menoresPrecos}
              cta={{ label: 'Ver todos', href: '/melhores-ofertas' }}
            />

            {/* 📉 Maiores quedas */}
            <OfferSection
              icon="📉"
              title="Maiores quedas"
              subtitle="Preços que mais caíram"
              offers={maioresQuedas}
              layout="scroll"
              cta={{ label: 'Ver mais', href: '/ofertas-do-dia' }}
            />

            {/* 🚚 Frete grátis */}
            {freteGratis.length > 0 && (
              <OfferSection
                icon="🚚"
                title="Frete grátis"
                subtitle="Entrega sem custo"
                offers={freteGratis}
                cta={{ label: 'Ver mais', href: '/busca?freteGratis=true' }}
              />
            )}

            {/* 💰 Até R$50 */}
            {ate50.length > 0 && (
              <OfferSection
                icon="💰"
                title="Até R$ 50"
                subtitle="Ofertas econômicas"
                offers={ate50}
                layout="scroll"
              />
            )}

            {/* 💰 Até R$100 */}
            {ate100.length > 0 && (
              <OfferSection
                icon="💵"
                title="Até R$ 100"
                subtitle="Bom custo-benefício"
                offers={ate100}
                layout="scroll"
              />
            )}

            {/* 💰 Até R$300 */}
            {ate300.length > 0 && (
              <OfferSection
                icon="💎"
                title="Até R$ 300"
                subtitle="Qualidade premium"
                offers={ate300}
                layout="scroll"
              />
            )}

            {/* ⭐ Mais clicados */}
            <OfferSection
              icon="⭐"
              title="Mais populares"
              subtitle="Os mais acessados do site"
              offers={maisClicados}
              cta={{ label: 'Ver ranking', href: '/melhores-ofertas' }}
            />

            {/* 🆕 Ofertas recentes */}
            <OfferSection
              icon="🆕"
              title="Ofertas recentes"
              subtitle="Acabaram de chegar"
              offers={ofertasRecentes}
              layout="grid"
            />
          </div>

          {/* Sidebar Direita */}
          <HomeSidebar
            side="right"
            trendingOffers={maioresQuedas}
            mostClicked={maisClicados}
          />
        </div>
      </div>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="max-w-7xl mx-auto px-4 mt-12 mb-12">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 md:p-10 text-center text-white">
          <h2 className="text-xl md:text-2xl font-extrabold mb-2">Não perca nenhuma oferta! 🔔</h2>
          <p className="text-sm text-white/70 mb-5 max-w-md mx-auto">
            Receba as melhores promoções direto no seu WhatsApp ou e-mail.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://chat.whatsapp.com/KiKjuB0AiMX0P5sVBteJpz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
            >
              📱 Entrar no WhatsApp
            </a>
            <a
              href="https://www.instagram.com/ofertafy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
            >
              📸 Seguir no Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

/** Ícone visual por categoria */
function categoryIcon(slug: string): string {
  const map: Record<string, string> = {
    eletronicos: '📱',
    celulares: '📲',
    informatica: '💻',
    moda: '👕',
    casa: '🏠',
    eletrodomesticos: '🔌',
    esportes: '⚽',
    beleza: '💄',
    brinquedos: '🧸',
    pets: '🐾',
    livros: '📚',
    automotivo: '🚗',
  }
  return map[slug] || '🛍'
}
