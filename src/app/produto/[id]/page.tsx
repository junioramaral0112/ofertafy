import { getOfferById } from '@/lib/fetcher'
import PriceChart from '@/components/PriceChart'
import OfferCard from '@/components/OfferCard'
import { formatPrice, sanitizeAffiliateUrl } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export default async function ProdutoPage({ params }: Props) {
  const { id } = await params
  const data = await getOfferById(id).catch(() => null)
  if (!data) notFound()

  const { offer, similar } = data

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-primary">Início</Link>
        <span className="mx-2">›</span>
        <Link href={`/categoria/${offer.categorySlug}`} className="hover:text-primary">{offer.category}</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-600 line-clamp-1">{offer.title.slice(0, 40)}...</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="aspect-square bg-slate-100">
            <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" />
          </div>
        </div>

        <div>
          {/* Store badge */}
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${storeBadgeColor(offer.store)}`}>
            {offer.storeLabel}
          </span>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 leading-tight">{offer.title}</h1>
          {offer.description && <p className="text-slate-500 mb-6">{offer.description}</p>}

          <div className="bg-slate-50 rounded-2xl p-6 mb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl md:text-4xl font-extrabold text-slate-900">{formatPrice(offer.price)}</span>
              {offer.originalPrice > offer.price && (
                <span className="text-lg text-slate-400 line-through">{formatPrice(offer.originalPrice)}</span>
              )}
            </div>
            {offer.discountPct >= 15 && (
              <div className="discount-badge inline-block mb-3">-{offer.discountPct}% de desconto</div>
            )}
            {offer.installment && <p className="text-sm text-slate-500 mb-3">{offer.installment}</p>}
            {offer.freeShipping && <p className="text-sm text-green-600 font-semibold">📦 Frete grátis</p>}

            <a href={sanitizeAffiliateUrl(offer.url, offer.store)} target="_blank" rel="noopener noreferrer"
              className="block text-center gradient-primary text-white font-bold py-4 px-8 rounded-xl mt-4 hover:opacity-95 transition-opacity text-lg">
              Ver oferta na {offer.storeLabel} →
            </a>
            <p className="text-xs text-slate-400 text-center mt-2">
              {offer.store === 'mercadolivre' && 'Link de afiliado com matt_tool=35888960. '}
              {offer.store === 'magalu' && 'Link via Magazine Voce. '}
              Você não paga nada a mais por isso.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Visitas</p>
              <p className="text-lg font-bold text-slate-700">{offer.clicks}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Categoria</p>
              <p className="text-sm font-bold text-slate-700">{offer.category}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-12">
        <PriceChart history={offer.priceHistory || []} currentPrice={offer.price} />
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">📦 Produtos similares</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {similar.map((s) => <OfferCard key={s.id} offer={s} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function storeBadgeColor(store: string): string {
  const map: Record<string, string> = {
    mercadolivre: 'bg-[#FFE600] text-slate-900',
    magalu:        'bg-[#0086FF] text-white',
    shopee:        'bg-[#EE4D2D] text-white',
    amazon:        'bg-[#FF9900] text-slate-900',
  }
  return map[store] || 'bg-slate-200 text-slate-700'
}
