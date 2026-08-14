import { NextRequest, NextResponse } from 'next/server'
import { searchOffers } from '@/lib/fetcher'
import { getSynonyms, rankOffers, extractBrand } from '@/lib/search-ranking'

// ═══════════════════════════════════════════════════════════════════
// SEARCH API — sinônimos + ranking centralizado (src/lib/search-ranking)
// Filtros: ?q= &store= &category= &minPrice= &maxPrice= &brand= &page=
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const rawQuery = searchParams.get('q') || ''
  const synonyms = getSynonyms(rawQuery)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const store = searchParams.get('store') || undefined
  const category = searchParams.get('category') || undefined
  const minPrice = searchParams.get('minPrice')
    ? parseFloat(searchParams.get('minPrice')!)
    : undefined
  const maxPrice = searchParams.get('maxPrice')
    ? parseFloat(searchParams.get('maxPrice')!)
    : undefined
  const brand = searchParams.get('brand') || undefined

  try {
    // Busca cada sinonimo individualmente e combina resultados
    const allOffers: any[] = []
    const seen = new Set<string>()

    for (const term of synonyms.slice(0, 6)) {
      const data = await searchOffers(
        term,
        { store, category, minPrice, maxPrice },
        1,
        12
      )
      for (const offer of data.offers || []) {
        const key = `${offer.store}|${offer.sourceId || offer.id}`
        if (!seen.has(key)) {
          seen.add(key)
          allOffers.push(offer)
        }
      }
    }

    // Filtro de marca (extraída do título pelo ranking engine)
    let filtered = allOffers
    if (brand) {
      filtered = allOffers.filter((o) => (extractBrand(o.title || '') || '').toLowerCase() === brand.toLowerCase())
    }

    // Ordenar por score de relevancia (celulares/TVs reais no topo,
    // acessorios no final) com desempate por desconto
    const ranked = rankOffers(filtered, rawQuery)

    // Paginate combined results
    const pageSize = 24
    const total = ranked.length
    const start = (page - 1) * pageSize
    const paged = ranked.slice(start, start + pageSize)

    return NextResponse.json({
      offers: paged,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ofertas', offers: [], total: 0, page, pageSize: 24, totalPages: 0 },
      { status: 500 }
    )
  }
}
