"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, ArrowUpRight } from "lucide-react";
import { OFFERS, getOfferKeyFromOffer } from "@/data/offers";
import { generateAffiliateLink } from "@/lib/affiliate";

export function MobileBestSellers() {
  const bestSellers = [...OFFERS].sort((a, b) => b.likes - a.likes);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-5 w-5 text-brand-orange" />
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          Mais Vendidos
        </h3>
      </div>

      {/* Grid 2 colunas */}
      <div className="grid grid-cols-2 gap-3">
        {bestSellers.map((offer, i) => {
          const link = generateAffiliateLink(offer.url, offer.source);
          return (
            <motion.a
              key={offer.id}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden active:scale-[0.97] transition-transform flex flex-col"
            >
              {/* Imagem */}
              <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {offer.imageUrl ? (
                  <img src={offer.imageUrl} alt={offer.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-3xl">{offer.img}</span>
                )}
              </div>

              {/* Conteúdo */}
              <div className="p-2.5 flex flex-col gap-1 flex-1">
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {offer.source}
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {offer.name}
                </span>

                <div className="mt-auto pt-1.5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] line-through text-slate-400 leading-tight">
                      {offer.originalPrice}
                    </span>
                    <span className="text-sm font-extrabold text-brand-emerald leading-tight">
                      {offer.currentPrice}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-brand-orange flex items-center gap-0.5">
                    {offer.discount} <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
