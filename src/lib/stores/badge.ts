/**
 * 🏪 BADGE CENTRALIZADO DE LOJA
 *
 * Use esta função em QUALQUER componente que precise
 * exibir o badge de uma loja. Garante consistência visual.
 *
 * Uso:
 *   <span className={getStoreBadge('mercadolivre')}>Mercado Livre</span>
 */

import { getStore } from './registry'

/** Retorna a classe CSS do badge para qualquer loja */
export function getStoreBadgeClass(slug: string): string {
  const store = getStore(slug)
  return store?.badgeClass || 'bg-slate-200 text-slate-700'
}

/** Retorna o nome exibível da loja */
export function getStoreDisplayName(slug: string): string {
  const store = getStore(slug)
  return store?.name || slug
}

/** Retorna o ícone da loja */
export function getStoreIcon(slug: string): string {
  const store = getStore(slug)
  return store?.icon || '🏪'
}
