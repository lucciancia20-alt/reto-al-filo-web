import React from 'react';
import { Flame, Settings, Handshake } from 'lucide-react';
import {
  RACE_CONFIG,
  getRaceTitle,
  getRaceEdition,
  getRaceFullTitle,
  expandOrdinalEdition,
  parseTargetDateParts,
} from '../data/raceConfig';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';

function normalizeSponsorLink(rawLink) {
  const trimmed = String(rawLink || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('@')) {
    return `https://www.instagram.com/${trimmed.slice(1).replace(/^\/+|\/+$/g, '')}/`;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function Footer({
  raceConfig = RACE_CONFIG,
  onOpenModal,
  onOpenAdmin,
}) {
  const { formattedFullDate } = parseTargetDateParts(raceConfig?.targetDateIso);
  const raceTitle = getRaceTitle(raceConfig);
  const expandedEdition = expandOrdinalEdition(getRaceEdition(raceConfig), 'SEGUNDA EDICIÓN');
  const titleWords = raceTitle.trim().split(/\s+/);
  const firstTitleWord = titleWords[0] || '';
  const restTitleWords = titleWords.slice(1).join(' ');
  const orgDigits = String(raceConfig?.whatsappNumber || '').replace(/\D/g, '');
  const sponsorWaUrl = orgDigits
    ? `https://wa.me/${orgDigits}?text=${encodeURIComponent(
        `Hola! Me interesa recibir información para ser sponsor de ${getRaceFullTitle(raceConfig, ' · ')}${
          raceConfig?.subtitle ? ` (${raceConfig.subtitle})` : ''
        }.`
      )}`
    : '#';
  const activeSponsors = (Array.isArray(raceConfig?.sponsors) ? raceConfig.sponsors : []).filter(
    (s) => s && (String(s.name || '').trim() || String(s.logoUrl || '').trim())
  );

  return (
    <footer className="bg-stone-950 border-t-2 border-orange-500/50 py-6 sm:py-8 text-stone-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-5">
        <div className="pb-4 border-b border-stone-800/80 flex flex-wrap items-center justify-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded bg-[var(--theme-sub-bg)] border border-[var(--theme-sub-border)] text-[var(--theme-sub)] font-display-athletic text-xs tracking-widest -skew-x-6 [text-shadow:none] shrink-0">
              <span className="skew-x-6">Nos acompañan:</span>
            </span>
            {activeSponsors.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
                {activeSponsors.map((sp, idx) => {
                  const href = normalizeSponsorLink(sp.linkUrl);
                  const content = sp.logoUrl ? (
                    <img
                      src={optimizeCloudinaryUrl(sp.logoUrl, 280)}
                      alt={sp.name || `Sponsor ${idx + 1}`}
                      loading="lazy"
                      decoding="async"
                      className={`h-8 sm:h-10 w-auto max-w-[130px] object-contain transition-all duration-200 ${
                        sp.invertOnDark
                          ? 'brightness-0 invert opacity-90 group-hover:opacity-100'
                          : 'opacity-90 group-hover:opacity-100'
                      }`}
                    />
                  ) : (
                    <span className="font-display font-bold text-xs sm:text-sm uppercase tracking-wider text-stone-200 group-hover:text-white transition-colors">
                      {sp.name}
                    </span>
                  );

                  return href ? (
                    <a
                      key={sp.id || `footer-sponsor-${idx}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={sp.name ? `Visitar ${sp.name}` : 'Visitar sponsor oficial'}
                      aria-label={sp.name ? `Visitar ${sp.name}` : 'Visitar sponsor oficial'}
                      className="group inline-flex items-center hover:scale-105 transition-transform"
                    >
                      {content}
                    </a>
                  ) : (
                    <span
                      key={sp.id || `footer-sponsor-${idx}`}
                      title={sp.name || undefined}
                      className="group inline-flex items-center"
                    >
                      {content}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-stone-400">
                Espacio disponible para marcas y sponsors oficiales
              </span>
            )}
          </div>
          {orgDigits && (
            <a
              href={sponsorWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 border border-[var(--theme-sub-border)] hover:border-[var(--theme-sub)] text-[var(--theme-sub)] text-xs font-semibold px-3 py-1.5 transition-colors whitespace-nowrap"
            >
              <Handshake className="w-3.5 h-3.5 shrink-0" />
              Sumate como Sponsor
            </a>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={optimizeCloudinaryUrl('/logo-raf.png', 400)}
            alt={`Logo ${raceTitle}`}
            loading="lazy"
            decoding="async"
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-md shrink-0"
          />
          <div>
            <p className="flex flex-wrap items-baseline gap-x-2 leading-tight uppercase">
              <span className="hero-title-athletic text-base sm:text-lg tracking-[0.06em] [word-spacing:0.1em]">
                <span className="text-[var(--theme-primary)]">{firstTitleWord}</span>
                {restTitleWords && <span className="text-white"> {restTitleWords}</span>}
              </span>
              {expandedEdition && (
                <span className="hero-subtitle-edition font-bold text-sm sm:text-base tracking-[0.12em] [text-shadow:none]">
                  <span className="text-white">- </span>
                  <span className="text-[var(--theme-edition-text)]">{expandedEdition}</span>
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              {formattedFullDate} · {raceConfig.locationName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 border border-orange-500/80 hover:border-orange-400 text-orange-400 text-xs font-semibold px-4 py-3 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-orange-500" />
              Panel Admin
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-950 border border-orange-500/90 ring-1 ring-orange-500/70 ring-offset-2 ring-offset-zinc-950 active:scale-[0.99] text-orange-400 font-display font-semibold text-xs uppercase tracking-wider px-5 py-3 transition-all cursor-pointer"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            Quiero Inscribirme
          </button>
        </div>
        </div>
      </div>
    </footer>
  );
}