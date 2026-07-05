/**
 * 🔒 AFFILIATE GATE — Camada única obrigatória de links de afiliado
 *
 * REGRAS:
 *   1. TODO link de saída DEVE passar por esta camada
 *   2. NUNCA gerar link sem tracking de afiliado
 *   3. Se o ID não estiver configurado, o link é REJEITADO
 *   4. Nenhum componente pode montar URL de saída manualmente
 *
 * USO:
 *   import { buildAffiliateLink } from '@/lib/affiliate-gate'
 *   const url = buildAffiliateLink({
 *     productUrl: 'https://www.amazon.com.br/dp/ABC123',
 *     store: 'amazon',
 *   })
 */

const AFFILIATE_IDS: Record<string, { param: string; value: string }> = {
  amazon: {
    param: 'tag',
    value: process.env.AMAZON_ASSOCIATE_TAG || 'ofertafy00-20',
  },
  shopee: {
    param: 'affiliate_id',
    value: process.env.SHOPEE_APP_ID || '18355150568',
  },
  mercadolivre: {
    param: 'matt_tool',
    value: process.env.ML_MATT_TOOL || '35888960',
  },
  magalu: {
    param: null, // Magalu usa URL path, não query param
    value: null,
  },
}

const MAGALU_STORE_ID = process.env.MAGALU_STORE_ID || 'ofertafy'

interface AffiliateLinkInput {
  productUrl: string
  store: string
}

/**
 * Constrói link de afiliado com validação obrigatória.
 * Se o store não estiver configurado ou o ID estiver vazio, lança erro.
 */
export function buildAffiliateLink({ productUrl, store }: AffiliateLinkInput): string {
  if (!productUrl) throw new Error('productUrl é obrigatório')
  if (!store) throw new Error('store é obrigatório')

  // Magalu: URL especial via Magazine Você
  if (store === 'magalu') {
    if (productUrl.includes('magazinevoce.com.br')) return productUrl
    return `https://www.magazinevoce.com.br/magazine${MAGALU_STORE_ID}/`
  }

  const config = AFFILIATE_IDS[store]
  if (!config) {
    throw new Error(`Loja "${store}" não possui configuração de afiliado. Link rejeitado.`)
  }

  if (!config.value || config.value === '') {
    throw new Error(`ID de afiliado para "${store}" está vazio. Link rejeitado.`)
  }

  // Se já tem o parâmetro, retorna como está
  if (config.param && productUrl.includes(`${config.param}=${config.value}`)) {
    return productUrl
  }

  // Injeta o parâmetro de afiliado
  const url = new URL(productUrl)
  if (config.param) {
    url.searchParams.set(config.param, config.value)
  }

  return url.toString()
}
