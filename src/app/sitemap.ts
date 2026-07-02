import type { MetadataRoute } from 'next'
import { CATEGORIES, STORES, getBaseUrl } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()
  const now = new Date()

  // ── Rotas estáticas ──────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${baseUrl}/busca`, lastModified: now, changeFrequency: 'always', priority: 0.9 },
    { url: `${baseUrl}/cupons`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    // SEO pages
    { url: `${baseUrl}/ofertas-do-dia`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/melhores-ofertas`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/promocoes-amazon`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/promocoes-mercado-livre`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/promocoes-shopee`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/sobre-nos`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contato`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.1 },
    // Moda — SEO pages
    { url: `${baseUrl}/moda/moda-feminina`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/moda/moda-masculina`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/moda/vestidos`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/moda/calcados`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/moda/bolsas`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/moda/tenis-feminino`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/moda/tenis-masculino`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
  ]

  // ── Categorias ───────────────────────────────────
  const categoryRoutes = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  // ── Lojas ────────────────────────────────────────
  const storeRoutes = STORES.map((store) => ({
    url: `${baseUrl}/loja/${store.slug}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  // ── Produtos (top 50 por score — limite rígido para build rápido) ──
  // ⚠️  5000 produtos causava Timeout/OOM na Vercel (plano Hobby).
  //      Mantemos 50 — o restante é indexado via link discovery.
  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const topOffers = await prisma.offer.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { scorePromocional: 'desc' },
      take: 50,
    })
    productRoutes = topOffers.map((o) => ({
      url: `${baseUrl}/produto/${o.id}`,
      lastModified: o.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }))
  } catch { /* DB offline during build */ }

  return [...staticRoutes, ...categoryRoutes, ...storeRoutes, ...productRoutes]
}
