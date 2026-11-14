import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ResizableTextarea from './ResizableTextarea';

export default function AdminScheduleFaqTab({
  schedule,
  faqs,
  onScheduleChange,
  onAddSchedule,
  onRemoveSchedule,
  onFaqChange,
}) {
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
                rows={2}
                value={item.description}
                onChange={(e) => onScheduleChange(idx, 'description', e.target.value)}
                className="rounded-lg bg-zinc-900 border border-orange-500/70 focus:border-orange-400 focus:outline-none px-3 pt-1.5 text-xs text-stone-200"
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
                rows={3}
                value={faq.answer}
                onChange={(e) => onFaqChange(idx, 'answer', e.target.value)}
                className="rounded-lg bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 pt-1.5 text-xs text-stone-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
