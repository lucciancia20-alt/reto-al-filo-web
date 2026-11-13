import React from 'react';
import { Flame } from 'lucide-react';
import { RACE_CONFIG } from '../data/raceConfig';

export default function Footer({
  raceConfig = RACE_CONFIG,
  onOpenModal,
}) {
  return (
    <footer className="bg-stone-950 border-t border-stone-900 py-12 text-stone-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img
            src="/logo-raf.png"
            alt="Logo Reto al Filo"
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-md shrink-0"
          />
          <div>
            <p className="font-display font-black text-white text-sm uppercase">
              {raceConfig.title}
            </p>
            <p className="text-xs text-stone-400">
              10 de Abril de 2027 · {raceConfig.locationName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-bold text-xs uppercase tracking-wider px-5 py-3 transition-colors cursor-pointer"
          >
            <Flame className="w-4 h-4 fill-stone-950" />
            Quiero Inscribirme
          </button>
        </div>
      </div>
    </footer>
  );
}