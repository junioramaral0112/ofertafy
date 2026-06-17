import { searchOffers } from '@/lib/fetcher'
import OfferGrid from '@/components/OfferGrid'
import StoreFilter from '@/components/StoreFilter'
import CategoryFilter from '@/components/CategoryFilter'
import Link from 'next/link'

type Props = {
  searchParams: Promise<{
    q?: string
    store?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    minDiscount?: string
    freeShipping?: string
    page?: string
  }>
}

export default async function BuscaPage({ searchParams }: Props) {
  const sp = await searchParams

  const query = sp.q || ''
  const page = parseInt(sp.page || '1', 10)
  const filters = {
    store: sp.store,
    category: sp.category,
    minPrice: sp.minPrice ? parseFloat(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? parseFloat(sp.maxPrice) : undefined,
    minDiscount: sp.minDiscount ? parseInt(sp.minDiscount) : undefined,
    freeShipping: sp.freeShipping === '1',
  }

  const data = await searchOffers(query, filters, page, 24).catch(() => ({
    offers: [], total: 0, page: 1, pageSize: 24, totalPages: 0,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-primary">Início</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-600 font-medium">Busca</span>
        {query && <><span className="mx-2">›</span><span className="text-slate-800">{query}</span></>}
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
          {query ? `Resultados para "${query}"` : 'Todas as Ofertas'}
        </h1>
        <p className="text-slate-500">
          {data.total.toLocaleString()} ofertas encontradas
          {filters.store && ` • Loja: ${filters.store}`}
          {filters.category && ` • Categoria: ${filters.category}`}
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-8">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Loja</p>
          <StoreFilter />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Categoria</p>
          <CategoryFilter />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Desconto minimo</p>
          <div className="flex flex-wrap gap-2">
            {[30, 40, 50, 60, 70].map((d) => {
              const params = new URLSearchParams(sp as Record<string, string>)
              const current = parseInt(sp.minDiscount || '0')
              if (current === d) params.delete('minDiscount')
              else params.set('minDiscount', String(d))
              params.delete('page')
              return (
                <Link key={d} href={`/busca?${params.toString()}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${current === d ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                  {d}%+
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      <OfferGrid offers={data.offers} />

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams(sp as Record<string, string>)
            params.set('page', String(p))
            return (
              <Link key={p} href={`/busca?${params.toString()}`}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${p === page ? 'gradient-primary text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary'}`}>
                {p}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
