import React, { useState } from 'react';
import { Mountain, Menu, X, ArrowUpRight } from 'lucide-react';

export default function Navbar({ onOpenModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Circuito', href: '#circuito' },
    { label: 'Galería', href: '#galeria' },
    { label: 'Cronograma', href: '#cronograma' },
    { label: 'Preguntas Frecuentes', href: '#faq' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-stone-950/85 backdrop-blur-md border-b border-stone-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a
          href="#inicio"
          className="flex items-center gap-2.5 text-stone-100 font-display font-extrabold tracking-tight text-lg"
        >
          <span className="w-9 h-9 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Mountain className="w-5 h-5 stroke-[2.5]" />
          </span>
          <span className="leading-none">
            RETO AL FILO
            <span className="block text-[10px] font-sans font-semibold tracking-widest text-amber-400 uppercase mt-0.5">
              2da Edición · 2027
            </span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-300">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-amber-400 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center">
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Quiero Inscribirme
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label="Abrir menú de navegación"
          className="md:hidden p-2 rounded-lg text-stone-200 hover:bg-stone-800/80 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-stone-950/98 border-b border-stone-800 px-4 pt-2 pb-5 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-stone-200 hover:text-amber-400 border-b border-stone-900"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenModal();
            }}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm uppercase tracking-wider py-3.5 shadow-lg shadow-amber-500/20"
          >
            Quiero Inscribirme
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
}
