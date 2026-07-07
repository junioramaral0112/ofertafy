"use client";

import React from "react";
import { Cpu, Github, Twitter, Youtube, ShieldAlert, Radio } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Legais",
      links: [
        { name: "Termos de Uso", href: "#" },
        { name: "Políticas de Privacidade", href: "#" },
        { name: "LGPD Compliance", href: "#" }
      ]
    },
    {
      title: "Startup",
      links: [
        { name: "Sobre Nós", href: "#" },
        { name: "Metodologia IA", href: "#" },
        { name: "Kit de Marca", href: "#" }
      ]
    },
    {
      title: "Canais VIP",
      links: [
        { name: "Grupo Telegram", href: "#" },
        { name: "Comunidade WhatsApp", href: "#" },
        { name: "Notificações de Browser", href: "#" }
      ]
    }
  ];

  return (
    <footer className="pt-20 pb-8 bg-background-light dark:bg-background-dark border-t border-slate-200/40 dark:border-slate-800/40 relative z-10 transition-colors">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

        {/* Brand visual block */}
        <div className="md:col-span-4 flex flex-col items-start gap-4 text-left">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-purple via-brand-orange to-brand-cyan flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Cpu className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-950 dark:from-white dark:to-white tracking-tight">
              Oferta<span className="text-brand-orange">Fy</span>
            </span>
          </a>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-light">
            A OfertaFy é uma iniciativa focada em empoderar os usuários de tecnologia na internet brasileira através de algoritmos matemáticos auditados. Não hospedamos produtos e não cobramos taxas.
          </p>

          {/* Social connections */}
          <div className="flex items-center gap-3.5 mt-2">
            <a href="#" className="p-2 rounded-full glass-container-light dark:glass-container-dark text-slate-500 hover:text-brand-purple transition-colors" aria-label="Github Link"><Github className="h-4 w-4" /></a>
            <a href="#" className="p-2 rounded-full glass-container-light dark:glass-container-dark text-slate-500 hover:text-brand-purple transition-colors" aria-label="Twitter Link"><Twitter className="h-4 w-4" /></a>
          </div>
        </div>

        {/* Links lists columns */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 text-left">
          {footerLinks.map((cat) => (
            <div key={cat.title}>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">{cat.title}</h4>
              <ul className="space-y-3">
                {cat.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-xs text-slate-500 hover:text-brand-purple dark:hover:text-brand-cyan font-medium transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>

      {/* Footer Bottom info */}
      <div className="max-w-7xl mx-auto px-6 border-t border-slate-200/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] text-slate-500 font-medium">
          © {year} OfertaFy Inc. Projetado no Brasil. Todos os direitos reservados.
        </p>

        {/* Safe Network Real status banner */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-[10px] font-semibold text-brand-emerald">
          <ShieldAlert className="h-3 w-3" /> Todas as promoções passaram no validador IA contra golpes
        </div>
      </div>
    </footer>
  );
}
