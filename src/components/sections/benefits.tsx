"use client";

import React from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Sparkles, CheckCircle, ShieldAlert, Cpu, Heart, Check, Gift } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export function Benefits() {
  const benefits = [
    {
      title: "Cupons Secretos Injetados",
      desc: "Nossa IA descobre cupons que os lojistas tentam ocultar diretamente nas páginas internas das campanhas.",
      icon: Gift,
      size: "lg:col-span-8",
      color: "purple"
    },
    {
      title: "100% Anti-Golpe",
      desc: "Analisamos se o domínio é real ou phishing imitando grandes sites.",
      icon: ShieldAlert,
      size: "lg:col-span-4",
      color: "orange"
    },
    {
      title: "Inteligência Artificial Ativa",
      desc: "Fatos reais de variação matemática e taxas de estorno.",
      icon: Cpu,
      size: "lg:col-span-4",
      color: "cyan"
    },
    {
      title: "Alertas Sem Spams por IA",
      desc: "Chega de canais com mil mensagens de lixo. Você escolhe marcas e categorias e recebe somente a oferta que atende ao seu filtro estrito.",
      icon: CheckCircle,
      size: "lg:col-span-8",
      color: "emerald"
    }
  ];

  return (
    <section id="benefits" className="py-24 relative overflow-hidden bg-slate-500/5 dark:bg-slate-950/20 border-y border-slate-200/40 dark:border-slate-800/40">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-cyan/10 text-brand-cyan text-xs font-bold mb-4">
            <LayoutGrid className="h-3.5 w-3.5" /> BENEFÍCIOS DO UNICÓRNIO
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Construído para quem valoriza dinheiro e tempo
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg font-light leading-relaxed">
            Diferente de agregadores ultrapassados, nós não geramos spam de links quebrados. Cada benefício foi desenhado buscando transparência e otimização total de cliques.
          </p>
        </div>

        {/* Bento Grid layout style Linear */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {benefits.map((b, idx) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, type: "spring", stiffness: 85 }}
              className={b.size}
            >
              <GlassCard className="p-8 h-full border-slate-200/50 dark:border-slate-820/60 flex flex-col justify-between text-left group cursor-default">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <b.icon className="h-5.5 w-5.5 text-brand-purple dark:text-brand-cyan" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {b.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                    {b.desc}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs text-brand-purple dark:text-brand-cyan font-semibold">
                  <Check className="h-4 w-4" /> Integrado ao Core Engine
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
