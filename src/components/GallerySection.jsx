import React, { useState, useEffect } from 'react';
import { Camera, Maximize2, X } from 'lucide-react';
import { RACE_CONFIG } from '../data/raceConfig';
import { fetchGalleryPhotos, filterDemoPhotos } from '../firebase/config';

export default function GallerySection() {
  const [photos, setPhotos] = useState(() => filterDemoPhotos('', 1));
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const loadPhotos = async () => {
      const result = await fetchGalleryPhotos();
      if (!isCancelled && Array.isArray(result?.photos) && result.photos.length > 0) {
        setPhotos(result.photos);
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

  // Cerrar lightbox con tecla Escape y bloquear scroll del body
  useEffect(() => {
    if (!selectedPhoto) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedPhoto]);

  return (
    <section
      id="galeria"
      className="py-8 sm:py-10 bg-stone-950 border-t-2 border-orange-500/50 relative"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Encabezado limpio de muestra fotográfica de la 1ra Edición */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.25)] px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Camera className="w-3.5 h-3.5" />
            <span>Galería · 1ra Edición</span>
          </div>

          <h2 className="mt-2 text-balance font-display text-3xl md:text-4xl font-black text-white uppercase tracking-tight drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
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
        <div className="mt-5 sm:mt-6 columns-1 sm:columns-2 lg:columns-3 gap-3.5 space-y-3.5">
          {photos.map((photo) => (
            <article
              key={photo.id}
              role="button"
              tabIndex={0}
              aria-label={`Ampliar postal: ${photo.sector}`}
              onClick={() => setSelectedPhoto(photo)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPhoto(photo);
                }
              }}
              className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-stone-900 border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.22)] hover:border-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
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
      </div>

      {/* Modal Lightbox de foto seleccionada */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de fotografía"
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 overscroll-contain"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-3xl overflow-hidden overscroll-contain bg-stone-900 border border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.3)]"
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
              className="w-full max-h-[78vh] object-contain bg-stone-950"
            />

            <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                1ra Edición · Reto al Filo
              </span>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-white">
                {selectedPhoto.sector}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
