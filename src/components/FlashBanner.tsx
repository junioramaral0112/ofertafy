'use client'

import { useState, useEffect, useMemo } from 'react'
import type { OfferData } from '@/types'
import { formatPrice, sanitizeAffiliateUrl } from '@/lib/utils'

export default function FlashBanner({ offers }: { offers: OfferData[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Gerar tempo aleatório para o cronômetro (entre 1.5h e 3h a partir de agora)
  // ⚠️ Só gera no cliente para evitar mismatch de hidratação
  const [generatedEndAt, setGeneratedEndAt] = useState<Date | null>(null)

  useEffect(() => {
    const randomMinutes = 90 + Math.floor(Math.random() * 90) // 90-180 min
    setGeneratedEndAt(new Date(Date.now() + randomMinutes * 60 * 1000))
  }, [])

  // Filtrar e ordenar candidatos: priorizar alto desconto + preço baixo
  const candidates = useMemo(() => {
    if (!offers || offers.length === 0) return []

    // Score = desconto% * (1 + bônus por preço baixo)
    // Preço < R$50: +30 pontos | Preço < R$100: +20 | Preço < R$300: +10 | Preço > R$1000: -20
    const scored = offers.map((o) => {
      let score = o.discountPct
      if (o.price < 50) score += 30
      else if (o.price < 100) score += 20
      else if (o.price < 300) score += 10
      if (o.price > 1000) score -= 20
      if (o.price > 3000) score -= 30
      return { offer: o, score }
    })

    // Ordenar por score decrescente
    scored.sort((a, b) => b.score - a.score)

    // Pegar top 5
    return scored.slice(0, 5).map((s) => s.offer)
  }, [offers])

  // ⚠️ Hydration fix: espera montagem no cliente antes de renderizar
  // o cronômetro, pois Date.now() difere entre servidor e navegador
  if (!isMounted || !generatedEndAt) {
    return (
      <section className="w-full max-w-[95rem] mx-auto px-4 -mt-8 mb-12">
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-center py-20">
            <div className="text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-500 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Carregando ofertas relâmpago...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (candidates.length === 0) return null

  const offer = candidates[currentIndex % candidates.length]

  // Usar flashEndsAt real ou o tempo gerado aleatoriamente
  const effectiveEndAt = (() => {
    if (offer.flashEndsAt) {
      const d = new Date(offer.flashEndsAt)
      if (d.getTime() > Date.now()) return d
    }
    return generatedEndAt
  })()

  return (
    <section className="w-full max-w-[95rem] mx-auto px-4 -mt-8 mb-12">
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
          {/* ============ LADO ESQUERDO (3/5) ============ */}
          <div className="lg:col-span-3 flex flex-col justify-center px-6 md:px-10 py-8 lg:py-12">
            {/* Badge vermelha com ícone de raio */}
            <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs md:text-sm font-bold px-3 py-1.5 rounded-full w-fit mb-4 animate-pulse-soft">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              RELÂMPAGO
              <span className="font-normal text-red-200">· TERMINA EM</span>
            </div>

            {/* Título do produto */}
            <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white mb-4 leading-tight line-clamp-2">
              {offer.title}
            </h2>

            {/* Preços */}
            <div className="flex items-baseline gap-3 flex-wrap mb-2">
              <span className="text-xs md:text-sm text-slate-400 line-through">
                De {formatPrice(offer.originalPrice)}
              </span>
              <span className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white">
                por {formatPrice(offer.price)}
              </span>
              <span className="discount-badge text-sm px-3 py-1">
                -{offer.discountPct}% OFF
              </span>
            </div>

            {/* Loja + meta info */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                offer.store === 'mercadolivre' ? 'bg-[#FFE600] text-slate-900' :
                offer.store === 'magalu' ? 'bg-[#0086FF] text-white' :
                'bg-slate-600 text-white'
              }`}>
                {offer.storeLabel}
              </span>
              {offer.freeShipping && (
                <span className="text-xs text-green-400 font-semibold">📦 Frete grátis</span>
              )}
              {offer.installment && (
                <span className="text-xs text-slate-400">{offer.installment}</span>
              )}
            </div>
          </div>

          {/* ============ LADO DIREITO (2/5) ============ */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center px-6 md:px-10 py-8 lg:py-12 bg-slate-800/50 lg:bg-gradient-to-l lg:from-slate-800/90 lg:to-transparent gap-5">
            {/* Cronômetro — SEMPRE ativo (real ou gerado) */}
            <CountdownTimer endAt={effectiveEndAt} />

            {/* Botão Ver agora → */}
            <a
              href={sanitizeAffiliateUrl(offer.url, offer.store)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-xs text-center bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-8 rounded-2xl transition-colors shadow-lg shadow-red-600/25 text-base md:text-lg"
            >
              Ver agora →
            </a>

            {/* Indicadores de paginação */}
            {candidates.length > 1 && (
              <div className="flex gap-2">
                {candidates.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === currentIndex % candidates.length
                        ? 'bg-white scale-125 shadow-sm'
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Contador de ofertas */}
            <p className="text-[10px] text-slate-500">
              {candidates.length} ofertas em destaque
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Cronômetro regressivo — SEMPRE roda (com data real ou gerada)
 */
function CountdownTimer({ endAt }: { endAt: Date }) {
  const [isMounted, setIsMounted] = useState(false)
  const [now, setNow] = useState(0) // inicia zerado — só atualiza após mount

  useEffect(() => {
    setIsMounted(true)
    setNow(Date.now())
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 250) // atualiza 4x por segundo (mais suave)
    return () => clearInterval(timer)
  }, [])

  // ⚠️ Enquanto não monta no cliente, mostra skeleton (evita mismatch de hidratação)
  if (!isMounted) {
    return (
      <div className="text-center">
        <p className="text-slate-400 text-xs mb-2">Termina em</p>
        <div className="flex items-center gap-2 md:gap-3">
          <TimeBox value="--" label="h" />
          <span className="text-slate-500 text-xl md:text-2xl font-light select-none">:</span>
          <TimeBox value="--" label="min" />
          <span className="text-slate-500 text-xl md:text-2xl font-light select-none">:</span>
          <TimeBox value="--" label="seg" />
        </div>
      </div>
    )
  }

  const remaining = calcRemaining(endAt, now)

  if (remaining.total <= 0) {
    return <p className="text-red-400 font-bold text-sm">⚡ Oferta encerrada!</p>
  }

  return (
    <div className="text-center">
      <p className="text-slate-400 text-xs mb-2">Termina em</p>
      <div className="flex items-center gap-2 md:gap-3">
        <TimeBox value={String(remaining.hours).padStart(2, '0')} label="h" />
        <span className="text-slate-500 text-xl md:text-2xl font-light select-none">:</span>
        <TimeBox value={String(remaining.minutes).padStart(2, '0')} label="min" />
        <span className="text-slate-500 text-xl md:text-2xl font-light select-none">:</span>
        <TimeBox value={String(remaining.seconds).padStart(2, '0')} label="seg" />
      </div>
    </div>
  )
}

function TimeBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-slate-700 border border-slate-600 rounded-xl w-14 md:w-18 h-14 md:h-18 flex items-center justify-center text-2xl md:text-3xl font-mono font-bold text-white shadow-inner">
        {value}
      </div>
      <span className="text-[10px] md:text-xs text-slate-400 mt-1.5">{label}</span>
    </div>
  )
}

function calcRemaining(endAt: Date, now: number) {
  const diff = endAt.getTime() - now
  if (diff <= 0) return { total: 0, hours: 0, minutes: 0, seconds: 0 }

  const seconds = Math.floor(diff / 1000) % 60
  const minutes = Math.floor(diff / (1000 * 60)) % 60
  const hours = Math.floor(diff / (1000 * 60 * 60))
  return { total: diff, hours, minutes, seconds }
}
