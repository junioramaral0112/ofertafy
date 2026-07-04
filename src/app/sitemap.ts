import type { MetadataRoute } from 'next'
import { CATEGORIES, STORES, getBaseUrl } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

const MODA_WHITELIST = [
  'moda-feminina', 'moda-masculina', 'vestidos', 'tenis-feminino',
  'blusas-femininas', 'calcas-femininas', 'bolsas', 'perfumes', 'maquiagem',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()
  const now = new Date()

  // ── Rotas estáticas ──────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${baseUrl}/cupons`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/ofertas-do-dia`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/melhores-ofertas`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/promocoes-amazon`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/promocoes-mercado-livre`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/promocoes-shopee`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
  ]

  // ── Moda — páginas SEO ───────────────────────────
  const modaRoutes = MODA_WHITELIST.map((slug) => ({
    url: `${baseUrl}/moda/${slug}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  }))

  // ── Todas as lojas (noindex na página controla indexação) ──
  const storeRoutes = STORES.map((store) => ({
    url: `${baseUrl}/loja/${store.slug}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  // ── Todas as categorias (noindex se < 10 produtos) ──
  const categoryRoutes = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  // ── Top 100 produtos ─────────────────────────────
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
