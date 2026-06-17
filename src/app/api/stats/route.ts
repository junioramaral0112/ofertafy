import { NextResponse } from 'next/server'
import { getStats } from '@/lib/fetcher'

export async function GET() {
  try {
    const stats = await getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { totalOffers: 0, totalClicks: 0, stores: [] },
      { status: 500 }
    )
  }
}
