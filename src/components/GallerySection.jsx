import React, { useState, useEffect } from 'react';
import {
  Camera,
  Search,
  Tag,
  Sparkles,
  RotateCcw,
  Maximize2,
  X,
  Database,
} from 'lucide-react';
import { RACE_CONFIG } from '../data/raceConfig';
import { searchPhotosByBib, filterDemoPhotos } from '../firebase/config';

export default function GallerySection() {
  const [bibInput, setBibInput] = useState('');
  const [photos, setPhotos] = useState(() => filterDemoPhotos('', 1));
  const [isSearching, setIsSearching] = useState(false);
  const [dataSource, setDataSource] = useState('demo-showcase');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Debounce de 350ms para evitar lecturas innecesarias en Firestore en cada pulsación
  useEffect(() => {
    const cleanInput = bibInput.trim();
    if (!cleanInput) {
      setPhotos(filterDemoPhotos('', 1));
      setDataSource('demo-showcase');
      setIsSearching(false);
      return undefined;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const result = await searchPhotosByBib(cleanInput, { edicion: 1 });
      setPhotos(result.photos);
      setDataSource(result.source);
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [bibInput]);

  return (
    <section
      id="galeria"
      className="py-16 sm:py-24 bg-stone-950 border-t border-stone-900 relative"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Encabezado de sección con contexto temporal de 1ra vs 2da Edición */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Camera className="w-3.5 h-3.5" />
            <span>Galería Fotográfica por Dorsal</span>
          </div>

          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Viví el Reto — Reviví la 1ra Edición
          </h2>

          <p className="mt-3 text-sm sm:text-base text-stone-300">
            Reviví las postales de cumbre de nuestra edición inaugural.{' '}
            <span className="text-amber-300 font-medium">
              Tras la carrera del 10 de abril de 2027, en este mismo buscador se habilitarán las
              fotos oficiales de la 2da Edición.
            </span>
          </p>
        </div>

        {/* Buscador interactivo por número de dorsal + Píldoras de filtro rápido */}
        <div className="mt-8 max-w-xl mx-auto">
          <div className="relative">
            <Search className="w-5 h-5 text-amber-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              inputMode="numeric"
              value={bibInput}
              onChange={(e) => setBibInput(e.target.value)}
              placeholder="Buscá tu foto por número de dorsal"
              aria-label="Buscá tu foto por número de dorsal"
              className="w-full rounded-2xl bg-stone-900 border border-stone-700 focus:border-amber-400 focus:outline-none py-4 pl-12 pr-24 text-sm sm:text-base text-white placeholder:text-stone-400 shadow-lg transition-colors"
            />
            {bibInput && (
              <button
                type="button"
                onClick={() => setBibInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-3 py-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>

          {/* Píldoras de prueba rápida (101, 205, 302) */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-stone-400 mr-1">Probar dorsal:</span>
              <button
                type="button"
                onClick={() => setBibInput('')}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  bibInput === ''
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-900 text-stone-300 border border-stone-800 hover:border-stone-700'
                }`}
              >
                Todos (6)
              </button>
              {RACE_CONFIG.quickBibs.map((bib) => {
                const isActive = bibInput.trim() === bib;
                return (
                  <button
                    key={bib}
                    type="button"
                    onClick={() => setBibInput(isActive ? '' : bib)}
                    className={`px-3 py-1 rounded-full font-mono font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-stone-900 text-amber-300 border border-stone-800 hover:border-amber-500/40'
                    }`}
                  >
                    #{bib}
                  </button>
                );
              })}
            </div>

            <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-400">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              {isSearching
                ? 'Buscando dorsal...'
                : dataSource === 'firestore'
                ? 'Firestore + Cloudinary Activo'
                : 'Edición 1 · Galería Demo Activa'}
            </span>
          </div>
        </div>

        {/* Grilla Masonry con las 6 imágenes de stock */}
        {photos.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-stone-900/60 border border-stone-800 p-10 text-center max-w-md mx-auto">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="mt-3 font-display text-xl font-bold text-white">
              Sin fotos para el dorsal #{bibInput.trim()}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-400">
              Probá con los dorsales de demostración <strong>101</strong>, <strong>205</strong> o{' '}
              <strong>302</strong> para verificar el filtrado interactivo.
            </p>
            <button
              type="button"
              onClick={() => setBibInput('')}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider px-4 py-2.5 cursor-pointer"
            >
              Ver todas las fotos
            </button>
          </div>
        ) : (
          <div className="mt-10 columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {photos.map((photo) => (
              <article
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-800/90 shadow-xl cursor-pointer"
              >
                <div className={`w-full overflow-hidden bg-stone-900 ${photo.aspectClass}`}>
                  <img
                    src={photo.cloudinaryThumb}
                    alt={`Corredor en ${photo.sector} — Dorsales ${photo.dorsales.join(', ')}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Superposición con badges de dorsal visibles */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent flex flex-col justify-between p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {photo.dorsales.map((dorsal) => (
                        <span
                          key={dorsal}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 text-stone-950 font-mono font-black text-xs px-2.5 py-1 shadow-md"
                        >
                          <Tag className="w-3 h-3" />#{dorsal}
                        </span>
                      ))}
                    </div>

                    <span className="w-8 h-8 rounded-lg bg-stone-950/75 text-stone-200 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      1ra Edición · Reto al Filo
                    </span>
                    <p className="text-sm font-bold text-white">{photo.sector}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Modal Lightbox de foto seleccionada */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-3xl overflow-hidden bg-stone-900 border border-stone-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Cerrar vista previa"
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-stone-950/80 text-white hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={selectedPhoto.cloudinaryUrl}
              alt={selectedPhoto.sector}
              className="w-full max-h-[75vh] object-cover"
            />

            <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-stone-950">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  1ra Edición · {selectedPhoto.sector}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-stone-400">Dorsales etiquetados:</span>
                  {selectedPhoto.dorsales.map((d) => (
                    <span
                      key={d}
                      className="font-mono text-xs font-bold bg-amber-500 text-stone-950 px-2 py-0.5 rounded"
                    >
                      #{d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
