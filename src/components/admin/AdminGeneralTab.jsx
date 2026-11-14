import React from 'react';
import { Landmark } from 'lucide-react';

export default function AdminGeneralTab({
  draft,
  setDraft,
  onUpdateCircuitField,
  onUpdatePaymentField,
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Título de la Carrera
          </label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="w-full rounded-xl bg-stone-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Subtítulo / Mes y Año
          </label>
          <input
            type="text"
            value={draft.subtitle}
            onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
            className="w-full rounded-xl bg-stone-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Fecha y Hora Largada (Formato ISO)
          </label>
          <input
            type="text"
            value={draft.targetDateIso}
            onChange={(e) => setDraft({ ...draft, targetDateIso: e.target.value })}
            className="w-full rounded-xl bg-stone-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3.5 py-2.5 text-sm font-mono text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Número WhatsApp Inscripciones (con código país)
          </label>
          <input
            type="text"
            value={draft.whatsappNumber}
            onChange={(e) => setDraft({ ...draft, whatsappNumber: e.target.value })}
            className="w-full rounded-xl bg-stone-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3.5 py-2.5 text-sm font-mono text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Nombre del Predio / Localidad
          </label>
          <input
            type="text"
            value={draft.locationName}
            onChange={(e) => setDraft({ ...draft, locationName: e.target.value })}
            className="w-full rounded-xl bg-stone-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            URL de Google Maps del Predio
          </label>
          <input
            type="url"
            value={draft.googleMapsUrl}
            onChange={(e) => setDraft({ ...draft, googleMapsUrl: e.target.value })}
            className="w-full rounded-xl bg-stone-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3.5 py-2.5 text-sm font-mono text-white"
          />
        </div>
      </div>

      {/* Precios y Datos Bancarios de Inscripción */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <h4 className="font-display text-sm font-bold text-white uppercase">
              Valores y Cuenta Bancaria para Inscripciones
            </h4>
            <p className="text-[11px] text-stone-400">
              Estos datos se muestran dentro del formulario de inscripción web antes de subir el
              comprobante.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Valor Inscripción <span className="text-cyan-400 font-bold">27K</span>
            </label>
            <input
              type="text"
              value={draft.circuits?.['27K']?.price || ''}
              onChange={(e) => onUpdateCircuitField('27K', 'price', e.target.value)}
              placeholder="$45.000"
              className="w-full rounded-xl bg-stone-900 border border-cyan-500 focus:border-cyan-400 focus:outline-none px-3.5 py-2 text-sm font-bold text-cyan-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Valor Inscripción <span className="text-red-500 font-bold">13K</span>
            </label>
            <input
              type="text"
              value={draft.circuits?.['13K']?.price || ''}
              onChange={(e) => onUpdateCircuitField('13K', 'price', e.target.value)}
              placeholder="$32.000"
              className="w-full rounded-xl bg-stone-900 border border-red-500 focus:border-red-500 focus:outline-none px-3.5 py-2 text-sm font-bold text-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Alias (Banco / Mercado Pago)
            </label>
            <input
              type="text"
              value={draft.payment?.bankAlias || ''}
              onChange={(e) => onUpdatePaymentField('bankAlias', e.target.value)}
              placeholder="RETO.AL.FILO"
              className="w-full rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3.5 py-2 text-sm font-mono text-amber-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">CBU / CVU</label>
            <input
              type="text"
              value={draft.payment?.bankCbu || ''}
              onChange={(e) => onUpdatePaymentField('bankCbu', e.target.value)}
              placeholder="0000003100000000000000"
              className="w-full rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3.5 py-2 text-sm font-mono text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Titular de la Cuenta
            </label>
            <input
              type="text"
              value={draft.payment?.bankHolder || ''}
              onChange={(e) => onUpdatePaymentField('bankHolder', e.target.value)}
              placeholder="Organización Reto al Filo"
              className="w-full rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3.5 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Banco / Billetera
            </label>
            <input
              type="text"
              value={draft.payment?.bankEntity || ''}
              onChange={(e) => onUpdatePaymentField('bankEntity', e.target.value)}
              placeholder="Mercado Pago / Banco Provincia"
              className="w-full rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3.5 py-2 text-sm text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Instrucciones para el Corredor
            </label>
            <textarea
              rows={2}
              value={draft.payment?.instructions || ''}
              onChange={(e) => onUpdatePaymentField('instructions', e.target.value)}
              className="w-full rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3.5 py-2 text-xs text-stone-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
