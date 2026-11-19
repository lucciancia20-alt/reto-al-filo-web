import React, { useState } from 'react';
import { Menu, X, ArrowUpRight, Handshake } from 'lucide-react';
import {
  RACE_CONFIG,
  getRaceTitle,
  getRaceEdition,
  getRaceFullTitle,
  parseTargetDateParts,
} from '../data/raceConfig';

export default function Navbar({ raceConfig = RACE_CONFIG, onOpenModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const raceTitle = getRaceTitle(raceConfig);
  const raceEdition = getRaceEdition(raceConfig);
  const { year } = parseTargetDateParts(raceConfig?.targetDateIso);
  const brandSubline = [raceEdition, year].filter(Boolean).join(' · ');

  const orgDigits = String(raceConfig?.whatsappNumber || '').replace(/\D/g, '');
  const sponsorWaUrl = orgDigits
    ? `https://wa.me/${orgDigits}?text=${encodeURIComponent(
        `Hola! Me interesa recibir información para ser sponsor de ${getRaceFullTitle(raceConfig, ' · ')}${
          raceConfig?.subtitle ? ` (${raceConfig.subtitle})` : ''
        }.`
      )}`
    : '#';

  const navLinks = [
    { label: 'Circuito', href: '#circuito' },
    { label: 'Galería', href: '#galeria' },
    { label: 'Cronograma', href: '#cronograma' },
    { label: 'Preguntas Frecuentes', href: '#faq' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-zinc-900/65 backdrop-blur-md border-b border-orange-500/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-2 flex items-center justify-between gap-3">
        <a
          href="#inicio"
          className="flex items-center gap-2.5 min-w-0 text-stone-100 font-display-athletic text-lg"
        >
          <img
            src="/logo-raf.png"
            alt={`Logo ${raceTitle}`}
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-md shrink-0"
          />
          <span className="leading-none uppercase min-w-0">
            <span className="block truncate max-w-[52vw] sm:max-w-xs font-display-athletic">{raceTitle}</span>
            {brandSubline && (
              <span className="block text-[10px] font-display-athletic tracking-widest text-orange-400 uppercase mt-0.5">
                {brandSubline}
              </span>
            )}
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-semibold text-orange-400">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-orange-400 hover:opacity-85 transition-opacity"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {orgDigits && (
            <a
              href={sponsorWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900/65 hover:bg-zinc-900/80 backdrop-blur-md border border-orange-500/80 hover:border-orange-400 text-orange-400 text-xs font-semibold px-3.5 py-2.5 transition-colors whitespace-nowrap"
            >
              <Handshake className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              ¿Querés ser sponsor?
            </a>
          )}
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex items-center justify-center rounded-full bg-zinc-900/70 hover:bg-zinc-900/80 backdrop-blur-md border border-orange-500/90 ring-1 ring-orange-500/70 ring-offset-2 ring-offset-zinc-900 active:scale-[0.99] text-orange-400 font-display font-semibold text-xs uppercase tracking-wider px-4 py-2.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="inline-flex items-center gap-1.5 animate-cta-pulse">
              <span>Quiero Inscribirme</span>
              <ArrowUpRight className="w-4 h-4 text-orange-400 shrink-0" />
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label="Abrir menú de navegación"
          className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg bg-zinc-900/65 backdrop-blur-md border border-orange-500/60 text-orange-400 hover:bg-zinc-900/80 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-900/65 backdrop-blur-md border-b border-orange-500/80 px-4 pt-2 pb-5 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-orange-400 hover:opacity-85 border-b border-orange-500/20"
            >
              {link.label}
            </a>
          ))}
          {orgDigits && (
            <a
              href={sponsorWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900/65 hover:bg-zinc-900/80 backdrop-blur-md border border-orange-500/80 hover:border-orange-400 text-orange-400 text-sm font-semibold py-3 transition-colors"
            >
              <Handshake className="w-4 h-4 text-orange-500 shrink-0" />
              ¿Querés ser sponsor?
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenModal();
            }}
            className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-zinc-900/70 hover:bg-zinc-900/80 backdrop-blur-md border border-orange-500/90 ring-1 ring-orange-500/70 ring-offset-2 ring-offset-zinc-900 active:scale-[0.99] text-orange-400 font-display font-semibold text-sm uppercase tracking-wider py-3.5 transition-all cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 animate-cta-pulse">
              <span>Quiero Inscribirme</span>
              <ArrowUpRight className="w-4 h-4 text-orange-400 shrink-0" />
            </span>
          </button>
        </div>
      )}
    </header>
  );
}