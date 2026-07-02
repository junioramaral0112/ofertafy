import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/r/shein?id=486969975
 *
 * REDIRECT SERVIDOR COM TRACKING DE AFILIADO
 * ===========================================
 *
 * PROBLEMA RESOLVIDO:
 *   Em dispositivos móveis, links com JavaScript (window.location)
 *   disparam o Deep Link do app da SHEIN, que abre o app nativo
 *   e REMOVE parâmetros de tracking (url_from).
 *   Resultado: comissão perdida.
 *
 * COMO OS GRANDES PLAYERS RESOLVEM:
 *   Usam redirecionamento HTTP 302 (server-side) em vez de
 *   redirecionamento JavaScript (client-side).
 *
 *   HTTP 302 acontece na camada de rede do navegador, ANTES de
 *   qualquer JavaScript ser executado. O app NÃO intercepta
 *   redirecionamentos HTTP — apenas navegações JavaScript.
 *
 *   Quando o navegador segue o 302 para SHEIN:
 *     1. O parâmetro url_from=... vai na URL da requisição HTTP
 *     2. O servidor da SHEIN processa o parâmetro server-side
 *     3. SHEIN seta o cookie de afiliado na resposta HTTP
 *     4. O cookie fica armazenado no navegador
 *     5. Se o app abrir depois, o cookie JÁ ESTÁ lá
 *
 * FLUXO COMPLETO:
 *   Usuário clica → /api/r/shein?id=486969975
 *   → 302 redirect para br.shein.com/product-p-486969975.html?url_from=...
 *   → SHEIN recebe o parâmetro → seta cookie de afiliado
 *   → Usuário vê o produto (cookie já registrado)
 *
 * CAMADA DE PROTEÇÃO ADICIONAL:
 *   O clique também é registrado no banco ANTES do redirect.
 *   Se o tracking falhar por qualquer motivo, temos o registro.
 */

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('id')

  if (!productId) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  try {
    // ── Registrar clique no banco ──────────────────────
    const offer = await prisma.offer.findFirst({
      where: {
        store: 'shein',
        OR: [
          { sourceId: `shein-${productId}` },
          { sourceId: productId },
        ],
      },
      select: { id: true },
    })

    if (offer) {
      await prisma.offer.update({
        where: { id: offer.id },
        data: { clicks: { increment: 1 } },
      })
    }

    // ── Construir URL com tracking ─────────────────────
    // O url_from só funciona em HTTP redirect (server-side).
    // Em navegação client-side o app da SHEIN remove o parâmetro.
    const trackingParam = `url_from=affiliate_koc_4292353225`
    const productUrl = `https://br.shein.com/product-p-${productId}.html`
    const targetUrl = `${productUrl}?${trackingParam}`

    // ── HTTP 302 Redirect ──────────────────────────────
    // 302 = redirecionamento temporário.
    // O navegador segue o redirect na camada HTTP.
    // Apps NÃO interceptam redirecionamentos HTTP.
    return NextResponse.redirect(targetUrl, 302)

  } catch {
    // Fallback: redirecionar para o produto sem tracking
    const fallbackUrl = `https://br.shein.com/product-p-${productId}.html`
    return NextResponse.redirect(fallbackUrl, 302)
  }
}
