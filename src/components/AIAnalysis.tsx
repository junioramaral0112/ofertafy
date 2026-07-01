import {
  calculateIndiceOfertafy,
  detectFakeDiscount,
  analyzePriceHistory,
  RECOMMENDATION_LABELS,
  RECOMMENDATION_COLORS,
  type IndiceOfertafy,
  type FakeDiscountResult,
  type PriceAnalysis,
} from '@/lib/ia'
import type { OfferData, PriceHistoryData } from '@/types'

interface AIAnalysisProps {
  offer: OfferData
  priceHistory?: PriceHistoryData[]
}

export default function AIAnalysis({ offer, priceHistory }: AIAnalysisProps) {
  const indice: IndiceOfertafy = calculateIndiceOfertafy(offer, priceHistory)
  const fakeDiscount: FakeDiscountResult = detectFakeDiscount(offer, priceHistory)
  const priceAnalysis: PriceAnalysis = analyzePriceHistory(priceHistory || [])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <h2 className="text-lg font-bold text-slate-900">Análise da IA</h2>
        <span className="text-xs text-slate-400 ml-auto">Índice Ofertafy</span>
      </div>

      {/* Score principal */}
      <div className="flex items-center gap-4">
        <ScoreGauge score={indice.score} />
        <div>
          <p className="text-sm text-slate-600">{indice.summary}</p>
        </div>
      </div>

      {/* Recomendação */}
      <div className={`border rounded-xl p-4 ${RECOMMENDATION_COLORS[indice.recommendation]}`}>
        <p className="font-bold text-lg">{RECOMMENDATION_LABELS[indice.recommendation]}</p>
        <p className="text-sm mt-1 opacity-80">
          {indice.recommendation === 'buy_now' && 'Menor preço recente. Momento ideal para comprar.'}
          {indice.recommendation === 'good_deal' && 'Bom custo-benefício. Vale a pena.'}
          {indice.recommendation === 'wait' && 'Preço pode cair mais. Considere esperar.'}
          {indice.recommendation === 'avoid' && 'Preço alto em relação ao histórico.'}
        </p>
      </div>

      {/* Detector de falso desconto */}
      {fakeDiscount.isFake && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-bold text-red-700 mb-1">⚠ Desconto Suspeito Detectado</p>
          <p className="text-xs text-red-600">{fakeDiscount.reason}</p>
          {fakeDiscount.inflatedPct > 0 && (
            <p className="text-xs text-red-500 mt-1">
              Preço original inflado em aproximadamente {fakeDiscount.inflatedPct}%
            </p>
          )}
        </div>
      )}

      {/* Análise de preço */}
      {priceAnalysis.daysTracked >= 2 && (
        <div className="bg-slate-50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">📊 Histórico de Preços</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-400">Menor</p>
              <p className="font-bold text-green-600">R$ {priceAnalysis.min.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Média</p>
              <p className="font-bold text-slate-700">R$ {priceAnalysis.avg.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Maior</p>
              <p className="font-bold text-red-500">R$ {priceAnalysis.max.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Tendência</p>
              <p className={`font-bold ${
                priceAnalysis.trend === 'falling' ? 'text-green-600'
                : priceAnalysis.trend === 'rising' ? 'text-red-500'
                : 'text-slate-600'
              }`}>
                {priceAnalysis.trend === 'falling' ? '↓ Caindo'
                : priceAnalysis.trend === 'rising' ? '↑ Subindo'
                : '→ Estável'}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Dados de {priceAnalysis.daysTracked} verificações de preço
          </p>
        </div>
      )}

      {/* Fatores detalhados (expansível) */}
      <details className="group">
        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
          Ver análise detalhada dos fatores
        </summary>
        <div className="mt-3 space-y-2">
          {indice.factors.map((f) => (
            <div key={f.name} className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{f.name} (peso {f.weight}%)</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      f.score >= 70 ? 'bg-green-500'
                      : f.score >= 40 ? 'bg-amber-500'
                      : 'bg-red-400'
                    }`}
                    style={{ width: `${f.score}%` }}
                  />
                </div>
                <span className="font-bold text-slate-700 w-8 text-right">{f.score}</span>
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

/** Medidor circular do Índice Ofertafy */
function ScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (score / 100) * circumference

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#059669' : score >= 35 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="40" cy="40" r="36"
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-extrabold" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}
