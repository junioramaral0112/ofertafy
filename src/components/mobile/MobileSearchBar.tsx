"use client";

import React from "react";
import { Search } from "lucide-react";

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export function MobileSearchBar({ value, onChange, onSearch }: MobileSearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="block md:hidden px-4 pt-2 pb-3">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
        <button onClick={onSearch} aria-label="Buscar" className="shrink-0">
          <Search className="h-4 w-4 text-slate-400" />
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar ofertas..."
          className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-xs text-slate-400 shrink-0"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
