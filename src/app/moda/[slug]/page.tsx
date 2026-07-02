import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import OfferCard from '@/components/OfferCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import Link from 'next/link'

// Mapeamento de slugs para metadata SEO
const MODA_PAGES: Record<string, { title: string; desc: string; h1: string; keywords: string[] }> = {
  'moda-feminina': {
    title: 'Moda Feminina — Roupas, Vestidos e Acessórios com Desconto',
    desc: 'As melhores ofertas de moda feminina: vestidos, blusas, calças, conjuntos, plus size, moda praia e muito mais. Compare preços no Mercado Livre, Amazon, Shopee e Magalu.',
    h1: 'Moda Feminina',
    keywords: ['vestido', 'blusa feminina', 'calça feminina', 'conjunto feminino', 'saia', 'plus size', 'moda praia'],
  },
  'moda-masculina': {
    title: 'Moda Masculina — Camisas, Calças, Tênis e Bermudas em Oferta',
    desc: 'As melhores ofertas de moda masculina: camisas, camisetas, calças, bermudas, tênis, cuecas e muito mais. Economize comprando online.',
    h1: 'Moda Masculina',
    keywords: ['camisa masculina', 'calça masculina', 'camiseta', 'bermuda', 'cueca', 'polo', 'terno'],
  },
  vestidos: {
    title: 'Vestidos em Oferta — Longos, Curtos, Festa e Casuais com Desconto',
    desc: 'Encontre vestidos com até 80% OFF. Vestidos longos, curtos, de festa, casuais, plus size. Compare preços nas melhores lojas.',
    h1: 'Vestidos em Oferta',
    keywords: ['vestido', 'vestido longo', 'vestido curto', 'vestido festa', 'vestido plus size'],
  },
  'blusas-femininas': {
    title: 'Blusas Femininas em Oferta — Camisetas, Regatas, Cropped e Mais',
    desc: 'Blusas femininas com desconto: camisetas, regatas, cropped, bodies, blusas de frio. As melhores ofertas online.',
    h1: 'Blusas Femininas',
    keywords: ['blusa feminina', 'camiseta feminina', 'cropped', 'body', 'regata', 'blusa'],
  },
  'calcas-femininas': {
    title: 'Calças Femininas em Oferta — Jeans, Legging, Pantalona e Mais',
    desc: 'Calças femininas com até 70% OFF: jeans, legging, pantalona, skinny, wide leg, alfaiataria. Compare preços.',
    h1: 'Calças Femininas',
    keywords: ['calça feminina', 'legging', 'jeans feminino', 'pantalona', 'calça wide leg'],
  },
  'conjuntos-femininos': {
    title: 'Conjuntos Femininos em Oferta — Looks Completos com Desconto',
    desc: 'Conjuntos femininos em promoção: moda praia, fitness, casual, social. Looks completos por um preço incrível.',
    h1: 'Conjuntos Femininos',
    keywords: ['conjunto feminino', 'conjunto moda praia', 'conjunto fitness', 'conjunto casual'],
  },
  'plus-size': {
    title: 'Moda Plus Size em Oferta — Roupas GG, G1, G2 com Desconto',
    desc: 'Moda plus size com desconto: vestidos, blusas, calças, conjuntos nos tamanhos GG, G1, G2, G3. Estilo e conforto.',
    h1: 'Moda Plus Size',
    keywords: ['plus size', 'GG', 'tamanho grande', 'plus', 'G1', 'G2', 'moda plus'],
  },
  'camisa-masculina': {
    title: 'Camisas Masculinas em Oferta — Social, Polo, Casual com Desconto',
    desc: 'Camisas masculinas em promoção: social, polo, casual, manga longa, slim fit. Compare preços e economize.',
    h1: 'Camisas Masculinas',
    keywords: ['camisa masculina', 'polo masculina', 'camisa social', 'camisa manga longa', 'camisa slim'],
  },
  'calca-masculina': {
    title: 'Calças Masculinas em Oferta — Jeans, Sarja, Social com Desconto',
    desc: 'Calças masculinas com desconto: jeans, sarja, social, chino, jogger. Melhores marcas e preços.',
    h1: 'Calças Masculinas',
    keywords: ['calça masculina', 'calça jeans', 'calça sarja', 'calça social', 'bermuda masculina'],
  },
  'tenis-feminino': {
    title: 'Tênis Feminino em Oferta — Esportivo, Casual, Conforto com Desconto',
    desc: 'Tênis feminino em promoção: esportivo, casual, academia, caminhada. Marcas como Adidas, Nike, Puma, Fila.',
    h1: 'Tênis Feminino',
    keywords: ['tênis feminino', 'tênis', 'sapatênis', 'tênis corrida', 'tênis academia'],
  },
  'tenis-masculino': {
    title: 'Tênis Masculino em Oferta — Esportivo, Casual, Corrida com Desconto',
    desc: 'Tênis masculino em promoção: esportivo, casual, corrida, academia. Grandes marcas com até 60% OFF.',
    h1: 'Tênis Masculino',
    keywords: ['tênis masculino', 'tênis', 'tênis corrida', 'tênis academia', 'tênis casual'],
  },
  bolsas: {
    title: 'Bolsas em Oferta — Tiracolo, Mochila, Carteira com Desconto',
    desc: 'Bolsas com desconto: tiracolo, mochila, carteira, necessaire, clutch, mala de viagem. Compare preços.',
    h1: 'Bolsas em Oferta',
    keywords: ['bolsa', 'bolsa tiracolo', 'mochila', 'carteira', 'necessaire', 'mala'],
  },
  sandalias: {
    title: 'Sandálias em Oferta — Rasteirinha, Salto, Plataforma com Desconto',
    desc: 'Sandálias femininas e masculinas em promoção: rasteirinha, salto, anabela, plataforma, slide. Melhores preços.',
    h1: 'Sandálias em Oferta',
    keywords: ['sandália', 'sandália feminina', 'rasteirinha', 'chinelo', 'sandália salto', 'sandália plataforma'],
  },
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const config = MODA_PAGES[slug]
  if (!config) return { title: 'Moda — Ofertafy' }

  return {
    title: config.title,
    description: config.desc,
    alternates: { canonical: `/moda/${slug}` },
    openGraph: {
      title: config.title,
      description: config.desc,
      url: `/moda/${slug}`,
      type: 'website',
    },
  }
}

