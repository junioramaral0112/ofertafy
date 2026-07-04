import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import OfferCard from '@/components/OfferCard'
import Breadcrumbs from '@/components/Breadcrumbs'

type Props = { params: Promise<{ query: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { query } = await params
  const term = decodeURIComponent(query).replace(/-/g, ' ')
  const words = term.split(/\s+/).filter((w: string) => w.length > 1)
  const title = `${capitalize(term)} — Melhores Preços e Ofertas | Ofertafy`
  const desc = `Compare preços de ${term} no Mercado Livre, Amazon, Shopee e Magalu.`

  // Verificar se há ofertas
  const count = words.length > 0
    ? await prisma.offer.count({ where: { OR: words.map((w: string) => ({ title: { contains: w, mode: 'insensitive' as const } })) } })
    : 0

  return {
    title,
    description: desc,
    alternates: { canonical: `/busca/${query}` },
    robots: count < 20 ? 'noindex, follow' : undefined,
    openGraph: {
      title,
      description: desc,
      url: `/busca/${query}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
    },
  }
}

export default async function BuscaLandingPage({ params }: Props) {
  const { query } = await params
  const term = decodeURIComponent(query).replace(/-/g, ' ').trim()
  const searchWords = term.split(/\s+/).filter((w) => w.length > 1)

  // Buscar ofertas
  let offers: any[] = []
  if (searchWords.length > 0) {
    offers = await prisma.offer.findMany({
      where: {
        OR: searchWords.map((w) => ({ title: { contains: w, mode: 'insensitive' as const } })),
      },
      orderBy: { discountPct: 'desc' },
      take: 24,
    })
  }

  // Sugestões de buscas relacionadas
  const relatedSearches = searchWords.length > 0
    ? await prisma.searchTerm.findMany({
        where: { term: { contains: searchWords[0], mode: 'insensitive' as const } },
        orderBy: { count: 'desc' },
        take: 8,
      })
    : []

  const termCapitalized = capitalize(term)

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Início', href: '/' },
          { label: 'Busca', href: '/busca' },
          { label: termCapitalized },
        ]} />

        {/* Header SEO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
            {termCapitalized} — Melhores Preços e Ofertas
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Confira as melhores ofertas de <strong>{term}</strong> no Mercado Livre, Amazon, Shopee e Magalu.
            Comparamos preços em tempo real para você economizar.
            {offers.length > 0 && (
              <> Encontramos <strong>{offers.length} ofertas</strong> de {term} com descontos de até {Math.max(...offers.map((o: any) => o.discountPct))}%.</>
            )}
          </p>

          {/* Schema.org SearchResultsPage */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SearchResultsPage',
              name: `${termCapitalized} — Ofertafy`,
              description: `Ofertas de ${term} no Mercado Livre, Amazon, Shopee e Magalu`,
              url: `https://www.ofertafy.com.br/busca/${query}`,
            }),
          }} />
        </div>

        {/* Resultados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mb-10">
          {offers.map((offer: any) => <OfferCard key={offer.id} offer={offer} />)}
        </div>

        {offers.length === 0 && (
          <div className="text-center py-12">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-slate-500">Nenhuma oferta encontrada para &quot;{term}&quot;.</p>
            <Link href="/busca" className="text-primary text-sm mt-2 inline-block hover:underline">
              Tentar outra busca →
            </Link>
          </div>
        )}

        {/* Conteúdo SEO adicional */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-3">📊 Guia de Compra: {termCapitalized}</h2>
          <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-2">
            <p>
              Procurando <strong>{term}</strong> com o melhor preço? O Ofertafy monitora diariamente milhares de ofertas
              das principais lojas do Brasil para ajudar você a encontrar o melhor custo-benefício.
              Nossa plataforma compara preços de <strong>{term}</strong> no Mercado Livre, Amazon, Shopee e Magalu,
              mostrando o histórico de preços e o Índice Ofertafy de cada oferta.
            </p>
            <p>
              Antes de comprar {term}, verifique:
            </p>
            <ul className="list-disc ml-4 space-y-1">
              <li>O <strong>Índice Ofertafy</strong> — nossa nota de 0 a 100 que avalia a qualidade da oferta</li>
              <li>O <strong>histórico de preços</strong> — para saber se o desconto é real</li>
              <li>O <strong>frete grátis</strong> — muitas ofertas incluem entrega gratuita</li>
              <li>As <strong>avaliações da loja</strong> — compramos apenas de vendedores confiáveis</li>
            </ul>
          </div>
        </div>

        {/* Sugestões relacionadas */}
        {relatedSearches.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-3">🔗 Buscas relacionadas</h3>
            <div className="flex flex-wrap gap-2">
              {relatedSearches.map((s) => {
                const slug = s.term.toLowerCase().replace(/\s+/g, '-')
                return (
                  <Link key={s.term} href={`/busca/${slug}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs text-slate-600 transition-colors">
                    {s.term}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function capitalize(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase())
}
