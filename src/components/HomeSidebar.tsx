import Link from 'next/link'
import type { OfferData } from '@/types'
import { formatPrice } from '@/lib/utils'

interface HomeSidebarProps {
  trendingOffers: OfferData[]
  mostClicked: OfferData[]
  side: 'left' | 'right'
}

/**
 * Sidebar esquerda/direita da Home.
 *
 * Esquerda: últimas quedas, recém-adicionados, tendência
 * Direita:  mais acessados, mais vendidos, banner WhatsApp/Instagram
 *
 * Em mobile (< 1024px), o sidebar é oculto.
 */
export default function HomeSidebar({ trendingOffers, mostClicked, side }: HomeSidebarProps) {
  return (
    <aside className="hidden lg:block w-72 shrink-0 space-y-5">
      {side === 'left' ? (
        <>
          {/* Últimas quedas */}
          <MiniOfferList
            title="📉 Maiores quedas"
            offers={trendingOffers.filter((o) => o.discountPct >= 20).slice(0, 5)}
          />

          {/* Produtos em tendência */}
          <MiniOfferList
            title="🔥 Em tendência"
            offers={trendingOffers.slice(0, 5)}
          />
        </>
      ) : (
        <>
          {/* Mais acessados */}
          <MiniOfferList
            title="👁 Mais acessados"
            offers={mostClicked.slice(0, 5)}
          />

          {/* Banner WhatsApp */}
          <div className="bg-green-500 rounded-2xl p-5 text-white text-center">
            <p className="text-2xl mb-2">📱</p>
            <p className="font-bold text-sm mb-1">Grupo de Ofertas</p>
            <p className="text-xs text-white/80 mb-3">Receba as melhores promoções em primeira mão</p>
            <a
              href="https://chat.whatsapp.com/KiKjuB0AiMX0P5sVBteJpz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-green-600 font-bold text-xs px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
            >
              Entrar no Grupo →
            </a>
          </div>

          {/* Banner Instagram */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white text-center">
            <p className="text-2xl mb-2">📸</p>
            <p className="font-bold text-sm mb-1">Siga no Instagram</p>
            <p className="text-xs text-white/80 mb-3">Ofertas diárias nos stories</p>
            <a
              href="https://www.instagram.com/ofertafy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-purple-600 font-bold text-xs px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Seguir →
            </a>
          </div>
        </>
      )}
    </aside>
  )
}

/** Lista compacta de ofertas para sidebar */
function MiniOfferList({
  title,
  offers,
}: {
  title: string
  offers: OfferData[]
}) {
  if (offers.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <h3 className="text-sm font-bold text-slate-900 mb-3">{title}</h3>
      <div className="space-y-3">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href={`/produto/${offer.id}`}
            className="flex items-center gap-3 group"
          >
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 truncate group-hover:text-primary transition-colors">
                {offer.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-slate-900">
                  {formatPrice(offer.price)}
                </span>
                {offer.discountPct >= 15 && (
                  <span className="text-xs text-green-600 font-medium">-{offer.discountPct}%</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
