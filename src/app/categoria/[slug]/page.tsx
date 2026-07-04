import type { Metadata } from 'next'
import { getOffersByCategory } from '@/lib/fetcher'
import OfferGrid from '@/components/OfferGrid'
import Breadcrumbs from '@/components/Breadcrumbs'
import { CATEGORIES } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cat = CATEGORIES.find((c) => c.slug === slug)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ofertafy.com.br'

  // Só indexa se tiver 20+ produtos
  const data = await getOffersByCategory(slug, 1, 1).catch(() => ({ total: 0 }))
  const noIndex = !cat || data.total < 20

  return {
    title: `${cat?.name || 'Categoria'} — Melhores Ofertas e Promoções`,
    description: `As melhores ofertas de ${cat?.name || slug} no Mercado Livre, Magalu, Shopee e Amazon. Compare preços, cupons e economize!`,
    alternates: { canonical: `${siteUrl}/categoria/${slug}` },
    robots: noIndex ? 'noindex, follow' : undefined,
    openGraph: {
      title: `${cat?.name} — Ofertas e Promoções`,
      description: `Encontre as melhores ofertas de ${cat?.name || slug} com até 90% OFF.`,
      url: `/categoria/${slug}`,
    },
  }
}

export default async function CategoriaPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const page = parseInt(sp.page || '1', 10)

  const cat = CATEGORIES.find((c) => c.slug === slug)
  if (!cat) notFound()

  const data = await getOffersByCategory(slug, page, 24).catch(() => ({
    offers: [], total: 0, page: 1, pageSize: 24, totalPages: 0,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: cat.name }]} />

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">{cat.name}</h1>
        <p className="text-slate-500">{data.total} ofertas encontradas</p>
      </div>

      {/* Subcategories - outras categorias */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/categoria/${c.slug}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${c.slug === slug ? 'gradient-primary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-primary'}`}>
            {c.name}
          </Link>
        ))}
      </div>

      <OfferGrid offers={data.offers} />

      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: Math.min(data.totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/categoria/${slug}?page=${p}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${p === page ? 'gradient-primary text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary'}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
