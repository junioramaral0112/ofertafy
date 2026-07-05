import Link from 'next/link'
import { formatPrice, generateProductSlug } from '@/lib/utils'
import { calculateIndiceOfertafy, isVerifiedOffer } from '@/lib/ia'
import type { OfferData } from '@/types'

export default function OfferCard({ offer, compact, index }: { offer: OfferData; compact?: boolean; index?: number }) {
  const indice = calculateIndiceOfertafy(offer)
  const verified = isVerifiedOffer(offer)
  const slug = generateProductSlug(offer.title, offer.id)
  const scoreColor = indice.score >= 80 ? 'bg-green-500' : indice.score >= 60 ? 'bg-emerald-500' : indice.score >= 35 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <Link
      href={`/p/${slug}`}
      className="bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col group hover:shadow-md hover:border-slate-200 transition-all duration-200"
    >
      {/* Imagem com badges sobrepostos */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        <img
          src={offer.imageUrl}
          alt={offer.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges no topo */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1">
          <div className="flex flex-col gap-1">
            {verified && (
              <span className="text-[9px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded">
                ✔ Verificada
              </span>
            )}
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${storeBadge(offer.store)}`}>
              {offer.storeLabel}
            </span>
          </div>
          {offer.discountPct >= 10 && (
            <span className="text-[10px] font-extrabold bg-red-500 text-white px-1.5 py-0.5 rounded">
              -{offer.discountPct}%
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-xs font-medium text-slate-800 line-clamp-2 mb-2 flex-1 leading-snug group-hover:text-primary transition-colors">
          {offer.title}
        </h3>

        <div className="mt-auto">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-slate-900">
              {formatPrice(offer.price)}
            </span>
            {offer.originalPrice > offer.price && (
              <span className="text-[11px] text-slate-400 line-through">
                {formatPrice(offer.originalPrice)}
              </span>
            )}
          </div>

          {offer.installment && (
            <p className="text-[10px] text-slate-400 mt-0.5">{offer.installment}</p>
          )}

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
            <span className="text-[10px] text-slate-400">{offer.category}</span>
            <div className="flex items-center gap-1">
              <div className="h-1 bg-slate-100 rounded-full w-10 overflow-hidden">
                <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${indice.score}%` }} />
              </div>
              <span className="text-[10px] font-bold text-slate-500">{indice.score}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function storeBadge(store: string): string {
  const map: Record<string, string> = {
    mercadolivre: 'bg-[#FFE600] text-slate-900',
    magalu: 'bg-[#0086FF] text-white',
    shopee: 'bg-[#EE4D2D] text-white',
    amazon: 'bg-[#FF9900] text-slate-900',
  }
  return map[store] || 'bg-slate-200 text-slate-700'
}
