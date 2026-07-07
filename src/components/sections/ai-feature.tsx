"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Cpu, Database, Check, RefreshCw 	} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

export function AIFeature() {
  const [analyzing, setAnalyzing] = useState(false);
  const [complete, setComplete] = useState(true);

  const startAnalysisSim = () => {
    setComplete(false);
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setComplete(true);
    }, 2000);
  };

  return (
    <section id="ai-features" className="py-24 relative overflow-hidden bg-slate-500/5 dark:bg-slate-950/40 border-y border-slate-200/40 dark:border-slate-800/40">
      {/* Glow decorative blobs */}
      <div className="absolute right-0 top-1/4 w-[350px] h-[350px] bg-brand-cyan/15 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

        {/* AI Left Column (Terminal & Simulation Visuals) */}
        <div className="lg:col-span-6 relative order-last lg:order-first">
          {/* Subtle neon glow on behind */}
          <div className="absolute inset-0 bg-brand-purple/10 rounded-[32px] blur-3xl pointer-events-none" />

          <GlassCard className="p-6 border-slate-200/60 dark:border-slate-800/60 select-none">
            <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/40 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-5 w-5 text-brand-cyan animate-spin-slow" />
                <span className="text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200">OfertaFy AI Analyzer v2.0</span>
              </div>
              <button
                onClick={startAnalysisSim}
                disabled={analyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-cyan/15 hover:bg-brand-cyan/25 text-brand-cyan text-xs font-mono font-bold border border-brand-cyan/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${analyzing ? "animate-spin" : ""}`} /> RERUN ANALYSIS
              </button>
            </div>

            {/* Simulated UI Grid of AI decision blocks */}
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-brand-purple" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Escaneamento de Vendedor</span>
                  </div>
                  <Badge variant={complete ? "emerald" : "orange"}>{complete ? "SEGURO" : "ANALISANDO..."}</Badge>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-light">
                  {complete ? "Mercado Líder Platinum com 9.870 vendas nos últimos 30 dias. Índice de reclamação baixíssimo (0.4%)." : "Consultando dados cadastrais, volume de vendas histórico e índice de estorno..."}
                </p>
                {complete && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-brand-emerald font-semibold">
                    <Check className="h-3.5 w-3.5" /> CNPJ Verificado e Ativo
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-orange" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Validador de Desconto Real</span>
                  </div>
                  <Badge variant={complete ? "emerald" : "orange"}>{complete ? "9.8/10 RECOMENDADO" : "CALCULANDO..."}</Badge>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-light">
                  {complete ? "Preço de tabela original R$3.499. Menor preço nos últimos 40 dias foi R$3.050. Preço atual de R$2.699 é o menor histórico absoluto." : "Consultando oscilação na base de preços dos últimos 6 meses..."}
                </p>
              </div>
            </div>

            {/* AI Summary badge container */}
            <div className="mt-5 p-3 rounded-xl bg-gradient-to-r from-brand-purple/10 to-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-purple dark:text-brand-cyan">Fator de Relevância IA:</span>
              <span className="text-sm font-black text-brand-purple dark:text-brand-cyan">98.4% de Probabilidade de Compra Perfeita🚀</span>
            </div>
          </GlassCard>
        </div>

        {/* AI Right Column (Content copy) */}
        <div className="lg:col-span-6 flex flex-col items-start gap-6 text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-cyan/10 text-brand-cyan text-xs font-bold">
            <Cpu className="h-3 w-3" /> INTELIGÊNCIA ARTIFICIAL ATIVA
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Nossa IA analisa cada promoção individualmente
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg font-light leading-relaxed">
            Mais do que capturar promoções, nossa infraestrutura conta com algoritmos especializados focados em defender sua carteira de armadilhas como a famosa "metade do dobro" ou vendedores fantasmas.
          </p>

          <div className="space-y-4 w-full">
            <div className="flex gap-4 items-start">
              <div className="h-9 w-9 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan shrink-0 mt-0.5">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Rastreamento de Histórico de Preços Real</h4>
                <p className="text-xs text-slate-500 leading-tight">Garantimos que o produto está genuinamente mais barato do que a média dos últimos 6 meses.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="h-9 w-9 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan shrink-0 mt-0.5">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Bloqueador Automático de Lojas Suspeitas</h4>
                <p className="text-xs text-slate-500 leading-tight">Lojas parceiras com CNPJ recente ou avaliações extremamente negativas são retidas antes de aparecer no dashboard.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
