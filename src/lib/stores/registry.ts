/**
 * 🏪 REGISTRO CENTRAL DE LOJAS
 *
 * ÚNICO arquivo a ser modificado para adicionar/remover lojas.
 * Toda a aplicação consome deste registro.
 */

import type { StoreConfig } from './types'

export const STORE_REGISTRY: Record<string, StoreConfig> = {
  // ─── MERCADO LIVRE ───────────────────────────
  mercadolivre: {
    slug: 'mercadolivre',
    name: 'Mercado Livre',
    domain: 'mercadolivre.com.br',
    color: '#FFE600',
    textColor: '#333333',
    icon: '🟡',
    badgeClass: 'bg-[#FFE600] text-slate-900',
    active: true,
    reputation: 82,
    affiliate: {
      type: 'query_param',
      paramName: 'matt_tool',
      paramValue: process.env.ML_MATT_TOOL || '35888960',
    },
  },

  // ─── MAGALU ──────────────────────────────────
  magalu: {
    slug: 'magalu',
    name: 'Magalu',
    domain: 'magazinevoce.com.br',
    color: '#0086FF',
    textColor: '#ffffff',
    icon: '🔵',
    badgeClass: 'bg-[#0086FF] text-white',
    active: true,
    reputation: 78,
    affiliate: {
      type: 'path',
      paramName: 'storeId',
      paramValue: process.env.MAGALU_STORE_ID || 'ofertafy',
      urlPrefix: 'https://www.magazinevoce.com.br/magazine',
    },
  },

  // ─── AMAZON ──────────────────────────────────
  amazon: {
    slug: 'amazon',
    name: 'Amazon',
    domain: 'amazon.com.br',
    color: '#FF9900',
    textColor: '#111111',
    icon: '🟠',
    badgeClass: 'bg-[#FF9900] text-slate-900',
    active: true,
    reputation: 85,
    affiliate: {
      type: 'query_param',
      paramName: 'tag',
      paramValue: process.env.AMAZON_ASSOCIATE_TAG || 'ofertafy00-20',
    },
  },

  // ─── SHOPEE ──────────────────────────────────
  shopee: {
    slug: 'shopee',
    name: 'Shopee',
    domain: 'shopee.com.br',
    color: '#EE4D2D',
    textColor: '#ffffff',
    icon: '🔴',
    badgeClass: 'bg-[#EE4D2D] text-white',
    active: true,
    reputation: 65,
    affiliate: {
      type: 'query_param',
      paramName: 'affiliate_id',
      paramValue: process.env.SHOPEE_APP_ID || '18355150568',
    },
  },

}

/** Lista plana de lojas ativas */
export function getActiveStores(): StoreConfig[] {
  return Object.values(STORE_REGISTRY).filter((s) => s.active)
}

/** Lista plana de todas as lojas */
export function getAllStores(): StoreConfig[] {
  return Object.values(STORE_REGISTRY)
}

/** Busca loja por slug */
export function getStore(slug: string): StoreConfig | undefined {
  return STORE_REGISTRY[slug]
}

/** Slug → nome exibível */
export function getStoreName(slug: string): string {
  return STORE_REGISTRY[slug]?.name || slug
}

/** Slug → cor do badge */
export function getStoreBadgeClass(slug: string): string {
  return STORE_REGISTRY[slug]?.badgeClass || 'bg-slate-200 text-slate-700'
}

/** Slug → reputação (0-100) */
export function getStoreReputation(slug: string): number {
  return STORE_REGISTRY[slug]?.reputation || 50
}
