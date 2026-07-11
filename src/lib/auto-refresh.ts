/**
 * AUTO-REFRESH ENGINE
 *
 * Orquestra os scrapers EXISTENTES (que ja funcionam sem API keys).
 * Apenas controla batch e frequencia — NAO reescreve a logica de scraping.
 */

import { prisma } from './prisma'
import { invalidateCache } from './cache'
import { fetchAllDeals } from './fetch-all-deals'

interface RefreshResult {
  store: string
  dealsFound: number
  dealsAdded: number
  dealsUpdated: number
  dealsDeactivated: number
  errors: string[]
  durationMs: number
}

export async function runAutoRefresh(storeFilter?: string): Promise<RefreshResult[]> {
  const results: RefreshResult[] = []

  try {
    const start = Date.now()

    // Usa o fetchAllDeals EXISTENTE — mesmo scraper que ja funciona
    const allResults = await fetchAllDeals({
      storeFilter,
      batchNumber: 1,
      batchSize: 50,
    })

    for (const r of allResults) {
      const storeName = r.store?.toLowerCase().replace(/ /g, '') || 'unknown'
      if (storeFilter && storeName !== storeFilter) continue

      results.push({
        store: storeName,
        dealsFound: r.offersFound || 0,
        dealsAdded: r.offersAdded || 0,
        dealsUpdated: r.offersUpdated || 0,
        dealsDeactivated: 0,
        errors: (r.errors || []).slice(0, 3),
        durationMs: Date.now() - start,
      })
    }
  } catch (e: any) {
    results.push({
      store: storeFilter || 'all',
      dealsFound: 0, dealsAdded: 0, dealsUpdated: 0, dealsDeactivated: 0,
      errors: [e.message?.slice(0, 200)],
      durationMs: 0,
    })
  }

  // Invalidate caches
  invalidateCache('home')
  invalidateCache('offers')
  invalidateCache('stats')

  return results
}
