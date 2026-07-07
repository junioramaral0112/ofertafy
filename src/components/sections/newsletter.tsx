"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 1500);
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Decorative center emitter glowing */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-brand-purple/20 to-brand-cyan/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <GlassCard className="p-8 md:p-12 border-slate-200/50 dark:border-slate-840/60 shadow-2xl relative overflow-hidden">
          {/* Subtle patterns */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" /> ALERTA DE QUEDA DE PREÇO
            </span>

            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Economize todos os dias sem esforço
            </h2>

            <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-light leading-relaxed">
              Assine nossa newsletter VIP de inteligência artificial. Receba gratuitamente apenas as superofertas de temperatura acima de 40° em seu e-mail. Zero spams. Desinscreva-se quando quiser.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-md mt-4">
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/40 text-brand-emerald flex items-center gap-3 justify-center text-sm font-semibold"
                  >
                    <CheckCircle2 className="h-5 w-5 animate-bounce" /> Cadastro Concluído! Bem-vindo ao time OfertaFy.
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col sm:flex-row gap-3 w-full"
                  >
                    <div className="relative flex-1">
                      <input
                        type="email"
                        placeholder="Digite seu e-mail de negócios..."
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (status === "error") setStatus("idle");
                        }}
                        disabled={status === "loading"}
                        className="w-full h-12 px-5 py-3 rounded-full bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white border border-slate-300/60 dark:border-slate-800/80 outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-all placeholder-slate-400 font-medium text-sm text-left"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="premium"
                      size="md"
                      className="h-12 w-full sm:w-auto font-bold justify-center"
                      disabled={status === "loading"}
                    >
                      {status === "loading" ? "Processando..." : (
                        <>
                          Ativar Alertas <Send className="h-4 w-4 ml-1.5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {status === "error" && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-brand-orange mt-2.5 flex items-center justify-center gap-1 font-semibold"
                >
                  <AlertCircle className="h-4 w-4" /> Endereço de e-mail inválido. Por favor, revise.
                </motion.p>
              )}
            </form>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
