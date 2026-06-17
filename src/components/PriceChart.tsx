'use client'

import { formatPrice } from '@/lib/utils'
import type { PriceHistoryData } from '@/types'

export default function PriceChart({ history, currentPrice }: { history: PriceHistoryData[]; currentPrice: number }) {
  if (!history || history.length < 2) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p className="text-sm">Histórico de preços em construção...</p>
        <p className="text-xs mt-1">Os dados aparecerão aqui conforme monitoramos este produto.</p>
      </div>
    )
  }

  const prices = [...history].reverse()
  const minPrice = Math.min(...prices.map((p) => p.price))
  const maxPrice = Math.max(...prices.map((p) => p.price))
  const range = maxPrice - minPrice || 1
  const chartHeight = 160
  const chartWidth = 100 / Math.max(prices.length - 1, 1)

  // SVG chart
  const points = prices
    .map((p, i) => {
      const x = (i / Math.max(prices.length - 1, 1)) * 100
      const y = 100 - ((p.price - minPrice) / range) * 100
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">📈 Histórico de Preços (30 dias)</h3>
        <div className="flex gap-4 text-xs">
          <span className="text-slate-400">Min: <strong className="text-green-600">{formatPrice(minPrice)}</strong></span>
          <span className="text-slate-400">Max: <strong className="text-red-600">{formatPrice(maxPrice)}</strong></span>
        </div>
      </div>

      <div className="relative bg-slate-50 rounded-xl p-4" style={{ height: chartHeight + 40 }}>
        <svg viewBox="0 0 100 100" className="w-full" style={{ height: chartHeight }} preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e2e8f0" strokeWidth="0.3" />
          ))}

          {/* Area fill */}
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area */}
          <polygon
            points={`0,100 ${points} 100,100`}
            fill="url(#priceGradient)"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current price dot */}
          {prices.length > 0 && (() => {
            const lastIdx = prices.length - 1
            const x = (lastIdx / Math.max(prices.length - 1, 1)) * 100
            const y = 100 - ((prices[lastIdx].price - minPrice) / range) * 100
            return (
              <>
                <circle cx={x} cy={y} r="2.5" fill="#6366f1" stroke="white" strokeWidth="1.5" />
                <text x={x} y={y - 6} textAnchor="middle" fontSize="7" fill="#6366f1" fontWeight="bold">
                  {formatPrice(prices[lastIdx].price)}
                </text>
              </>
            )
          })()}
        </svg>

        {/* Date labels */}
        <div className="flex justify-between mt-2 text-[10px] text-slate-400">
          <span>{formatDate(prices[0]?.checkedAt)}</span>
          <span>{formatDate(prices[prices.length - 1]?.checkedAt)}</span>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateStr: Date | string | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
