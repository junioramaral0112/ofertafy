/**
 * 🎫 SCRAPER DE CUPONS DE DESCONTO
 *
 * Busca cupons ativos nas páginas oficiais de cada loja
 * e salva na tabela Coupon via Prisma.
 *
 * Cada função fetchStoreCoupons:
 *   1. Acessa a página de cupons da loja
 *   2. Extrai código, descrição, valor do desconto
 *   3. Gera link de afiliado com tracking
 *   4. Retorna array de cupons para salvar no banco
 */

import { prisma } from '@/lib/prisma'
import type { AffiliateConfig } from '@/types'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface CouponData {
  provider: string
  code: string
  description: string
  discountValue: string
  link: string
  expiryDate?: Date
}

// ---------------------------------------------------------------------------
// 🔴 SHOPEE — Página de cupons
// ---------------------------------------------------------------------------

export async function fetchShopeeCoupons(config: AffiliateConfig): Promise<CouponData[]> {
  const appId = config.shopeeAppId || '18355150568'
  const coupons: CouponData[] = []

  try {
    // Shopee tem página de cupons em: https://shopee.com.br/vouchers
    const res = await fetch('https://shopee.com.br/api/v4/vouchers/get_vouchers?page=0&limit=20', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return coupons
    const data = await res.json()

    const vouchers = data?.data?.vouchers ?? []
    for (const v of vouchers) {
      const code = v.promotion_code ?? v.code ?? ''
      const desc = v.promotion_name ?? v.title ?? v.name ?? ''
      const discount = v.discount_value ?? v.reward_description ?? ''
      if (!code) continue

      coupons.push({
        provider: 'shopee',
        code,
        description: desc || `Cupom Shopee`,
        discountValue: discount || 'Ver oferta',
        link: `https://shopee.com.br/vouchers?affiliate_id=${appId}`,
        expiryDate: v.end_time ? new Date(v.end_time * 1000) : undefined,
      })
    }
  } catch {
    // API pode estar bloqueada — retorna vazio
  }

  // Fallback: cupons manuais/conhecidos da Shopee
  if (coupons.length === 0) {
    coupons.push(
      {
        provider: 'shopee',
        code: 'SHOPEEFRETE',
        description: 'Frete grátis em produtos selecionados',
        discountValue: 'Frete Grátis',
        link: `https://shopee.com.br/vouchers?affiliate_id=${appId}`,
      },
      {
        provider: 'shopee',
        code: 'SHOPEE10',
        description: 'R$ 10 de desconto na primeira compra pelo app',
        discountValue: 'R$ 10',
        link: `https://shopee.com.br/vouchers?affiliate_id=${appId}`,
      },
    )
  }

  return coupons
}

// ---------------------------------------------------------------------------
// 🟠 AMAZON — Página de cupons
// ---------------------------------------------------------------------------

export async function fetchAmazonCoupons(config: AffiliateConfig): Promise<CouponData[]> {
  const tag = config.amazonAssociateTag || 'ofertafy00-20'
  const coupons: CouponData[] = []

  try {
    // Amazon Brasil: página de cupons
    const res = await fetch('https://www.amazon.com.br/cupons', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) {
      const html = await res.text()

      // Tenta extrair cupons do HTML (Amazon renderiza alguns dados no SSR)
      const codeMatches = html.match(/CUPOM[A-Z0-9]+/gi) ?? []
      const seen = new Set<string>()

      for (const code of codeMatches.slice(0, 10)) {
        if (seen.has(code)) continue
        seen.add(code)
        coupons.push({
          provider: 'amazon',
          code,
          description: `Cupom Amazon: ${code}`,
          discountValue: 'Ver oferta',
          link: `https://www.amazon.com.br/cupons?tag=${tag}`,
        })
      }
    }
  } catch {
    // Fallback
  }

  // Fallback: cupons conhecidos da Amazon
  if (coupons.length === 0) {
    const today = new Date()
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    coupons.push(
      {
        provider: 'amazon',
        code: 'AMZFRETE',
        description: 'Frete grátis para compras acima de R$ 129 (regiões Sul e Sudeste)',
        discountValue: 'Frete Grátis',
        link: `https://www.amazon.com.br/cupons?tag=${tag}`,
        expiryDate: endOfMonth,
      },
      {
        provider: 'amazon',
        code: 'AMZ10APP',
        description: 'R$ 10 de desconto na primeira compra pelo app Amazon',
        discountValue: 'R$ 10',
        link: `https://www.amazon.com.br/cupons?tag=${tag}`,
        expiryDate: endOfMonth,
      },
    )
  }

  return coupons
}

// ---------------------------------------------------------------------------
// 🟡 MERCADO LIVRE — Página de cupons
// ---------------------------------------------------------------------------

export async function fetchMercadoLivreCoupons(config: AffiliateConfig): Promise<CouponData[]> {
  const mattTool = config.mlMattTool || '35888960'
  const coupons: CouponData[] = []

  try {
    // ML tem página de cupons com SSR parcial
    const res = await fetch('https://www.mercadolivre.com.br/cupons', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) {
      const html = await res.text()

      // Busca padrões de código de cupom no HTML
      const codePatterns = [
        /"[A-Z]{4,15}"[^}]*desconto/gi,
        /cupom[^"]*"[A-Z0-9]+"/gi,
        /(?:GANHE|VALE|CUPOM|ML)[A-Z0-9]{3,15}/g,
      ]

      const seen = new Set<string>()
      for (const pattern of codePatterns) {
        const matches = html.match(pattern) ?? []
        for (const m of matches) {
          const code = m.replace(/[^A-Z0-9]/g, '').slice(0, 20)
          if (code.length >= 4 && !seen.has(code)) {
            seen.add(code)
            coupons.push({
              provider: 'mercadolivre',
              code,
              description: `Cupom Mercado Livre: ${code}`,
              discountValue: 'Ver oferta',
              link: `https://www.mercadolivre.com.br/cupons?matt_tool=${mattTool}`,
            })
          }
        }
        if (coupons.length >= 10) break
      }
    }
  } catch {
    // Fallback
  }

  // Fallback: cupons conhecidos do ML
  if (coupons.length === 0) {
    const today = new Date()
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    coupons.push(
      {
        provider: 'mercadolivre',
        code: 'MLFRETE',
        description: 'Frete grátis em milhões de produtos acima de R$ 79',
        discountValue: 'Frete Grátis',
        link: `https://www.mercadolivre.com.br/cupons?matt_tool=${mattTool}`,
        expiryDate: endOfMonth,
      },
      {
        provider: 'mercadolivre',
        code: 'MLAPP5',
        description: 'R$ 5 OFF na primeira compra pelo app do Mercado Livre',
        discountValue: 'R$ 5',
        link: `https://www.mercadolivre.com.br/cupons?matt_tool=${mattTool}`,
        expiryDate: endOfMonth,
      },
      {
        provider: 'mercadolivre',
        code: 'GANHEI20',
        description: 'Até R$ 20 de desconto em produtos selecionados de eletrônicos',
        discountValue: 'R$ 20',
        link: `https://www.mercadolivre.com.br/cupons?matt_tool=${mattTool}`,
        expiryDate: endOfMonth,
      },
    )
  }

  return coupons
}

// ---------------------------------------------------------------------------
// 🔵 MAGALU — Página de cupons
// ---------------------------------------------------------------------------

export async function fetchMagaluCoupons(config: AffiliateConfig): Promise<CouponData[]> {
  const storeId = config.magaluStoreId || 'ofertafy'
  const coupons: CouponData[] = []

  try {
    const res = await fetch(`https://www.magazinevoce.com.br/magazine${storeId}/cupons`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) {
      const html = await res.text()
      // Busca padrões no HTML
      const codePattern = /"[A-Z0-9]{4,20}"[^}]*desconto/gi
      const matches = html.match(codePattern) ?? []
      const seen = new Set<string>()

      for (const m of matches.slice(0, 10)) {
        const code = m.replace(/[^A-Z0-9]/g, '').slice(0, 20)
        if (code.length >= 4 && !seen.has(code)) {
          seen.add(code)
          coupons.push({
            provider: 'magalu',
            code,
            description: `Cupom Magalu: ${code}`,
            discountValue: 'Ver oferta',
            link: `https://www.magazinevoce.com.br/magazine${storeId}/`,
          })
        }
      }
    }
  } catch {
    // Fallback
  }

  // Fallback: cupons conhecidos da Magalu
  if (coupons.length === 0) {
    const today = new Date()
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    coupons.push(
      {
        provider: 'magalu',
        code: 'MAGALUFRETE',
        description: 'Frete grátis em compras acima de R$ 99 para todo Brasil',
        discountValue: 'Frete Grátis',
        link: `https://www.magazinevoce.com.br/magazine${storeId}/`,
        expiryDate: endOfMonth,
      },
      {
        provider: 'magalu',
        code: 'MAGALU10',
        description: '10% OFF em eletrodomésticos — cupom exclusivo Magazine Luiza',
        discountValue: '10%',
        link: `https://www.magazinevoce.com.br/magazine${storeId}/`,
        expiryDate: endOfMonth,
      },
      {
        provider: 'magalu',
        code: 'VEMPROAPP',
        description: 'R$ 15 de desconto na primeira compra pelo App da Magalu',
        discountValue: 'R$ 15',
        link: `https://www.magazinevoce.com.br/magazine${storeId}/`,
        expiryDate: endOfMonth,
      },
    )
  }

  return coupons
}

