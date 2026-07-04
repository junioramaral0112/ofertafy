import type { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

const MIN_PRODUCTS = 10

// Whitelist de páginas moda com alto valor SEO
const MODA_WHITELIST = [
  'moda-feminina', 'moda-masculina', 'vestidos', 'tenis-feminino',
  'blusas-femininas', 'calcas-femininas', 'bolsas', 'perfumes', 'maquiagem',
]

// Lojas com afiliado ativo e 10+ produtos
const ACTIVE_STORES = ['shopee', 'amazon', 'magalu']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()
  const now = new Date()

  // ── Rotas estáticas de alto valor ─────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${baseUrl}/cupons`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/ofertas-do-dia`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/melhores-ofertas`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ]

  // ── Moda — páginas SEO de alto valor ─────────────
  const modaRoutes = MODA_WHITELIST.map((slug) => ({
    url: `${baseUrl}/moda/${slug}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  }))

  // ── Lojas ativas (apenas com afiliado funcional) ──
  const storeRoutes = ACTIVE_STORES.map((slug) => ({
    url: `${baseUrl}/loja/${slug}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  // ── Categorias (apenas com 10+ produtos) ──────────
  let categoryRoutes: MetadataRoute.Sitemap = []
  try {
    const catCounts = await prisma.offer.groupBy({
      by: ['categorySlug'],
      _count: true,
      where: { price: { gt: 0 } },
    })
    const validSlugs = catCounts.filter((c) => c._count >= MIN_PRODUCTS).map((c) => c.categorySlug)
    categoryRoutes = validSlugs.map((slug) => ({
      url: `${baseUrl}/categoria/${slug}`,
      lastModified: now,
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    }))
  } catch { /* DB offline */ }

  // ── Produtos (top 100 por score) ──────────────────
  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const topOffers = await prisma.offer.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { scorePromocional: 'desc' },
      take: 100,
    })
    productRoutes = topOffers.map((o) => ({
      url: `${baseUrl}/p/${o.id}`,
      lastModified: o.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }))
  } catch { /* DB offline */ }

  return [...staticRoutes, ...modaRoutes, ...storeRoutes, ...categoryRoutes, ...productRoutes]
}
