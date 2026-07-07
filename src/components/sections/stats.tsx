"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingUp } from "lucide-react";

export function Stats() {
  const stats = [
    { value: 15, suffix: "M+", title: "Economizados", subtitle: "Estimativa real de economia de usuários" },
    { value: 1.2, suffix: "M+", title: "Alertas Ativados", subtitle: "Disparos efetuados via canais integrados" },
    { value: 99.8, suffix: "%", title: "Uptime da API", subtitle: "Engine operacional monitorando os varejistas" },
    { value: 0.8, suffix: "s", title: "Tempo de Busca", subtitle: "Tempo médio para validar cupons escaneados" }
  ];

  return (
    <section className="py-20 relative overflow-hidden bg-slate-900 text-white dark:bg-slate-950/60 dark:border-y dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-center lg:text-left">
          {stats.map((s, idx) => {
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="flex flex-col items-center lg:items-start gap-2 border-l-2 border-brand-purple/20 pl-6 text-left"
              >
                <div className="text-4xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-white to-brand-cyan">
                  {s.value}
                  {s.suffix}
                </div>
                <h4 className="text-lg font-bold mt-1 text-slate-100">{s.title}</h4>
                <p className="text-xs text-slate-400 font-light leading-snug">{s.subtitle}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
