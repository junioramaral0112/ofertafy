"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, ShieldAlert, BadgePercent, Send, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export function HowItWorks() {
  const steps = [
    {
      id: "01",
      icon: Search,
      title: "Rastreio e Captura",
      description: "Nossos robôs varrem continuamente a API de Amazon, Mercado Livre e Shopee capturando alterações de preços em microssegundos.",
      color: "brand-purple",
    },
    {
      id: "02",
      icon: ShieldAlert,
      title: "Análise Antigolpe",
      description: "A Inteligência Artificial atua validando a segurança do produto, reputação do lojista e se o desconto é real ou maquiado.",
      color: "brand-orange",
    },
    {
      id: "03",
      icon: BadgePercent,
      title: "Filtro de Superdescontos",
      description: "Aplicamos cupons exclusivos ocultos e calculamos frete estimado para priorizar apenas o produto com maior margem de desconto real.",
      color: "brand-cyan",
    },
    {
      id: "04",
      icon: Send,
      title: "Disparo Imediato",
      description: "As ofertas são disponibilizadas no dashboard, canais do Telegram e WhatsApp, além de disparadas como alerta push para assinantes.",
      color: "brand-emerald",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-purple/10 text-brand-purple dark:text-brand-cyan text-xs font-bold mb-4">
            <Sparkles className="h-3 w-3" /> FLUXO DE ENGENHARIA
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Como funciona a OfertaFy?
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg font-light">
            Desenvolvemos um pipeline sofisticado focado em automatizar a barreira do preço. Esqueça grupos de promoções manuais lentos ou links com malware.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Decorative Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-0.5 bg-gradient-to-r from-brand-purple via-brand-orange via-brand-cyan to-brand-emerald -translate-y-12 opacity-20 z-0" />

          {steps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.15, type: "spring", stiffness: 80 }}
              className="relative z-10"
            >
              <GlassCard className="h-full p-6 border-slate-200/50 dark:border-slate-840/60 dark:hover:border-slate-700/60 group">
                <div className="flex justify-between items-start mb-6">
                  {/* Icon wrapper */}
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-white group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="h-6 w-6 text-brand-purple dark:text-brand-cyan" />
                  </div>
                  {/* Large visual ID */}
                  <span className="text-3xl font-black font-mono text-slate-300/40 dark:text-slate-800/80 group-hover:text-brand-orange/40 transition-colors duration-300">
                    {step.id}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 text-left">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 text-left leading-relaxed font-light">
                  {step.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
