'use client'

import { useRef, useState, useEffect } from 'react'
import OfferCard from './OfferCard'
import { getOfferKey } from '@/lib/utils'
import type { OfferData } from '@/types'

export default function FlashDeals({ offers }: { offers: OfferData[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 300
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  if (!offers || offers.length === 0) return null

  return (
    <section className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="gradient-flash text-white p-2 rounded-xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Ofertas Relâmpago</h2>
            <p className="text-sm text-slate-500">Promoções por tempo limitado</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button onClick={() => scroll('right')} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {offers.map((offer) => (
          <div key={getOfferKey(offer)} className="min-w-[220px] max-w-[220px] snap-start">
            <OfferCard offer={offer} />
          </div>
        ))}
      </div>
    </section>
  )
}
