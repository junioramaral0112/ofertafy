"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Clock } from "lucide-react";
import { OFFERS, type Offer } from "@/data/offers";
import { generateAffiliateLink } from "@/lib/affiliate";

export function MobileFlashDeals({ offers: externalOffers }: { offers?: Offer[] }) {
  // Countdown falso estilo Mercado Livre
  const [timeLeft, setTimeLeft] = useState({ h: 4, m: 32, s: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) return { h: 0, m: 0, s: 0 };
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtra ofertas com maior desconto para destaque
  const source = externalOffers ?? OFFERS;
  const flashDeals = [...source]
    .sort((a, b) => parseInt(b.discount) - parseInt(a.discount))
    .slice(0, 5);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div id="mobile-flash-deals">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-brand-orange fill-brand-orange" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Ofertas Relâmpago
          </h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-mono font-bold text-brand-orange">
          <Clock className="h-3.5 w-3.5" />
          {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
        </div>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-1 px-1">
        {flashDeals.map((offer, i) => {
          const link = generateAffiliateLink(offer.url, offer.source);
          return (
            <motion.a
              key={offer.id}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="snap-center shrink-0 w-[150px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-3 flex flex-col gap-2 active:scale-95 transition-transform"
            >
              {/* Imagem */}
              <div className="aspect-square w-full rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {offer.imageUrl ? (
                  <img src={offer.imageUrl} alt={offer.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-3xl">{offer.img}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {offer.source}
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {offer.name}
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-sm font-extrabold text-brand-emerald">
                    {offer.currentPrice}
                  </span>
                  <span className="text-[10px] line-through text-slate-400">
                    {offer.originalPrice}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-brand-shopee bg-brand-shopee/10 px-1.5 py-0.5 rounded-md w-fit mt-0.5">
                  {offer.discount}
                </span>
              </div>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
