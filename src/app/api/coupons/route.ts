import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchAllCoupons, saveCoupons } from '@/lib/affiliates/coupons'

export const dynamic = 'force-dynamic'

function getAffiliateConfig() {
  return {
    mlMattTool: process.env.ML_MATT_TOOL || '35888960',
    magaluStoreId: process.env.MAGALU_STORE_ID || 'ofertafy',
    shopeeAppId: process.env.SHOPEE_APP_ID || '',
    shopeeSecret: process.env.SHOPEE_SECRET || '',
    amazonAssociateTag: process.env.AMAZON_ASSOCIATE_TAG || 'ofertafy00-20',
    amazonAccessKey: process.env.AMAZON_ACCESS_KEY || '',
    amazonSecretKey: process.env.AMAZON_SECRET_KEY || '',
  }
}

/**
 * GET /api/coupons
 *
 * Retorna cupons ativos do banco.
 * Query params:
 *   ?provider=shopee  → filtra por loja
 *   ?refresh=true      → força re-scraping antes de retornar
 *   ?secret=xxx        → proteção para refresh
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const provider = searchParams.get('provider')
  const refresh = searchParams.get('refresh') === 'true'
  const secret = searchParams.get('secret')

  // Refresh: busca cupons frescos via scraping
  if (refresh) {
    const expectedSecret = process.env.CRON_SECRET
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    try {
      const config = getAffiliateConfig()
      const coupons = await fetchAllCoupons(config)
      await saveCoupons(coupons)
    } catch (error) {
      console.error('Erro ao buscar cupons:', error)
    }
  }

  // Buscar cupons ativos do banco
  const where: Record<string, unknown> = { isActive: true }
  if (provider) where.provider = provider

  const coupons = await prisma.coupon.findMany({
    where: where as any,
    orderBy: [{ provider: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  })

  return NextResponse.json({
    coupons,
    total: coupons.length,
    timestamp: new Date().toISOString(),
  })
}
