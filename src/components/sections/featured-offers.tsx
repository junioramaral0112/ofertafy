"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Flame, Heart, Sparkles, Filter, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { OFFERS, getOfferKeyFromOffer } from "@/data/offers";

export function FeaturedOffers() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  const [convertedLinks, setConvertedLinks] = useState<Record<string, string>>({});

  const categories = ["Todos", "Eletrônicos", "Gamers", "Acessórios", "Casa"];

  const offers = OFFERS;

  // Converte todos os links de afiliados de forma assíncrona ao carregar a página
  useEffect(() => {
    async function convertAllLinks() {
      const linkMap: Record<string, string> = {};

      for (const item of offers) {
        try {
          const res = await fetch("/api/convert-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ originalUrl: item.url, store: item.source })
          });
          const data = await res.json();
          linkMap[item.id] = data.affiliateUrl || item.url;
        } catch (e) {
          linkMap[item.id] = item.url; // Fallback para o original
        }
      }

      setConvertedLinks(linkMap);
    }

    convertAllLinks();
  }, []);

  const handleLike = (id: string) => {
    setLikedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredOffers = activeCategory === "Todos"
    ? offers
    : offers.filter(o => o.category === activeCategory);

  return (
    <section id="featured-offers" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="text-left max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold mb-4">
              <Flame className="h-3.5 w-3.5 animate-pulse" /> OFERTAS ATIVAS AGORA
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
              Ofertas em Destaque
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg font-light leading-relaxed">
              Selecionadas a dedo pela IA da OfertaFy. Cupons validados e preços históricos auditados há menos de 1 minuto.
            </p>
          </div>

          {/* Categories Filter menu */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  activeCategory === cat
                    ? "bg-brand-purple text-white shadow-md shadow-brand-purple/20"
                    : "glass-container-light dark:glass-container-dark text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid List */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredOffers.map((o) => (
            <motion.div
              layout
              key={o.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-5 border-slate-200/40 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between h-full group text-left">
                <div>
                  {/* Top Stats Metadata */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">Canal: {o.source}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-brand-orange text-right">{o.hotDegree}</span>
                      <Flame className="h-3.5 w-3.5 text-brand-orange animate-pulse" />
                    </div>
                  </div>

                  {/* Representative Large Img/Emoji */}
                  <div className="aspect-video w-full rounded-2xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-800/40 flex items-center justify-center text-4xl mb-4 group-hover:scale-[1.02] transition-transform duration-300 overflow-hidden">
                    {o.imageUrl ? (
                      <img src={o.imageUrl} alt={o.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      o.img
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-brand-purple dark:group-hover:text-brand-cyan transition-colors">
                    {o.name}
                  </h3>

                  {/* Rating trust block */}
                  <div className="flex items-center gap-1.5 mb-5 text-xs text-slate-500 dark:text-slate-400">
                    <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
                    <span>Pontuação IA: <strong className="text-slate-900 dark:text-white">{o.aiTrust}/10</strong> (Muito Seguro)</span>
                  </div>
                </div>

                <div>
                  {/* Pricing footer block */}
                  <div className="h-px bg-slate-200 dark:bg-slate-800/60 my-4" />

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs line-through text-slate-400 dark:text-slate-600 block">{o.originalPrice}</span>
                      <span className="text-xl font-black text-brand-emerald">{o.currentPrice}</span>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <Badge variant="emerald" className="font-extrabold text-[10px]">{o.discount}</Badge>
                    </div>
                  </div>

                  {/* Action items */}
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => handleLike(o.id)}
                      className={`h-11 px-3.5 rounded-xl border flex items-center justify-center transition-colors ${
                        likedItems[o.id]
                          ? "bg-pink-100 dark:bg-pink-950/40 text-pink-600 border-pink-200 dark:border-pink-900/40"
                          : "glass-container-light dark:glass-container-dark text-slate-600 hover:text-pink-600 border-slate-200/60 dark:border-slate-800/80"
                      }`}
                      aria-label="Curtir oferta"
                    >
                      <Heart className={`h-4.5 w-4.5 ${likedItems[o.id] ? "fill-current" : ""}`} />
                      <span className="text-xs font-bold font-mono ml-1.5">{likedItems[o.id] ? o.likes + 1 : o.likes}</span>
                    </button>

                    <a
                      href={convertedLinks[o.id] || o.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-11 bg-brand-purple hover:bg-[#4338CA] dark:bg-brand-cyan/20 dark:hover:bg-brand-cyan/30 text-white dark:text-brand-cyan border dark:border-brand-cyan/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      Pegar Oferta <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
