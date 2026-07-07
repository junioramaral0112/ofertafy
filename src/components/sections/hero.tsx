"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bell, Sparkles, TrendingUp, ShieldCheck, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveIndicator } from "@/components/ui/active-indicator";
import { GlassCard } from "@/components/ui/glass-card";

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  const dashboardProducts = [
    { name: "Sony PlayStation 5", original: "R$ 4.499", current: "R$ 3.199", discount: "28% OFF", source: "Amazon", img: "🎮", temp: "42° Hot", aiTrust: "9.9/10" },
    { name: "iPhone 15 Pro Max 256GB", original: "R$ 9.499", current: "R$ 7.299", discount: "23% OFF", source: "Mercado Livre", img: "📱", temp: "39°", aiTrust: "9.7/10" },
    { name: "Fone Bluetooth JBL Tune", original: "R$ 399", current: "R$ 199", discount: "50% OFF", source: "Shopee", img: "🎧", temp: "55° SuperHot", aiTrust: "9.5/10" },
  ];

  return (
    <section className="relative min-h-[95vh] pt-32 pb-20 overflow-hidden mesh-gradient-aura">
      {/* Background Decorative Emitters */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-brand-purple/20 dark:bg-brand-purple/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-orange/20 dark:bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Hero Left Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 flex flex-col items-start gap-6 text-left"
        >
          <motion.div variants={itemVariants}>
            <ActiveIndicator text="Tecnologia proprietária conectada em tempo real" />
          </motion.div>

          {/* Slogan */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-[70px] lg:leading-[1.1] font-extrabold tracking-tight text-slate-950 dark:text-white"
          >
            As melhores ofertas <br />
            da internet em{" "}
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-brand-orange to-brand-shopee">
              tempo real.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-light"
          >
            Inteligência artificial encontra promoções reais da Amazon, Shopee e Mercado Livre para você economizar todos os dias. Avaliamos preços históricos, qualificamos vendedores e detectamos fraudes.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button variant="premium" size="lg" className="w-full sm:w-auto shadow-lg shadow-brand-purple/15">
              Explorar Ofertas <ArrowRight className="h-5 w-5 ml-1.5" />
            </Button>
            <Button variant="glass" size="lg" className="w-full sm:w-auto border-slate-300/80 dark:border-slate-700/80">
              <Bell className="h-5 w-5 mr-2 text-brand-orange animate-pulse" /> Receber Alertas de IA
            </Button>
          </motion.div>

          {/* Social Proof badge bar */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-200/40 dark:border-slate-800/40 w-full text-slate-500 dark:text-slate-400 text-sm font-medium"
          >
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4.5 w-4.5 text-brand-emerald" /> 100% Livre de Golpes</span>
            <span className="flex items-center gap-1.5"><Cpu className="h-4.5 w-4.5 text-brand-cyan" /> Análise IA Multivetorial</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="h-4.5 w-4.5 text-brand-purple" /> Histórico de Preços Real</span>
          </motion.div>
        </motion.div>

        {/* Hero Right: Premium Animated Mockup Dashboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 60, delay: 0.4 }}
          className="lg:col-span-5 relative w-full flex justify-center"
        >
          {/* Glowing Aura behind Dashboard */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-brand-purple/20 to-brand-cyan/20 rounded-full blur-[60px] opacity-70 pointer-events-none" />

          <GlassCard className="w-full max-w-[480px] p-6 border-slate-200/50 dark:border-slate-800/60 shadow-2xl relative select-none">
            {/* Custom Header of Mockup dashboard */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/40 dark:border-slate-800/40 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 ml-2">Engine: v1.4.2-Live</span>
              </div>
              <Sparkles className="h-4 w-4 text-brand-cyan animate-pulse" />
            </div>

            {/* Dashboard Inner List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>ÚLTIMOS ACHADOS</span>
                <span className="flex items-center gap-1 text-xs text-brand-emerald">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-ping" />
                  Rastreando...
                </span>
              </div>

              {dashboardProducts.map((p, idx) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.15 }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-950/40 border border-slate-100/40 dark:border-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.img}</span>
                    <div className="text-left">
                      <h4 className="text-sm font-semibold truncate max-w-[130px] sm:max-w-none text-slate-800 dark:text-slate-200">{p.name}</h4>
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Canal: {p.source}</p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs line-through text-slate-400 dark:text-slate-600">{p.original}</span>
                      <span className="text-sm font-extrabold text-brand-emerald">{p.current}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-brand-purple/10 text-brand-purple font-bold">{p.discount}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-brand-orange/10 text-brand-orange font-bold font-mono">Conf: {p.aiTrust}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Simulated Live Alert Floating Container */}
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, type: "spring", stiffness: 100 }}
              className="absolute -bottom-8 -right-4 md:-right-8 p-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl shadow-xl flex items-center gap-3.5 border border-slate-800 dark:border-slate-100 max-w-[280px]"
            >
              <div className="h-9 w-9 rounded-xl bg-brand-orange flex items-center justify-center text-white">
                <Bell className="h-4.5 w-4.5" />
              </div>
              <div className="text-left">
                <h5 className="text-xs font-bold">ALERTA DISPARADO 🚨</h5>
                <p className="text-[10px] opacity-80 mt-0.5 leading-tight">Smart TV QLED 55" baixou R$450 agora na Amazon.</p>
              </div>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
