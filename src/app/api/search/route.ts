import { NextRequest, NextResponse } from 'next/server'
import { searchOffers } from '@/lib/fetcher'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const store = searchParams.get('store') || undefined
  const category = searchParams.get('category') || undefined
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const minDiscount = searchParams.get('minDiscount')
  const freeShipping = searchParams.get('freeShipping')

  const filters = {
    store,
    category,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    minDiscount: minDiscount ? parseInt(minDiscount) : undefined,
    freeShipping: freeShipping === '1' || freeShipping === 'true',
  }

  try {
    const data = await searchOffers(query, filters, page, 24)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ofertas', offers: [], total: 0, page, pageSize: 24, totalPages: 0 },
      { status: 500 }
    )
  }
}
