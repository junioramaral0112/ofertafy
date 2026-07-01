'use client'

import { useState, useEffect, useCallback } from 'react'
import type { OfferData } from '@/types'
import { formatPrice, getBridgeUrl } from '@/lib/utils'
import { calculateIndiceOfertafy } from '@/lib/ia'

interface HeroCarouselProps {
  offers: OfferData[]
}

/**
 * Hero Carousel — substitui o FlashBanner.
 *
 * Exibe 5 ofertas em destaque com transição automática a cada 5s.
 * CSS puro para animação (sem lib externa).
 * Cada slide: imagem, preço, desconto, loja, botão "Ver Oferta".
 * Espaço reservado para Nota IA (Sprint 3).
 */
export default function HeroCarousel({ offers }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const slides = offers.slice(0, 5)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length)
  }, [slides.length])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length)
  }, [slides.length])

  // Auto-avanço a cada 5 segundos
  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, slides.length])

  if (slides.length === 0) return null

  const offer = slides[current]
  const indice = calculateIndiceOfertafy(offer)

  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-center">
          {/* Imagem do produto */}
          <div className="relative aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden bg-white">
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="w-full h-full object-contain p-4"
              loading="eager"
            />

            {/* Badge da loja */}
            <span className={`absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full shadow ${storeBadgeStyle(offer.store)}`}>
              {offer.storeLabel}
            </span>

            {/* Desconto grande */}
            {offer.discountPct >= 10 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white rounded-xl px-4 py-2 text-center shadow-lg">
                <div className="text-2xl font-extrabold leading-none">-{offer.discountPct}%</div>
                <div className="text-[10px] font-medium">OFF</div>
              </div>
            )}

            {/* Indicadores de slide */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? 'bg-slate-800 w-6' : 'bg-slate-300'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Setas */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full shadow flex items-center justify-center hover:bg-white transition-colors"
                  aria-label="Anterior"
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full shadow flex items-center justify-center hover:bg-white transition-colors"
                  aria-label="Próximo"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Info do produto */}
          <div className="text-white">
            <h2 className="text-xl md:text-3xl font-extrabold leading-tight mb-3 line-clamp-2">
              {offer.title}
            </h2>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl md:text-4xl font-extrabold text-green-400">
                {formatPrice(offer.price)}
              </span>
              {offer.originalPrice > offer.price && (
                <span className="text-lg text-white/50 line-through">
                  {formatPrice(offer.originalPrice)}
                </span>
              )}
            </div>

            {/* Economia */}
            {offer.originalPrice > offer.price && (
              <p className="text-sm text-green-400 mb-4">
                Economize {formatPrice(offer.originalPrice - offer.price)} ({offer.discountPct}% OFF)
              </p>
            )}

            {/* Selos */}
            <div className="flex flex-wrap gap-2 mb-4">
              {offer.freeShipping && (
                <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
                  📦 Frete grátis
                </span>
              )}
              {offer.installment && (
                <span className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full">
                  💳 {offer.installment}
                </span>
              )}
            </div>

            {/* Índice Ofertafy */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-sm">🤖</span>
                <span className="text-white/60 text-xs">Índice Ofertafy</span>
                <span className={`ml-auto text-xl font-extrabold ${
                  indice.score >= 80 ? 'text-green-400'
                  : indice.score >= 60 ? 'text-emerald-400'
                  : indice.score >= 35 ? 'text-amber-400'
                  : 'text-red-400'
                }`}>{indice.score}</span>
              </div>
            </div>

            {/* CTA */}
            <a
              href={getBridgeUrl(offer.url, offer.storeLabel)}
              className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-green-500/25"
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
