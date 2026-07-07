"use client";

import React from "react";
import { Cpu, Search, Bell } from "lucide-react";
import { MobileBanner } from "./MobileBanner";
import { MobileShortcuts } from "./MobileShortcuts";
import { MobileFlashDeals } from "./MobileFlashDeals";
import { MobileBestSellers } from "./MobileBestSellers";

export function MobileHome() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header fixo simples */}
      <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-200/40 dark:border-slate-800/40">
        <div className="flex items-center justify-between px-4 py-2.5">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-purple via-brand-orange to-brand-cyan flex items-center justify-center">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-brand-purple dark:from-white dark:to-brand-cyan">
              Oferta<span className="text-brand-orange">Fy</span>
            </span>
          </div>

          {/* Ícones */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full glass-container-light dark:glass-container-dark" aria-label="Notificações">
              <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        {/* Barra de busca fake estilo ML */}
        <div className="px-4 pb-2.5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <Search className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400 dark:text-slate-500">Buscar ofertas...</span>
          </div>
        </div>
      </header>

      {/* Conteúdo com scroll contínuo */}
      <main className="px-4 py-3 space-y-5 pb-20">
        <MobileBanner />
        <MobileShortcuts />
        <MobileFlashDeals />
        <MobileBestSellers />

        {/* Rodapé simples */}
        <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-600">
          <p>© 2026 OfertaFy — As melhores ofertas em tempo real</p>
        </div>
      </main>
    </div>
  );
}
