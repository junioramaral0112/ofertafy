import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import type { OfferData } from '@/types'

export default function OfferCard({ offer }: { offer: OfferData }) {
  return (
    <Link
      href={`/produto/${offer.id}`}
      className="card-hover bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col group"
    >
      {/* Image */}
      <div className="relative aspect-square bg-slate-100 overflow-hidden">
        <img
          src={offer.imageUrl}
          alt={offer.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Discount badge */}
        {offer.discountPct >= 15 && (
          <span className="discount-badge absolute top-3 left-3 shadow-lg">
            -{offer.discountPct}%
          </span>
        )}

        {/* Store badge */}
        <StoreBadge store={offer.store} />

        {/* Free shipping */}
        {offer.freeShipping && (
          <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-green-600 text-xs font-semibold px-2 py-1 rounded-lg">
            📦 Frete grátis
          </span>
        )}

        {/* Flash timer */}
        {offer.isFlash && offer.flashEndsAt && (
          <div className="absolute top-3 right-3">
            <FlashTimer endAt={offer.flashEndsAt} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-slate-800 line-clamp-2 mb-2 flex-1 leading-snug group-hover:text-primary transition-colors">
          {offer.title}
        </h3>

        {/* Prices */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-slate-900">
              {formatPrice(offer.price)}
            </span>
            {offer.originalPrice > offer.price && (
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(offer.originalPrice)}
              </span>
            )}
          </div>

          {/* Installment */}
          {offer.installment && (
            <p className="text-xs text-slate-500 mt-1">{offer.installment}</p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">{offer.category}</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              👁 {offer.clicks}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/**
 * Badge da loja com cores oficiais:
 * 🟡 Mercado Livre = amarelo #FFE600
 * 🔵 Magalu = azul #0086FF
 * 🔴 Shopee = laranja/vermelho (adormecida)
 * 🟠 Amazon = laranja (adormecida)
 */
function StoreBadge({ store }: { store: string }) {
  const colors: Record<string, string> = {
    mercadolivre: 'bg-[#FFE600] text-slate-900',
    magalu:        'bg-[#0086FF] text-white',
    shopee:        'bg-[#EE4D2D] text-white',
    amazon:        'bg-[#FF9900] text-slate-900',
    tiktok:        'bg-black text-white',
  }

  const labels: Record<string, string> = {
    mercadolivre: 'Mercado Livre',
    magalu:        'Magalu',
    shopee:        'Shopee',
    amazon:        'Amazon',
    tiktok:        'TikTok Shop',
  }

  return (
    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[store] || 'bg-slate-200 text-slate-700'} shadow`}>
      {labels[store] || store}
    </span>
  )
}

function FlashTimer({ endAt }: { endAt: Date | string }) {
  return (
    <span className="flash-timer text-xs">
      ⚡ TERMINA EM BREVE
    </span>
  )
}
