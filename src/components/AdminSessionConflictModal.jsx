import React from 'react';
import { AlertTriangle, MonitorSmartphone, LogIn, X } from 'lucide-react';

/**
 * Modal de conflicto de sesión única activa.
 * Se muestra cuando hay otra sesión admin activa en otro dispositivo.
 */
export default function AdminSessionConflictModal({
  conflictInfo,
  onTakeover,
  onCancel,
}) {
  if (!conflictInfo) return null;

  const { deviceInfo, startedAt } = conflictInfo;
  const startedAtText = startedAt
    ? new Date(startedAt).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="Conflicto de sesión activa"
    >
      <div className="w-full max-w-sm rounded-2xl bg-stone-900 border border-amber-500/70 shadow-2xl flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <div>
            <h2 className="font-display text-sm font-semibold text-white uppercase tracking-wide">
              Sesión activa en otro equipo
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">Panel de Administración</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5">
            <MonitorSmartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200 leading-relaxed">
              Hay una sesión activa en{' '}
              <span className="font-semibold text-amber-300">{deviceInfo}</span>
              {startedAtText && (
                <> desde las <span className="font-semibold text-amber-300">{startedAtText}</span></>
              )}
              . Para evitar pisar cambios en vivo, cerrá la otra sesión o tomá el control desde este dispositivo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onTakeover}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-semibold text-sm uppercase tracking-wide py-3 cursor-pointer transition-colors shadow-lg shadow-amber-500/20"
          >
            <LogIn className="w-4 h-4" />
            Cerrar la otra sesión y entrar acá
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 border border-stone-700 hover:border-stone-500 text-stone-300 hover:text-white font-semibold text-sm py-2.5 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
