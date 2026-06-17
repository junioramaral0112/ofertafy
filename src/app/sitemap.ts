import type { MetadataRoute } from 'next'
import { CATEGORIES, STORES } from '@/lib/utils'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ofertafy.com.br'

  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'hourly' as const, priority: 1 },
    { url: `${baseUrl}/busca`, lastModified: new Date(), changeFrequency: 'always' as const, priority: 0.9 },
  ]

  const categoryRoutes = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  const storeRoutes = STORES.map((store) => ({
    url: `${baseUrl}/loja/${store.slug}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...categoryRoutes, ...storeRoutes]
}
