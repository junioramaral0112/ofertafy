import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "OfertaFy | As melhores ofertas da internet em tempo real",
  description: "A OfertaFy é uma plataforma inteligente que encontra e divulga automaticamente as melhores ofertas de grandes marketplaces (Amazon, Mercado Livre e Shopee) através de tecnologia, automação e inteligência artificial.",
  keywords: ["ofertas", "desconto", "promoção", "cupom de desconto", "amazon", "shopee", "mercado livre", "inteligência artificial", "compras seguras", "startup"],
  authors: [{ name: "OfertaFy", url: "https://ofertafy.io" }],
  creator: "OfertaFy",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://ofertafy.io",
    title: "OfertaFy | As melhores ofertas em tempo real",
    description: "Economize de verdade. Inteligência artificial encontra promoções imperdíveis na Amazon, Shopee e Mercado Livre automaticamente.",
    siteName: "OfertaFy",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OfertaFy - As melhores ofertas da internet em tempo real",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OfertaFy | Plataforma Inteligente de Ofertas",
    description: "Com tecnologia avançada, filtramos cupons e quedas de preço nos maiores sites de compras em tempo real.",
    images: ["/og-image.png"],
    creator: "@ofertafy",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9FAFB" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Schema estruturado LD-JSON para SEO de alto nível */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "OfertaFy",
              "operatingSystem": "All",
              "applicationCategory": "ShoppingApplication",
              "description": "Plataforma avançada baseada em IA para capturar, validar e exibir as maiores ofertas do varejo online.",
              "offers": {
                "@type": "AggregateOffer",
                "priceCurrency": "BRL",
                "lowPrice": "0.00",
                "offerCount": "1000"
              }
            }),
          }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
