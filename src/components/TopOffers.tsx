import OfferCard from './OfferCard'
import type { OfferData } from '@/types'

export default function TopOffers({ offers }: { offers: OfferData[] }) {
  if (!offers || offers.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="gradient-primary text-white p-2 rounded-xl">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Top da Semana</h2>
          <p className="text-sm text-slate-500">Mais acessados pelos usuários</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {offers.map((offer) => (
          <div key={`${offer.sourceId || offer.id}-${offer.store}`} className="animate-fade-in">
            <OfferCard offer={offer} />
          </div>
        ))}
      </div>
    </section>
  )
}
