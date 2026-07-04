'use client'

import type { OfferData } from '@/types'
import { formatPrice, getBridgeUrl } from '@/lib/utils'
import { calculateIndiceOfertafy } from '@/lib/ia'

interface Props {
  offers: OfferData[]
}

/**
 * Stack vertical de ofertas para mobile.
 * Substitui o HeroCarousel em telas < 768px.
 * Feed scrollável com cards compactos de alta densidade.
 */
export default function MobileDealStack({ offers }: Props) {
  if (!offers || offers.length === 0) return null

  return (
    <section className="block md:hidden bg-gradient-to-br from-slate-900 to-slate-800 px-3 py-3">
      <h2 className="text-white text-sm font-bold mb-3 flex items-center gap-1.5">
        <span>🔥</span> Ofertas em Destaque
      </h2>

      <div className="flex flex-col gap-2">
        {offers.slice(0, 6).map((offer) => (
          <DealCard key={offer.id} offer={offer} />
        ))}
      </div>
    </section>
  )
}

function DealCard({ offer }: { offer: OfferData }) {
  const indice = calculateIndiceOfertafy(offer)
  const scoreColor = indice.score >= 80 ? 'bg-green-500' : indice.score >= 60 ? 'bg-emerald-500' : indice.score >= 35 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <a
      href={getBridgeUrl(offer.url, offer.storeLabel)}
      className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl p-2.5 hover:bg-white/15 transition-colors active:scale-[0.98]"
    >
      {/* Imagem compacta */}
      <img
        src={offer.imageUrl}
        alt={offer.title}
        className="w-16 h-16 rounded-lg object-cover shrink-0 bg-white"
        loading="lazy"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${storeBadge(offer.store)}`}>
          {offer.storeLabel}
        </span>
        <h3 className="text-xs text-white font-medium line-clamp-2 mt-1 leading-tight">
          {offer.title}
        </h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-sm font-extrabold text-green-400">
            {formatPrice(offer.price)}
          </span>
          {offer.originalPrice > offer.price && (
            <span className="text-[11px] text-white/40 line-through">
              {formatPrice(offer.originalPrice)}
            </span>
          )}
          {offer.discountPct >= 10 && (
            <span className="text-[10px] text-green-400 font-bold ml-auto">
              -{offer.discountPct}%
            </span>
          )}
        </div>
        {/* Score IA */}
        <div className="flex items-center gap-1 mt-0.5">
          <div className="h-1 bg-white/10 rounded-full w-12 overflow-hidden">
            <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${indice.score}%` }} />
          </div>
          <span className="text-[9px] text-white/50">{indice.score}</span>
        </div>
      </div>

      {/* CTA */}
      <span className="text-[10px] bg-green-500 text-white font-bold px-2.5 py-1.5 rounded-lg shrink-0">
        Ver →
      </span>
    </a>
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
