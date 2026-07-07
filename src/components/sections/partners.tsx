"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";

export function Partners() {
  const partners = [
    { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", color: "hover:text-[#FF9900]" },
    { name: "OfertaFy IA Engine", logo: null, customText: "👑 OfertaFy IA Scan", color: "text-brand-purple dark:text-brand-cyan" },
    { name: "Mercado Livre", logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Mercado_Libre_logo.svg", color: "hover:text-[#FFE600]" },
    { name: "Shopee", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee_logo.svg", color: "hover:text-[#EE4D2D]" },
    { name: "Magalu", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Magazine_Luiza_logo.svg", color: "hover:text-[#0086FF]" },
    { name: "Casas Bahia", logo: null, customText: "🏠 Casas Bahia", color: "hover:text-[#003399]" }
  ];

  // Duplicamos os parceiros para criar o efeito perfeito de loop infinito sem quebrar
  const marqueeItems = [...partners, ...partners, ...partners];

  return (
    <section className="py-12 border-y border-slate-200/40 dark:border-slate-800/40 bg-slate-500/5 dark:bg-slate-950/20 backdrop-blur-sm relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-purple dark:text-brand-cyan">Marketplace Sync</p>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">Conectado nativamente e em tempo real</h3>
        </div>
        <p className="text-xs text-slate-500 max-w-sm text-left md:text-right">
          A IA do OfertaFy escaneia mais de 100.000 requisições por segundo nessas plataformas para garimpar os maiores erros de preço e cupons agressivos.
        </p>
      </div>

      <div className="relative flex items-center overflow-x-hidden w-full">
        {/* Gradient overlays to blur edges like Stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-r from-background-light dark:from-background-dark to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-l from-background-light dark:from-background-dark to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-16 items-center whitespace-nowrap py-4"
          animate={{ x: [0, -1920] }}
          transition={{
            ease: "linear",
            duration: 35,
            repeat: Infinity,
          }}
        >
          {marqueeItems.map((partner, idx) => (
            <div
              key={`${partner.name}-${idx}`}
              className={`flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-400 dark:text-slate-500 transition-colors duration-300 cursor-default select-none ${partner.color}`}
            >
              <ShoppingBag className="h-5 w-5 saturate-50" />
              {partner.logo ? (
                // Oferece suporte para renderizar o nome em fallback e manter desempenho premium
                <span>{partner.name}</span>
              ) : (
                <span className="font-mono text-base font-semibold">{partner.customText}</span>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
