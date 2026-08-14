import Link from 'next/link'
import { availableBrands } from '@/lib/search-ranking'

/**
 * 🎛️ FILTROS DE BUSCA — lateral (desktop) / topo (mobile, via <details>)
 *
 * Server component: cada filtro é um <Link> que atualiza a URL
 * (?loja= / ?min= / ?max= / ?marca=) — zero JavaScript no cliente.
 */

const STORES: { value: string; label: string; emoji: string }[] = [
  { value: 'amazon', label: 'Amazon', emoji: '🟠' },
  { value: 'magalu', label: 'Magalu', emoji: '🔵' },
  { value: 'shopee', label: 'Shopee', emoji: '🔴' },
  { value: 'mercadolivre', label: 'Mercado Livre', emoji: '🟡' },
]

const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: 'Até R$ 50', max: 50 },
  { label: 'R$ 50 – R$ 100', min: 50, max: 100 },
  { label: 'R$ 100 – R$ 300', min: 100, max: 300 },
  { label: 'R$ 300 – R$ 1.000', min: 300, max: 1000 },
  { label: 'Acima de R$ 1.000', min: 1000 },
]

export interface SearchFilterState {
  store?: string
  min?: number
  max?: number
  brands: string[]
}

interface SearchFiltersProps {
  basePath: string
  current: SearchFilterState
  storeCounts: Record<string, number>
  offers: Array<{ title: string }>
}

function buildUrl(basePath: string, patch: Partial<Record<string, string | number | string[] | undefined>>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === '') continue
    if (Array.isArray(v)) {
      if (v.length > 0) sp.set(k, v.join(','))
      continue
    }
    sp.set(k, String(v))
  }
  const qs = sp.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

/** URL com os filtros ATUAIS + uma alteração (toggle) */
function urlWith(current: SearchFilterState, basePath: string, patch: Partial<Record<string, string | number | undefined>>): string {
  // ⚠️ a chave do param é "marca" (singular) — a página lê sp.marca
  const next: Record<string, string | number | string[] | undefined> = {
    store: current.store,
    min: current.min,
    max: current.max,
    marca: current.brands.length ? current.brands.join(',') : undefined,
  }

  if (patch.store !== undefined) {
    next.store = current.store === patch.store ? undefined : patch.store
  }
  if (patch.min !== undefined || patch.max !== undefined) {
    // Trocar de faixa de preço substitui a anterior
    next.min = patch.min
    next.max = patch.max
    if (current.min === patch.min && current.max === patch.max) {
      next.min = undefined
      next.max = undefined
    }
  }
  if (patch.marca !== undefined) {
    const m = String(patch.marca)
    const has = current.brands.includes(m)
    const brands = has ? current.brands.filter((b) => b !== m) : [...current.brands, m]
    next.marca = brands.length ? brands.join(',') : undefined
  }

  return buildUrl(basePath, next)
}

export default function SearchFilters({ basePath, current, storeCounts, offers }: SearchFiltersProps) {
  const brands = availableBrands(offers)
  const totalCount = Object.values(storeCounts).reduce((a, b) => a + b, 0)

  const content = (
    <div className="space-y-6">
      {/* ── Lojas ── */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Loja</h3>
        <div className="space-y-1">
          {STORES.map((s) => {
            const active = current.store === s.value
            return (
              <Link
                key={s.value}
                href={urlWith(current, basePath, { store: s.value })}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">{s.emoji}</span> {s.label}
                </span>
                <span className="text-xs text-slate-400">{storeCounts[s.value] || 0}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Faixa de preço ── */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preço</h3>
        <div className="space-y-1">
          {PRICE_RANGES.map((r) => {
            const active = current.min === r.min && current.max === r.max
            return (
              <Link
                key={r.label}
                href={urlWith(current, basePath, { min: r.min, max: r.max })}
                className={`block px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {r.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Marcas ── */}
      {brands.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Marca</h3>
          <div className="flex flex-wrap gap-1.5">
            {brands.map((b) => {
              const active = current.brands.includes(b.name)
              return (
                <Link
                  key={b.name}
                  href={urlWith(current, basePath, { marca: b.name })}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    active
                      ? 'bg-primary text-white border-primary font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  {b.name} <span className={active ? 'text-white/70' : 'text-slate-400'}>({b.count})</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Limpar tudo ── */}
      {(current.store || current.min !== undefined || current.brands.length > 0) && (
        <Link href={basePath} className="inline-block text-xs text-primary hover:underline font-semibold">
          ✕ Limpar todos os filtros
        </Link>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop: sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Filtros</h2>
            <span className="text-xs text-slate-400">{totalCount} ofertas</span>
          </div>
          {content}
        </div>
      </aside>

      {/* Mobile: painel colapsável no topo */}
      <details className="lg:hidden mb-4 bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <summary className="px-4 py-3 cursor-pointer text-sm font-bold text-slate-900 flex items-center justify-between select-none">
          <span>🎛️ Filtros</span>
          <span className="text-xs text-slate-400 font-normal">
            {current.store ? 'loja • ' : ''}{current.min !== undefined ? 'preço • ' : ''}{current.brands.length > 0 ? `marca (${current.brands.length})` : ''}{' '}▾
          </span>
        </summary>
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          {content}
        </div>
      </details>
    </>
  )
}
