'use client'

import { useState } from 'react'

interface Coupon {
  id: string
  provider: string
  code: string
  description: string
  discountValue: string
  link: string
  expiryDate?: string | null
}

const STORE_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  shopee:        { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  label: 'Shopee' },
  amazon:        { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Amazon' },
  mercadolivre:  { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200',  label: 'Mercado Livre' },
  magalu:        { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    label: 'Magalu' },
}

const STORE_LOGOS: Record<string, string> = {
  shopee:        '🔴',
  amazon:        '🟠',
  mercadolivre:  '🟡',
  magalu:        '🔵',
}

export default function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false)
  const style = STORE_STYLES[coupon.provider] ?? STORE_STYLES.shopee
  const logo = STORE_LOGOS[coupon.provider] ?? '🏷️'

  const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date()

  const handleCopyAndGo = () => {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      // Abre o link de afiliado em nova aba
      window.open(coupon.link, '_blank', 'noopener,noreferrer')
    }).catch(() => {
      // Fallback: só abre o link
      window.open(coupon.link, '_blank', 'noopener,noreferrer')
    })
  }

  return (
    <div className={`
      relative bg-white rounded-2xl border-2 ${style.border}
      p-5 shadow-sm hover:shadow-md transition-all duration-200
      ${isExpired ? 'opacity-50 grayscale' : 'card-hover'}
    `}>
      {/* Badge da loja */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
          {logo} {style.label}
        </span>
        {coupon.discountValue && (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
            {coupon.discountValue}
          </span>
        )}
      </div>

      {/* Código do cupom (grande e destacado) */}
      <div className="text-center my-4">
        <code className="text-2xl md:text-3xl font-extrabold tracking-wider text-slate-800 bg-slate-100 px-4 py-2 rounded-xl select-all">
          {coupon.code}
        </code>
      </div>

      {/* Descrição */}
      <p className="text-sm text-slate-600 text-center mb-4 min-h-[2.5rem]">
        {coupon.description}
      </p>

      {/* Validade */}
      {coupon.expiryDate && (
        <p className="text-xs text-slate-400 text-center mb-3">
          {isExpired ? '❌ Expirado em' : '⏳ Válido até'}{' '}
          {new Date(coupon.expiryDate).toLocaleDateString('pt-BR')}
        </p>
      )}

      {/* Botão de ação */}
      <button
        onClick={handleCopyAndGo}
        disabled={isExpired}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
          text-sm font-bold transition-all duration-200
          ${isExpired
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : copied
              ? 'bg-green-500 text-white'
              : 'gradient-primary text-white hover:opacity-90'
          }
        `}
      >
        {isExpired ? (
          'Cupom Expirado'
        ) : copied ? (
          <>
            ✅ Copiado! <span className="font-normal text-white/80">Abrindo loja...</span>
          </>
        ) : (
          <>
            📋 Copiar e Ir para a Loja
          </>
        )}
      </button>
    </div>
  )
}
