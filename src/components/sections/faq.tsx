"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "A OfertaFy cobra alguma mensalidade ou taxa dos usuários?",
      a: "Não! A nossa plataforma é 100% gratuita para os consumidores finais. Nós somos remunerados através de comissões de afiliação pagas diretamente pelos marketplaces (Amazon, Shopee, Mercado Livre) quando você compra através dos nossos links recomendados pela IA."
    },
    {
      q: "Como a Inteligência Artificial garante que as ofertas analisadas são seguras?",
      a: "Nossa IA analisa em tempo real múltiplos fatores, incluindo: se a URL pertence ao domínio oficial do marketplace, se o CNPJ do vendedor está regularizado há mais de 1 ano, o volume de devoluções do produto e o histórico de flutuação de preço para vetar simulações enganosas."
    },
    {
      q: "Onde recebo os alertas imediatos de promoções imperdíveis?",
      a: "Você pode receber alertas de ofertas quentes das três formas mais rápidas da atualidade: se inscrevendo na nossa Newsletter por e-mail, ativando notificações push no navegador ou entrando no nosso canal de transmissão exclusivo no Telegram e WhatsApp."
    },
    {
      q: "Posso criar alertas para marcas ou produtos específicos?",
      a: "Sim! Dentro do painel logado da OfertaFy, você pode cadastrar termos como 'iPhone 16 Pro Max' ou 'Cafeteira Nespresso' e definir o teto de preço ideal. Assim que o robô pescar o produto por um valor menor ou igual ao seu teto, você receberá um push instantâneo."
    }
  ];

  return (
    <section id="faq" className="py-24 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6">

        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-purple/10 text-brand-purple dark:text-brand-cyan text-xs font-bold mb-4">
            <HelpCircle className="h-3.5 w-3.5" /> SUPORTE E DUVIDAS
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Perguntas Frequentes
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg font-light leading-relaxed">
            Tem alguma dúvida sobre como operamos nossa engrenagem? Encontre respostas rápidas abaixo.
          </p>
        </div>

        {/* Accordions Wrapper */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <GlassCard
                key={idx}
                className="border-slate-200/50 dark:border-slate-840/60 dark:hover:border-slate-700/60 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full py-5 px-6 flex items-center justify-between gap-4 text-left transition-colors hover:bg-slate-100/30 dark:hover:bg-slate-900/30"
                  aria-expanded={isOpen}
                >
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {faq.q}
                  </h3>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0"
                  >
                    <ChevronDown className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-slate-200/10 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light text-left">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            );
          })}
        </div>

      </div>
    </section>
  );
}
