import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Flame, ChevronDown, Timer } from 'lucide-react';
import { RACE_CONFIG } from '../data/raceConfig';

function calculateTimeLeft(targetIso) {
  const targetMs = Date.parse(targetIso);
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
  const [countdown, setCountdown] = useState(() =>
    calculateTimeLeft(raceConfig.targetDateIso)
  );

  useEffect(() => {
    setCountdown(calculateTimeLeft(raceConfig.targetDateIso));
    const interval = setInterval(() => {
      setCountdown(calculateTimeLeft(raceConfig.targetDateIso));
    }, 1000);
    return () => clearInterval(interval);
  }, [raceConfig.targetDateIso]);

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

  return (
    <section
      id="inicio"
      className="relative min-h-[85dvh] sm:min-h-[88dvh] flex items-center justify-center overflow-hidden bg-stone-950 pt-20 pb-6"
    >
      {/* Imagen de fondo Unsplash con srcSet responsivo y respaldo oscuro para lectura en exterior */}
      <img
        src={raceConfig.heroImage}
        srcSet={heroSrcSet}
        sizes="100vw"
        alt="Corredor de trail running en el filo de la montaña"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105 animate-[pulse_18s_ease-in-out_infinite]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/65 to-stone-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(12,10,9,0.85)_100%)]" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center flex flex-col items-center">
        {/* Etiqueta superior de aventura */}
        <div className="inline-flex items-center gap-2 rounded-full bg-stone-900/90 border border-orange-500 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-400 mb-3.5 shadow-[0_0_14px_rgba(249,115,22,0.3)]">
          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{raceConfig.subtitle} · 10 de Abril · 08:00 hs</span>
        </div>

        {/* Título central imponente */}
        <h1 className="max-w-3xl mx-auto text-balance font-display text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-[1.08] drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
          RETO AL FILO{' '}
          <span className="whitespace-nowrap">
            2<sup className="lowercase text-sm md:text-base font-extrabold align-super -top-2 relative">da</sup> EDICIÓN
          </span>
        </h1>

        <p className="mt-2 text-lg sm:text-2xl font-bold uppercase tracking-[0.22em] text-amber-400">
          {raceConfig.subtitle}
        </p>

        <p className="mt-2.5 max-w-xl text-balance text-sm sm:text-base text-stone-200 leading-relaxed">
          Desafiá las crestas técnicas, el bosque de altura y los senderos serranos en dos
          distancias diseñadas para corredores de montaña: <strong className="text-white">27K Competitivo</strong> y{' '}
          <strong className="text-white">13K Montaña</strong>.
        </p>

        {/* Contador regresivo dinámico hacia el 10 de abril de 2027 */}
        <div className="mt-5 w-full max-w-md">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-stone-300 mb-2">
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {countdown.expired
                ? '¡Largada en curso!'
                : 'Cuenta regresiva hacia la largada (10 Abr 2027)'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {timeUnits.map((unit) => (
              <div
                key={unit.label}
                className="rounded-2xl bg-stone-900/90 backdrop-blur-md border border-orange-500 py-2.5 px-2 sm:py-3 shadow-[0_0_16px_rgba(249,115,22,0.35)]"
              >
                <div className="font-display text-2xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                  {unit.value}
                </div>
                <div className="mt-1 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón CTA principal */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-stone-950 font-display font-black text-base sm:text-lg uppercase tracking-wider px-8 py-3 sm:py-3.5 shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
          >
            <Flame className="w-5 h-5 fill-stone-950" />
            Quiero Inscribirme
          </button>

          <a
            href="#circuito"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900/85 hover:bg-stone-800 text-stone-100 border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:border-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.45)] font-semibold text-sm sm:text-base px-6 py-3 sm:py-3.5 transition-all"
          >
            Ver Circuito y Altimetría
          </a>
        </div>

        {/* Ubicación rápida */}
        <div className="mt-4 inline-flex items-center gap-2 text-xs sm:text-sm text-stone-300">
          <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{raceConfig.locationName}</span>
        </div>
      </div>

      <a
        href="#circuito"
        aria-label="Desplazarse al circuito"
        className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-stone-400 hover:text-amber-400 transition-colors animate-bounce"
      >
        <ChevronDown className="w-6 h-6" />
      </a>
    </section>
  );
}
