import { prisma } from '@/lib/prisma'
import { formatPrice, getBridgeUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1 hora

/**
 * GET /api/rss — RSS Feed com as últimas ofertas
 *
 * Compatível com:
 *   - Feedly, Inoreader, NewsBlur
 *   - Google Discover (via RSS)
 *   - Zapier, IFTTT, Make
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ofertafy.com.br'

  const offers = await prisma.offer.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      price: true,
      originalPrice: true,
      discountPct: true,
      store: true,
      storeLabel: true,
      url: true,
      imageUrl: true,
      description: true,
      createdAt: true,
    },
  })

  const items = offers
    .map(
      (o: any) => `
    <item>
      <title><![CDATA[${o.title.slice(0, 100)} — ${formatPrice(o.price)} (-${o.discountPct}%)]]></title>
      <link>${siteUrl}/produto/${o.id}</link>
      <guid isPermaLink="true">${siteUrl}/produto/${o.id}</guid>
      <description><![CDATA[
        <p>De ${formatPrice(o.originalPrice)} por <strong>${formatPrice(o.price)}</strong> (-${o.discountPct}% OFF)</p>
        <p>Loja: ${o.storeLabel}</p>
        <p><a href="${getBridgeUrl(o.url, o.storeLabel, true)}">Ver oferta na ${o.storeLabel} →</a></p>
        ${o.imageUrl ? `<img src="${o.imageUrl}" alt="${o.title.slice(0, 60)}" />` : ''}
      ]]></description>
      <pubDate>${new Date(o.createdAt).toUTCString()}</pubDate>
      <source url="${siteUrl}">Ofertafy</source>
      <category>${o.storeLabel}</category>
    </item>`,
    )
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Ofertafy — Melhores Ofertas do Brasil</title>
    <link>${siteUrl}</link>
    <description>As melhores ofertas do Mercado Livre, Magalu, Shopee e Amazon em um só lugar. Atualizado a cada hora.</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/logo.png</url>
      <title>Ofertafy</title>
      <link>${siteUrl}</link>
    </image>
    ${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  })
}
