"use client";

import { useState, useEffect } from "react";
import { Shield, X, Check } from "lucide-react";

const STORAGE_KEY = "ofertafy_trust_banner_closed";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function TrustBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const closed = localStorage.getItem(STORAGE_KEY);
    if (!closed) {
      setVisible(true);
    } else {
      const closedAt = parseInt(closed, 10);
      if (Date.now() - closedAt > THIRTY_DAYS_MS) {
        localStorage.removeItem(STORAGE_KEY);
        setVisible(true);
      }
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-emerald-950/20 border-b border-emerald-200/60 dark:border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 py-3 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-3 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Main message */}
        <div className="flex items-center gap-2 mb-2 pr-6">
          <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Compra 100% Segura
          </p>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2.5 max-w-3xl">
          O <strong>OfertaFy</strong> nao vende produtos. Somos um portal que reune ofertas da
          Amazon, Shopee, Mercado Livre e Magalu. Ao clicar em uma oferta voce sera direcionado
          para o site <strong>OFICIAL</strong> da loja para finalizar sua compra com total seguranca.
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-500 mb-2.5 italic">
          Pagamento realizado apenas na loja oficial.
        </p>

        {/* Trust seals */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {[
            "Compra na loja oficial",
            "Pagamento Seguro",
            "Garantia da Loja",
            "Sem intermediarios",
          ].map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium"
            >
              <Check className="h-3 w-3 shrink-0" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
