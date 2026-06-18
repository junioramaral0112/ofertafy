import { prisma } from './prisma'
import { getCached, setCache, invalidateCache } from './cache'
import { fetchMercadoLivreDeals } from './affiliates/mercadolivre'
import { fetchMagaluDeals } from './affiliates/magalu'
import { fetchAmazonDeals } from './affiliates/amazon'
import { fetchShopeeDeals } from './affiliates/shopee'
import type { FetchResult } from '@/types'

function getAffiliateConfig() {
  return {
    mlMattTool: process.env.ML_MATT_TOOL || '35888960',
    magaluStoreId: process.env.MAGALU_STORE_ID || 'ofertafy',

    // Shopee API oficial
    shopeeAppId: process.env.SHOPEE_APP_ID || '',
    shopeeSecret: process.env.SHOPEE_SECRET || '',
    amazonAssociateTag: process.env.AMAZON_ASSOCIATE_TAG || '',
    amazonAccessKey: process.env.AMAZON_ACCESS_KEY || '',
    amazonSecretKey: process.env.AMAZON_SECRET_KEY || '',
  }
}

/**
 * Busca ofertas de TODAS as lojas: ML, Magalu, Amazon, Shopee
 */
export async function fetchAllDeals(): Promise<FetchResult[]> {
  const config = getAffiliateConfig()
  const results: FetchResult[] = []

  const [mlDeals, magaluDeals, amazonDeals, shopeeDeals] = await Promise.all([
    fetchMercadoLivreDeals(config).catch((e) => { console.error('ML:', e); return [] }),
    fetchMagaluDeals(config).catch((e) => { console.error('Magalu:', e); return [] }),
    fetchAmazonDeals(config).catch((e) => { console.error('Amazon:', e); return [] }),
    fetchShopeeDeals(config).catch((e) => { console.error('Shopee:', e); return [] }),
  ])

  // Processar e salvar no banco
  const processStore = async (
    deals: typeof mlDeals,
    storeLabel: string
  ): Promise<FetchResult> => {
    let added = 0
    let updated = 0
    const errors: string[] = []

    for (const deal of deals) {
      try {
        if (!deal.sourceId || !deal.title) {
          errors.push(`Oferta invalida: ${JSON.stringify(deal).slice(0, 100)}`)
          continue
        }

        const existing = await prisma.offer.findFirst({
          where: { sourceId: deal.sourceId, store: deal.store },
        })

        if (existing) {
          if (existing.price !== deal.price) {
            await prisma.priceHistory.create({
              data: { offerId: existing.id, price: deal.price },
            })
          }
          await prisma.offer.update({
            where: { id: existing.id },
            data: {
              price: deal.price,
              originalPrice: deal.originalPrice,
              discountPct: deal.discountPct,
              imageUrl: deal.imageUrl,
              url: deal.url,
              freeShipping: deal.freeShipping,
              installment: deal.installment,
              updatedAt: new Date(),
            },
          })
          updated++
        } else {
          await prisma.offer.create({ data: { ...deal } })
          added++
        }
      } catch (error) {
        errors.push(`Erro ao processar ${deal.title}: ${String(error)}`)
      }
    }

    invalidateCache('offers')
    invalidateCache('home')

    return { store: storeLabel, offersFound: deals.length, offersAdded: added, offersUpdated: updated, errors: errors.slice(0, 5) }
  }

  const [mlResult, magaluResult, amazonResult, shopeeResult] = await Promise.all([
    processStore(mlDeals, 'Mercado Livre'),
    processStore(magaluDeals, 'Magalu'),
    processStore(amazonDeals, 'Amazon'),
    processStore(shopeeDeals, 'Shopee'),
  ])

  results.push(mlResult, magaluResult, amazonResult, shopeeResult)

  return results
}

