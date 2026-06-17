import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Inserindo dados de exemplo (ML + Magalu)...')

  const sampleOffers = [
    // ============ MERCADO LIVRE (matt_tool=35888960) ============
    { title: 'Smart TV 50" 4K UHD Samsung Crystal', description: 'Smart TV Samsung 50", resolucao 4K, processador Crystal 4K', imageUrl: 'https://picsum.photos/seed/tv/400/400', price: 1899.00, originalPrice: 2999.00, discountPct: 37, url: 'https://www.mercadolivre.com.br/tv-samsung-50-4k?matt_tool=35888960', store: 'mercadolivre', storeLabel: 'Mercado Livre', category: 'Eletronicos', categorySlug: 'eletronicos', installment: '12x R$ 158,25 sem juros', freeShipping: true, sourceId: 'MLB1234567890' },
    { title: 'iPhone 15 Pro Max 256GB Titanio', description: 'Apple iPhone 15 Pro Max, Titanio Natural, 5G, 256GB', imageUrl: 'https://picsum.photos/seed/iphone/400/400', price: 7499.00, originalPrice: 9499.00, discountPct: 21, url: 'https://www.mercadolivre.com.br/iphone-15-pro-max?matt_tool=35888960', store: 'mercadolivre', storeLabel: 'Mercado Livre', category: 'Celulares', categorySlug: 'celulares', installment: '12x R$ 624,92 sem juros', freeShipping: true, sourceId: 'MLB0987654321' },
    { title: 'Robo Aspirador Inteligente Xiaomi', description: 'Robo aspirador com mapeamento WiFi, Alexa', imageUrl: 'https://picsum.photos/seed/robo/400/400', price: 1599.00, originalPrice: 2999.00, discountPct: 47, url: 'https://www.mercadolivre.com.br/robo-aspirador-xiaomi?matt_tool=35888960', store: 'mercadolivre', storeLabel: 'Mercado Livre', category: 'Casa', categorySlug: 'casa', installment: '12x R$ 133,25 sem juros', freeShipping: true, sourceId: 'MLB5555555555' },
    { title: 'Cafeteira Nespresso Essenza Mini', description: 'Nespresso Essenza Mini, 19 bar, 2 tamanhos', imageUrl: 'https://picsum.photos/seed/cafeteira/400/400', price: 299.00, originalPrice: 499.00, discountPct: 40, url: 'https://www.mercadolivre.com.br/cafeteira-nespresso?matt_tool=35888960', store: 'mercadolivre', storeLabel: 'Mercado Livre', category: 'Eletrodomesticos', categorySlug: 'eletrodomesticos', installment: '12x R$ 24,92 sem juros', freeShipping: true, sourceId: 'MLB7777777777', isFlash: true, flashEndsAt: new Date(Date.now() + 4 * 60 * 60 * 1000) },
    { title: 'Bicicleta Aro 29 MTB 21 Marchas', description: 'Bicicleta MTB, quadro aluminio, suspensao dianteira', imageUrl: 'https://picsum.photos/seed/bike/400/400', price: 999.00, originalPrice: 1799.00, discountPct: 44, url: 'https://www.mercadolivre.com.br/bicicleta-aro-29?matt_tool=35888960', store: 'mercadolivre', storeLabel: 'Mercado Livre', category: 'Esportes', categorySlug: 'esportes', installment: '12x R$ 83,25 sem juros', freeShipping: true, sourceId: 'MLB8888888888' },
    { title: 'Notebook Samsung Galaxy Book2 i5', description: 'Notebook Samsung, Intel Core i5, 8GB RAM, SSD 256GB', imageUrl: 'https://picsum.photos/seed/notebook2/400/400', price: 2499.00, originalPrice: 3999.00, discountPct: 38, url: 'https://www.mercadolivre.com.br/notebook-samsung-book2?matt_tool=35888960', store: 'mercadolivre', storeLabel: 'Mercado Livre', category: 'Informatica', categorySlug: 'informatica', installment: '12x R$ 208,25 sem juros', freeShipping: true, sourceId: 'MLB2222222222' },

    // ============ MAGALU (Magazine Você ofertafy) ============
    { title: 'Geladeira Brastemp Frost Free 375L', description: 'Geladeira Brastemp 375 litros, Frost Free, Inox', imageUrl: 'https://picsum.photos/seed/geladeira/400/400', price: 2899.00, originalPrice: 4299.00, discountPct: 33, url: 'https://www.magazinevoce.com.br/magazineofertafy/busca/produto/123', store: 'magalu', storeLabel: 'Magalu', category: 'Eletrodomesticos', categorySlug: 'eletrodomesticos', installment: '12x R$ 241,58 sem juros', freeShipping: true, sourceId: 'magalu-001' },
    { title: 'Fogao 5 Bocas Fischer Inox', description: 'Fogao Fischer 5 bocas, acendimento automatico, Inox', imageUrl: 'https://picsum.photos/seed/fogao/400/400', price: 1299.00, originalPrice: 1999.00, discountPct: 35, url: 'https://www.magazinevoce.com.br/magazineofertafy/busca/produto/456', store: 'magalu', storeLabel: 'Magalu', category: 'Eletrodomesticos', categorySlug: 'eletrodomesticos', installment: '12x R$ 108,25 sem juros', freeShipping: true, sourceId: 'magalu-002' },
    { title: 'Smartphone Motorola Edge 40 5G', description: 'Motorola Edge 40, 5G, 256GB, 8GB RAM, tela 6.5"', imageUrl: 'https://picsum.photos/seed/moto/400/400', price: 1899.00, originalPrice: 3299.00, discountPct: 42, url: 'https://www.magazinevoce.com.br/magazineofertafy/busca/produto/789', store: 'magalu', storeLabel: 'Magalu', category: 'Celulares', categorySlug: 'celulares', installment: '12x R$ 158,25 sem juros', freeShipping: true, sourceId: 'magalu-003', isFlash: true, flashEndsAt: new Date(Date.now() + 6 * 60 * 60 * 1000) },
    { title: 'Maquina de Lavar LG 12kg Inox', description: 'Maquina LG 12kg, lavagem inteligente, motor inverter', imageUrl: 'https://picsum.photos/seed/lavar/400/400', price: 2199.00, originalPrice: 3299.00, discountPct: 33, url: 'https://www.magazinevoce.com.br/magazineofertafy/busca/produto/012', store: 'magalu', storeLabel: 'Magalu', category: 'Eletrodomesticos', categorySlug: 'eletrodomesticos', installment: '12x R$ 183,25 sem juros', freeShipping: true, sourceId: 'magalu-004' },
    { title: 'Tenis Nike Revolution 7 FlyEase', description: 'Tenis Nike Revolution 7, FlyEase, masculino', imageUrl: 'https://picsum.photos/seed/tenis2/400/400', price: 249.90, originalPrice: 429.99, discountPct: 42, url: 'https://www.magazinevoce.com.br/magazineofertafy/busca/produto/345', store: 'magalu', storeLabel: 'Magalu', category: 'Moda', categorySlug: 'moda', installment: '12x R$ 20,83 sem juros', freeShipping: true, sourceId: 'magalu-005' },
    { title: 'Ar Condicionado Split LG Dual 12000', description: 'Ar condicionado LG Dual Inverter, 12000 BTUs, frio', imageUrl: 'https://picsum.photos/seed/arcond/400/400', price: 2399.00, originalPrice: 3599.00, discountPct: 33, url: 'https://www.magazinevoce.com.br/magazineofertafy/busca/produto/678', store: 'magalu', storeLabel: 'Magalu', category: 'Eletrodomesticos', categorySlug: 'eletrodomesticos', installment: '12x R$ 199,92 sem juros', freeShipping: true, sourceId: 'magalu-006' },
  ]

  await prisma.priceHistory.deleteMany()
  await prisma.offer.deleteMany()

  for (const offerData of sampleOffers) {
    const { isFlash, flashEndsAt, ...data } = offerData
    const offer = await prisma.offer.create({
      data: { ...data, isFlash: isFlash || false, flashEndsAt: flashEndsAt || null },
    })
    const now = new Date()
    for (let i = 7; i >= 0; i--) {
      const day = new Date(now); day.setDate(day.getDate() - i)
      const variation = (Math.random() - 0.5) * (data.originalPrice - data.price) * 0.3
      await prisma.priceHistory.create({
        data: { offerId: offer.id, price: Math.round((data.price + variation) * 100) / 100, checkedAt: day },
      })
    }
  }
  console.log(`✅ ${sampleOffers.length} ofertas criadas (${sampleOffers.filter(o=>o.store==='mercadolivre').length} ML + ${sampleOffers.filter(o=>o.store==='magalu').length} Magalu)`)
}
main().catch((e) => { console.error('Erro:', e); process.exit(1) }).finally(() => prisma.$disconnect())
