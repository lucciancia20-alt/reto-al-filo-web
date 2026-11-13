import React, { useEffect, useState } from 'react';
import { X, MessageCircle, Mountain, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { RACE_CONFIG, buildWhatsAppUrl } from '../data/raceConfig';

export default function RegistrationModal({ isOpen, onClose, initialDistance = '21K' }) {
  const [selectedDistance, setSelectedDistance] = useState(initialDistance);

  useEffect(() => {
    setSelectedDistance(initialDistance);
  }, [initialDistance, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const distances = [
    {
      id: '21K',
      title: '21K Competitivo',
      elevation: '+1.150 m D+',
      details: '4 Puestos de Hidratación · Corte 5 hs',
    },
    {
      id: '10K',
      title: '10K Montaña',
      elevation: '+480 m D+',
      details: '2 Puestos de Hidratación · Corte 3 hs',
    },
  ];

  const whatsappHref = buildWhatsAppUrl(selectedDistance);
  const previewMessage = `Hola! Quiero inscribirme al Reto al Filo - 2da Edición en la distancia de ${selectedDistance}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-inscripcion-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-stone-900 border border-stone-700/90 p-5 sm:p-6 shadow-2xl text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Mountain className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Inscripción Directa · Abril 2027
              </span>
              <h3
                id="modal-inscripcion-title"
                className="font-display text-xl font-extrabold text-white"
              >
                Elegí tu Distancia
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de inscripción"
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-xs sm:text-sm text-stone-300">
          Seleccioná la distancia en la que querés participar para iniciar tu inscripción con la
          organización vía WhatsApp:
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {distances.map((item) => {
            const active = selectedDistance === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDistance(item.id)}
                className={`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer flex items-center justify-between ${
                  active
                    ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                    : 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-black text-white">
                      {item.title}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-stone-800 text-amber-400">
                      {item.elevation}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-300">{item.details}</p>
                </div>

                <CheckCircle2
                  className={`w-6 h-6 shrink-0 transition-colors ${
                    active ? 'text-amber-400' : 'text-stone-700'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Vista previa del mensaje pre-armado */}
        <div className="mt-4 rounded-xl bg-stone-950 border border-stone-800 p-3">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Mensaje pre-armado para WhatsApp (+{RACE_CONFIG.whatsappNumber}):
          </span>
          <p className="mt-1 text-xs text-stone-200 italic">"{previewMessage}"</p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-display font-black text-sm sm:text-base uppercase tracking-wider py-4 px-5 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-stone-950" />
            Continuar por WhatsApp ({selectedDistance})
            <ArrowUpRight className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
