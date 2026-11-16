import React, { useState } from 'react';
import {
  Clock,
  HelpCircle,
  ChevronDown,
  MapPin,
  ExternalLink,
  ShieldCheck,
  FileText,
  Award,
  CheckCircle2,
  Printer,
  FileCheck2,
  Search,
  Wifi,
  AlertCircle,
  Loader2,
  PackageCheck,
  Car,
  MessageCircle,
} from 'lucide-react';
import { RACE_CONFIG, parseTargetDateParts, syncScheduleWithTargetDate } from '../data/raceConfig';
import { openPrintableWaiver, openPrintableMedicalCert } from '../utils/printableDocs';
import { fetchPublicRunnerStatus } from '../firebase/config';

export default function InfoFaqSection({ raceConfig = RACE_CONFIG }) {
  const [openFaqId, setOpenFaqId] = useState(
    raceConfig?.faqs?.[0]?.id || RACE_CONFIG.faqs[0].id
  );
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);

  const handleLookupSubmit = async (e) => {
    e.preventDefault();
    const trimmed = lookupQuery.trim();
    if (!trimmed) {
      setLookupResult({ found: false, invalidQuery: true });
      return;
    }
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const res = await fetchPublicRunnerStatus(trimmed);
      setLookupResult(res);
    } catch {
      setLookupResult({ found: false, errorCode: 'unknown' });
    } finally {
      setLookupLoading(false);
    }
  };

  const orgDigits = String(raceConfig?.whatsappNumber || '').replace(/\D/g, '');
  const orgWaUrl = orgDigits
    ? `https://wa.me/${orgDigits}?text=${encodeURIComponent('Hola! Consulto por el estado de mi inscripción en Reto al Filo.')}`
    : '#';

  const { formattedFullDate } = parseTargetDateParts(raceConfig.targetDateIso);
  const syncedSchedule = syncScheduleWithTargetDate(
    raceConfig.schedule || [],
    raceConfig.targetDateIso
  );

  const faqIcons = {
    'elementos-obligatorios': ShieldCheck,
    'como-llegar': MapPin,
    reglamento: FileText,
  };

  const mandatoryGear = raceConfig?.mandatoryGear || RACE_CONFIG.mandatoryGear;
  const gear27 = (Array.isArray(mandatoryGear?.['27K']) ? mandatoryGear['27K'] : RACE_CONFIG.mandatoryGear['27K']).filter(
    (item) => String(item || '').trim()
  );
  const gear13 = (Array.isArray(mandatoryGear?.['13K']) ? mandatoryGear['13K'] : RACE_CONFIG.mandatoryGear['13K']).filter(
    (item) => String(item || '').trim()
  );

  const ageCategories = raceConfig?.ageCategories || RACE_CONFIG.ageCategories;
  const categoryBrackets = (
    Array.isArray(ageCategories?.brackets)
      ? ageCategories.brackets
      : RACE_CONFIG.ageCategories.brackets
  ).filter((b) => String(b?.label || b?.range || '').trim());

  return (
    <>
      {/* Grilla de 3 columnas en escritorio (xl:grid-cols-3) y 1 columna en móviles/tablets */}
      <div className="bg-stone-950 border-t-2 border-orange-500/50 py-8 sm:py-10 relative">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 xl:px-10 grid grid-cols-1 xl:grid-cols-3 gap-10 xl:gap-6 items-stretch">
          {/* Columna 1: Línea de Tiempo (Cronograma del Día) */}
          <section id="cronograma" className="scroll-mt-20 min-w-0 flex flex-col h-full">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-950 border border-orange-500/70 shadow-[0_0_12px_rgba(249,115,22,0.25)] px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-orange-400">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Cronograma Oficial · {formattedFullDate}</span>
              </div>

              <h2 className="mt-2 text-balance font-display text-3xl md:text-4xl xl:text-2xl font-black text-white uppercase tracking-tight section-title-stroke">
                Horarios del Día de Carrera
              </h2>
              <p className="mt-1.5 text-balance text-xs sm:text-sm text-stone-300">
                Planificá tu llegada al predio con anticipación. La charla técnica y el control de
                equipamiento son obligatorios para todas las distancias.
              </p>
            </div>

            {/* Línea de tiempo vertical con los horarios del día */}
            <div className="mt-5 flex-1 flex flex-col justify-between gap-2.5 relative pl-6 sm:pl-8 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-7 before:bottom-7 before:w-0.5 before:bg-gradient-to-b before:from-orange-500 before:via-orange-500/50 before:to-stone-800">
              {syncedSchedule.map((item, idx) => (
                <div
                  key={`${item.time}-${idx}`}
                  className="relative flex-1 flex flex-col justify-center rounded-2xl bg-zinc-950 border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.22)] p-3.5 sm:p-4 hover:border-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all"
                >
                  {/* Punto indicador centrado exactamente sobre la línea vertical */}
                  <span
                    className={`absolute -left-[22px] sm:-left-[26px] top-5 w-4 h-4 rounded-full border-2 ${
                      idx === 2
                        ? 'bg-orange-500 border-stone-950 ring-4 ring-orange-500/30'
                        : 'bg-stone-950 border-orange-500'
                    }`}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.day && (
                        <span className="inline-flex items-center h-7 text-xs font-extrabold uppercase tracking-wider leading-none text-orange-300 bg-zinc-950 border border-orange-500/60 px-2.5 rounded-lg whitespace-nowrap">
                          {item.day}
                        </span>
                      )}
                      <span className="inline-flex items-center h-7 font-mono tabular-nums text-xs sm:text-sm font-extrabold leading-none text-orange-400 bg-zinc-950 border border-orange-500/50 px-2.5 rounded-lg whitespace-nowrap">
                        {item.time}
                      </span>
                    </div>
                    <span className="inline-flex items-center h-7 text-[11px] font-semibold uppercase tracking-wider leading-none text-stone-400 bg-zinc-950 px-2.5 rounded-md border border-orange-500/60 whitespace-nowrap">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="mt-2 font-display text-lg sm:text-xl font-extrabold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-stone-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Columna 2: Tabla Pública de Categorías por Edad y Premiación */}
          <section
            id="categorias"
            className="scroll-mt-20 min-w-0 pt-8 border-t-2 border-orange-500/40 xl:pt-0 xl:border-t-0 flex flex-col h-full"
          >
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-950 border border-orange-500/70 shadow-[0_0_12px_rgba(249,115,22,0.25)] px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-orange-400">
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>Clasificación Oficial · Damas y Caballeros</span>
              </div>

              <h2 className="mt-2 text-balance font-display text-3xl md:text-4xl xl:text-2xl font-black text-white uppercase tracking-tight section-title-stroke">
                {ageCategories.title || 'Categorías por Edad y Premiación'}
              </h2>
              <p className="mt-1.5 text-balance text-xs sm:text-sm text-stone-300">
                Aplicable tanto para <strong className="text-cyan-400">27K Competitivo</strong> como para{' '}
                <strong className="text-red-500">13K Competitivo</strong> en ramas Damas y Caballeros.
              </p>
            </div>

            <div className="mt-5 flex-1 flex flex-col gap-3">
              {/* Resumen de Premiación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5">
              <div className="rounded-2xl bg-zinc-950 border border-orange-500/70 p-3.5">
                <span className="block text-[10px] font-medium uppercase tracking-widest text-orange-400">
                  Clasificación General
                </span>
                <p className="mt-1 text-xs sm:text-sm font-medium text-white">
                  {ageCategories.generalPodium || RACE_CONFIG.ageCategories.generalPodium}
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-950 border border-orange-500/70 p-3.5">
                <span className="block text-[10px] font-medium uppercase tracking-widest text-orange-400">
                  Premiación por Categorías
                </span>
                <p className="mt-1 text-xs sm:text-sm font-medium text-white">
                  {ageCategories.categoryPodium || RACE_CONFIG.ageCategories.categoryPodium}
                </p>
              </div>
            </div>

            {/* Tabla de Franjas Etarias */}
            {categoryBrackets.length > 0 && (
              <div className="rounded-2xl bg-zinc-950 border border-orange-500/80 overflow-hidden shadow-[0_0_16px_rgba(249,115,22,0.18)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-orange-500/35 text-[11px] uppercase tracking-wider text-orange-400">
                        <th className="px-3 sm:px-6 py-2.5 font-medium">Franja Etaria</th>
                        <th className="px-3 sm:px-6 py-2.5 font-medium text-right">Ramas y Distancias</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/80">
                      {categoryBrackets.map((cat, idx) => (
                        <tr
                          key={cat.id || idx}
                          className="hover:bg-stone-950/60 transition-colors"
                        >
                          <td className="px-3 sm:px-6 py-2.5 font-display font-bold text-white text-xs sm:text-sm whitespace-nowrap">
                            {cat.label || cat.range}
                          </td>
                          <td className="px-3 sm:px-6 py-2.5 text-[11px] sm:text-xs text-stone-300">
                            <div className="flex flex-row items-center justify-end gap-1.5 whitespace-nowrap">
                              <span>
                                Damas / Caballeros <span>·</span>
                              </span>
                              <span>
                                <span className="text-cyan-400 font-bold">27K</span> y{' '}
                                <span className="text-red-500 font-bold">13K</span>
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {ageCategories.ruleNote && (
              <div className="mt-auto rounded-xl bg-zinc-950 border border-orange-500/60 px-4 py-2.5 text-xs text-orange-100 leading-relaxed">
                <strong className="text-orange-400">Criterio reglamentario: </strong>
                {ageCategories.ruleNote}
              </div>
            )}
            </div>
          </section>

          {/* Columna 3: Acordeón Desplegable de Preguntas Frecuentes */}
          <section
            id="faq"
            className="scroll-mt-20 min-w-0 pt-8 border-t-2 border-orange-500/40 xl:pt-0 xl:border-t-0 flex flex-col h-full"
          >
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-950 border border-orange-500/70 shadow-[0_0_12px_rgba(249,115,22,0.25)] px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-orange-400">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Información Clave para el Corredor</span>
              </div>

              <h2 className="mt-2 text-balance font-display text-3xl md:text-4xl xl:text-2xl font-black text-white uppercase tracking-tight section-title-stroke">
                Preguntas Frecuentes (FAQ)
              </h2>
            </div>

            <div className="mt-5 flex-1 flex flex-col gap-2.5">
            {(raceConfig.faqs || []).map((faq) => {
              const isOpen = openFaqId === faq.id;
              const IconComponent = faqIcons[faq.id] || HelpCircle;

              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all overflow-hidden bg-zinc-950 ${
                    isOpen
                      ? 'border-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.3)]'
                      : 'border-orange-500/80 shadow-[0_0_12px_rgba(249,115,22,0.18)] hover:border-orange-400'
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${faq.id}`}
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full px-4 sm:px-5 py-3.5 sm:py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </span>
                      <span className="font-display text-base sm:text-lg font-extrabold text-white">
                        {faq.question}
                      </span>
                    </div>

                    <ChevronDown
                      className={`w-5 h-5 text-orange-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-panel-${faq.id}`}
                      className="px-4 sm:px-5 pb-4 pt-1 text-xs sm:text-sm text-stone-300 leading-relaxed border-t border-orange-500/30"
                    >
                      <p className={`mt-2.5 ${faq.id === 'como-llegar' ? 'text-justify [text-align-last:left]' : ''}`}>{faq.answer}</p>

                      {faq.id === 'elementos-obligatorios' && (
                        <div className="mt-3.5 space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                            <div className="rounded-xl bg-zinc-950 border border-cyan-500/60 p-3.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-display font-black uppercase tracking-wider text-cyan-400">
                                27K Cumbre Técnica
                              </span>
                              <ul className="mt-2 space-y-1.5 text-xs text-stone-200">
                                {gear27.map((item, idx) => (
                                  <li key={`gear27-${idx}`} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="rounded-xl bg-zinc-950 border border-red-500/60 p-3.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-display font-black uppercase tracking-wider text-red-500">
                                13K Competitivo
                              </span>
                              <ul className="mt-2 space-y-1.5 text-xs text-stone-200">
                                {gear13.map((item, idx) => (
                                  <li key={`gear13-${idx}`} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {mandatoryGear.note && (
                            <p className="text-[11px] text-white bg-zinc-950 border border-orange-500/70 rounded-lg px-3 py-2">
                              {mandatoryGear.note}
                            </p>
                          )}
                        </div>
                      )}

                      {faq.id === 'reglamento' && (
                        <div className="mt-3.5 flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => openPrintableWaiver({ raceConfig })}
                            className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 border border-orange-500 hover:border-orange-400 text-orange-400 font-display font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4 shrink-0 text-orange-500" />
                            <span>Deslinde de Responsabilidad (A4 / PDF)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openPrintableMedicalCert({ raceConfig })}
                            className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 border border-orange-500 hover:border-orange-400 text-orange-400 font-display font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors cursor-pointer"
                          >
                            <FileCheck2 className="w-4 h-4 shrink-0 text-orange-500" />
                            <span>Modelo de Apto Médico (A4 / PDF)</span>
                          </button>
                        </div>
                      )}

                      {faq.id === 'como-llegar' && (
                        <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-2.5">
                          <div className="rounded-xl bg-zinc-950 border border-orange-500/80 p-3 space-y-1.5">
                            <span className="flex items-center min-h-[1.75rem] gap-1.5 text-[10px] lg:text-[11px] font-display font-medium uppercase tracking-wider whitespace-nowrap text-orange-400">
                              <PackageCheck className="w-4 h-4 shrink-0 text-orange-400" />
                              Checklist para Retirar Kit
                            </span>
                            <p className="text-[11px] sm:text-xs text-stone-200 leading-relaxed text-justify [text-align-last:left]">
                              Presentá en mesa: <strong className="text-white">DNI físico</strong>, <strong className="text-white">Apto Médico firmado por médico</strong> (vigencia &lt; 1 año) y <strong className="text-white">Deslinde impreso firmado</strong>. Sin documentación completa no se entrega dorsal ni chip.
                            </p>
                          </div>

                          <div className="rounded-xl bg-zinc-950 border border-orange-500/80 p-3 space-y-1.5">
                            <span className="flex items-center min-h-[1.75rem] gap-1.5 text-[10px] lg:text-[11px] font-display font-medium uppercase tracking-wider whitespace-nowrap text-orange-400">
                              <Wifi className="w-4 h-4 shrink-0 text-orange-400" />
                              Wi-Fi Starlink + Track Offline
                            </span>
                            <p className="text-[11px] sm:text-xs text-stone-200 leading-relaxed text-justify [text-align-last:left]">
                              Contamos con <strong className="text-white">Wi-Fi satelital Starlink</strong> en la base (domo, cantina y largada). En los filos y cumbres no hay señal móvil: llevá el <strong className="text-white">archivo .GPX descargado offline</strong> en tu reloj o teléfono antes de largar.
                            </p>
                          </div>

                          <div className="rounded-xl bg-zinc-950 border border-orange-500/80 p-3 space-y-1.5">
                            <span className="flex items-center min-h-[1.75rem] gap-1.5 text-[10px] lg:text-[11px] font-display font-medium uppercase tracking-wider whitespace-nowrap text-orange-400">
                              <Car className="w-4 h-4 shrink-0 text-orange-400" />
                              Servicios en Cerro Providencia
                            </span>
                            <p className="text-[11px] sm:text-xs text-stone-200 leading-relaxed text-justify [text-align-last:left]">
                              Predio con <strong className="text-white">estacionamiento</strong>, <strong className="text-white">baños químicos</strong> y cantina (se recomienda llevar algo de <strong className="text-white">efectivo</strong> además de pago digital).
                            </p>
                          </div>
                        </div>
                      )}

                      {faq.hasMapButton && (
                        <div className="mt-3">
                          <a
                            href={raceConfig.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-950 border border-orange-500/80 hover:border-orange-400 text-orange-400 font-display font-medium text-xs uppercase tracking-wider px-4 py-2.5 transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-orange-400" />
                            Abrir ubicación en Google Maps
                            <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Acceso directo permanente a Documentos Imprimibles A4 */}
            <div className="mt-auto rounded-2xl bg-zinc-950 border border-orange-500/70 p-4 flex flex-col sm:flex-row xl:flex-col sm:items-center xl:items-stretch justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium uppercase tracking-widest text-orange-400">
                  Documentación para Acreditación (Imprimible A4)
                </span>
                <p className="mt-0.5 font-mono text-[11px] font-normal tracking-tight leading-relaxed text-white">
                  Descargá e imprimí tu Deslinde y el Modelo de Certificado / Apto Médico
                </p>
              </div>
              <div className="shrink-0 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPrintableWaiver({ raceConfig })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 border border-orange-500 hover:border-orange-400 text-orange-400 font-display font-bold text-xs uppercase tracking-wider px-3 py-1.5 whitespace-nowrap transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0 text-orange-500" />
                  <span>Deslinde A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => openPrintableMedicalCert({ raceConfig })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 border border-orange-500 hover:border-orange-400 text-orange-400 font-display font-bold text-xs uppercase tracking-wider px-3 py-1.5 whitespace-nowrap transition-colors cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5 shrink-0 text-orange-500" />
                  <span>Apto Médico A4</span>
                </button>
              </div>
            </div>
            </div>
          </section>
        </div>
      </div>

      {/* Consultor Público Seguro de Inscripción y Dorsal (centrado debajo de las 3 columnas) */}
      <section
        id="consultar-dorsal"
        className="scroll-mt-20 py-8 sm:py-10 bg-stone-900/70 border-t-2 border-orange-500/50"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-zinc-950 border border-orange-500/80 shadow-[0_0_24px_rgba(249,115,22,0.18)] p-5 sm:p-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-950 border border-orange-500/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-400">
                <Search className="w-3.5 h-3.5" />
                <span>Consultor Oficial de Corredores</span>
              </div>
              <h2 className="mt-2 font-display text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight md:whitespace-nowrap section-title-stroke">
                ¿Ya te inscribiste? Consultá tu Estado y Dorsal
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-stone-300">
                Ingresá tu código <span className="font-mono text-orange-400">RAF-XXXXX</span> para verificar confirmación, talle y número asignado.
              </p>
            </div>

            <form
              onSubmit={handleLookupSubmit}
              className="mt-4 flex flex-col sm:flex-row gap-2.5"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Ej: RAF-12345"
                  aria-label="Código de inscripción RAF"
                  className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-stone-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={lookupLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 border border-orange-500 hover:border-orange-400 active:scale-[0.99] text-orange-400 font-display font-bold text-xs sm:text-sm uppercase tracking-wider px-5 py-2.5 transition-all cursor-pointer disabled:opacity-60 shrink-0"
              >
                {lookupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-orange-500" />
                    <span>Consultar Estado</span>
                  </>
                )}
              </button>
            </form>

            {lookupResult && (
              <div className="mt-4">
                {lookupResult.found && lookupResult.data ? (
                  (() => {
                    const st = lookupResult.data;
                    const isConfirmed = st.status === 'confirmed';
                    const isRejected = st.status === 'rejected';
                    const badgeConfig = isConfirmed
                      ? {
                          wrapper: 'border-orange-500/80 bg-zinc-950',
                          pill: 'bg-zinc-950 border-emerald-500/80 text-emerald-400',
                          label: 'Inscripción Confirmada',
                        }
                      : isRejected
                        ? {
                            wrapper: 'border-red-500/80 bg-zinc-950',
                            pill: 'bg-zinc-950 border-red-500/80 text-red-400',
                            label: 'Observada / Rechazada',
                          }
                        : {
                            wrapper: 'border-orange-500/80 bg-zinc-950',
                            pill: 'bg-zinc-950 border-orange-500/80 text-orange-400',
                            label: 'Pendiente de Verificación',
                          };

                    return (
                      <div className={`rounded-2xl border p-4 space-y-3 ${badgeConfig.wrapper}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${badgeConfig.pill}`}
                            >
                              {isConfirmed ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : isRejected ? (
                                <AlertCircle className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              {badgeConfig.label}
                            </span>
                            <span className="font-mono text-xs text-stone-200 bg-zinc-950 border border-stone-700 rounded-lg px-2 py-0.5">
                              {st.code}
                            </span>
                            <span className="text-xs font-bold text-stone-100">
                              Iniciales: {st.initials}
                            </span>
                          </div>

                          <div className="font-display text-base sm:text-lg text-orange-400">
                            {isConfirmed ? (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 border border-orange-500/80 px-3 py-1 font-medium text-orange-400">
                                Dorsal: {st.assignedBib ? `#${st.assignedBib}` : 'A asignar en mesa'}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-stone-300">
                                Dorsal pendiente de confirmación
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="rounded-xl bg-zinc-950 border border-orange-500/75 px-3 py-2">
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">
                              Distancia
                            </span>
                            <strong
                              className={
                                st.distance === '27K' ? 'text-cyan-400 font-bold' : 'text-red-500 font-bold'
                              }
                            >
                              {st.distance} Competitivo
                            </strong>
                          </div>

                          <div className="rounded-xl bg-zinc-950 border border-orange-500/75 px-3 py-2">
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">
                              Talle Reservado
                            </span>
                            <strong className="text-orange-400">{st.shirtSize || 'A confirmar'}</strong>
                          </div>

                          <div className="rounded-xl bg-zinc-950 border border-orange-500/75 px-3 py-2">
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">
                              Acreditación Presencial
                            </span>
                            <strong className={st.checkedIn ? 'text-emerald-300' : 'text-stone-200'}>
                              {st.checkedIn ? 'Kit entregado ✓' : 'Pendiente de retiro'}
                            </strong>
                          </div>
                        </div>

                        {!isConfirmed && !isRejected && (
                          <p className="text-xs text-orange-100/90">
                            Tu comprobante está en cola de verificación manual por la organización. Apenas confirmemos el pago verás acá tu número de dorsal asignado.
                          </p>
                        )}

                        {isRejected ? (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <p className="text-xs text-red-200">
                              Hay una observación con tu inscripción o comprobante. Contactanos para resolverlo rápido:
                            </p>
                            {orgDigits && (
                              <a
                                href={orgWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs px-3.5 py-2 transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Contactar por WhatsApp
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
                            <span className="text-[11px] text-stone-300">
                              Recordá llevar DNI, Deslinde firmado y Apto Médico para retirar tu kit:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openPrintableWaiver({
                                    raceConfig,
                                    runner: {
                                      code: st.code,
                                      distance: st.distance,
                                      assignedBib: st.assignedBib,
                                      dni: '',
                                    },
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-zinc-950 border border-orange-500 hover:border-orange-400 text-orange-400 font-bold text-[11px] uppercase px-2.5 py-1.5 transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5 text-orange-500" />
                                Deslinde A4
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openPrintableMedicalCert({
                                    raceConfig,
                                    runner: {
                                      code: st.code,
                                      distance: st.distance,
                                      assignedBib: st.assignedBib,
                                      dni: '',
                                    },
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-zinc-950 border border-orange-500 hover:border-orange-400 text-orange-400 font-bold text-[11px] uppercase px-2.5 py-1.5 transition-colors cursor-pointer"
                              >
                                <FileCheck2 className="w-3.5 h-3.5 text-orange-500" />
                                Apto Médico A4
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="rounded-2xl border border-stone-700 bg-zinc-950 p-4 text-xs text-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span>
                        {lookupResult.invalidQuery
                          ? 'Ingresá tu código RAF-XXXXX para realizar la consulta.'
                          : lookupResult.errorCode === 'permission-denied'
                            ? 'El consultor online está actualizando permisos en Firebase. Mientras tanto podés verificar tu estado escribiéndonos por WhatsApp.'
                            : 'No encontramos ninguna inscripción con ese código RAF. Verificá los datos o consultanos por WhatsApp si te inscribiste recién.'}
                      </span>
                    </div>
                    {orgDigits && (
                      <a
                        href={orgWaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-950 hover:bg-white/5 text-emerald-400 border border-emerald-500/60 font-bold text-xs px-3 py-2 transition-colors shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Consultar WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
