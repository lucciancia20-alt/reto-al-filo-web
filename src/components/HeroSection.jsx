import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Flame, ChevronDown, Timer, Search, Mail } from 'lucide-react';
import {
  RACE_CONFIG,
  DEFAULT_RESIDENT_DISCOUNT_PERCENT,
  DEFAULT_TEAMS_BENEFIT_EMAIL,
  parseTargetDateParts,
  resolveTargetDateIso,
  getRaceTitle,
  getRaceEdition,
  expandOrdinalEdition,
} from '../data/raceConfig';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';

const SPONSOR_CIRCLE_SIZE_CLASS =
  'w-14 h-14 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] lg:w-[76px] lg:h-[76px] aspect-square';

const SPONSOR_PRESENTATIONS = [
  {
    matchUrl: 'aoiikojcbeiifxjcmbkz',
    matchName: /\bena\b/i,
    variant: 'circle-white',
  },
  {
    matchUrl: 'lk1mw5odlaby0mwvhwkq',
    matchName: /minuj[ií]n/i,
    variant: 'circle',
    src: '/sponsors/minujin.png',
  },
  {
    matchUrl: 'g9snabgpin6vdhxxbzhq',
    matchName: /vertientes|churrasquer/i,
    variant: 'circle',
    src: '/sponsors/vertientes.png',
  },
  {
    matchUrl: 'lvpqtxqvv2wlf5ns2orx',
    matchName: /\bhidra\b/i,
    variant: 'circle',
  },
  {
    matchUrl: 'yjcapd0duqt2iur2fu7p',
    matchName: /resto\s*bar|229/i,
    variant: 'badge',
    src: '/sponsors/restobar-229.png',
  },
  {
    matchUrl: 'tjuvxbiv7wpzg53twn9c',
    matchName: /tornquist\s*municipio|municipio\s*(de\s*)?tornquist/i,
    variant: 'circle-white',
    src: '/sponsors/municipio-tornquist.png',
  },
  {
    matchUrl: 'l23k5ifhxguhm1vntihl',
    matchName: /mistega/i,
    variant: 'circle-white',
  },
  {
    matchUrl: 't2hgy400hjjfw3mclvwn',
    matchName: /irineo/i,
    variant: 'circle-white',
    src: '/sponsors/irineo.png',
  },
];

function resolveSponsorPresentation(sp) {
  const url = String(sp?.logoUrl || '');
  const name = String(sp?.name || '');
  const matched = SPONSOR_PRESENTATIONS.find(
    (entry) => (entry.matchUrl && url.includes(entry.matchUrl)) || entry.matchName.test(name)
  );
  const variant = matched?.variant || 'default';
  const resolvedSrc = matched?.src || optimizeCloudinaryUrl(url, 320);

  if (variant === 'circle' || variant === 'circle-white') {
    return {
      src: resolvedSrc,
      wrapperClass: `${SPONSOR_CIRCLE_SIZE_CLASS} rounded-full overflow-hidden ${
        variant === 'circle-white' ? 'bg-white' : ''
      }`,
      imgClass: 'w-full h-full object-cover rounded-full transition-transform duration-200',
      allowInvert: false,
    };
  }

  if (variant === 'badge') {
    return {
      src: resolvedSrc,
      wrapperClass: SPONSOR_CIRCLE_SIZE_CLASS,
      imgClass: 'w-full h-full object-contain transition-transform duration-200',
      allowInvert: false,
    };
  }

  if (variant === 'horizontal') {
    return {
      src: resolvedSrc,
      wrapperClass: 'h-11 sm:h-12 md:h-[52px] lg:h-[56px] w-auto',
      imgClass:
        'h-full w-auto max-w-[155px] sm:max-w-[185px] md:max-w-[205px] object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] transition-transform duration-200',
      allowInvert: false,
    };
  }

  return {
    src: resolvedSrc,
    wrapperClass: 'h-14 sm:h-16 md:h-[72px] lg:h-[76px]',
    imgClass:
      'h-full w-auto max-w-[140px] sm:max-w-[175px] md:max-w-[195px] object-contain transition-all duration-200',
    allowInvert: true,
  };
}

