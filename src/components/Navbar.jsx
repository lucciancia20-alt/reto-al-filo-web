import React, { useState } from 'react';
import { Menu, X, ArrowUpRight, Handshake } from 'lucide-react';
import {
  RACE_CONFIG,
  getRaceTitle,
  getRaceEdition,
  getRaceFullTitle,
  expandOrdinalEdition,
  parseTargetDateParts,
} from '../data/raceConfig';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';

export default function Navbar({ raceConfig = RACE_CONFIG, onOpenModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const raceTitle = getRaceTitle(raceConfig);
  const titleWords = raceTitle.trim().split(/\s+/);
  const firstTitleWord = titleWords[0] || '';
  const restTitleWords = titleWords.slice(1).join(' ');
  const editionText = expandOrdinalEdition(getRaceEdition(raceConfig), 'SEGUNDA EDICIÓN');
  const editionChars = Array.from(editionText);
  const { year } = parseTargetDateParts(raceConfig?.targetDateIso);
  const yearChars = Array.from(String(year || '').trim());

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
    <header className="fixed top-0 inset-x-0 z-40 bg-slate-950/60 backdrop-blur-md border-b border-orange-500/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-[72px] sm:min-h-20 py-1.5 sm:py-2 flex items-center justify-between gap-3">
        {/* Logo + título RAF */}
        <a
          href="#inicio"
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 text-stone-100 font-display-athletic text-lg shrink-0"
        >
          <img
            src={optimizeCloudinaryUrl('/logo-raf.png', 400)}
            alt={`Logo ${raceTitle}`}
            decoding="async"
            className="w-16 h-16 sm:w-[68px] sm:h-[68px] object-contain drop-shadow-md shrink-0"
          />
          <span className="inline-flex flex-col items-stretch leading-none gap-[3px] uppercase min-w-0 font-display-athletic">
            <span className="block whitespace-nowrap hero-title-athletic text-[12px] sm:text-[13.5px] leading-none">
              <span className="text-[var(--theme-primary)]">{firstTitleWord}</span>
              {restTitleWords && <span className="text-white"> {restTitleWords}</span>}
            </span>
            {editionChars.length > 0 && (
              <span
                aria-label={editionText}
                className="w-full flex items-center justify-between text-[9.5px] sm:text-[10px] leading-none text-[var(--theme-sub)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)] select-none"
              >
                {editionChars.map((ch, idx) => (
                  <span key={idx} aria-hidden="true">
                    {ch === ' ' ? '\u00A0' : ch}
                  </span>
                ))}
              </span>
            )}
            {yearChars.length > 0 && (
              <span
                aria-label={year}
                className="w-full flex items-center justify-between text-[9.5px] sm:text-[10px] leading-none text-[var(--theme-sub)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)] select-none"
              >
                {yearChars.map((ch, idx) => (
                  <span key={idx} aria-hidden="true">
                    {ch}
                  </span>
                ))}
              </span>
            )}
          </span>
        </a>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-5 xl:gap-7 text-sm lg:text-base font-semibold">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[var(--theme-primary)] hover:opacity-85 transition-opacity whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Botones derecha — desktop */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {orgDigits && (
            <a
              href={sponsorWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-transparent hover:bg-zinc-900/25 backdrop-blur-[2px] border border-[var(--theme-sub-border)] hover:border-[var(--theme-sub)] text-[var(--theme-sub)] text-xs font-bold px-3.5 py-2.5 transition-colors whitespace-nowrap"
            >
              <Handshake className="w-3.5 h-3.5 text-[var(--theme-sub)] shrink-0" />
              ¿Querés ser sponsor?
            </a>
          )}
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex items-center justify-center rounded-full bg-zinc-900/10 hover:bg-zinc-900/25 backdrop-blur-[2px] border border-orange-500/90 ring-1 ring-orange-500/70 ring-offset-2 ring-offset-zinc-900 active:scale-[0.99] text-[var(--theme-primary)] font-display font-semibold text-xs uppercase tracking-wider px-4 py-2.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="inline-flex items-center gap-1.5 animate-cta-pulse">
              <span>Quiero Inscribirme</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" />
            </span>
          </button>
        </div>

        {/* Hamburguesa — mobile */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label="Abrir menú de navegación"
          className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg bg-zinc-900/10 backdrop-blur-[2px] border border-orange-500/60 text-[var(--theme-primary)] hover:bg-zinc-900/25 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Menú mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-900/65 backdrop-blur-md border-b border-orange-500/80 px-4 pt-2 pb-5 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-[var(--theme-primary)] hover:opacity-85 border-b border-orange-500/20"
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
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900/65 hover:bg-zinc-900/80 backdrop-blur-md border border-[var(--theme-sub-border)] hover:border-[var(--theme-sub)] text-[var(--theme-sub)] text-sm font-semibold py-3 transition-colors"
            >
              <Handshake className="w-4 h-4 text-[var(--theme-sub)] shrink-0" />
              ¿Querés ser sponsor?
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenModal();
            }}
            className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-zinc-900/70 hover:bg-zinc-900/80 backdrop-blur-md border border-orange-500/90 ring-1 ring-orange-500/70 ring-offset-2 ring-offset-zinc-900 active:scale-[0.99] text-[var(--theme-primary)] font-display font-semibold text-sm uppercase tracking-wider py-3.5 transition-all cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 animate-cta-pulse">
              <span>Quiero Inscribirme</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" />
            </span>
          </button>
        </div>
      )}
    </header>
  );
}
