import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { isActive: true },
      orderBy: { startDate: 'asc' },
    })
    return NextResponse.json(campaigns)
  } catch (e) {
    console.error('Campaigns error:', e)
    return NextResponse.json([], { status: 200 })
  }
}
