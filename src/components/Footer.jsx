import React from 'react';
import { Flame, Settings } from 'lucide-react';
import {
  RACE_CONFIG,
  getRaceTitle,
  getRaceEdition,
  getRaceFullTitle,
  expandOrdinalEdition,
  parseTargetDateParts,
} from '../data/raceConfig';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';

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

  return (
    <footer className="bg-stone-950 border-t-2 border-orange-500/50 py-6 sm:py-8 text-stone-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-5">
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
            <p className="flex flex-wrap items-baseline gap-x-2 leading-none uppercase">
              <span className="hero-title-athletic text-base sm:text-lg leading-none tracking-[0.06em] [word-spacing:0.1em]">
                <span className="text-[var(--theme-primary)]">{firstTitleWord}</span>
                {restTitleWords && <span className="text-white"> {restTitleWords}</span>}
              </span>
              {expandedEdition && (
                <span className="hero-subtitle-edition font-bold text-[18.5px] sm:text-[21px] leading-none -translate-y-[0.5px] tracking-[0.1em] [text-shadow:none]">
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