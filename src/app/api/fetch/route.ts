import { NextRequest, NextResponse } from 'next/server'
import { fetchAllDeals } from '@/lib/fetcher'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Proteger com secret para evitar abusos
  const secret = request.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const results = await fetchAllDeals()
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar ofertas' },
      { status: 500 }
    )
  }
}
