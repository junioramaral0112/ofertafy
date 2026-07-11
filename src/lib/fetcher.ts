import { prisma } from './prisma'
import { getCached, setCache, invalidateCache } from './cache'

// ═══════════════════════════════════════════════════════════
// CATEGORIAS PRIORITARIAS — keywords para classificacao
// ═══════════════════════════════════════════════════════════

const PRIORITY_KEYWORDS: Record<string, string[]> = {
  tv: ['tv', 'smart tv', 'televisao', 'televisão', 'oled', 'qled', '4k'],
  celular: ['celular', 'smartphone', 'iphone', 'samsung galaxy', 'xiaomi', 'motorola', 'telefone'],
  notebook: ['notebook', 'laptop', 'macbook', 'chromebook'],
  casa: ['air fryer', 'cafeteira', 'aspirador', 'robo aspirador', 'robô aspirador',
         'geladeira', 'fogao', 'fogão', 'microondas', 'micro-ondas', 'maquina', 'máquina',
         'liquidificador', 'ventilador', 'climatizador', 'purificador'],
  moda: ['tenis', 'tênis', 'vestido', 'perfume', 'maquiagem', 'bolsa', 'camisa',
         'camiseta', 'calca', 'calça', 'jaqueta', 'relogio', 'relógio', 'oculos', 'óculos'],
}

function classifyByTitle(title: string): string | null {
  const t = title.toLowerCase()
  for (const [cat, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some(kw => t.includes(kw))) return cat
  }
  return null
}

// ═══════════════════════════════════════════════════════════
// HOME OFFERS — Diversified, quota-based selection
// ═══════════════════════════════════════════════════════════

export async function getHomeOffers(): Promise<{
  flashDeals: any[]; topOffers: any[]; recentOffers: any[]
}> {
  const cacheKey = 'home:offers'
  const cached = getCached<{ flashDeals: any[]; topOffers: any[]; recentOffers: any[] }>(cacheKey)
  if (cached) return cached

  const [flashDeals, topOffers] = await Promise.all([
    prisma.offer.findMany({
      where: { isFlash: true, flashEndsAt: { gt: new Date() } },
      orderBy: [{ discountPct: 'desc' }, { price: 'asc' }],
      take: 10,
      include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
    }),
    prisma.offer.findMany({
      orderBy: { clicks: 'desc' },
      take: 12,
      include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
    }),
  ])

  // ── Buscar 100 candidatos por loja (sem filtro de desconto) ──
  const stores = ['mercadolivre', 'magalu', 'shopee', 'amazon']
  const storeOffers = await Promise.all(
    stores.map((store) =>
      prisma.offer.findMany({
        where: { store, price: { gt: 0 } },
        orderBy: [{ clicks: 'desc' }, { discountPct: 'desc' }, { price: 'asc' }],
        take: 100,
        include: { priceHistory: { orderBy: { checkedAt: 'desc' }, take: 30 } },
      }),
    ),
  )

  // ── Pool unico com todos os candidatos, deduplicado ──
  const seen = new Set<string>()
  const pool: any[] = []
  for (const arr of storeOffers) {
    for (const o of arr) {
      const key = `${o.store}|${o.sourceId || o.id}`
      if (!seen.has(key)) {
        seen.add(key)
        pool.push(o)
      }
    }
  }

  // ── Classificar por categoria ──
  const buckets: Record<string, any[]> = { tv: [], celular: [], notebook: [], casa: [], moda: [], other: [] }
  const used = new Set<string>()

  for (const o of pool) {
    const cat = classifyByTitle(o.title || '') || 'other'
    if (buckets[cat]) buckets[cat].push(o)
    else buckets['other'].push(o)
  }

  // ── Selecionar com cotas minimas ──
  const selected: any[] = []
  const addFromBucket = (bucket: any[], count: number) => {
    for (const o of bucket) {
      if (count <= 0) break
      const key = `${o.store}|${o.sourceId || o.id}`
      if (!used.has(key)) {
        used.add(key)
        selected.push(o)
        count--
      }
    }
  }

  // Cota minima: 4 de cada categoria
  addFromBucket(buckets['tv'] || [], 4)
  addFromBucket(buckets['celular'] || [], 4)
  addFromBucket(buckets['notebook'] || [], 4)
  addFromBucket(buckets['casa'] || [], 4)
  addFromBucket(buckets['moda'] || [], 4)

  // Top descontos (ainda nao selecionados)
  const byDiscount = [...pool].sort((a, b) => (b.discountPct || 0) - (a.discountPct || 0))
  addFromBucket(byDiscount, 8)

  // Completar ate 30 com o restante
  addFromBucket(pool, 30 - selected.length)

  // ── Intercalar lojas para equilibrio ──
  const perStore: Record<string, any[]> = {}
  for (const o of selected) {
    if (!perStore[o.store]) perStore[o.store] = []
    perStore[o.store].push(o)
  }

  const recentOffers: any[] = []
  let idx = 0
  while (recentOffers.length < selected.length && idx < 30) {
    for (const store of stores) {
      const arr = perStore[store]
      if (arr && arr[idx]) recentOffers.push(arr[idx])
      if (recentOffers.length >= selected.length) break
    }
    idx++
  }

  const data = { flashDeals, topOffers, recentOffers }
  const hasData = flashDeals.length > 0 || topOffers.length > 0 || recentOffers.length > 0
  if (hasData) setCache(cacheKey, data, 300)
  return data
}

// ═══════════════════════════════════════════════════════════
// (restante do arquivo inalterado)
// ═══════════════════════════════════════════════════════════

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

  if (query) {
    const words = query.trim().split(/\s+/).filter((w) => w.length > 0)
    if (words.length === 1) {
      where.title = { contains: words[0], mode: 'insensitive' }
    } else {
      where.AND = words.map((w) => ({ title: { contains: w, mode: 'insensitive' } }))
    }
  }

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

  if (stats.totalOffers > 0) setCache(cacheKey, stats, 600)
  return stats
}
