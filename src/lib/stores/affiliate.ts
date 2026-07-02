/**
 * 🏪 FÁBRICA DE URLs DE AFILIADO
 *
 * Camada única: generateAffiliateUrl(store, productUrl)
 * Funciona para QUALQUER loja cadastrada no registry.
 */

import { getStore } from './registry'
import type { StoreConfig } from './types'
import { safeUrl } from '@/lib/utils'

/**
 * Gera a URL de afiliado para qualquer loja.
 *
 * @param storeSlug  Slug da loja (ex: 'mercadolivre')
 * @param productUrl URL do produto
 * @returns URL com parâmetros de afiliado
 */
export function generateAffiliateUrl(storeSlug: string, productUrl: string): string {
  const store = getStore(storeSlug)
  if (!store) return productUrl

  const url = safeUrl(productUrl)
  if (!url) return productUrl

  const { affiliate } = store

  // ── Custom builder (prioridade máxima) ──────
  if (affiliate.customUrlBuilder) {
    return affiliate.customUrlBuilder(productUrl, store)
  }

  // ── Query param ─────────────────────────────
  if (affiliate.type === 'query_param' && affiliate.paramName && affiliate.paramValue) {
    url.searchParams.set(affiliate.paramName, affiliate.paramValue)
    return url.toString()
  }

  // ── Path-based ──────────────────────────────
  if (affiliate.type === 'path' && affiliate.urlPrefix) {
    const storeId = affiliate.paramValue || ''
    return `${affiliate.urlPrefix}${storeId}/`
  }

  // ── Subdomain ───────────────────────────────
  if (affiliate.type === 'subdomain' && affiliate.urlPrefix) {
    return `${affiliate.urlPrefix}${encodeURIComponent(productUrl)}`
  }

  // ── Shortlink / API — retorna URL original ──
  return productUrl
}

/**
 * Retorna parâmetros de afiliado como string para append manual.
 */
export function getAffiliateParams(storeSlug: string): string {
  const store = getStore(storeSlug)
  if (!store?.affiliate.paramName || !store.affiliate.paramValue) return ''
  return `${store.affiliate.paramName}=${store.affiliate.paramValue}`
}
