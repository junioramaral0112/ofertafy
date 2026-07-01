import type { Metadata } from 'next'
import { getHomeOffers, getStats } from '@/lib/fetcher'
import OfferSection from '@/components/OfferSection'
import HeroCarousel from '@/components/HeroCarousel'
import SearchBar from '@/components/SearchBar'
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

  // Blocos derivados
  const emAlta = [...all].sort((a, b) => (b.scorePromocional || 0) - (a.scorePromocional || 0)).slice(0, 12)
  const maisClicados = [...all].sort((a, b) => b.clicks - a.clicks).slice(0, 12)
  const ultimas = [...all].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()).slice(0, 12)

  // Por loja
  const storeFilter = (store: string) => all.filter((o: any) => o.store === store).sort((a: any, b: any) => b.discountPct - a.discountPct).slice(0, 8)
  const ml = storeFilter('mercadolivre')
  const magalu = storeFilter('magalu')
  const amazon = storeFilter('amazon')
  const shopee = storeFilter('shopee')

  return (
    <div>
      {/* ═══════════ HERO CAROUSEL V2 (compacto) ═══════════ */}
      <HeroCarousel offers={data.recentOffers || data.flashDeals || data.topOffers || []} />

      {/* ═══════════ STATS CARDS ═══════════ */}
      <section className="max-w-7xl mx-auto px-4 -mt-3 relative z-10">
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <StatCard value={stats.totalOffers.toLocaleString()} label="Ofertas" icon="🏷️" />
          <StatCard value={String(stats.stores.length)} label="Lojas" icon="🏪" />
          <StatCard value={stats.totalClicks.toLocaleString()} label="Economias" icon="💰" />
        </div>
      </section>

      {/* ═══════════ SEARCH ═══════════ */}
      <section className="max-w-7xl mx-auto px-4 mt-4">
        <SearchBar large placeholder="O que você quer economizar hoje?" />
      </section>

      {/* ═══════════ CATEGORIAS ═══════════ */}
      <section className="max-w-7xl mx-auto px-4 mt-5">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/categoria/${cat.slug}`}
              className="flex flex-col items-center gap-0.5 p-2 bg-white rounded-xl border border-slate-200 hover:border-primary hover:shadow-sm transition-all group">
              <span className="text-lg">{catIcon(cat.slug)}</span>
              <span className="text-[10px] font-medium text-slate-500 group-hover:text-primary text-center leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════ OFERTAS EM ALTA ═══════════ */}
      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        {emAlta.length > 0 && (
          <OfferSection icon="🔥" title="Ofertas em Alta" subtitle="Maior score promocional" offers={emAlta}
            cta={{ label: 'Ver todas', href: '/melhores-ofertas' }} />
        )}

        {/* ═══════════ MAIS CLICADAS ═══════════ */}
        {maisClicados.length > 0 && (
          <OfferSection icon="👁" title="Mais clicadas hoje" subtitle="As mais acessadas" offers={maisClicados}
            cta={{ label: 'Ver ranking', href: '/melhores-ofertas' }} />
        )}

        {/* ═══════════ ÚLTIMAS PROMOÇÕES ═══════════ */}
        {ultimas.length > 0 && (
          <OfferSection icon="🆕" title="Últimas promoções" subtitle="Acabaram de chegar" offers={ultimas} />
        )}

        {/* ═══════════ POR LOJA ═══════════ */}
        {ml.length > 0 && <OfferSection icon="🟡" title="Mercado Livre" subtitle="Menores preços" offers={ml} layout="scroll" cta={{ label: 'Ver loja', href: '/loja/mercadolivre' }} />}
        {amazon.length > 0 && <OfferSection icon="🟠" title="Amazon" subtitle="Melhores descontos" offers={amazon} layout="scroll" cta={{ label: 'Ver loja', href: '/loja/amazon' }} />}
        {shopee.length > 0 && <OfferSection icon="🔴" title="Shopee" subtitle="Ofertas em destaque" offers={shopee} layout="scroll" cta={{ label: 'Ver loja', href: '/loja/shopee' }} />}
        {magalu.length > 0 && <OfferSection icon="🔵" title="Magalu" subtitle="Promoções do dia" offers={magalu} layout="scroll" cta={{ label: 'Ver loja', href: '/loja/magalu' }} />}

        {/* ═══════════ CTA FINAL ═══════════ */}
        <section className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-center text-white">
          <h2 className="text-lg md:text-xl font-extrabold mb-2">Não perca nenhuma oferta! 🔔</h2>
          <p className="text-sm text-white/60 mb-4 max-w-md mx-auto">
            Receba as melhores promoções direto no seu WhatsApp.
          </p>
          <a href="https://chat.whatsapp.com/KiKjuB0AiMX0P5sVBteJpz" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors">
            📱 Entrar no Grupo de Ofertas
          </a>
        </section>
      </div>
    </div>
  )
}

/** Card pequeno de estatística */
function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 md:p-4 text-center shadow-sm">
      <span className="text-base md:text-lg">{icon}</span>
      <p className="text-lg md:text-xl font-extrabold text-slate-900">{value}</p>
      <p className="text-[10px] md:text-xs text-slate-400">{label}</p>
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
