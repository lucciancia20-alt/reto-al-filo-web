import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Flame, ChevronDown, Timer, Search } from 'lucide-react';
import {
  RACE_CONFIG,
  parseTargetDateParts,
  resolveTargetDateIso,
  getRaceTitle,
  getRaceEdition,
  expandOrdinalEdition,
} from '../data/raceConfig';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';

function calculateTimeLeft(targetIso) {
  const targetMs = Date.parse(resolveTargetDateIso(targetIso));
  const nowMs = Date.now();
  const diff = Math.max(0, targetMs - nowMs);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    expired: diff === 0,
  };
}

export default function HeroSection({ raceConfig = RACE_CONFIG, onOpenModal }) {
  const targetDateIso = resolveTargetDateIso(raceConfig?.targetDateIso);
  const [countdown, setCountdown] = useState(() => calculateTimeLeft(targetDateIso));

  useEffect(() => {
    setCountdown(calculateTimeLeft(targetDateIso));
    const interval = setInterval(() => {
      setCountdown(calculateTimeLeft(targetDateIso));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDateIso]);

  const timeUnits = [
    { label: 'Días', value: countdown.days },
    { label: 'Horas', value: countdown.hours },
    { label: 'Min', value: countdown.minutes },
    { label: 'Seg', value: countdown.seconds },
  ];

  const heroSrcSet =
    raceConfig.heroImage && raceConfig.heroImage.includes('images.unsplash.com')
      ? [800, 1280, 1920]
          .map((w) => `${raceConfig.heroImage.replace(/w=\d+/, `w=${w}`)} ${w}w`)
          .join(', ')
      : undefined;

  const targetDateParts = parseTargetDateParts(targetDateIso);
  const raceTitle = getRaceTitle(raceConfig);
  const rawEdition = getRaceEdition(raceConfig);
  const raceEdition = expandOrdinalEdition(rawEdition, 'SEGUNDA EDICIÓN');
  const titleWords = raceTitle.trim().split(/\s+/);
  const firstTitleWord = titleWords[0] || '';
  const restTitleWords = titleWords.slice(1).join(' ');
  const editionChars = raceEdition ? Array.from(raceEdition) : [];
  const topBadgeSubtitle =
    raceConfig.subtitle &&
    (!rawEdition ||
      raceConfig.subtitle.trim().toLowerCase() !== rawEdition.trim().toLowerCase()) &&
    (!raceEdition ||
      raceConfig.subtitle.trim().toLowerCase() !== raceEdition.trim().toLowerCase())
      ? raceConfig.subtitle
      : '';

  return (
    <section
      id="inicio"
      className="relative min-h-[92dvh] md:min-h-[100dvh] flex items-center justify-center overflow-hidden bg-stone-950 pt-16 pb-12 md:pt-20 md:pb-16"
    >
      {/* Imagen de fondo con srcSet responsivo y respaldo oscuro para lectura en exterior */}
      <img
        src={optimizeCloudinaryUrl(raceConfig.heroImage || '/images/hero-trail-runners.jpg', 1920)}
        srcSet={heroSrcSet}
        sizes="100vw"
        alt="Corredor de trail running en el filo de la montaña"
        fetchpriority="high"
        className="absolute inset-0 w-full h-full object-cover object-[center_28%]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-2 pb-8 sm:pt-3 sm:pb-10 -mt-2 md:-mt-4 text-center flex flex-col items-center">
        {/* Etiqueta superior de aventura */}
        <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/20 backdrop-blur-sm border border-orange-500 px-4 py-1.5 text-xs sm:text-sm font-semibold text-orange-400 mb-3.5 shadow-[0_0_14px_var(--theme-glow)]">
          <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
          <span>
            {[topBadgeSubtitle, targetDateParts.formattedDayMonth, targetDateParts.formattedTime]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>

        {/* Título central imponente */}
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-4 sm:py-5 rounded-2xl bg-zinc-900/20 backdrop-blur-sm border border-orange-500/80 shadow-[0_0_16px_var(--theme-glow)]">
          <div className="inline-flex flex-col items-stretch mx-auto max-w-full">
            <h1 className="hero-title-athletic text-[clamp(1.25rem,5.6vw,3.85rem)] whitespace-nowrap">
              <span className="hero-word-accent">{firstTitleWord}</span>
              {restTitleWords && (
                <>
                  {' '}
                  <span className="hero-word-white">{restTitleWords}</span>
                </>
              )}
            </h1>

            {editionChars.length > 0 && (
              <p
                aria-label={raceEdition}
                className="hero-subtitle-edition mt-2 sm:mt-2.5 w-full flex items-center justify-between text-xs sm:text-base md:text-xl leading-none select-none"
              >
                {editionChars.map((ch, idx) => (
                  <span key={idx} aria-hidden="true">
                    {ch === ' ' ? '\u00A0' : ch}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 max-w-2xl mx-auto px-6 sm:px-8 py-3.5 rounded-2xl bg-zinc-900/20 backdrop-blur-sm border border-orange-500/80 shadow-[0_0_16px_var(--theme-glow)]">
          <p className="w-full max-w-none text-center text-sm sm:text-base text-white leading-relaxed tracking-[0.075em] [word-spacing:0.28em]">
            Desafiá las crestas técnicas, el bosque de altura y los senderos serranos en dos
            distancias diseñadas para corredores de montaña:{' '}
            <span className="inline-block"><strong className="text-cyan-400 font-bold whitespace-nowrap">27K Competitivo</strong>{' '}y{' '}<strong className="text-red-500 font-bold whitespace-nowrap">13K Competitivo.</strong></span>
          </p>
        </div>

        {/* Contador regresivo dinámico hacia la fecha y hora de largada */}
        <div className="w-full max-w-md">
          <p className="my-4 text-center text-xs sm:text-sm font-medium uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <Timer className="inline-block w-4 h-4 sm:w-[18px] sm:h-[18px] text-orange-400 mr-1.5 -mt-0.5 align-middle" />
            <span>
              {countdown.expired ? (
                '¡Largada en curso!'
              ) : (
                <>
                  Cuenta regresiva hacia la largada
                  <br className="sm:hidden" />{' '}
                  <span className="whitespace-nowrap">({targetDateParts.formattedShortDate})</span>
                </>
              )}
            </span>
          </p>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {timeUnits.map((unit) => (
              <div
                key={unit.label}
                className="rounded-2xl bg-zinc-900/20 backdrop-blur-sm border border-orange-500 py-2.5 px-2 sm:py-3 shadow-[0_0_16px_var(--theme-glow)]"
              >
                <div className="section-title-athletic text-2xl sm:text-4xl text-white tabular-nums">
                  {unit.value}
                </div>
                <div className="mt-1 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-orange-400">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón CTA principal */}
        <div className="mt-5 w-full max-w-2xl mx-auto space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-stretch w-full">
            <button
              type="button"
              onClick={() => onOpenModal()}
              className="w-full min-h-[54px] h-full flex items-center justify-center rounded-2xl bg-zinc-900/20 hover:bg-zinc-900/35 backdrop-blur-sm border border-orange-500/90 ring-1 ring-orange-500/70 ring-offset-2 ring-offset-zinc-950 active:scale-[0.99] text-orange-400 font-display font-semibold text-base sm:text-lg uppercase tracking-wider px-6 py-3 transition-all cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5 animate-cta-pulse">
                <Flame className="w-5 h-5 text-orange-400" />
                <span>Quiero Inscribirme</span>
              </span>
            </button>

            <a
              href="#circuito"
              className="w-full min-h-[54px] h-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900/20 hover:bg-zinc-900/35 backdrop-blur-sm text-orange-400 border border-orange-500 shadow-[0_0_15px_var(--theme-glow)] hover:scale-[1.01] font-semibold uppercase text-xs sm:text-[13px] tracking-wider whitespace-nowrap px-6 py-3 transition-all"
            >
              VER CIRCUITO Y ALTIMETRÍA
            </a>
          </div>

          <a
            href="#consultar-dorsal"
            className="w-full flex items-center justify-center gap-2 rounded-full bg-zinc-900/20 hover:bg-zinc-900/35 backdrop-blur-sm border border-orange-500/70 px-4 py-2 text-xs font-semibold text-orange-400 hover:scale-[1.01] transition-all"
          >
            <Search className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>¿Ya te inscribiste? Consultar mi estado y dorsal →</span>
          </a>
        </div>

        {/* Ubicación rápida */}
        <div className="mt-4 inline-flex items-center gap-2 text-xs sm:text-sm text-stone-300">
          <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
          <span>{raceConfig.locationName}</span>
        </div>
      </div>

      <a
        href="#circuito"
        aria-label="Desplazarse al circuito"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-stone-400 hover:text-orange-400 transition-colors animate-bounce"
      >
        <ChevronDown className="w-6 h-6" />
      </a>
    </section>
  );
}
