import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatPrice, getBridgeUrl, extractIdFromSlug, slugify } from '@/lib/utils'
import { calculateIndiceOfertafy } from '@/lib/ia'
import PriceChart from '@/components/PriceChart'
import OfferCard from '@/components/OfferCard'
import Breadcrumbs from '@/components/Breadcrumbs'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await findOfferBySlug(slug)
  if (!data) return { title: 'Produto não encontrado — Ofertafy' }
  const { offer } = data

  const title = `${offer.title.slice(0, 60)} — ${formatPrice(offer.price)} na ${offer.storeLabel}`
  const desc = `${offer.title.slice(0, 150)} — De ${formatPrice(offer.originalPrice)} por ${formatPrice(offer.price)} (-${offer.discountPct}%). ${offer.freeShipping ? 'Frete grátis!' : ''} Confira no Ofertafy.`

  return {
    title,
    description: desc,
    alternates: { canonical: `/p/${slug}` },
    openGraph: {
      title,
      description: desc,
      images: [offer.imageUrl],
      url: `/p/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: offer.title.slice(0, 60),
      description: `-${offer.discountPct}% OFF na ${offer.storeLabel}! ${formatPrice(offer.price)}`,
      images: [offer.imageUrl],
    },
  }
}

export default async function ProdutoSlugPage({ params }: Props) {
  const { slug } = await params
  const data = await findOfferBySlug(slug)
  if (!data) notFound()

  const { offer, similar } = data
  const indice = calculateIndiceOfertafy(offer)

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
    },
    brand: { '@type': 'Brand', name: offer.storeLabel },
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      <Breadcrumbs items={[
        { label: 'Início', href: '/' },
        { label: offer.category, href: `/categoria/${offer.categorySlug}` },
        { label: offer.title.slice(0, 50) },
      ]} />

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-10">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="aspect-square bg-slate-100">
              <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" loading="eager" />
            </div>
          </div>

          <div>
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 bg-slate-100">{offer.storeLabel}</span>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 mb-3 leading-tight">{offer.title}</h1>

            <div className="bg-slate-50 rounded-2xl p-5 md:p-6 mb-5">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-2xl md:text-4xl font-extrabold text-slate-900">{formatPrice(offer.price)}</span>
                {offer.originalPrice > offer.price && (
                  <span className="text-base md:text-lg text-slate-400 line-through">{formatPrice(offer.originalPrice)}</span>
                )}
              </div>
              {offer.discountPct >= 15 && (
                <div className="discount-badge inline-block mb-3">-{offer.discountPct}% de desconto</div>
              )}
              {offer.installment && <p className="text-sm text-slate-500 mb-2">{offer.installment}</p>}
              {offer.freeShipping && <p className="text-sm text-green-600 font-semibold">📦 Frete grátis</p>}

              <a href={getBridgeUrl(offer.url, offer.storeLabel)}
                className="block text-center gradient-primary text-white font-bold py-3.5 px-8 rounded-xl mt-4 hover:opacity-95 transition-opacity">
                Ver oferta na {offer.storeLabel} →
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-xs text-slate-400">🤖 Índice Ofertafy</span>
                <p className="text-xl font-extrabold text-primary">{indice.score}/100</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-xs text-slate-400">Categoria</span>
                <p className="text-sm font-bold text-slate-700">{offer.category}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 mb-10">
          <PriceChart history={offer.priceHistory || []} currentPrice={offer.price} />
        </div>

        {/* Conteúdo SEO descritivo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-3">📝 Sobre este produto</h2>
          <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-2">
            <p>
              O <strong>{offer.title}</strong> está disponível na <strong>{offer.storeLabel}</strong> por{' '}
              <strong>{formatPrice(offer.price)}</strong>
              {offer.originalPrice > offer.price && (
                <>, com <strong>{offer.discountPct}% de desconto</strong> sobre o preço original de {formatPrice(offer.originalPrice)}</>
              )}.
              {offer.freeShipping && ' Esta oferta inclui frete grátis.'}
              {offer.installment && ` O pagamento pode ser parcelado em ${offer.installment}.`}
            </p>
            <p>
              De acordo com o <strong>Índice Ofertafy</strong>, esta oferta recebeu uma pontuação de <strong>{indice.score}/100</strong>,
              baseada em fatores como percentual de desconto, reputação da loja, tendência de preço e popularidade.
              {indice.score >= 80
                ? ' Esta é considerada uma excelente oportunidade de compra.'
                : indice.score >= 60
                  ? ' É uma boa oferta que vale a pena considerar.'
                  : ' Recomendamos monitorar o preço por mais alguns dias.'}
            </p>
            <p>
              Na <strong>{offer.storeLabel}</strong>, você encontra este produto na categoria <strong>{offer.category}</strong>.
              O Ofertafy monitora os preços diariamente para garantir que você encontre as melhores ofertas disponíveis.
              Compare preços, histórico e avaliações antes de comprar.
            </p>
          </div>
        </div>

        {similar.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">📦 Produtos similares</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {similar.map((s) => <OfferCard key={s.id} offer={s} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

/** Resolve oferta pelo slug SEO */
async function findOfferBySlug(slug: string): Promise<{ offer: any; similar: any[] } | null> {
  // Tenta extrair ID curto do slug
  const shortId = extractIdFromSlug(slug)
  if (shortId) {
    // Busca por ID que termina com o shortId
    const offers = await prisma.offer.findMany({
      where: { id: { endsWith: shortId } },
      take: 1,
      include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
    })
    if (offers.length > 0) {
      const offer = offers[0]
      const similar = await prisma.offer.findMany({
        where: { categorySlug: offer.categorySlug, id: { not: offer.id } },
        orderBy: { discountPct: 'desc' },
        take: 10,
      })
      return { offer, similar }
    }
  }

  // Fallback: busca por título similar
  const searchTerm = slug.replace(/-/g, ' ').substring(0, 40)
  const offers = await prisma.offer.findMany({
    where: { title: { contains: searchTerm, mode: 'insensitive' } },
    take: 1,
    include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
  })
  if (offers.length > 0) {
    const offer = offers[0]
    const similar = await prisma.offer.findMany({
      where: { categorySlug: offer.categorySlug, id: { not: offer.id } },
      orderBy: { discountPct: 'desc' },
      take: 10,
    })
    return { offer, similar }
  }

  return null
}
