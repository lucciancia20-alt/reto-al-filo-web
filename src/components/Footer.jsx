import React from 'react';
import { Flame, Settings } from 'lucide-react';
import { RACE_CONFIG } from '../data/raceConfig';

export default function Footer({
  raceConfig = RACE_CONFIG,
  onOpenModal,
  onOpenAdmin,
}) {
  return (
    <footer className="bg-stone-950 border-t-2 border-orange-500/50 py-6 sm:py-8 text-stone-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-orange-400 border border-orange-500/60 hover:border-orange-400 text-xs font-semibold px-4 py-3 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-orange-400" />
              Panel Admin
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-display font-bold text-xs uppercase tracking-wider px-5 py-3 transition-colors cursor-pointer"
          >
            <Flame className="w-4 h-4 fill-zinc-950" />
            Quiero Inscribirme
          </button>
        </div>
      </div>
    </footer>
  );
}