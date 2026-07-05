'use client'

import type { OfferData } from '@/types'
import { formatPrice, getBridgeUrl } from '@/lib/utils'
import { calculateIndiceOfertafy } from '@/lib/ia'

function fmtNum(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

interface Props {
  offers: OfferData[]
  stats: { totalOffers: number; totalClicks: number; stores: { store: string; count: number }[] }
}

const QUICK_LINKS = [
  { label: 'Ofertas do Dia', icon: '🔥', href: '/ofertas-do-dia' },
  { label: 'Moda', icon: '👗', href: '/moda/moda-feminina' },
  { label: 'Calçados', icon: '👟', href: '/moda/tenis-feminino' },
  { label: 'Beleza', icon: '💄', href: '/categoria/beleza' },
  { label: 'Eletrônicos', icon: '📱', href: '/categoria/eletronicos' },
  { label: 'Cupons', icon: '🎫', href: '/cupons' },
]

export default function MobileAppLayoutV2({ offers, stats }: Props) {
  if (!offers || offers.length === 0) return null

  const sorted = [...offers].sort((a, b) => (b.discountPct || 0) - (a.discountPct || 0))
  const hero = sorted[0]
  const feed = sorted.slice(1, 25)

  return (
    <div className="md:hidden bg-slate-50 min-h-screen">
      {/* ── STATS BAR ── */}
      <div className="bg-white border-b border-slate-100 px-4 py-2">
        <div className="flex justify-between text-center">
          <div><p className="text-sm font-extrabold text-slate-900" suppressHydrationWarning>{fmtNum(stats.totalOffers)}</p><p className="text-[9px] text-slate-400">Ofertas</p></div>
          <div><p className="text-sm font-extrabold text-slate-900" suppressHydrationWarning>{stats.stores.length}</p><p className="text-[9px] text-slate-400">Lojas</p></div>
          <div><p className="text-sm font-extrabold text-slate-900" suppressHydrationWarning>{fmtNum(stats.totalClicks)}</p><p className="text-[9px] text-slate-400">Economias</p></div>
          <div><p className="text-sm font-extrabold text-emerald-600">12.144</p><p className="text-[9px] text-slate-400">Produtos</p></div>
        </div>
      </div>

      {/* ── QUICK LINKS ── */}
      <div className="bg-white border-b border-slate-100 px-2 py-2.5">
        <div className="flex justify-between">
          {QUICK_LINKS.map((link) => (
            <a key={link.href} href={link.href}
              className="flex flex-col items-center gap-0.5 px-1.5 min-w-[52px]">
              <span className="text-lg">{link.icon}</span>
              <span className="text-[9px] text-slate-500 font-medium text-center leading-tight">{link.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── HERO BANNER ── */}
      {hero && (
        <a href={getBridgeUrl(hero.url, hero.storeLabel)}
          className="block mx-3 mt-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden">
          <div className="flex items-center p-3 gap-3">
            <img src={hero.imageUrl} alt={hero.title}
              className="w-24 h-24 rounded-xl object-cover bg-white shrink-0" loading="eager" />
            <div className="flex-1 min-w-0 text-white">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${storeBadge(hero.store)}`}>
                {hero.storeLabel}
              </span>
              <h2 className="text-sm font-bold mt-1.5 line-clamp-2 leading-tight">{hero.title}</h2>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-xl font-extrabold text-green-400">{formatPrice(hero.price)}</span>
                {hero.originalPrice > hero.price && (
                  <span className="text-xs text-white/50 line-through">{formatPrice(hero.originalPrice)}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                {hero.discountPct >= 10 && (
                  <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded">-{hero.discountPct}%</span>
                )}
                {hero.freeShipping && (
                  <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded">Frete grátis</span>
                )}
                <HeroScoreBadge offer={hero} />
              </div>
              <span className="inline-block mt-2 bg-green-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-lg">
                Ver Oferta →
              </span>
            </div>
          </div>
        </a>
      )}

      {/* ── FEED ── */}
      <div className="px-3 mt-4">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <span>🔥</span> Melhores ofertas para você
        </h3>
        <div className="space-y-2.5">
          {feed.map((offer) => (
            <FeedCard key={offer.id} offer={offer} />
          ))}
        </div>
      </div>

      {/* ── BOTTOM SPACER ── */}
      <div className="h-20" />
    </div>
  )
}

/** Card do feed principal estilo marketplace */
function FeedCard({ offer }: { offer: OfferData }) {
  const indice = calculateIndiceOfertafy(offer)
  const scoreColor = indice.score >= 80 ? 'bg-green-500' : indice.score >= 60 ? 'bg-emerald-500' : indice.score >= 35 ? 'bg-amber-500' : 'bg-red-400'

  return (
    <a href={getBridgeUrl(offer.url, offer.storeLabel)}
      className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]">
      {/* Imagem */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">
        <img src={offer.imageUrl} alt={offer.title}
          className="w-full h-full object-cover" loading="lazy" />
        {offer.discountPct >= 15 && (
          <span className="absolute top-0.5 left-0.5 bg-red-500 text-white text-[9px] font-extrabold px-1 rounded">-{offer.discountPct}%</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${storeBadge(offer.store)}`}>
            {offer.storeLabel}
          </span>
          {offer.freeShipping && (
            <span className="text-[8px] text-green-600 font-medium">📦 Grátis</span>
          )}
        </div>
        <h3 className="text-xs font-medium text-slate-800 line-clamp-2 leading-tight">{offer.title}</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-base font-extrabold text-slate-900">{formatPrice(offer.price)}</span>
          {offer.originalPrice > offer.price && (
            <span className="text-[10px] text-slate-400 line-through">{formatPrice(offer.originalPrice)}</span>
          )}
        </div>
        {/* Score bar */}
        <div className="flex items-center gap-1 mt-1">
          <div className="h-1 bg-slate-100 rounded-full flex-1 overflow-hidden">
            <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${indice.score}%` }} />
          </div>
          <span className="text-[9px] font-bold text-slate-500">{indice.score}</span>
        </div>
      </div>

      {/* CTA */}
      <span className="text-[10px] bg-green-500 text-white font-bold px-2.5 py-1.5 rounded-lg shrink-0">
        Ver →
      </span>
    </a>
  )
}

function HeroScoreBadge({ offer }: { offer: OfferData }) {
  const indice = calculateIndiceOfertafy(offer)
  const color = indice.score >= 80 ? 'bg-green-600' : indice.score >= 60 ? 'bg-emerald-600' : indice.score >= 35 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <span className={`text-[10px] ${color} text-white font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5`}>
      🤖 {indice.score}
    </span>
  )
}

function storeBadge(store: string): string {
  const map: Record<string, string> = {
    mercadolivre: 'bg-[#FFE600] text-slate-900',
    magalu: 'bg-[#0086FF] text-white',
    shopee: 'bg-[#EE4D2D] text-white',
    amazon: 'bg-[#FF9900] text-slate-900',
    shein: 'bg-black text-white',
  }
  return map[store] || 'bg-slate-200 text-slate-700'
}
