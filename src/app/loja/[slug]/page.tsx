import { getOffersByStore } from '@/lib/fetcher'
import OfferGrid from '@/components/OfferGrid'
import { STORES } from '@/lib/utils'
import { getStore } from '@/lib/stores/registry'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }

function storeBg(slug: string): string {
  const map: Record<string, string> = {
    mercadolivre: 'bg-[#FFF9C4]', magalu: 'bg-[#DBEAFE]',
    amazon: 'bg-[#FFF3E0]', shopee: 'bg-[#FFE0D9]',
    tiktok: 'bg-slate-200', shein: 'bg-slate-100',
  }
  return map[slug] || 'bg-slate-100'
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const store = STORES.find((s) => s.slug === slug)
  const data = await getOffersByStore(slug, 1, 1).catch(() => ({ total: 0 }))
  const noIndex = !store || data.total < 20
  return {
    title: `Ofertas na ${store?.name || slug} | ofertaFy`,
    description: `Encontre as melhores ofertas e promocoes na ${store?.name || slug}. Acompanhe historico de precos e economize!`,
    robots: noIndex ? 'noindex, follow' : undefined,
  }
}

export default async function LojaPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const page = parseInt(sp.page || '1', 10)

  const store = STORES.find((s) => s.slug === slug)
  if (!store) notFound()

  const data = await getOffersByStore(slug, page, 24).catch(() => ({
    offers: [], total: 0, page: 1, pageSize: 24, totalPages: 0,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-primary">Início</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-600 font-medium">{store.name}</span>
      </div>

      {/* Store Header */}
      <div className={`rounded-2xl p-6 md:p-10 mb-8 text-center ${storeBg(slug)}`}>
        <span className="text-4xl block mb-3">{getStore(slug)?.icon || '🏪'}</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">Ofertas na {store.name}</h1>
        <p className="text-slate-600">{data.total} ofertas encontradas • Links de afiliado</p>
      </div>

      {/* Other stores */}
      <div className="flex flex-wrap gap-2 mb-8">
        {STORES.map((s) => (
          <Link key={s.slug} href={`/loja/${s.slug}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${s.slug === slug ? 'gradient-primary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-primary'}`}>
            {s.name}
          </Link>
        ))}
      </div>

      <OfferGrid offers={data.offers} />

      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: Math.min(data.totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/loja/${slug}?page=${p}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${p === page ? 'gradient-primary text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary'}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
