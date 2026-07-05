'use client'

import type { OfferData } from '@/types'
import { formatPrice, getBridgeUrl } from '@/lib/utils'
import { calculateIndiceOfertafy } from '@/lib/ia'

interface Props {
  offers: OfferData[]
}

/**
 * Stack mobile estilo Mercado Livre.
 *
 * Grid assimétrico: mini-cards (esquerda) + card destaque (direita).
 * Exibido apenas em telas < 768px (md:hidden no container pai).
 */
export default function MobileDealStack({ offers }: Props) {
  if (!offers || offers.length === 0) return null

  const sorted = [...offers].sort((a, b) => (b.discountPct || 0) - (a.discountPct || 0))
  const hero = sorted[0]
  const miniCards = sorted.slice(1, 4)

  return (
    <section className="md:hidden bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Banner compacto */}
      <div className="px-4 pt-3 pb-2">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-2xl px-4 py-3 flex items-center justify-between text-white">
          <div>
            <p className="text-sm font-bold">Ofertas do Dia</p>
            <p className="text-[10px] text-white/70">{offers.length.toLocaleString()} ofertas ativas</p>
          </div>
          <a href="/ofertas-do-dia" className="bg-white text-emerald-700 font-bold text-[11px] px-3 py-1.5 rounded-full">
            Ver todas
          </a>
        </div>
      </div>

      {/* Grid Assimétrico */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        {/* Coluna esquerda: mini-cards */}
        <div className="flex flex-col gap-2">
          {miniCards.map((offer) => (
            <MiniCard key={`${offer.sourceId || offer.id}-${offer.store}`} offer={offer} />
          ))}
        </div>

        {/* Coluna direita: card destaque */}
        {hero && <HeroCard offer={hero} />}
      </div>

      {/* Scroll horizontal: Menores Preços */}
      <HorizontalScroll
        title="💰 Menores precos"
        offers={[...offers].sort((a, b) => a.price - b.price).slice(0, 6)}
      />

      {/* Scroll horizontal: Maiores Quedas */}
      <HorizontalScroll
        title="📉 Maiores quedas"
        offers={[...offers].sort((a, b) => b.discountPct - a.discountPct).slice(0, 6)}
      />
    </section>
  )
}

/** Mini-card compacto (coluna esquerda do grid) */
function MiniCard({ offer }: { offer: OfferData }) {
  const indice = calculateIndiceOfertafy(offer)
  const scoreColor = indice.score >= 80 ? 'bg-green-500' : indice.score >= 60 ? 'bg-emerald-500' : indice.score >= 35 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <a
      href={getBridgeUrl(offer.url, offer.storeLabel)}
      className="bg-white/10 backdrop-blur rounded-xl p-2 flex items-center gap-2 hover:bg-white/15 transition-colors active:scale-[0.98]"
    >
      <img src={offer.imageUrl} alt={offer.title}
        className="w-11 h-11 rounded-lg object-cover shrink-0 bg-white" loading="lazy" />
      <div className="flex-1 min-w-0">
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${miniBadge(offer.store)}`}>
          {offer.storeLabel}
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-xs font-extrabold text-green-400">{formatPrice(offer.price)}</span>
          {offer.discountPct >= 10 && (
            <span className="text-[10px] text-green-300 font-bold">-{offer.discountPct}%</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="h-1 bg-white/10 rounded-full w-10 overflow-hidden">
            <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${indice.score}%` }} />
          </div>
          <span className="text-[8px] text-white/40">{indice.score}</span>
        </div>
      </div>
    </a>
  )
}

/** Card destaque grande (coluna direita do grid) */
function HeroCard({ offer }: { offer: OfferData }) {
  const indice = calculateIndiceOfertafy(offer)

  return (
    <a
      href={getBridgeUrl(offer.url, offer.storeLabel)}
      className="bg-white/10 backdrop-blur rounded-xl overflow-hidden flex flex-col hover:bg-white/15 transition-colors active:scale-[0.98]"
    >
      <div className="relative aspect-square bg-white">
        <img src={offer.imageUrl} alt={offer.title}
          className="w-full h-full object-contain p-2" loading="eager" />
        <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full shadow ${mainBadge(offer.store)}`}>
          {offer.storeLabel}
        </span>
        {offer.discountPct >= 10 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-extrabold px-2 py-1 rounded-lg shadow">
            -{offer.discountPct}%
          </span>
        )}
      </div>
      <div className="p-2.5 flex flex-col flex-1">
        <h3 className="text-xs text-white font-semibold leading-tight line-clamp-2">{offer.title}</h3>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-lg font-extrabold text-green-400">{formatPrice(offer.price)}</span>
          {offer.originalPrice > offer.price && (
            <span className="text-[11px] text-white/40 line-through">{formatPrice(offer.originalPrice)}</span>
          )}
        </div>
        {offer.freeShipping && <p className="text-[10px] text-white/60 mt-0.5">Frete gratis</p>}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[9px] text-white/40">IA Ofertafy</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${indice.score >= 80 ? 'bg-green-500' : indice.score >= 60 ? 'bg-emerald-500' : indice.score >= 35 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${indice.score}%` }} />
          </div>
          <span className="text-[10px] font-bold text-green-400">{indice.score}</span>
        </div>
        <span className="block text-center bg-green-500 text-white font-bold text-[11px] py-1.5 rounded-lg mt-2">
          Ver Oferta
        </span>
      </div>
    </a>
  )
}

/** Scroll horizontal de cards */
function HorizontalScroll({ title, offers }: { title: string; offers: OfferData[] }) {
  if (offers.length === 0) return null
  return (
    <div className="px-4 pb-3">
      <h3 className="text-white text-xs font-bold mb-2 flex items-center gap-1.5">{title}</h3>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {offers.map((offer) => (
          <a key={`${offer.sourceId || offer.id}-${offer.store}`}
            href={getBridgeUrl(offer.url, offer.storeLabel)}
            className="bg-white/10 backdrop-blur rounded-xl p-2 min-w-[130px] flex-shrink-0 hover:bg-white/15 transition-colors active:scale-[0.98]"
          >
            <img src={offer.imageUrl} alt={offer.title}
              className="w-full h-[90px] object-cover rounded-lg bg-white" loading="lazy" />
            <div className="mt-2">
              <p className="text-xs font-extrabold text-green-400">{formatPrice(offer.price)}</p>
              {offer.originalPrice > offer.price && (
                <p className="text-[10px] text-white/40 line-through">{formatPrice(offer.originalPrice)}</p>
              )}
              <p className="text-[9px] text-white/50 mt-0.5">{offer.storeLabel}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

function miniBadge(store: string): string {
  const map: Record<string, string> = {
    mercadolivre: 'bg-[#FFE600] text-slate-900',
    magalu: 'bg-[#0086FF] text-white',
    shopee: 'bg-[#EE4D2D] text-white',
    amazon: 'bg-[#FF9900] text-slate-900',
    shein: 'bg-black text-white',
  }
  return map[store] || 'bg-slate-400 text-white'
}

function mainBadge(store: string): string {
  const map: Record<string, string> = {
    mercadolivre: 'bg-[#FFE600] text-slate-900',
    magalu: 'bg-[#0086FF] text-white',
    shopee: 'bg-[#EE4D2D] text-white',
    amazon: 'bg-[#FF9900] text-slate-900',
    shein: 'bg-black text-white',
  }
  return map[store] || 'bg-slate-500 text-white'
}
