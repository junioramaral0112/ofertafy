/**
 * 🛡️ Middleware Global — Rate Limiting + CSRF + Headers
 *
 * Rate limiting: 60 req/min por IP nas APIs públicas.
 * Implementação leve com Map (sem dependências externas).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Rate Limiter em memória ──────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_WINDOW = 60_000  // 1 minuto
const RATE_LIMIT_MAX = 60         // 60 requisições por minuto
const RATE_LIMIT_ADMIN = 20       // 20 req/min para APIs de admin
const RATE_LIMIT_FETCH = 5        // 5 req/min para scraping

function getRateLimitKey(request: NextRequest): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'anonymous'
  const path = request.nextUrl.pathname
  return `${ip}:${path}`
}

function checkRateLimit(key: string, max: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: max - 1 }
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: max - entry.count }
}

// Limpeza periódica do Map (a cada 5 minutos)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key)
    }
  }, 300_000)
}

// ── Middleware ───────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const key = getRateLimitKey(request)

  // API de scraping: limite bem baixo
  if (pathname.startsWith('/api/fetch')) {
    const { allowed, remaining } = checkRateLimit(key, RATE_LIMIT_FETCH)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 },
      )
    }
    const res = NextResponse.next()
    res.headers.set('X-RateLimit-Remaining', String(remaining))
    return res
  }

  // APIs de admin: limite médio
  if (pathname.startsWith('/api/admin')) {
    const { allowed, remaining } = checkRateLimit(key, RATE_LIMIT_ADMIN)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 },
      )
    }
    const res = NextResponse.next()
    res.headers.set('X-RateLimit-Remaining', String(remaining))
    return res
  }

  // APIs públicas: limite padrão
  if (pathname.startsWith('/api/')) {
    const { allowed, remaining } = checkRateLimit(key, RATE_LIMIT_MAX)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 },
      )
    }
    const res = NextResponse.next()
    res.headers.set('X-RateLimit-Remaining', String(remaining))
    return res
  }

  return NextResponse.next()
}

// ── Config: só aplica nas rotas de API ───────────────
export const config = {
  matcher: '/api/:path*',
}
