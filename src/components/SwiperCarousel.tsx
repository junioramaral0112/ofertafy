'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import type { OfferData } from '@/types'
import { formatPrice, getBridgeUrl } from '@/lib/utils'
import { calculateIndiceOfertafy } from '@/lib/ia'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface SwiperCarouselProps {
  offers: OfferData[]
}

export default function SwiperCarousel({ offers }: SwiperCarouselProps) {
  if (!offers || offers.length === 0) return null

  return (
    <div className="relative">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        loop
        className="rounded-2xl overflow-hidden"
      >
        {offers.slice(0, 5).map((offer, idx) => (
          <SwiperSlide key={idx}>
            <CarouselSlide offer={offer} />
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .swiper-button-next,
        .swiper-button-prev {
          color: white !important;
          background: rgba(0,0,0,0.3);
          width: 40px !important;
          height: 40px !important;
          border-radius: 50%;
          backdrop-filter: blur(4px);
        }
        .swiper-button-next::after,
        .swiper-button-prev::after {
          font-size: 16px !important;
          font-weight: bold;
        }
        .swiper-pagination-bullet {
          background: white !important;
          opacity: 0.5;
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
          background: #10b981 !important;
        }
      `}</style>
    </div>
  )
}

function CarouselSlide({ offer }: { offer: OfferData }) {
  const indice = calculateIndiceOfertafy(offer)
  const scoreColor = indice.score >= 80 ? 'bg-green-500' : indice.score >= 60 ? 'bg-emerald-500' : indice.score >= 35 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Imagem */}
        <div className="relative aspect-[4/3] md:aspect-auto bg-white">
          <img
            src={offer.imageUrl}
            alt={offer.title}
            className="w-full h-full object-contain p-4 md:p-8"
          />

          {/* Badge Loja (amarelo, canto superior esquerdo) */}
          <span className={`absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full shadow-lg ${storeBadge(offer.store)}`}>
            {offer.storeLabel}
          </span>

          {/* Badge Desconto (vermelho, canto superior direito) */}
          {offer.discountPct >= 10 && (
            <div className="absolute top-4 right-4 bg-red-500 text-white rounded-xl px-3 py-2 text-center shadow-lg">
              <div className="text-2xl font-extrabold leading-none">-{offer.discountPct}%</div>
              <div className="text-[10px] font-medium">OFF</div>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="p-6 md:p-8 flex flex-col justify-center text-white">
          <h2 className="text-xl md:text-2xl font-extrabold leading-tight mb-3 line-clamp-2">
            {offer.title}
          </h2>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl md:text-4xl font-extrabold text-green-400">
              {formatPrice(offer.price)}
            </span>
            {offer.originalPrice > offer.price && (
              <span className="text-lg text-white/40 line-through">
                {formatPrice(offer.originalPrice)}
              </span>
            )}
          </div>

          {offer.originalPrice > offer.price && (
            <p className="text-sm text-green-400 mb-3">
              Economize {formatPrice(offer.originalPrice - offer.price)} ({offer.discountPct}% OFF)
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {offer.freeShipping && (
              <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full">📦 Frete grátis</span>
            )}
            {offer.installment && (
              <span className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full">💳 {offer.installment}</span>
            )}
          </div>

          {/* Índice Ofertafy */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-white/50">🤖 Índice Ofertafy</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden max-w-[160px]">
              <div className={`h-full rounded-full transition-all ${scoreColor}`} style={{ width: `${indice.score}%` }} />
            </div>
            <span className={`text-sm font-bold ${indice.score >= 80 ? 'text-green-400' : indice.score >= 60 ? 'text-emerald-400' : indice.score >= 35 ? 'text-amber-400' : 'text-red-400'}`}>
              {indice.score}/100
            </span>
          </div>

          <a
            href={getBridgeUrl(offer.url, offer.storeLabel)}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-green-500/25 w-fit"
          >
            Ver Oferta →
          </a>
        </div>
      </div>
    </div>
  )
}

function storeBadge(store: string): string {
  const map: Record<string, string> = {
    mercadolivre: 'bg-[#FFE600] text-slate-900',
    magalu: 'bg-[#0086FF] text-white',
    shopee: 'bg-[#EE4D2D] text-white',
    amazon: 'bg-[#FF9900] text-slate-900',
  }
  return map[store] || 'bg-white text-slate-900'
}
