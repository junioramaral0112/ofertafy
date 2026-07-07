"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon, Cpu, Menu, X, ArrowRight, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Evita Hydration Mismatch em Next.js Theme Switchers
  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Como Funciona", href: "#how-it-works" },
    { name: "Inteligência Artificial", href: "#ai-features" },
    { name: "Ofertas Quentes", href: "#featured-offers" },
    { name: "Benefícios", href: "#benefits" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "py-4 bg-background-light/75 dark:bg-background-dark/75 backdrop-blur-md border-b border-slate-200/40 dark:border-slate-800/40 shadow-sm"
          : "py-6 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-purple via-brand-orange to-brand-cyan flex items-center justify-center shadow-lg shadow-brand-purple/20 group-hover:scale-105 transition-transform duration-300">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-brand-purple to-slate-950 dark:from-white dark:via-brand-cyan dark:to-white tracking-tight">
            Oferta<span className="text-brand-orange dark:text-brand-orange">Fy</span>
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-purple dark:hover:text-brand-cyan transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme switcher */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-full glass-container-light dark:glass-container-dark text-slate-700 dark:text-slate-300 hover:text-brand-purple dark:hover:text-brand-cyan transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          <Button variant="glass" size="sm" className="hidden lg:inline-flex border-slate-300/60 dark:border-slate-800/60">
            Falar com IA
          </Button>
          <Button variant="premium" size="sm">
            Explorar Painel <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Mobile Action Buttons */}
        <div className="flex md:hidden items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full glass-container-light dark:glass-container-dark text-slate-700 dark:text-slate-300"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-full glass-container-light dark:glass-container-dark text-slate-700 dark:text-slate-300"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 left-4 right-4 z-40 p-6 glass-container-light dark:glass-container-dark rounded-3xl shadow-xl border border-slate-200/60 dark:border-slate-800/60"
          >
            <nav className="flex flex-col gap-5">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-semibold text-slate-700 dark:text-slate-200"
                >
                  {link.name}
                </a>
              ))}
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
              <div className="flex flex-col gap-3">
                <Button variant="glass" size="md" className="w-full">
                  Falar com IA
                </Button>
                <Button variant="premium" size="md" className="w-full">
                  Explorar Painel <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
