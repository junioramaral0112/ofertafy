"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const slides = [
  {
    id: 1,
    headline: "Até 50% OFF em Eletrônicos",
    sub: "iPhone, Fones, Smartwatches e mais",
    bg: "from-brand-purple via-brand-purple to-brand-cyan",
    emoji: "📱",
  },
  {
    id: 2,
    headline: "Ofertas Relâmpago Shopee",
    sub: "Descontos que acabam hoje",
    bg: "from-brand-orange via-brand-shopee to-brand-orange",
    emoji: "⚡",
  },
  {
    id: 3,
    headline: "Gamers: até 26% OFF",
    sub: "PS5, Monitores, Headsets",
    bg: "from-brand-cyan via-brand-purple to-brand-cyan",
    emoji: "🎮",
  },
];

export function MobileBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const scrollToOffers = () => {
    document.getElementById("mobile-flash-deals")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToOffers}
      className="relative w-full overflow-hidden rounded-2xl h-[180px] text-left cursor-pointer active:scale-[0.98] transition-transform"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
          className={`absolute inset-0 bg-gradient-to-br ${slides[current].bg} flex items-center justify-between px-5 py-4`}
        >
          <div className="flex flex-col gap-1.5 max-w-[65%]">
            <span className="text-white/70 text-[11px] font-semibold uppercase tracking-wider">
              {slides[current].emoji} OfertaFy
            </span>
            <h2 className="text-white text-lg font-extrabold leading-tight">
              {slides[current].headline}
            </h2>
            <p className="text-white/80 text-xs">{slides[current].sub}</p>
            <div className="flex items-center gap-1 mt-1 text-white text-xs font-bold">
              Ver ofertas <ArrowRight className="h-3 w-3" />
            </div>
          </div>
          <div className="text-6xl opacity-80">{slides[current].emoji}</div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-5 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </button>
  );
}
