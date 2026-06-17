import { NextRequest, NextResponse } from 'next/server'
import { getHomeOffers, getOffersByCategory, getOffersByStore, getOfferById } from '@/lib/fetcher'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')
  const category = searchParams.get('category')
  const store = searchParams.get('store')
  const page = parseInt(searchParams.get('page') || '1', 10)

  try {
    if (id) {
      const data = await getOfferById(id)
      if (!data) return NextResponse.json({ error: 'Oferta nao encontrada' }, { status: 404 })
      return NextResponse.json(data)
    }

    if (category) {
      const data = await getOffersByCategory(category, page, 24)
      return NextResponse.json(data)
    }

    if (store) {
      const data = await getOffersByStore(store, page, 24)
      return NextResponse.json(data)
    }

    // Default: home offers
    const data = await getHomeOffers()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Offers error:', error)
    return NextResponse.json({ error: 'Erro ao buscar ofertas' }, { status: 500 })
  }
}
