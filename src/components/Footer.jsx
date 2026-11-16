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

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 border border-orange-500/80 hover:border-orange-400 text-orange-400 text-xs font-semibold px-4 py-3 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-orange-500" />
              Panel Admin
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-950 border border-orange-500/90 ring-1 ring-orange-500/70 ring-offset-2 ring-offset-zinc-950 active:scale-[0.99] text-orange-400 font-display font-semibold text-xs uppercase tracking-wider px-5 py-3 transition-all cursor-pointer"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            Quiero Inscribirme
          </button>
        </div>
      </div>
    </footer>
  );
}