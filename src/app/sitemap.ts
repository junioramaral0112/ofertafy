import type { MetadataRoute } from 'next'
import { CATEGORIES, STORES } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ofertafy.com.br'
  const now = new Date()

  // ── Rotas estáticas ──────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${baseUrl}/busca`, lastModified: now, changeFrequency: 'always', priority: 0.9 },
    { url: `${baseUrl}/cupons`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
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

  // ── Produtos (top 100 por desconto) ──────────────
  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const topOffers = await prisma.offer.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { discountPct: 'desc' },
      take: 500,
    })
    productRoutes = topOffers.map((o) => ({
      url: `${baseUrl}/produto/${o.id}`,
      lastModified: o.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }))
  } catch {
    // DB não disponível durante build — fallback vazio
  }

  return [...staticRoutes, ...categoryRoutes, ...storeRoutes, ...productRoutes]
}
