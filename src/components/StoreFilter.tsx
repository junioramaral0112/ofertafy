'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { STORES } from '@/lib/utils'

export default function StoreFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStore = searchParams.get('store') || ''

  const handleClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (currentStore === slug) { params.delete('store') }
    else { params.set('store', slug) }
    params.delete('page')
    router.push(`/busca?${params.toString()}`)
  }

  const activeStores = STORES.filter(s => s.active)
  const dormantStores = STORES.filter(s => !s.active)

  return (
    <div className="flex flex-wrap gap-2">
      {activeStores.map((store) => (
        <button key={store.slug} onClick={() => handleClick(store.slug)}
          className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${currentStore === store.slug ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
          {store.name}
        </button>
      ))}
      {dormantStores.map((store) => (
        <span key={store.slug} title={`Configure as chaves da ${store.name} no .env`}
          className="px-4 py-2 rounded-full text-sm font-medium border border-dashed border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed select-none">
          {store.name} 🔜
        </span>
      ))}
    </div>
  )
}
