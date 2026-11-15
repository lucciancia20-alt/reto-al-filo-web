import React from 'react';
import { Plus, Trash2, ShieldCheck, Award } from 'lucide-react';
import { RACE_CONFIG } from '../../data/raceConfig';
import ResizableTextarea from './ResizableTextarea';

export default function AdminScheduleFaqTab({
  schedule,
  faqs,
  mandatoryGear,
  ageCategories,
  setDraft,
  onScheduleChange,
  onAddSchedule,
  onRemoveSchedule,
  onFaqChange,
}) {
  const gear = mandatoryGear || RACE_CONFIG.mandatoryGear;
  const gear27 = Array.isArray(gear['27K']) ? gear['27K'] : RACE_CONFIG.mandatoryGear['27K'];
  const gear13 = Array.isArray(gear['13K']) ? gear['13K'] : RACE_CONFIG.mandatoryGear['13K'];

  const cats = ageCategories || RACE_CONFIG.ageCategories;
  const brackets = Array.isArray(cats.brackets)
    ? cats.brackets
    : RACE_CONFIG.ageCategories.brackets;

  const updateGearList = (dist, nextList) => {
    setDraft((prev) => ({
      ...prev,
      mandatoryGear: {
        ...(prev.mandatoryGear || RACE_CONFIG.mandatoryGear),
        [dist]: nextList,
      },
    }));
  };

  const handleGearItemChange = (dist, idx, value) => {
    const base = dist === '27K' ? [...gear27] : [...gear13];
    base[idx] = value;
    updateGearList(dist, base);
  };

  const handleAddGearItem = (dist) => {
    const base = dist === '27K' ? [...gear27] : [...gear13];
    base.push('');
    updateGearList(dist, base);
  };

  const handleRemoveGearItem = (dist, idx) => {
    const base = dist === '27K' ? gear27 : gear13;
    updateGearList(
      dist,
      base.filter((_, i) => i !== idx)
    );
  };

  const updateGearNote = (note) => {
    setDraft((prev) => ({
      ...prev,
      mandatoryGear: {
        ...(prev.mandatoryGear || RACE_CONFIG.mandatoryGear),
        note,
      },
    }));
  };

  const updateCategoryField = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      ageCategories: {
        ...(prev.ageCategories || RACE_CONFIG.ageCategories),
        [field]: value,
      },
    }));
  };

  const handleBracketChange = (idx, field, value) => {
    const nextBrackets = brackets.map((b, i) =>
      i === idx ? { ...b, [field]: value } : b
    );
    updateCategoryField('brackets', nextBrackets);
  };

  const handleAddBracket = () => {
    updateCategoryField('brackets', [
      ...brackets,
      { id: `cat-${Date.now()}`, label: '', range: '' },
    ]);
  };

  const handleRemoveBracket = (idx) => {
    updateCategoryField(
      'brackets',
      brackets.filter((_, i) => i !== idx)
    );
  };
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-sm font-bold text-white uppercase">
            Cronograma del Día de Carrera
          </h4>
          <button
            type="button"
            onClick={onAddSchedule}
            className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar Día y Horario
          </button>
        </div>

        <div className="space-y-3">
          {schedule.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-2.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={item.day ?? ''}
                  onChange={(e) => onScheduleChange(idx, 'day', e.target.value)}
                  placeholder="Ej. Sábado 10"
                  aria-label="Día del cronograma"
                  className="sm:col-span-3 rounded-lg bg-zinc-900 border border-orange-500/70 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs font-semibold text-orange-300"
                />
                <input
                  type="text"
                  value={item.time}
                  onChange={(e) => onScheduleChange(idx, 'time', e.target.value)}
                  placeholder="06:00 hs"
                  aria-label="Horario"
                  className="sm:col-span-2 rounded-lg bg-zinc-900 border border-orange-500/70 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs font-mono text-amber-300"
                />
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => onScheduleChange(idx, 'title', e.target.value)}
                  placeholder="Título"
                  aria-label="Título"
                  className="sm:col-span-4 rounded-lg bg-zinc-900 border border-orange-500/70 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs font-bold text-white"
                />
                <input
                  type="text"
                  value={item.tag}
                  onChange={(e) => onScheduleChange(idx, 'tag', e.target.value)}
                  placeholder="Lugar"
                  aria-label="Lugar"
                  className="sm:col-span-2 rounded-lg bg-zinc-900 border border-orange-500/70 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs text-stone-200"
                />
                <button
                  type="button"
                  onClick={() => onRemoveSchedule(idx)}
                  aria-label="Quitar horario"
                  className="sm:col-span-1 justify-self-end p-1.5 text-stone-400 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <ResizableTextarea
                rows={1}
                value={item.description}
                onChange={(e) => onScheduleChange(idx, 'description', e.target.value)}
                className="rounded-lg bg-zinc-900 border border-orange-500/70 focus:border-orange-400 focus:outline-none px-3 py-2 text-xs text-stone-200"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-display text-sm font-bold text-white uppercase mb-3">
          Preguntas Frecuentes (FAQ)
        </h4>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={faq.id}
              className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-2"
            >
              <input
                type="text"
                value={faq.question}
                onChange={(e) => onFaqChange(idx, 'question', e.target.value)}
                className="w-full rounded-lg bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs font-bold text-white"
              />
              <ResizableTextarea
                rows={1}
                value={faq.answer}
                onChange={(e) => onFaqChange(idx, 'answer', e.target.value)}
                className="rounded-lg bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-2 text-xs text-stone-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Elementos Obligatorios diferenciados por distancia (27K y 13K) */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <h4 className="font-display text-sm font-bold text-white uppercase">
              Elementos Obligatorios Diferenciados (27K vs. 13K)
            </h4>
            <p className="text-[11px] text-stone-400">
              Se muestran en la sección Elementos Obligatorios del FAQ y en la vista previa del
              Reglamento al inscribirse.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {[
            {
              dist: '27K',
              title: '27K Cumbre Técnica',
              items: gear27,
              accentText: 'text-cyan-400',
              borderClass: 'border-cyan-500/50 focus:border-cyan-400',
              btnClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20',
            },
            {
              dist: '13K',
              title: '13K Competitivo',
              items: gear13,
              accentText: 'text-red-400',
              borderClass: 'border-red-500/50 focus:border-red-400',
              btnClass: 'bg-red-500/10 text-red-300 border-red-500/40 hover:bg-red-500/20',
            },
          ].map((col) => (
            <div
              key={col.dist}
              className="rounded-xl bg-stone-900/70 border border-stone-800 p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`font-display text-xs font-black uppercase ${col.accentText}`}>
                  {col.title}
                </span>
                <button
                  type="button"
                  onClick={() => handleAddGearItem(col.dist)}
                  className={`inline-flex items-center gap-1 rounded-lg border text-[11px] font-bold px-2.5 py-1 cursor-pointer transition-colors ${col.btnClass}`}
                >
                  <Plus className="w-3 h-3" />
                  <span>Agregar</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {col.items.map((item, idx) => (
                  <div key={`${col.dist}-gear-${idx}`} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleGearItemChange(col.dist, idx, e.target.value)}
                      placeholder={`Elemento obligatorio ${col.dist}...`}
                      className={`flex-1 min-w-0 rounded-lg bg-stone-950 border ${col.borderClass} focus:outline-none px-2.5 py-1.5 text-xs text-stone-100`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGearItem(col.dist, idx)}
                      aria-label={`Quitar elemento ${col.dist} #${idx + 1}`}
                      className="p-1.5 text-stone-400 hover:text-rose-400 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Nota aclaratoria de control de material
          </label>
          <ResizableTextarea
            rows={1}
            value={gear.note || ''}
            onChange={(e) => updateGearNote(e.target.value)}
            className="rounded-lg bg-stone-900 border border-orange-500/50 focus:border-orange-400 focus:outline-none px-3 py-2 text-xs text-stone-200"
          />
        </div>
      </div>

      {/* Categorías por Edad y Premiación */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <h4 className="font-display text-sm font-bold text-white uppercase">
                Categorías por Edad y Premiación
              </h4>
              <p className="text-[11px] text-stone-400">
                Editá las franjas de edad (Damas y Caballeros) y las reglas de premiación pública.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddBracket}
            className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 text-xs font-bold px-3 py-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Franja</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Título de Sección
            </label>
            <input
              type="text"
              value={cats.title || ''}
              onChange={(e) => updateCategoryField('title', e.target.value)}
              className="w-full rounded-lg bg-stone-900 border border-orange-500/50 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Premiación Clasificación General
            </label>
            <input
              type="text"
              value={cats.generalPodium || ''}
              onChange={(e) => updateCategoryField('generalPodium', e.target.value)}
              className="w-full rounded-lg bg-stone-900 border border-orange-500/50 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Premiación por Categorías
            </label>
            <input
              type="text"
              value={cats.categoryPodium || ''}
              onChange={(e) => updateCategoryField('categoryPodium', e.target.value)}
              className="w-full rounded-lg bg-stone-900 border border-orange-500/50 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Regla de cómputo de edad y no acumulación
            </label>
            <ResizableTextarea
              rows={2}
              value={cats.ruleNote || ''}
              onChange={(e) => updateCategoryField('ruleNote', e.target.value)}
              className="rounded-lg bg-stone-900 border border-orange-500/50 focus:border-orange-400 focus:outline-none px-3 py-2 text-xs text-stone-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Franjas Etarias (Damas y Caballeros · 27K y 13K)
          </span>
          {brackets.map((b, idx) => (
            <div key={b.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={b.label}
                onChange={(e) => handleBracketChange(idx, 'label', e.target.value)}
                placeholder="Ej. 18 a 29 años"
                aria-label={`Nombre categoría ${idx + 1}`}
                className="sm:col-span-5 rounded-lg bg-stone-900 border border-orange-500/50 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs font-bold text-white"
              />
              <input
                type="text"
                value={b.range}
                onChange={(e) => handleBracketChange(idx, 'range', e.target.value)}
                placeholder="Ej. 18 – 29 años"
                aria-label={`Rango edad ${idx + 1}`}
                className="sm:col-span-6 rounded-lg bg-stone-900 border border-orange-500/50 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs font-mono text-amber-300"
              />
              <button
                type="button"
                onClick={() => handleRemoveBracket(idx)}
                aria-label={`Quitar categoría ${idx + 1}`}
                className="sm:col-span-1 justify-self-end p-1.5 text-stone-400 hover:text-rose-400 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
