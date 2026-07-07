"use client";

import React from "react";
import { motion } from "framer-motion";

const shortcuts = [
  { emoji: "📱", label: "Eletrônicos", color: "bg-blue-50 dark:bg-blue-950" },
  { emoji: "🎮", label: "Games", color: "bg-purple-50 dark:bg-purple-950" },
  { emoji: "🏠", label: "Casa", color: "bg-orange-50 dark:bg-orange-950" },
  { emoji: "⌚", label: "Acessórios", color: "bg-emerald-50 dark:bg-emerald-950" },
  { emoji: "⚽", label: "Esportes", color: "bg-cyan-50 dark:bg-cyan-950" },
  { emoji: "💄", label: "Beleza", color: "bg-pink-50 dark:bg-pink-950" },
  { emoji: "📚", label: "Livros", color: "bg-amber-50 dark:bg-amber-950" },
  { emoji: "🔍", label: "Ver Todos", color: "bg-slate-100 dark:bg-slate-800" },
];

export function MobileShortcuts() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {shortcuts.map((s, i) => (
        <motion.button
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex flex-col items-center gap-1.5"
        >
          <div
            className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center text-2xl active:scale-95 transition-transform`}
          >
            {s.emoji}
          </div>
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-tight text-center">
            {s.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
