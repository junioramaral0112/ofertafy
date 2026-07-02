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

    // ── Parâmetros de afiliado ─────────────────────────
    // url_from: ID do afiliado na plataforma SHEIN
    // subid: identificador da origem do clique (para analytics)
    const AFFILIATE_ID = 'affiliate_koc_4292353225'
    const SUBID = 'ofertafy_home'

    // ── Montar URL limpa + tracking ────────────────────
    // A URL limpa garante que o produto abra corretamente.
    // Os parâmetros são processados pelo servidor da SHEIN
    // durante o HTTP redirect, ANTES de qualquer App abrir.
    const productUrl = `https://br.shein.com/product-p-${productId}.html`
    const targetUrl = `${productUrl}?url_from=${AFFILIATE_ID}&subid=${SUBID}`

    // ── HTTP 302 Redirect ──────────────────────────────
    // 302 = redirecionamento temporário.
    // Cache-Control: no-store impede que o navegador faça cache
    // do redirect, garantindo que cada clique seja rastreado.
    return NextResponse.redirect(targetUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })

  } catch {
    // Fallback: redirecionar para o produto sem tracking
    const fallbackUrl = `https://br.shein.com/product-p-${productId}.html`
    return NextResponse.redirect(fallbackUrl, 302)
  }
}
