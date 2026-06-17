import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

async function main() {
  const coupons = [
    { provider: 'shopee', code: 'SHOPEEFRETE', description: 'Frete grátis em produtos selecionados', discountValue: 'Frete Grátis', link: 'https://shopee.com.br/vouchers?affiliate_id=18355150568' },
    { provider: 'shopee', code: 'SHOPEE10', description: 'R$ 10 de desconto na primeira compra pelo app', discountValue: 'R$ 10', link: 'https://shopee.com.br/vouchers?affiliate_id=18355150568' },
    { provider: 'amazon', code: 'AMZFRETE', description: 'Frete grátis para compras acima de R$ 129', discountValue: 'Frete Grátis', link: 'https://www.amazon.com.br/cupons?tag=ofertafy00-20' },
    { provider: 'amazon', code: 'AMZ10APP', description: 'R$ 10 de desconto na primeira compra pelo app', discountValue: 'R$ 10', link: 'https://www.amazon.com.br/cupons?tag=ofertafy00-20' },
    { provider: 'mercadolivre', code: 'MLFRETE', description: 'Frete grátis em milhões de produtos acima de R$ 79', discountValue: 'Frete Grátis', link: 'https://www.mercadolivre.com.br/cupons?matt_tool=35888960' },
    { provider: 'mercadolivre', code: 'GANHEI20', description: 'Até R$ 20 de desconto em eletrônicos', discountValue: 'R$ 20', link: 'https://www.mercadolivre.com.br/cupons?matt_tool=35888960' },
    { provider: 'magalu', code: 'MAGALUFRETE', description: 'Frete grátis em compras acima de R$ 99', discountValue: 'Frete Grátis', link: 'https://www.magazinevoce.com.br/magazineofertafy/' },
    { provider: 'magalu', code: 'MAGALU10', description: '10% OFF em eletrodomésticos', discountValue: '10%', link: 'https://www.magazinevoce.com.br/magazineofertafy/' },
  ]

  for (const c of coupons) {
    const exists = await p.coupon.findFirst({ where: { provider: c.provider, code: c.code } })
    if (!exists) {
      await p.coupon.create({ data: c })
      console.log(`  ✅ ${c.provider}: ${c.code}`)
    } else {
      console.log(`  ⏭️  ${c.provider}: ${c.code} (já existe)`)
    }
  }

  const total = await p.coupon.count()
  console.log(`🎫 Total: ${total} cupons no banco`)
}

main().finally(() => p.$disconnect())
