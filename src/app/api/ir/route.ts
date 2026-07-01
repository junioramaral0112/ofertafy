import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/ir?url=...&loja=...
 *
 * Camada 4 — Server-side HTTP 302 redirect.
 * Usado como fallback quando o JavaScript da bridge page não funciona,
 * ou como alternativa para links compartilhados em apps de mensagem.
 *
 * Vantagens sobre o client-side:
 * - Funciona sem JavaScript
 * - Preserva HTTP Referer header
 * - Mais rápido (sem atraso de 750ms)
 *
 * ⚠️  Só aceita URLs com http:// ou https:// (proteção contra open redirect)
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  try {
    const decoded = decodeURIComponent(url)

    // Proteção: só aceita http/https
    if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // 302 Found — redirecionamento temporário (preserva SEO da origem)
    return NextResponse.redirect(decoded, 302)
  } catch {
    return NextResponse.redirect(new URL('/', req.url))
  }
}
