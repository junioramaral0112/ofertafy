'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBar({ placeholder = 'Buscar ofertas...', large = false }: { placeholder?: string; large?: boolean }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`relative transition-all ${focused ? 'scale-[1.02]' : ''}`}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`w-full bg-white border-2 border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none transition-all ${
            large ? 'pl-6 pr-16 py-4 text-lg' : 'pl-5 pr-14 py-3 text-sm'
          } shadow-sm`}
        />
        <button
          type="submit"
          className={`absolute right-2 top-1/2 -translate-y-1/2 gradient-primary text-white rounded-xl hover:opacity-90 transition-opacity ${
            large ? 'p-3' : 'p-2.5'
          }`}
        >
          <svg width={large ? 22 : 18} height={large ? 22 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </div>
    </form>
  )
}