function normalizeSponsorLink(rawLink) {
  const trimmed = String(rawLink || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('@'))
    return `https://www.instagram.com/${trimmed.slice(1).replace(/^\/+|\/+$/g, '')}/`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

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

  const activeSponsors = (Array.isArray(raceConfig?.sponsors) ? raceConfig.sponsors : []).filter(
    (s) => s && (String(s.name || '').trim() || String(s.logoUrl || '').trim())
  );

  const residentDiscountEnabled = Boolean(
    raceConfig?.residentDiscountEnabled ?? RACE_CONFIG.residentDiscountEnabled
  );
  const rawDiscountPercent = Number(
    raceConfig?.residentDiscountPercent ?? RACE_CONFIG.residentDiscountPercent
  );
  const residentDiscountPercent =
    Number.isFinite(rawDiscountPercent) && rawDiscountPercent >= 1
      ? Math.min(100, Math.max(1, Math.round(rawDiscountPercent)))
      : DEFAULT_RESIDENT_DISCOUNT_PERCENT;

  const teamsBenefitEnabled = true;
  const rawNotificationEmail = String(raceConfig?.notificationEmail ?? '').trim();
  const rawTeamsBenefitEmail = String(raceConfig?.teamsBenefitEmail ?? '').trim();
  const customTeamsBenefitEmail =
    rawTeamsBenefitEmail &&
    rawTeamsBenefitEmail.toLowerCase() !== DEFAULT_TEAMS_BENEFIT_EMAIL.toLowerCase()
      ? rawTeamsBenefitEmail
      : '';
  const teamsBenefitEmail =
    rawNotificationEmail || customTeamsBenefitEmail || DEFAULT_TEAMS_BENEFIT_EMAIL;

  return (
    <section
      id="inicio"
      className="relative min-h-[92dvh] md:min-h-[100dvh] flex items-center justify-center overflow-hidden bg-stone-950 pt-20 pb-12 md:pt-22 md:pb-14"
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/30 to-black/80" />

      <div className="relative z-10 w-full max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 pt-2 sm:pt-3 pb-8 sm:pb-10 text-center flex flex-col items-center">
        {/* Franja de sponsors — arriba debajo del Navbar fijo */}
        {activeSponsors.length > 0 && (
          <div className="w-full max-w-6xl xl:max-w-7xl mx-auto mb-3.5 px-2 sm:px-4 flex flex-col items-center justify-center gap-2">
            <span className="inline-flex items-center px-4 py-1 rounded-md bg-zinc-900/10 backdrop-blur-[2px] border border-[var(--theme-sub-border)] shadow-[0_0_12px_var(--theme-glow)] text-[var(--theme-sub)] font-display-athletic font-extrabold text-sm sm:text-base tracking-widest -skew-x-6 shrink-0">
              <span className="skew-x-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">Nos acompañan:</span>
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mx-auto max-w-[300px] sm:max-w-none">
              {activeSponsors.map((sp, idx) => {
                const href = normalizeSponsorLink(sp.linkUrl);
                const presentation = resolveSponsorPresentation(sp);
                const content = sp.logoUrl ? (
                  <img
                    src={presentation.src}
                    alt={sp.name || `Sponsor ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className={`${presentation.imgClass}${
                      presentation.allowInvert && sp.invertOnDark ? ' brightness-0 invert' : ''
                    }`}
                  />
                ) : (
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-stone-200 hover:text-white transition-colors">
                    {sp.name}
                  </span>
                );
                return href ? (
                  <a
                    key={sp.id || `hero-sponsor-${idx}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={sp.name ? `Visitar ${sp.name}` : 'Visitar sponsor oficial'}
                    aria-label={sp.name ? `Visitar ${sp.name}` : 'Visitar sponsor oficial'}
                    className={`inline-flex items-center justify-center shrink-0 ${presentation.wrapperClass} hover:scale-105 transition-transform`}
                  >
                    {content}
                  </a>
                ) : (
                  <span
                    key={sp.id || `hero-sponsor-${idx}`}
                    className={`inline-flex items-center justify-center shrink-0 ${presentation.wrapperClass}`}
                  >
                    {content}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Pastilla de fecha debajo de los sponsors */}
        <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/10 backdrop-blur-[2px] border border-orange-500 px-4 py-1.5 text-xs sm:text-sm font-semibold text-orange-400 mb-3.5 shadow-[0_0_14px_var(--theme-glow)]">
          <Calendar className="w-4 h-4 text-[var(--theme-sub)] shrink-0" />
          <span>
            {[topBadgeSubtitle, targetDateParts.formattedDayMonth, targetDateParts.formattedTime]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>

        {/* Título central imponente + sellos inclinados de Teams y Residentes */}
        <div className="relative z-20 inline-flex flex-col items-center max-w-full">
          {(teamsBenefitEnabled || residentDiscountEnabled) && (
            <div className="mb-3.5 flex flex-wrap items-center justify-center gap-3.5 sm:gap-5 min-[1360px]:mb-0 min-[1360px]:contents">
              {teamsBenefitEnabled && (
                <a
                  href={`mailto:${teamsBenefitEmail}?subject=${encodeURIComponent(`Beneficios para Teams - ${raceTitle}`)}`}
                  aria-label={`Beneficios para Teams: Profesor/Entrenador FREE y 1 Corredor FREE cada 10 inscriptos. Coordinar al mail ${teamsBenefitEmail}`}
                  className="z-20 min-[1360px]:absolute min-[1360px]:right-full min-[1360px]:mr-16 2xl:mr-24 min-[1360px]:-top-12 -rotate-2 min-[1360px]:-rotate-[5deg] hover:rotate-0 min-[1360px]:hover:-rotate-[1.5deg] hover:scale-105 antialiased transform-gpu [backface-visibility:hidden] rounded-2xl bg-zinc-900/15 hover:bg-zinc-900/25 backdrop-blur-[2px] border border-[var(--theme-primary)] hover:border-[var(--theme-secondary)] shadow-none px-3.5 py-2.5 sm:px-3.5 sm:py-3 transition-all duration-200 cursor-pointer flex flex-col items-stretch w-[244px] sm:w-[258px] text-center no-underline"
                >
                  <span className="block font-poster-condensed poster-title-stroke uppercase leading-[0.86] tracking-[0.02em] drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)] select-none">
                    <span className="block text-[32px] sm:text-[35px]">BENEFICIOS</span>
                    <span className="block text-[31px] sm:text-[34px] mt-0.5">PARA TEAMS</span>
                  </span>
                  <span className="mt-2 flex flex-col gap-1">
                    <span className="block rounded-[3px] bg-[#f4f2e1] px-2.5 py-0.5 font-display text-[11.5px] sm:text-xs font-bold text-slate-950 leading-snug whitespace-nowrap">
                      Profesor/Entrenador{' '}
                      <strong className="font-black text-[var(--theme-strip-accent)] uppercase">
                        FREE
                      </strong>
                    </span>
                    <span className="block rounded-[3px] bg-[#f4f2e1] px-2.5 py-0.5 font-display text-[11.5px] sm:text-xs font-bold text-slate-950 leading-snug whitespace-nowrap">
                      <strong className="font-black text-[var(--theme-strip-accent)]">
                        1 Corredor FREE
                      </strong>{' '}
                      cada 10 inscriptos
                    </span>
                  </span>
                  <span className="mt-1.5 block font-display text-[10.5px] sm:text-[11px] font-semibold text-white/95 leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                    Se coordina con el profesor /
                    <br />
                    entrenador al mail:
                  </span>
                  <span className="mt-1.5 inline-flex items-center justify-center gap-1.5 w-full rounded-[2px] theme-poster-ribbon text-[var(--theme-ribbon-text)] font-display font-extrabold text-[11.5px] sm:text-[12.5px] tracking-tight px-3 py-1 leading-tight whitespace-nowrap">
                    <Mail className="w-3.5 h-3.5 text-[var(--theme-ribbon-text)] shrink-0 stroke-[2.5]" />
                    <span className="truncate">{teamsBenefitEmail}</span>
                  </span>
                </a>
              )}

              {residentDiscountEnabled && (
                <button
                  type="button"
                  onClick={() => onOpenModal()}
                  aria-label={`Descuento para residentes del distrito: ${residentDiscountPercent}% OFF. Abrir inscripción.`}
                  className="z-20 min-[1360px]:absolute min-[1360px]:left-full min-[1360px]:ml-16 2xl:ml-24 min-[1360px]:-top-8 rotate-2 min-[1360px]:rotate-[5deg] hover:rotate-0 min-[1360px]:hover:rotate-[1.5deg] hover:scale-105 antialiased transform-gpu [backface-visibility:hidden] rounded-2xl bg-zinc-900/15 hover:bg-zinc-900/25 backdrop-blur-[2px] border-2 border-[var(--theme-primary)] hover:border-[var(--theme-secondary)] shadow-[0_0_16px_var(--theme-glow)] px-3.5 sm:px-4 pt-6 sm:pt-7 pb-3.5 sm:pb-4 transition-all duration-200 cursor-pointer flex flex-col items-center w-max"
                >
                  {/* Bloque estirado verticalmente desde la base: el pt extra compensa el crecimiento hacia arriba */}
                  <span className="inline-flex items-stretch justify-center gap-[3px] poster-title-stroke font-poster-impact drop-shadow-[0_3px_8px_rgba(0,0,0,0.65)] select-none px-0.5 scale-y-[1.18] scale-x-[0.94] origin-bottom antialiased transform-gpu">
                    <span className="text-[80px] sm:text-[92px] leading-[0.8] tracking-[-0.04em]">
                      {residentDiscountPercent}
                    </span>
                    <span className="flex flex-col justify-between text-left">
                      <span className="text-[44px] sm:text-[50px] leading-[0.8]">%</span>
                      <span className="text-[34px] sm:text-[39px] leading-[0.8] tracking-[-0.02em]">
                        OFF
                      </span>
                    </span>
                  </span>
                  <span className="relative z-10 -mt-[3px] block w-full -rotate-[2.5deg] antialiased transform-gpu [backface-visibility:hidden] rounded-[2px] theme-poster-ribbon text-[var(--theme-ribbon-text)] font-display font-extrabold uppercase text-[11.5px] sm:text-[12.5px] tracking-[0.03em] px-3 py-1 leading-tight whitespace-nowrap shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
                    CORREDORES DEL DISTRITO
                  </span>
                </button>
              )}
            </div>
          )}

          <div className="max-w-4xl mx-auto px-5 sm:px-7 py-4 sm:py-5 rounded-2xl bg-zinc-900/10 backdrop-blur-[2px] border border-orange-500 shadow-[0_0_16px_var(--theme-glow)]">
            <div className="inline-flex flex-col items-stretch mx-auto max-w-full">
              <h1 className="hero-title-athletic text-[clamp(1.25rem,4.9vw,3.45rem)] whitespace-nowrap">
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
        </div>

        <div className="mt-3 max-w-2xl mx-auto px-6 sm:px-8 py-3.5 rounded-2xl bg-zinc-900/10 backdrop-blur-[2px] border border-orange-500 shadow-[0_0_16px_var(--theme-glow)]">
          <p className="w-full max-w-none text-center text-sm sm:text-base text-white leading-relaxed tracking-[0.075em] [word-spacing:0.28em]">
            Desafiá las crestas técnicas, el bosque de altura y los senderos serranos en dos
            distancias diseñadas para corredores de montaña:{' '}
            <span className="inline-block"><strong className="text-cyan-400 font-bold whitespace-nowrap">27K Competitivo</strong>{' '}y{' '}<strong className="text-red-500 font-bold whitespace-nowrap">13K Competitivo.</strong></span>
          </p>
        </div>

        {/* Contador regresivo dinámico hacia la fecha y hora de largada */}
        <div className="w-full max-w-md sm:max-w-lg">
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
                className="rounded-2xl bg-zinc-900/10 backdrop-blur-[2px] border border-orange-500 py-2.5 px-2 sm:py-3 shadow-[0_0_16px_var(--theme-glow)]"
              >
                <div className="font-mono font-bold text-2xl sm:text-4xl leading-none tracking-[0.06em] text-white tabular-nums drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                  {unit.value}
                </div>
                <div className="mt-1.5 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-orange-400">
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
              className="w-full min-h-[54px] h-full flex items-center justify-center rounded-2xl bg-zinc-900/10 hover:bg-zinc-900/25 backdrop-blur-[2px] border border-orange-500/90 ring-1 ring-orange-500/70 ring-offset-2 ring-offset-zinc-950 active:scale-[0.99] text-orange-400 font-display font-semibold text-base sm:text-lg uppercase tracking-wider px-6 py-3 transition-all cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5 animate-cta-pulse">
                <Flame className="w-5 h-5 text-[var(--theme-sub)] shrink-0" />
                <span>Quiero Inscribirme</span>
              </span>
            </button>

            <a
              href="#circuito"
              className="w-full min-h-[54px] h-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900/10 hover:bg-zinc-900/25 backdrop-blur-[2px] text-orange-400 border border-orange-500 shadow-[0_0_15px_var(--theme-glow)] hover:scale-[1.01] font-semibold uppercase text-xs sm:text-[13px] tracking-wider whitespace-nowrap px-6 py-3 transition-all"
            >
              VER CIRCUITO Y ALTIMETRÍA
            </a>
          </div>

          <a
            href="#consultar-dorsal"
            className="w-full flex items-center justify-center gap-2 rounded-full bg-zinc-900/10 hover:bg-zinc-900/25 backdrop-blur-[2px] border border-orange-500/70 px-4 py-2 text-xs font-semibold text-orange-400 hover:scale-[1.01] transition-all"
          >
            <Search className="w-3.5 h-3.5 text-[var(--theme-sub)] shrink-0" />
            <span>¿Ya te inscribiste? Consultar mi estado y dorsal →</span>
          </a>
        </div>

        {/* Ubicación rápida */}
        <div className="mt-4 inline-flex items-center gap-2 text-xs sm:text-sm text-stone-200 border-b border-[var(--theme-sub-border)] pb-1">
          <MapPin className="w-5 h-5 text-[var(--theme-sub)] shrink-0" />
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
