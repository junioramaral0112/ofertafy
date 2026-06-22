import type { Metadata } from 'next'
import { getOfferById } from '@/lib/fetcher'
import PriceChart from '@/components/PriceChart'
import OfferCard from '@/components/OfferCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import { formatPrice, sanitizeAffiliateUrl } from '@/lib/utils'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const data = await getOfferById(id).catch(() => null)
  if (!data) return { title: 'Produto não encontrado' }

  const { offer } = data
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ofertafy.com.br'

  return {
    title: `${offer.title.slice(0, 60)} — ${formatPrice(offer.price)} na ${offer.storeLabel}`,
    description: `${offer.title.slice(0, 150)} — De ${formatPrice(offer.originalPrice)} por ${formatPrice(offer.price)} (-${offer.discountPct}%). ${offer.freeShipping ? 'Frete grátis!' : ''}`,
    alternates: { canonical: `/produto/${offer.id}` },
    openGraph: {
      title: `${offer.title.slice(0, 60)} — ${formatPrice(offer.price)}`,
      description: `De ${formatPrice(offer.originalPrice)} por ${formatPrice(offer.price)} na ${offer.storeLabel}. ${offer.discountPct}% OFF!`,
      images: [offer.imageUrl],
      url: `/produto/${offer.id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${offer.title.slice(0, 60)}`,
      description: `-${offer.discountPct}% OFF na ${offer.storeLabel}! ${formatPrice(offer.price)}`,
      images: [offer.imageUrl],
    },
  }
}

export default async function ProdutoPage({ params }: Props) {
  const { id } = await params
  const data = await getOfferById(id).catch(() => null)
  if (!data) notFound()

  const { offer, similar } = data

  // JSON-LD: Product
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: offer.title,
    description: offer.description || offer.title,
    image: offer.imageUrl,
    offers: {
      '@type': 'Offer',
      price: offer.price,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: offer.url,
      priceValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    brand: {
      '@type': 'Brand',
      name: offer.storeLabel,
    },
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: offer.category, href: `/categoria/${offer.categorySlug}` },
          { label: offer.title.slice(0, 50) },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-10">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="aspect-square bg-slate-100">
              <img
                src={offer.imageUrl}
                alt={offer.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          <div>
            <span
              className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${storeBadgeColor(offer.store)}`}
            >
              {offer.storeLabel}
            </span>

            <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 mb-3 leading-tight">
              {offer.title}
            </h1>
            {offer.description && (
              <p className="text-slate-500 mb-5 text-sm">{offer.description}</p>
            )}

            <div className="bg-slate-50 rounded-2xl p-5 md:p-6 mb-5">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-2xl md:text-4xl font-extrabold text-slate-900">
                  {formatPrice(offer.price)}
                </span>
                {offer.originalPrice > offer.price && (
                  <span className="text-base md:text-lg text-slate-400 line-through">
                    {formatPrice(offer.originalPrice)}
                  </span>
                )}
              </div>
              {offer.discountPct >= 15 && (
                <div className="discount-badge inline-block mb-3">
                  -{offer.discountPct}% de desconto
                </div>
              )}
              {offer.installment && (
                <p className="text-sm text-slate-500 mb-2">{offer.installment}</p>
              )}
              {offer.freeShipping && (
                <p className="text-sm text-green-600 font-semibold">📦 Frete grátis</p>
              )}

              <a
                href={sanitizeAffiliateUrl(offer.url, offer.store)}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center gradient-primary text-white font-bold py-3.5 px-8 rounded-xl mt-4 hover:opacity-95 transition-opacity text-base md:text-lg"
              >
                Ver oferta na {offer.storeLabel} →
              </a>
              <p className="text-xs text-slate-400 text-center mt-2">
                Você não paga nada a mais por isso. Preço atualizado via link de afiliado.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
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

        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 mb-10">
          <PriceChart history={offer.priceHistory || []} currentPrice={offer.price} />
        </div>

        {similar.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">📦 Produtos similares</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {similar.map((s) => (
                <OfferCard key={s.id} offer={s} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function storeBadgeColor(store: string): string {
  const map: Record<string, string> = {
    mercadolivre: 'bg-[#FFE600] text-slate-900',
    magalu: 'bg-[#0086FF] text-white',
    shopee: 'bg-[#EE4D2D] text-white',
    amazon: 'bg-[#FF9900] text-slate-900',
  }
  return map[store] || 'bg-slate-200 text-slate-700'
}
