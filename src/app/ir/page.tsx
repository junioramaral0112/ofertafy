'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// ═══════════════════════════════════════════════════════════
// PÁGINA PONTE (/ir) — Blindagem de Afiliado (v2)
// ═══════════════════════════════════════════════════════════
//
// Problema resolvido:
//   Android/iOS interceptam links de e-commerce e forçam a
//   abertura dos apps nativos (Mercado Livre, Magalu, Shopee,
//   Amazon). Isso DERRUBA o cookie de afiliado e você perde
//   a comissão.
//
// Estratégia multi-camada (v2):
//   Camada 1: location.replace(url)     ← JS (primário, 750ms)
//   Camada 2: <meta http-equiv refresh> ← HTML (fallback, 1000ms)
//   Camada 3: <noscript><a href></a>    ← HTML puro (sem JS)
//   Camada 4: /api/ir?redirect=server   ← Server-side 302 (backup)
// ═══════════════════════════════════════════════════════════

const BRIDGE_DELAY_MS = 750
const META_REFRESH_DELAY_S = 1

function RedirectHandler() {
  const searchParams = useSearchParams()
  const [error, setError] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [targetUrl, setTargetUrl] = useState('/')

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

      setTargetUrl(decoded)

      // ── Camada 1: Redirecionamento JS com atraso ──────
      const timer = setTimeout(() => {
        window.location.replace(decoded)
      }, BRIDGE_DELAY_MS)

      return () => clearTimeout(timer)
    } catch {
      setError(true)
      setTargetUrl('/')
      const timer = setTimeout(() => {
        window.location.replace('/')
      }, BRIDGE_DELAY_MS)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const isHome = targetUrl === '/'

  return (
    <>
      {/* Camada 2: Meta refresh fallback (funciona sem JavaScript) */}
      {!error && (
        <meta
          httpEquiv="refresh"
          content={`${META_REFRESH_DELAY_S};url=${targetUrl}`}
        />
      )}

      <div className="flex flex-col items-center justify-center gap-4">
        {/* Logo / Ícone */}
        <div className="flex items-center gap-2">
          <span className="text-5xl animate-bounce">{error ? '🔙' : '🏷️'}</span>
        </div>

        {/* Spinner (só aparece com JS) */}
        {!error && (
          <div className="w-8 h-8 border-3 border-slate-200 border-t-primary rounded-full animate-spin" />
        )}

        {/* Texto dinâmico */}
        <p className="text-slate-700 font-medium text-lg text-center px-4">
          {error
            ? 'Redirecionando para a home...'
            : storeName
              ? <>Ativando seu desconto na loja <span className="text-primary font-bold">{storeName}</span></>
              : 'Ativando seu desconto...'}
        </p>

        <p className="text-slate-400 text-xs text-center mt-2">
          {error
            ? 'Algo deu errado. Voltando para a página inicial.'
            : 'Você será redirecionado em instantes. Não pague nada a mais por isso — link de afiliado.'}
        </p>

        {/* Camada 3: Fallback para navegadores sem JavaScript */}
        <noscript>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-800 text-sm font-medium mb-2">
              ⚠ JavaScript está desabilitado
            </p>
            {isHome ? (
              <a href="/" className="text-primary font-bold hover:underline">
                Clique aqui para voltar à página inicial
              </a>
            ) : (
              <a
                href={targetUrl}
                rel="nofollow"
                className="text-primary font-bold hover:underline"
              >
                Clique aqui para acessar a oferta na {storeName || 'loja'}
              </a>
            )}
          </div>
        </noscript>
      </div>
    </>
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
