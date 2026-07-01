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
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-6">
        <div className="flex flex-col md:flex-row gap-3 md:gap-5 items-stretch">

          {/* ─── COLUNA ESQUERDA: Imagem (40%) ─── */}
          <div className="relative w-full md:w-[40%] aspect-[4/3] md:aspect-auto md:max-h-[330px] rounded-2xl overflow-hidden bg-white shrink-0">
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="w-full h-full object-contain p-2 md:p-3"
              loading="eager"
            />

            {/* Badge loja */}
            <span className={`absolute top-2 left-2 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full shadow ${storeBadgeStyle(offer.store)}`}>
              {offer.storeLabel}
            </span>

            {/* Desconto */}
            {offer.discountPct >= 10 && (
              <div className="absolute top-2 right-2 bg-red-500 text-white rounded-lg px-2 py-1 text-center shadow-lg">
                <div className="text-base md:text-lg font-extrabold leading-none">-{offer.discountPct}%</div>
              </div>
            )}

            {/* Indicadores */}
            {slides.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-slate-800 w-4' : 'bg-slate-300'}`}
                    aria-label={`Slide ${i + 1}`} />
                ))}
              </div>
            )}

            {/* Setas */}
            {slides.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 rounded-full shadow flex items-center justify-center hover:bg-white text-sm" aria-label="Anterior">‹</button>
                <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 rounded-full shadow flex items-center justify-center hover:bg-white text-sm" aria-label="Próximo">›</button>
              </>
            )}
          </div>

          {/* ─── COLUNA DIREITA: Info (60%) ─── */}
          <div className="flex-1 flex flex-col justify-center text-white min-w-0">
            {/* Título — 2 linhas max */}
            <h2 className="text-lg md:text-xl font-extrabold leading-tight line-clamp-2 mb-2">
              {offer.title}
            </h2>

            {/* Preço + desconto — inline compacto */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl md:text-3xl font-extrabold text-green-400">
                {formatPrice(offer.price)}
              </span>
              {offer.originalPrice > offer.price && (
                <>
                  <span className="text-sm text-white/40 line-through">
                    {formatPrice(offer.originalPrice)}
                  </span>
                  <span className="text-xs text-green-400 font-bold">
                    -{offer.discountPct}%
                  </span>
                </>
              )}
            </div>

            {/* Economia + Frete + Parcelamento — 1 linha */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-2">
              {offer.originalPrice > offer.price && (
                <span className="text-green-400">
                  Economize {formatPrice(offer.originalPrice - offer.price)}
                </span>
              )}
              {offer.freeShipping && <span className="text-white/60">📦 Frete grátis</span>}
              {offer.installment && <span className="text-white/60">💳 {offer.installment}</span>}
            </div>

            {/* Índice Ofertafy — barra compacta (40px max) */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-white/50">🤖 Índice Ofertafy</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-[120px]">
                <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${indice.score}%` }} />
              </div>
              <span className={`text-xs font-bold ${indice.score >= 80 ? 'text-green-400' : indice.score >= 60 ? 'text-emerald-400' : indice.score >= 35 ? 'text-amber-400' : 'text-red-400'}`}>
                {indice.score}/100
              </span>
            </div>

            {/* CTA */}
            <a
              href={getBridgeUrl(offer.url, offer.storeLabel)}
              className="inline-block w-full md:w-[220px] text-center bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm md:text-base transition-all hover:scale-[1.02] shadow-lg shadow-green-500/20"
            >
              Ver Oferta →
            </a>
          </div>
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