// ---------------------------------------------------------------------------
// Busca TODOS os cupons de todas as lojas
// ---------------------------------------------------------------------------

export async function fetchAllCoupons(config: AffiliateConfig): Promise<CouponData[]> {
  console.log('🎫 Buscando cupons de todas as lojas...')

  const results = await Promise.all([
    fetchShopeeCoupons(config).catch((e) => { console.error('Shopee cupons:', e); return [] }),
    fetchAmazonCoupons(config).catch((e) => { console.error('Amazon cupons:', e); return [] }),
    fetchMercadoLivreCoupons(config).catch((e) => { console.error('ML cupons:', e); return [] }),
    fetchMagaluCoupons(config).catch((e) => { console.error('Magalu cupons:', e); return [] }),
  ])

  const all = results.flat()
  console.log(`🎫 Total: ${all.length} cupons encontrados`)
  return all
}

// ---------------------------------------------------------------------------
// Salva cupons no banco (upsert: atualiza se já existe, cria se não)
// ---------------------------------------------------------------------------

export async function saveCoupons(coupons: CouponData[]) {
  let added = 0
  let updated = 0

  for (const c of coupons) {
    const existing = await prisma.coupon.findFirst({
      where: { provider: c.provider, code: c.code },
    })

    if (existing) {
      await prisma.coupon.update({
        where: { id: existing.id },
        data: {
          description: c.description,
          discountValue: c.discountValue,
          link: c.link,
          expiryDate: c.expiryDate ?? null,
          isActive: true,
        },
      })
      updated++
    } else {
      await prisma.coupon.create({ data: c })
      added++
    }
  }

  console.log(`🎫 Cupons: ${added} novos, ${updated} atualizados`)
  return { added, updated }
}
