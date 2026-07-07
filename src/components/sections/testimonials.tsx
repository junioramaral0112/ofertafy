"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export function Testimonials() {
  const testimonials = [
    {
      name: "Guilherme Santos",
      role: "Software Engineer",
      avatar: "👨‍💻",
      comment: "A IA deles conseguiu capturar um monitor Odyssey Neo com 45% de desconto de madrugada na Amazon devido a um erro de cupom. Comprei e o produto foi entregue em 2 dias! Economizei R$ 1.800 de verdade.",
      stars: 5
    },
    {
      name: "Mariana Alencar",
      role: "Designer UX/UI",
      avatar: "👩‍🎨",
      comment: "O design da plataforma é espetacular. Lembra muito o painel de desenvolvedores do Stripe. O monitoramento de segurança garante que você nunca caia naquelas lojas fakes de golpistas do Instagram.",
      stars: 5
    },
    {
      name: "Rodrigo Mendes",
      role: "E-commerce Analyst",
      avatar: "👨‍💼",
      comment: "Trabalho com varejo e sei o quão difícil é monitorar APIs de forma veloz. A OfertaFy é o primeiro player a fazer isso com inteligência de verdade e sem encher meu celular de notificações de spam.",
      stars: 5
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-slate-500/5 dark:bg-slate-950/20">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-purple/10 text-brand-purple dark:text-brand-cyan text-xs font-bold mb-4">
            <MessageSquare className="h-3.5 w-3.5" /> DEPOIMENTOS TRANSPARENTES
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            O que diz quem economiza todos os dias
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg font-light leading-relaxed">
            Nossa comunidade cresce de forma orgânica. Valorizamos o feedback real sem maquiagem ou depoimentos comprados.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, type: "spring", stiffness: 90 }}
            >
              <GlassCard className="p-6 border-slate-200/50 dark:border-slate-840/60 dark:hover:border-slate-700/60 flex flex-col justify-between h-full text-left">
                <div>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.stars)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-brand-orange text-brand-orange" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed font-light mb-6">
                    "{t.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{t.role}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
