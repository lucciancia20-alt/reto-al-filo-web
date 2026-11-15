import React, { useState, useEffect } from 'react';
import { Camera, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { RACE_CONFIG } from '../data/raceConfig';
import {
  fetchGalleryPhotos,
  filterDemoPhotos,
  getLocalCachedGalleryPhotos,
} from '../firebase/config';

export default function GallerySection() {
  const [photos, setPhotos] = useState(() => getLocalCachedGalleryPhotos() || []);
  const [isLoadingGallery, setIsLoadingGallery] = useState(
    () => !getLocalCachedGalleryPhotos()
  );
  const [selectedIndex, setSelectedIndex] = useState(null);
  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  useEffect(() => {
    let isCancelled = false;

    const loadPhotos = async () => {
      try {
        const result = await fetchGalleryPhotos();
        if (!isCancelled) {
          if (Array.isArray(result?.photos) && result.photos.length > 0) {
            setPhotos(result.photos);
          } else {
            setPhotos(filterDemoPhotos('', 1));
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingGallery(false);
        }
      }
    };

    loadPhotos();

    const handleGalleryUpdate = () => {
      loadPhotos();
    };
    window.addEventListener('reto-gallery-updated', handleGalleryUpdate);

    return () => {
      isCancelled = true;
      window.removeEventListener('reto-gallery-updated', handleGalleryUpdate);
    };
  }, []);

  // Cerrar lightbox con Escape, navegar con flechas y bloquear scroll del body
  useEffect(() => {
    if (selectedIndex === null) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedIndex(null);
      } else if (e.key === 'ArrowRight' && photos.length > 1) {
        setSelectedIndex((prev) => (prev + 1) % photos.length);
      } else if (e.key === 'ArrowLeft' && photos.length > 1) {
        setSelectedIndex((prev) => (prev - 1 + photos.length) % photos.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedIndex, photos.length]);

  // Precargar en segundo plano las fotos vecinas mientras el Lightbox está abierto
  useEffect(() => {
    if (selectedIndex === null || photos.length <= 1) return;
    const prevIdx = (selectedIndex - 1 + photos.length) % photos.length;
    const nextIdx = (selectedIndex + 1) % photos.length;
    [prevIdx, nextIdx].forEach((idx) => {
      const url = photos[idx]?.cloudinaryUrl;
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [selectedIndex, photos]);

  return (
    <section
      id="galeria"
      className="scroll-mt-16 py-8 sm:py-10 bg-stone-950 border-t-2 border-orange-500/50 relative"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Encabezado limpio de muestra fotográfica de la 1ra Edición */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-950 border border-orange-500/70 shadow-[0_0_12px_rgba(249,115,22,0.25)] px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-orange-400">
            <Camera className="w-3.5 h-3.5" />
            <span>Galería · 1ra Edición</span>
          </div>

          <h2 className="mt-2 text-balance font-display text-3xl md:text-4xl font-black text-white uppercase tracking-tight section-title-stroke">
            VIVÍ EL RETO: POSTALES DE LA{' '}
            <span className="whitespace-nowrap">
              1<sup className="lowercase text-sm md:text-base font-extrabold align-super -top-2 relative">ra</sup> EDICIÓN
            </span>
          </h2>

          <p className="mt-1.5 max-w-2xl mx-auto text-balance text-sm sm:text-base text-stone-300">
            Recorré los paisajes del Cerro Providencia, los senderos del filo y el paso de los
            corredores en nuestra edición inaugural.
          </p>
        </div>

        {/* Grilla Masonry de postales */}
        {isLoadingGallery && photos.length === 0 ? (
          <div
            aria-busy="true"
            aria-label="Cargando galería fotográfica"
            className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 min-h-[260px]"
          >
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="aspect-[4/3] w-full rounded-2xl bg-zinc-950 border border-orange-500/40 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 sm:mt-6 columns-1 sm:columns-2 lg:columns-3 gap-3.5 space-y-3.5">
            {photos.map((photo, idx) => (
              <article
                key={photo.id}
                role="button"
                tabIndex={0}
                aria-label={`Ampliar postal: ${photo.sector}`}
                onClick={() => setSelectedIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedIndex(idx);
                  }
                }}
                className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-stone-900 border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.22)] hover:border-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                <div className={`w-full overflow-hidden bg-stone-900 ${photo.aspectClass}`}>
                  <img
                    src={photo.cloudinaryThumb}
                    alt={`Postal de Reto al Filo — ${photo.sector}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.fallbackApplied) {
                        e.currentTarget.dataset.fallbackApplied = 'true';
                        e.currentTarget.src = RACE_CONFIG.heroImage;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Superposición discreta con ubicación y botón ampliar */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/15 to-transparent flex flex-col justify-between p-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIndex(idx);
                      }}
                      aria-label={`Ampliar postal: ${photo.sector}`}
                      className="w-8 h-8 rounded-full bg-zinc-900/35 hover:bg-zinc-900/55 backdrop-blur-md border border-orange-500/70 hover:border-orange-400 text-orange-400 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
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
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de fotografía"
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 overscroll-contain"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative w-fit h-fit min-w-[280px] min-h-[200px] max-w-[92vw] max-h-[85vh] flex items-center justify-center rounded-2xl overflow-hidden overscroll-contain border border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              aria-label="Cerrar vista previa"
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-zinc-900/45 backdrop-blur-md hover:bg-zinc-900/65 border border-orange-500/70 hover:border-orange-400 text-orange-400 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((prev) => (prev - 1 + photos.length) % photos.length)
                  }
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-zinc-900/45 backdrop-blur-md hover:bg-zinc-900/65 border border-orange-500/70 hover:border-orange-400 text-orange-400 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((prev) => (prev + 1) % photos.length)
                  }
                  aria-label="Foto siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-zinc-900/45 backdrop-blur-md hover:bg-zinc-900/65 border border-orange-500/70 hover:border-orange-400 text-orange-400 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <img
              src={selectedPhoto.cloudinaryUrl}
              alt={selectedPhoto.sector}
              className="block max-w-[92vw] max-h-[85vh] w-auto h-auto"
            />

            <div className="absolute bottom-0 inset-x-0 z-10 p-4 sm:p-5 bg-zinc-900/25 backdrop-blur-md border-t border-orange-500/20 flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                  1ra Edición · Reto al Filo
                </span>
                <p className="mt-0.5 text-sm sm:text-base font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                  {selectedPhoto.sector}
                </p>
              </div>
              {photos.length > 1 && (
                <span className="text-xs font-mono text-stone-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                  {selectedIndex + 1} / {photos.length}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