export default async function ModaPage({ params }: Props) {
  const { slug } = await params
  const config = MODA_PAGES[slug]

  if (!config) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Página não encontrada</h1>
        <Link href="/" className="text-primary hover:underline">← Voltar ao início</Link>
      </div>
    )
  }

  // Buscar ofertas que contenham qualquer uma das keywords
  const offers = await prisma.offer.findMany({
    where: {
      OR: config.keywords.map((kw) => ({
        title: { contains: kw, mode: 'insensitive' as const },
      })),
      price: { gt: 0 },
    },
    orderBy: { discountPct: 'desc' },
    take: 24,
  })

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Início', href: '/' },
          { label: 'Moda', href: '/moda/moda-feminina' },
          { label: config.h1 },
        ]} />

        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
            {config.h1} — Melhores Ofertas com Desconto
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            {config.desc}
            {offers.length > 0 && (
              <> Encontramos <strong>{offers.length} ofertas</strong> de {config.h1.toLowerCase()} com descontos de até {Math.max(...offers.map((o: any) => o.discountPct))}% no Mercado Livre, Amazon, Shopee, Magalu e SHEIN.</>
            )}
          </p>
        </div>

        {offers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mb-10">
            {offers.map((offer: any) => <OfferCard key={offer.id} offer={offer} />)}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-5xl mb-4 block">🛍</span>
            <p className="text-slate-500">Nenhuma oferta encontrada no momento. Tente novamente mais tarde.</p>
          </div>
        )}

        {/* Links para navegação de moda */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-10">
          <h2 className="font-bold text-slate-900 mb-3">🛍 Navegue por Moda</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MODA_PAGES).map(([s, c]) => (
              <Link key={s} href={`/moda/${s}`}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  s === slug
                    ? 'bg-primary text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {c.h1}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
