'use client'

import { useState, useEffect, useCallback } from 'react'
import type { OfferData } from '@/types'
import { formatPrice, getBridgeUrl } from '@/lib/utils'
import { calculateIndiceOfertafy } from '@/lib/ia'

interface HeroCarouselProps {
  offers: OfferData[]
}

/**
 * Hero Carousel V2 — Compacto, estilo portal de ofertas.
 *
 * Redução de ~50% na altura vs V1.
 * Layout: 2 colunas (40% imagem | 60% info).
 * Tudo otimizado para conversão sem espaço desperdiçado.
 */
export default function HeroCarousel({ offers }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const slides = offers.slice(0, 5)

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, slides.length])

  if (slides.length === 0) return null

  const offer = slides[current]
  const indice = calculateIndiceOfertafy(offer)
  const scoreColor = indice.score >= 80 ? 'bg-green-500' : indice.score >= 60 ? 'bg-emerald-500' : indice.score >= 35 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-1.5">
        <div className="flex gap-2 items-center">

          {/* ─── IMAGEM (80px) ─── */}
          <div className="relative w-[80px] h-[80px] md:w-[90px] md:h-[90px] rounded-lg overflow-hidden bg-white shrink-0">
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="w-full h-full object-contain p-1"
              loading="eager"
            />

            {offer.discountPct >= 10 && (
              <div className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded text-[9px] font-extrabold px-1 leading-tight">
                -{offer.discountPct}%
              </div>
            )}

            {slides.length > 1 && (
              <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`w-1 h-1 rounded-full transition-all ${i === current ? 'bg-slate-800 w-2' : 'bg-slate-300'}`}
                    aria-label={`Slide ${i + 1}`} />
                ))}
              </div>
            )}
          </div>

          {/* ─── INFO ─── */}
          <div className="flex-1 flex flex-col justify-center text-white min-w-0 gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${storeBadgeStyle(offer.store)}`}>
                {offer.storeLabel}
              </span>
              {offer.freeShipping && <span className="text-[9px] text-white/50">📦 Grátis</span>}
            </div>
            <h2 className="text-xs md:text-sm font-bold leading-tight line-clamp-2">
              {offer.title}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg font-extrabold text-green-400">
                {formatPrice(offer.price)}
              </span>
              {offer.originalPrice > offer.price && (
                <span className="text-[11px] text-white/40 line-through">
                  {formatPrice(offer.originalPrice)}
                </span>
              )}
              <span className="text-[10px] text-white/30">🤖{indice.score}</span>
              <a href={getBridgeUrl(offer.url, offer.storeLabel)}
                className="ml-auto text-[11px] bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2.5 rounded-md transition-all shrink-0">
                Ver Oferta →
              </a>
            </div>
          </div>

          {slides.length > 1 && (
            <div className="hidden md:flex flex-col gap-0.5 shrink-0">
              <button onClick={prev} className="w-5 h-5 bg-white/10 rounded flex items-center justify-center hover:bg-white/20 text-white text-[10px]" aria-label="Anterior">▲</button>
              <button onClick={next} className="w-5 h-5 bg-white/10 rounded flex items-center justify-center hover:bg-white/20 text-white text-[10px]" aria-label="Próximo">▼</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function storeBadgeStyle(store: string): string {
  const map: Record<string, string> = {
    mercadolivre: 'bg-[#FFE600] text-slate-900',
    magalu: 'bg-[#0086FF] text-white',
    shopee: 'bg-[#EE4D2D] text-white',
    amazon: 'bg-[#FF9900] text-slate-900',
  }
  return map[store] || 'bg-white text-slate-900'
}
