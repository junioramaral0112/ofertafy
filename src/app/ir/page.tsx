'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// ═══════════════════════════════════════════════════════════
// PÁGINA PONTE (/ir) — Blindagem de Afiliado
// ═══════════════════════════════════════════════════════════
//
// Problema resolvido:
//   Android/iOS interceptam links de e-commerce e forçam a
//   abertura dos apps nativos (Mercado Livre, Magalu, Shopee,
//   Amazon). Isso DERRUBA o cookie de afiliado e você perde
//   a comissão.
//
// Solução:
//   750ms de atraso + window.location.replace() burlam o
//   gatilho automático de deep linking. O cookie de afiliado
//   é preservado e a venda é atribuída corretamente.
//
//   Além disso, o SEO é protegido: links externos não são
//   expostos diretamente no DOM.
// ═══════════════════════════════════════════════════════════

function RedirectHandler() {
  const searchParams = useSearchParams()
  const [error, setError] = useState(false)
  const [storeName, setStoreName] = useState('')

  useEffect(() => {
    try {
      const rawUrl = searchParams.get('url')
      const loja = searchParams.get('loja') || ''

      setStoreName(loja)

      // ── Validação do parâmetro url ────────────────────
      if (!rawUrl) throw new Error('URL ausente')

      const decoded = decodeURIComponent(rawUrl)

      // Só aceita http:// ou https://
      if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
        throw new Error('URL inválida')
      }

      // ── Redirecionamento com atraso anti-deep-link ─────
      const timer = setTimeout(() => {
        window.location.replace(decoded)
      }, 750)

      return () => clearTimeout(timer)
    } catch {
      // Fallback: URL ausente, corrompida ou sem protocolo
      setError(true)
      const timer = setTimeout(() => {
        window.location.replace('/')
      }, 750)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-5xl">🏷️</span>
        <p className="text-slate-500 text-sm">Redirecionando para a home...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Logo / Ícone */}
      <div className="flex items-center gap-2">
        <span className="text-5xl animate-bounce">🏷️</span>
      </div>

      {/* Spinner */}
      <div className="w-8 h-8 border-3 border-slate-200 border-t-primary rounded-full animate-spin" />

      {/* Texto dinâmico */}
      <p className="text-slate-700 font-medium text-lg text-center px-4">
        Ativando seu desconto
        {storeName ? (
          <>
            {' '}
            na loja{' '}
            <span className="text-primary font-bold">{storeName}</span>
          </>
        ) : (
          '...'
        )}
      </p>

      <p className="text-slate-400 text-xs text-center mt-2">
        Você será redirecionado em instantes.
        <br />
        Não pague nada a mais por isso — link de afiliado.
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL (com Suspense — REGRA DE OURO VERCEL)
// ═══════════════════════════════════════════════════════════

export default function BridgePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center gap-4">
            <span className="text-5xl">🏷️</span>
            <div className="w-8 h-8 border-3 border-slate-200 border-t-primary rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Carregando sua oferta...</p>
          </div>
        }
      >
        <RedirectHandler />
      </Suspense>
    </div>
  )
}
