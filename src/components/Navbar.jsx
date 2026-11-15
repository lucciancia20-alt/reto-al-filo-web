import React, { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';

export default function Navbar({ onOpenModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Circuito', href: '#circuito' },
    { label: 'Galería', href: '#galeria' },
    { label: 'Cronograma', href: '#cronograma' },
    { label: 'Preguntas Frecuentes', href: '#faq' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-stone-950/85 backdrop-blur-md border-b-2 border-orange-500/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-2 flex items-center justify-between gap-3">
        <a
          href="#inicio"
          className="flex items-center gap-2.5 text-stone-100 font-display font-extrabold tracking-tight text-lg"
        >
          <img
            src="/logo-raf.png"
            alt="Logo Reto al Filo"
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-md shrink-0"
          />
          <span className="leading-none">
            RETO AL FILO
            <span className="block text-[10px] font-sans font-semibold tracking-widest text-orange-400 uppercase mt-0.5">
              2da Edición · 2027
            </span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-orange-400">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-orange-400 hover:text-orange-300 transition-colors"
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
          className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg border border-orange-500/60 text-orange-400 hover:bg-stone-800/80 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-stone-950/98 border-b border-orange-500/40 px-4 pt-2 pb-5 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-orange-400 hover:text-orange-300 border-b border-orange-500/20"
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