import type { Metadata } from 'next'
import { Suspense } from 'react'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppFloat from '@/components/WhatsAppFloat'
import { getBaseUrl } from '@/lib/utils'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-F1R04L8N36'

const SITE_URL = getBaseUrl()
const SITE_NAME = 'Ofertafy'
const SITE_DESCRIPTION =
  'As melhores ofertas do Mercado Livre, Magalu, Shopee e Amazon em um só lugar. Compare preços, histórico e cupons de desconto atualizados.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - As Melhores Ofertas em um Só Lugar`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'ofertas',
    'promoções',
    'desconto',
    'mercado livre',
    'magalu',
    'shopee',
    'amazon',
    'comparar preços',
    'cupons',
    'economizar',
    'black friday',
    'promoção do dia',
  ],
  authors: [{ name: 'Ofertafy' }],
  creator: 'Ofertafy',
  publisher: 'Ofertafy',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE_NAME,
    title: `${SITE_NAME} - As Melhores Ofertas em um Só Lugar`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Ofertas e Promoções`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: process.env.GOOGLE_VERIFICATION
    ? { google: process.env.GOOGLE_VERIFICATION }
    : undefined,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        {/* JSON-LD: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Ofertafy',
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              sameAs: ['https://www.instagram.com/ofertafy.br', 'https://www.tiktok.com/@ofertafy'],
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${SITE_URL}/busca?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        {/* Font preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preconnect para domínios externos */}
        <link rel="preconnect" href="https://http2.mlstatic.com" />
        <link rel="preconnect" href="https://cf.shopee.com.br" />
        <link rel="preconnect" href="https://m.media-amazon.com" />
        {/* DNS prefetch para analytics */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50">
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
          <Header />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
        <Suspense fallback={null}>
          <WhatsAppFloat />
        </Suspense>

        {/* Google Analytics 4 */}
        <Suspense fallback={null}>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-config" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_ID}');`}
          </Script>
        </Suspense>
      </body>
    </html>
  )
}
