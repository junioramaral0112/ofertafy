/**
 * AUTO-REFRESH ENGINE
 *
 * NAO executa scraping (cron /api/fetch ja faz isso).
 * Apenas atualiza o ranking e rotaciona ofertas no banco existente.
 *
 * Foca em:
 *   - Atualizar score de ofertas existentes
 *   - Reordenar Home com produtos diversificados
 *   - Limpar cache para forcar refresh visual
 */

import { prisma } from './prisma'
import { invalidateCache } from './cache'

interface RefreshResult {
  store: string
  processed: number
  flashUpdated: number
  dealTagsApplied: number
  staleCleaned: number
  errors: string[]
  durationMs: number
}

export async function runAutoRefresh(storeFilter?: string): Promise<RefreshResult[]> {
  const results: RefreshResult[] = []
  const stores = storeFilter ? [storeFilter] : ['mercadolivre', 'magalu', 'shopee', 'amazon']

  for (const store of stores) {
    const start = Date.now()
    const result: RefreshResult = {
      store,
      processed: 0,
      flashUpdated: 0,
      dealTagsApplied: 0,
      staleCleaned: 0,
      errors: [],
      durationMs: 0,
    }

    try {
      // 1. Marcar como FLASH ofertas com alto desconto (>30%) e recentes
      const flashUpdated = await prisma.offer.updateMany({
        where: {
          store,
          discountPct: { gte: 30 },
          price: { gt: 0 },
          imageUrl: { not: '' },
          isFlash: false,
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        data: { isFlash: true },
      })
      result.flashUpdated = flashUpdated.count

      // 2. Marcar como BEST SELLER ofertas com muitos cliques
      const bestsellerUpdated = await prisma.offer.updateMany({
        where: {
          store,
          clicks: { gte: 10 },
          isFlash: false,
        },
        data: { isFlash: true },
      })
      result.flashUpdated += bestsellerUpdated.count

      // 3. Limpar FLASH de ofertas antigas (>7 dias sem update)
      const staleCleaned = await prisma.offer.updateMany({
        where: {
          store,
          isFlash: true,
          updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        data: { isFlash: false },
      })
      result.staleCleaned = staleCleaned.count

      // 4. Contar total processado
      const total = await prisma.offer.count({ where: { store, price: { gt: 0 } } })
      result.processed = total

    } catch (e: any) {
      result.errors.push(e.message?.slice(0, 200))
    }

    result.durationMs = Date.now() - start
    results.push(result)
  }

  // Invalidate caches
  invalidateCache('home')
  invalidateCache('offers')
  invalidateCache('stats')

  return results
}
