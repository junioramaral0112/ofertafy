'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORIES } from '@/lib/utils'

export default function CategoryFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category') || ''

  const handleClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (currentCategory === slug) { params.delete('category') }
    else { params.set('category', slug) }
    params.delete('page')
    router.push(`/busca?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.map((cat) => (
        <button key={cat.slug} onClick={() => handleClick(cat.slug)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${currentCategory === cat.slug ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
          {cat.name}
        </button>
      ))}
    </div>
  )
}
