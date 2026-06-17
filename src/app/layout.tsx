import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

export const metadata: Metadata = {
  title: "ofertaFy - As Melhores Ofertas em um Só Lugar",
  description: "Encontre as melhores ofertas do Mercado Livre, Shopee e Amazon. Compare preços, acompanhe o histórico e economize! Links de afiliado.",
  keywords: "ofertas, promoções, desconto, mercado livre, shopee, amazon, comparar preços, cupons",
  openGraph: {
    title: "ofertaFy - Ofertas e Promoções",
    description: "As melhores ofertas do Mercado Livre, Shopee e Amazon em um só lugar.",
    type: "website",
    locale: "pt_BR",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
