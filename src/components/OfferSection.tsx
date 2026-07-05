import Link from 'next/link'
import OfferCard from './OfferCard'
import { getOfferKey } from '@/lib/utils'
import type { OfferData } from '@/types'

type SectionLayout = 'grid' | 'scroll' | 'list'

interface OfferSectionProps {
  title: string
  subtitle?: string
  icon?: string
  offers: OfferData[]
  layout?: SectionLayout
  cta?: { label: string; href: string }
  className?: string
}

/**
 * Bloco reutilizável de ofertas — usado em toda a Home.
 *
 * Layouts suportados:
 * - grid:  grid responsivo (2-5 colunas), padrão para a maioria dos blocos
 * - scroll: scroll horizontal (mobile-friendly, tipo carrossel de cards)
 * - list:   lista vertical compacta (sidebars)
 */
export default function OfferSection({
  title,
  subtitle,
  icon,
  offers,
  layout = 'grid',
  cta,
  className = '',
}: OfferSectionProps) {
  if (!offers || offers.length === 0) return null

  return (
    <section className={`${className}`}>
      {/* Cabeçalho do bloco */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {subtitle && (
            <span className="text-xs text-slate-400 hidden sm:inline">· {subtitle}</span>
          )}
        </div>
        {cta && (
          <Link
            href={cta.href}
            className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
          >
            {cta.label} →
          </Link>
        )}
      </div>

      {/* Conteúdo conforme layout */}
      {layout === 'scroll' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
          {offers.slice(0, 12).map((offer) => (
            <div key={getOfferKey(offer)} className="min-w-[220px] max-w-[260px] snap-start shrink-0">
              <OfferCard offer={offer} compact />
            </div>
          ))}
        </div>
      ) : layout === 'list' ? (
        <div className="space-y-2">
          {offers.slice(0, 10).map((offer) => (
            <Link
              key={getOfferKey(offer)}
              href={`/produto/${offer.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <img
                src={offer.imageUrl}
                alt={offer.title}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 truncate group-hover:text-primary transition-colors">
                  {offer.title}
                </p>
                <p className="text-xs text-slate-400">{offer.storeLabel}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-900">
                  R$ {offer.price.toFixed(2)}
                </p>
                {offer.discountPct >= 10 && (
                  <p className="text-xs text-green-600 font-medium">-{offer.discountPct}%</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* grid — padrão */
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
          {offers.slice(0, 15).map((offer) => (
            <OfferCard key={getOfferKey(offer)} offer={offer} />
          ))}
        </div>
      )}
    </section>
  )
}
