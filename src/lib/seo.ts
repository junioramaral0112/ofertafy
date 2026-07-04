/**
 * 🎯 SEO QUALITY — Lógica de indexação inteligente
 *
 * Uma página é "forte" (index, follow) se:
 *   1. Tem produtos com preço real (price > 0)
 *   2. Tem pelo menos 1 produto de loja com afiliado ativo
 *   3. Não é duplicata semântica
 *   4. Tem intenção de busca clara (categoria/loja válida)
 *
 * Lojas com afiliado ativo: Shopee, Amazon, Magalu
 * Lojas sem afiliado/dados: SHEIN, ML, TikTok
 */

const ACTIVE_AFFILIATE_STORES = ['shopee', 'amazon', 'magalu']

interface SeoQuality {
  indexable: boolean
  reason?: string
}

/**
 * Avalia se uma página deve ser indexada com base na qualidade
 * dos produtos que contém, não apenas na quantidade.
 */
export function evaluateIndexQuality(
  products: Array<{ store: string; price: number }>,
): SeoQuality {
  // 1. Precisa ter produtos
  if (!products || products.length === 0) {
    return { indexable: false, reason: 'sem produtos' }
  }

  // 2. Precisa ter produtos com preço válido
  const withPrice = products.filter((p) => p.price > 0)
  if (withPrice.length === 0) {
    return { indexable: false, reason: 'sem preço válido' }
  }

  // 3. Pelo menos 1 produto de loja com afiliado ativo
  const hasActiveStore = withPrice.some((p) =>
    ACTIVE_AFFILIATE_STORES.includes(p.store),
  )
  if (!hasActiveStore) {
    return { indexable: false, reason: 'sem loja com afiliado ativo' }
  }

  // 4. Pelo menos 3 produtos com preço e afiliado (densidade mínima)
  const activeProducts = withPrice.filter((p) =>
    ACTIVE_AFFILIATE_STORES.includes(p.store),
  )
  if (activeProducts.length < 3) {
    return { indexable: false, reason: 'densidade insuficiente (< 3 produtos ativos)' }
  }

  return { indexable: true }
}
