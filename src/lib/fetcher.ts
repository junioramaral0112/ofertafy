import { prisma } from './prisma'
import { getCached, setCache, invalidateCache } from './cache'

export async function getHomeOffers(): Promise<{ flashDeals: any[]; topOffers: any[]; recentOffers: any[] }> {
  const cacheKey = 'home:offers'
  const cached = getCached<{ flashDeals: any[]; topOffers: any[]; recentOffers: any[] }>(cacheKey)
  if (cached) return cached

  const [flashDeals, topOffers] = await Promise.all([
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
  ])

  // Recentes: busca 8 de cada loja ativa e intercala para equilibrar
  // Filtro leve: só ignora produtos sem desconto ou com preço zero
  const stores = ['mercadolivre', 'magalu', 'shopee', 'amazon']
  const storeOffers = await Promise.all(
    stores.map((store) =>
      prisma.offer.findMany({
        where: {
          store,
          price: { gt: 0 },
          discountPct: { gte: 5 }, // filtro leve — só ignora sem desconto
        },
        orderBy: [{ discountPct: 'desc' }, { clicks: 'desc' }, { price: 'asc' }],
        take: 8,
        include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
      }),
    ),
  )

  // Intercala: 1 de cada loja alternadamente
  const recentOffers: any[] = []
  let idx = 0
  while (recentOffers.length < 24 && idx < 8) {
    for (const arr of storeOffers) {
      if (arr[idx]) recentOffers.push(arr[idx])
      if (recentOffers.length >= 24) break
    }
    idx++
  }

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

  // Busca por palavra-chave: case-insensitive + múltiplas palavras
  if (query) {
    const words = query.trim().split(/\s+/).filter((w) => w.length > 0)
    if (words.length === 1) {
      // Palavra única: contains case-insensitive
      where.title = { contains: words[0], mode: 'insensitive' }
    } else {
      // Múltiplas palavras: cada uma deve aparecer no título (AND)
      where.AND = words.map((w) => ({
        title: { contains: w, mode: 'insensitive' },
      }))
    }
  }

  // Filtro por loja
  if (filters.store) where.store = filters.store

  // Filtro por categoria (via categorySlug)
  if (filters.category) where.categorySlug = filters.category

  // Filtro por faixa de preço
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {}
    if (filters.minPrice !== undefined) (where.price as Record<string, number>).gte = filters.minPrice
    if (filters.maxPrice !== undefined) (where.price as Record<string, number>).lte = filters.maxPrice
  }

  // Filtro por desconto mínimo
  if (filters.minDiscount) where.discountPct = { gte: filters.minDiscount }

  // Filtro por frete grátis
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
