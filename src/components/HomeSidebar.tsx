import Link from 'next/link'
import type { OfferData } from '@/types'
import { formatPrice } from '@/lib/utils'

interface HomeSidebarProps {
  trendingOffers: OfferData[]
  mostClicked: OfferData[]
  side: 'left' | 'right'
}

export default function HomeSidebar({ trendingOffers, mostClicked, side }: HomeSidebarProps) {
  return (
    <aside className="hidden lg:block w-56 shrink-0 space-y-4">
      {side === 'left' ? (
        <>
          <MiniList title="🔥 Maiores quedas" offers={trendingOffers.filter((o) => o.discountPct >= 20).slice(0, 8)} />
          <MiniList title="📈 Em tendência" offers={trendingOffers.slice(0, 8)} />
        </>
      ) : (
        <>
          <MiniList title="👁 Mais acessados" offers={mostClicked.slice(0, 8)} />

          {/* Banner WhatsApp */}
          <div className="bg-green-500 rounded-xl p-4 text-white text-center">
            <p className="text-lg mb-1">📱</p>
            <p className="font-bold text-xs mb-1">Grupo de Ofertas</p>
            <p className="text-[10px] text-white/70 mb-2">Receba em primeira mão</p>
            <a href="https://chat.whatsapp.com/KiKjuB0AiMX0P5sVBteJpz" target="_blank" rel="noopener noreferrer"
              className="inline-block bg-white text-green-600 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
              Entrar no Grupo →
            </a>
          </div>

          {/* Banner Instagram */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-white text-center">
            <p className="text-lg mb-1">📸</p>
            <p className="font-bold text-xs mb-1">Siga no Instagram</p>
            <p className="text-[10px] text-white/70 mb-2">Ofertas nos stories</p>
            <a href="https://www.instagram.com/ofertafy" target="_blank" rel="noopener noreferrer"
              className="inline-block bg-white text-purple-600 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors">
              Seguir →
            </a>
          </div>
        </>
      )}
    </aside>
  )
}

/** Lista vertical compacta de produtos */
function MiniList({ title, offers }: { title: string; offers: OfferData[] }) {
  if (!offers || offers.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3">
      <h3 className="text-xs font-bold text-slate-700 mb-2">{title}</h3>
      <div className="space-y-2">
        {offers.map((offer) => (
          <Link key={offer.id} href={`/produto/${offer.id}`}
            className="flex items-center gap-2 group hover:bg-slate-50 rounded-lg p-1 -mx-1 transition-colors">
            <img src={offer.imageUrl} alt={offer.title}
              className="w-10 h-10 rounded-lg object-cover shrink-0" loading="lazy" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-700 truncate group-hover:text-primary transition-colors leading-tight">
                {offer.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-bold text-slate-900">{formatPrice(offer.price)}</span>
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
