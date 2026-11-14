import React from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { interpolatePointAtKm } from '../../data/gpxTracks';

export default function AdminCircuitsTab({
  editDistance,
  onSelectDistance,
  activeCircuitDraft,
  activeTrack,
  circuitInputBorderClass,
  gpxStatus,
  onUpdateCircuitField,
  onStationChange,
  onAddStation,
  onRemoveStation,
  onGpxFileUpload,
  onClearCustomGpx,
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {['27K', '13K'].map((d) => {
          const active = editDistance === d;
          const colorClass = !active
            ? 'bg-stone-950 text-stone-300 border border-stone-600 hover:border-stone-400 hover:text-white'
            : d === '27K'
              ? 'bg-stone-950 text-cyan-400 border border-cyan-500 shadow-sm shadow-cyan-500/20'
              : 'bg-stone-950 text-red-500 border border-red-500 shadow-sm shadow-red-500/20';

          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelectDistance(d)}
              className={`px-4 py-2 rounded-xl font-display font-bold text-xs uppercase cursor-pointer transition-all ${colorClass}`}
            >
              Circuito {d}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Desnivel Positivo
          </label>
          <input
            type="text"
            value={activeCircuitDraft.elevationGain}
            onChange={(e) => onUpdateCircuitField(editDistance, 'elevationGain', e.target.value)}
            className={`w-full rounded-xl bg-stone-950 ${circuitInputBorderClass} px-3 py-2 text-sm text-white`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">Tiempo de Corte</label>
          <input
            type="text"
            value={activeCircuitDraft.cutoffTime}
            onChange={(e) => onUpdateCircuitField(editDistance, 'cutoffTime', e.target.value)}
            className={`w-full rounded-xl bg-stone-950 ${circuitInputBorderClass} px-3 py-2 text-sm text-white`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">Etiqueta Nivel</label>
          <input
            type="text"
            value={activeCircuitDraft.summaryBadge}
            onChange={(e) => onUpdateCircuitField(editDistance, 'summaryBadge', e.target.value)}
            className={`w-full rounded-xl bg-stone-950 ${circuitInputBorderClass} px-3 py-2 text-sm text-white`}
          />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Descripción del Circuito
          </label>
          <textarea
            rows={2}
            value={activeCircuitDraft.description}
            onChange={(e) => onUpdateCircuitField(editDistance, 'description', e.target.value)}
            className={`w-full rounded-xl bg-stone-950 ${circuitInputBorderClass} px-3 py-2 text-sm text-white`}
          />
        </div>
      </div>

      {/* Puestos de Hidratación dinámicos sobre el GPX */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="font-display text-sm font-bold text-white uppercase">
              Puestos de Hidratación (
              <span className={editDistance === '13K' ? 'text-red-500' : 'text-cyan-400'}>
                {editDistance}
              </span>
              )
            </h4>
            <p className="text-[11px] text-stone-400">
              Ingresá el kilómetro y se ubican automáticamente sobre la altura y mapa GPS real.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddStation}
            className={`inline-flex items-center gap-1 rounded-xl border text-xs font-bold px-3 py-1.5 cursor-pointer transition-colors ${
              editDistance === '13K'
                ? 'bg-black/40 hover:bg-red-500/10 text-red-500 border-red-500'
                : 'bg-black/40 hover:bg-cyan-500/10 text-cyan-400 border-cyan-400'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar Puesto
          </button>
        </div>

        <div className="space-y-2">
          {(activeCircuitDraft.hydrationStations || []).map((st, idx) => {
            const interp = interpolatePointAtKm(activeTrack.points, st.km);
            return (
              <div
                key={st.id || idx}
                className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-stone-900 p-2.5 rounded-xl border border-stone-800"
              >
                <div className="w-24 shrink-0">
                  <label className="block text-[10px] text-stone-400">KM</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={activeTrack.totalKm}
                    value={st.km}
                    onChange={(e) => onStationChange(idx, 'km', e.target.value)}
                    className={`w-full rounded-lg bg-stone-950 ${circuitInputBorderClass} px-2.5 py-1.5 text-xs font-mono text-white`}
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[10px] text-stone-400">Nombre del Puesto</label>
                  <input
                    type="text"
                    value={st.label}
                    onChange={(e) => onStationChange(idx, 'label', e.target.value)}
                    className={`w-full rounded-lg bg-stone-950 ${circuitInputBorderClass} px-2.5 py-1.5 text-xs text-white`}
                  />
                </div>
                <div
                  className={`text-[11px] font-mono px-2 whitespace-nowrap ${
                    editDistance === '13K' ? 'text-red-500' : 'text-cyan-400'
                  }`}
                >
                  {interp.alt} msnm
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveStation(idx)}
                  aria-label="Eliminar puesto"
                  className="p-2 text-stone-400 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cargar nuevo archivo .GPX */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-display text-sm font-bold text-white uppercase">
            Reemplazar Track .GPX (
            <span className={editDistance === '13K' ? 'text-red-500' : 'text-cyan-400'}>
              {editDistance}
            </span>
            )
          </h4>
          <p className="text-[11px] text-stone-400">
            Subí un archivo .gpx exportado de Garmin, COROS, Strava o Wikiloc para actualizar el
            mapa y la altimetría.
          </p>
          {gpxStatus && <p className="mt-1 text-xs text-amber-300 font-medium">{gpxStatus}</p>}
        </div>

        <div className="flex items-center gap-2">
          {activeCircuitDraft.customGpx && (
            <button
              type="button"
              onClick={onClearCustomGpx}
              className="rounded-xl bg-stone-800 hover:bg-stone-700 text-xs text-stone-200 px-3 py-2 cursor-pointer"
            >
              Usar GPX original
            </button>
          )}
          <label className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold px-3.5 py-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Subir archivo .GPX
            <input type="file" accept=".gpx" onChange={onGpxFileUpload} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
