import React, { useState } from 'react';
import {
  Clock,
  HelpCircle,
  ChevronDown,
  MapPin,
  ExternalLink,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { RACE_CONFIG } from '../data/raceConfig';

export default function InfoFaqSection({ raceConfig = RACE_CONFIG }) {
  const [openFaqId, setOpenFaqId] = useState(
    raceConfig?.faqs?.[0]?.id || RACE_CONFIG.faqs[0].id
  );

  const faqIcons = {
    'elementos-obligatorios': ShieldCheck,
    'como-llegar': MapPin,
    reglamento: FileText,
  };

  return (
    <section
      id="cronograma"
      className="py-16 sm:py-24 bg-stone-950 border-t border-stone-900 relative"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Parte 1: Línea de Tiempo (Cronograma del Día) */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.25)] px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Cronograma Oficial · 10 de Abril 2027</span>
          </div>

          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Horarios del Día de Carrera
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-stone-300">
            Planificá tu llegada al predio con anticipación. La charla técnica y el control de
            equipamiento son obligatorios para todas las distancias.
          </p>
        </div>

        {/* Línea de tiempo vertical con los horarios del día */}
        <div className="mt-10 max-w-2xl mx-auto relative pl-6 sm:pl-8 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:via-amber-500/50 before:to-stone-800 space-y-6">
          {(raceConfig.schedule || []).map((item, idx) => (
            <div
              key={`${item.time}-${idx}`}
              className="relative rounded-2xl bg-stone-900/80 border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.22)] p-5 sm:p-6 hover:border-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all"
            >
              {/* Punto indicador en la línea vertical */}
              <span
                className={`absolute -left-[25px] sm:-left-[29px] top-6 w-4 h-4 rounded-full border-2 ${
                  idx === 2
                    ? 'bg-amber-400 border-stone-950 ring-4 ring-amber-500/30'
                    : 'bg-stone-950 border-amber-400'
                }`}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm sm:text-base font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
                  {item.time}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 bg-stone-950 px-2.5 py-1 rounded-md border border-orange-500/60">
                  {item.tag}
                </span>
              </div>

              <h3 className="mt-3 font-display text-lg sm:text-xl font-extrabold text-white">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-stone-300 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Parte 2: Acordeón Desplegable de Preguntas Frecuentes (3 ítems) */}
        <div id="faq" className="mt-20 pt-10 border-t border-stone-900">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.25)] px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Información Clave para el Corredor</span>
            </div>

            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              Preguntas Frecuentes (FAQ)
            </h2>
          </div>

          <div className="mt-8 max-w-3xl mx-auto space-y-3.5">
            {(raceConfig.faqs || []).map((faq) => {
              const isOpen = openFaqId === faq.id;
              const IconComponent = faqIcons[faq.id] || HelpCircle;

              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen
                      ? 'bg-stone-900 border-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.3)]'
                      : 'bg-stone-900/60 border-orange-500/80 shadow-[0_0_12px_rgba(249,115,22,0.18)] hover:border-orange-400'
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${faq.id}`}
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </span>
                      <span className="font-display text-base sm:text-lg font-extrabold text-white">
                        {faq.question}
                      </span>
                    </div>

                    <ChevronDown
                      className={`w-5 h-5 text-amber-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-panel-${faq.id}`}
                      className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-stone-300 leading-relaxed border-t border-orange-500/30"
                    >
                      <p className="mt-3">{faq.answer}</p>

                      {faq.hasMapButton && (
                        <div className="mt-4">
                          <a
                            href={raceConfig.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors"
                          >
                            <MapPin className="w-4 h-4" />
                            Abrir ubicación en Google Maps
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
