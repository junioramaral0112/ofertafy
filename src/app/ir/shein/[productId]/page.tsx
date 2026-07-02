import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

type Props = { params: Promise<{ productId: string }> }

/**
 * /ir/shein/[productId] — Redirect seguro com tracking
 *
 * Camada anti-deep-link para SHEIN:
 *   1. Registra clique no banco (ANTES de sair do Ofertafy)
 *   2. Redireciona para a bridge page (/ir) com proteção de 750ms
 *   3. Bridge page redireciona para o produto na SHEIN
 *
 * Mesmo se o app da SHEIN abrir e remover parâmetros,
 * o clique já está registrado.
 */
export default async function SheinRedirectPage({ params }: Props) {
  const { productId } = await params

  try {
    // Buscar a oferta pelo sourceId
    const offer = await prisma.offer.findFirst({
      where: {
        store: 'shein',
        OR: [
          { sourceId: `shein-${productId}` },
          { sourceId: productId },
        ],
      },
      select: { id: true, url: true },
    })

    // Registrar clique ANTES do redirect
    if (offer) {
      await prisma.offer.update({
        where: { id: offer.id },
        data: { clicks: { increment: 1 } },
      })
    }

    // URL limpa do produto
    const productUrl = offer?.url || `https://www.shein.com.br/product-p-${productId}.html`

    // Redirecionar para a bridge page com proteção anti-deep-link
    const bridgePath = `/ir?url=${encodeURIComponent(productUrl)}&loja=${encodeURIComponent('SHEIN')}`
    redirect(bridgePath)

  } catch {
    // Fallback: redirecionar direto para bridge page
    const fallbackPath = `/ir?url=${encodeURIComponent(`https://www.shein.com.br/product-p-${productId}.html`)}&loja=SHEIN`
    redirect(fallbackPath)
  }
}
