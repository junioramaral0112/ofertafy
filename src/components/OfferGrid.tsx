import OfferCard from './OfferCard'
import type { OfferData } from '@/types'

export default function OfferGrid({ offers }: { offers: OfferData[] }) {
  if (!offers || offers.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl mb-4 block">🔍</span>
        <p className="text-slate-500 text-lg">Nenhuma oferta encontrada.</p>
        <p className="text-slate-400 text-sm mt-2">Tente ajustar os filtros ou buscar por outro termo.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {offers.map((offer, idx) => (
        <div key={`${offer.sourceId || offer.id}-${offer.store}-${idx}`} className="animate-fade-in">
          <OfferCard offer={offer} />
        </div>
      ))}
    </div>
  )
}