export async function getHomeOffers(): Promise<{ flashDeals: any[]; topOffers: any[]; recentOffers: any[] }> {
  const cacheKey = 'home:offers'
  const cached = getCached<{ flashDeals: any[]; topOffers: any[]; recentOffers: any[] }>(cacheKey)
  if (cached) return cached

  const [flashDeals, topOffers, recentOffers] = await Promise.all([
    // Flash: ofertas relâmpago ativas, maior desconto primeiro
    prisma.offer.findMany({
      where: { isFlash: true, flashEndsAt: { gt: new Date() } },
      orderBy: [{ discountPct: 'desc' }, { price: 'asc' }],
      take: 10,
      include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
    }),
    // Top week: mais clicados
    prisma.offer.findMany({
      orderBy: { clicks: 'desc' },
      take: 12,
      include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
    }),
    // Recentes: prioriza desconto agressivo + preço acessível
    // Regra: desconto > 30% OU preço < R$200 = prioridade máxima
    // Evita produtos acima de R$3000 a menos que tenham 50%+ OFF
    prisma.offer.findMany({
      where: {
        OR: [
          { discountPct: { gte: 30 }, price: { lte: 200 } },   // Super desconto + barato
          { discountPct: { gte: 50 } },                          // Desconto agressivo (qualquer preço)
          { price: { lte: 100 } },                               // Muito barato
          { price: { lte: 500 }, discountPct: { gte: 20 } },    // Preço médio + bom desconto
        ],
      },
      orderBy: [{ discountPct: 'desc' }, { price: 'asc' }],
      take: 24,
      include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
    }),
  ])

  const data = { flashDeals, topOffers, recentOffers }

  // ⚠️ Só cacheia se houver dados reais (evita cache vazio do build)
  const hasData = flashDeals.length > 0 || topOffers.length > 0 || recentOffers.length > 0
  if (hasData) {
    setCache(cacheKey, data, 300)
  }

  return data
}

export async function getOffersByCategory(slug: string, page = 1, pageSize = 24) {
  const skip = (page - 1) * pageSize
  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where: { categorySlug: slug },
      orderBy: { discountPct: 'desc' },
      skip, take: pageSize,
      include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
    }),
    prisma.offer.count({ where: { categorySlug: slug } }),
  ])
  return { offers, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getOffersByStore(slug: string, page = 1, pageSize = 24) {
  const skip = (page - 1) * pageSize
  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where: { store: slug },
      orderBy: { discountPct: 'desc' },
      skip, take: pageSize,
      include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
    }),
    prisma.offer.count({ where: { store: slug } }),
  ])
  return { offers, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function searchOffers(
  query: string,
  filters: {
    store?: string; category?: string; minPrice?: number
    maxPrice?: number; minDiscount?: number; freeShipping?: boolean
  } = {},
  page = 1,
  pageSize = 24
) {
  const skip = (page - 1) * pageSize
  const where: Record<string, unknown> = {}

  if (query) where.title = { contains: query }
  if (filters.store) where.store = filters.store
  if (filters.category) where.categorySlug = filters.category
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {}
    if (filters.minPrice !== undefined) (where.price as Record<string, number>).gte = filters.minPrice
    if (filters.maxPrice !== undefined) (where.price as Record<string, number>).lte = filters.maxPrice
  }
  if (filters.minDiscount) where.discountPct = { gte: filters.minDiscount }
  if (filters.freeShipping) where.freeShipping = true

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where: where as any,
      orderBy: { discountPct: 'desc' },
      skip, take: pageSize,
      include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
    }),
    prisma.offer.count({ where: where as any }),
  ])

  if (query) {
    try {
      await prisma.searchTerm.upsert({
        where: { term: query.toLowerCase() },
        update: { count: { increment: 1 }, updatedAt: new Date() },
        create: { term: query.toLowerCase() },
      })
    } catch { /* ignore */ }
  }

  return { offers, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getOfferById(id: string) {
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 60 } },
  })
  if (!offer) return null

  await prisma.offer.update({ where: { id }, data: { clicks: { increment: 1 } } })

  const similar = await prisma.offer.findMany({
    where: { categorySlug: offer.categorySlug, id: { not: offer.id } },
    orderBy: { discountPct: 'desc' },
    take: 8,
    include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
  })

  return { offer, similar }
}

export async function getStats(): Promise<{ totalOffers: number; totalClicks: number; stores: { store: string; count: number }[] }> {
  const cacheKey = 'stats'
  const cached = getCached<{ totalOffers: number; totalClicks: number; stores: { store: string; count: number }[] }>(cacheKey)
  if (cached) return cached

  const [totalOffers, stores, totalClicks] = await Promise.all([
    prisma.offer.count(),
    prisma.offer.groupBy({ by: ['store'], _count: true }),
    prisma.offer.aggregate({ _sum: { clicks: true } }),
  ])

  const stats = {
    totalOffers,
    totalClicks: totalClicks._sum.clicks || 0,
    stores: stores.map((s) => ({ store: s.store, count: s._count })),
  }

  // ⚠️ Só cacheia se houver dados reais
  if (stats.totalOffers > 0) {
    setCache(cacheKey, stats, 600)
  }
  return stats
}
