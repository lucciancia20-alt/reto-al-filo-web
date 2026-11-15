import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminPhotosTab({
  defaultCloudName,
  photoFiles,
  photoPreviews,
  photoUrl,
  setPhotoUrl,
  uploadPreset,
  setUploadPreset,
  photoSector,
  setPhotoSector,
  photoStatus,
  photoStepMessage,
  photoSubmitting,
  galleryItems,
  galleryCustomCount,
  galleryLoading,
  photoBusyId,
  onSelectPhotoFiles,
  onClearSelectedPhotos,
  onAddPhoto,
  onLoadGalleryItems,
  onDeleteGalleryPhoto,
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);
  const deleteTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
        deleteTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (previewIndex === null) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPreviewIndex(null);
      } else if (e.key === 'ArrowRight' && galleryItems.length > 1) {
        setPreviewIndex((prev) => (prev + 1) % galleryItems.length);
      } else if (e.key === 'ArrowLeft' && galleryItems.length > 1) {
        setPreviewIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewIndex, galleryItems.length]);

  const handlePhotoDeleteClick = (item) => {
    if (confirmDeleteId !== item.id) {
      setConfirmDeleteId(item.id);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => {
        setConfirmDeleteId(null);
        deleteTimerRef.current = null;
      }, 3000);
      return;
    }

    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setConfirmDeleteId(null);
    onDeleteGalleryPhoto(item);
  };

  return (
    <div className="space-y-3">
      <form
        id="admin-photo-form"
        onSubmit={onAddPhoto}
        className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 sm:p-4 space-y-2.5"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="font-display text-base font-bold text-white uppercase">
              Subir Fotos de Muestra · 1ra Edición
            </h4>
            <p className="text-xs text-stone-400 mt-0.5">
              Elegí una o varias fotos juntas desde tu celular o PC (se suben a tu nube{' '}
              <span className="font-mono text-orange-400">
                {defaultCloudName || 'no configurada'}
              </span>
              ). Apenas subas tu primera foto, reemplazará las de demostración.
            </p>
          </div>
        </div>

        {/* Selector de uno o múltiples archivos */}
        <div className="rounded-xl border border-dashed border-stone-700 bg-stone-900/60 px-3.5 py-3 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-stone-400 shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-200">
                  {photoFiles.length > 0
                    ? `${photoFiles.length} ${photoFiles.length === 1 ? 'foto lista para subir' : 'fotos listas para subir'}`
                    : 'Seleccioná una o varias fotos (.jpg, .png, .webp) de paisajes o corredores'}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Se optimizan y guardan en la carpeta{' '}
                  <span className="font-mono">reto-al-filo/galeria</span>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <label className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 text-orange-400 border border-orange-500/70 hover:border-orange-400 font-display font-bold text-xs uppercase tracking-wider px-3.5 py-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-orange-500" />
                {photoFiles.length > 0 ? 'Cambiar Fotos' : 'Elegir Fotos'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onSelectPhotoFiles}
                  className="hidden"
                />
              </label>
              {photoFiles.length > 0 && (
                <button
                  type="button"
                  onClick={onClearSelectedPhotos}
                  className="text-xs text-stone-400 hover:text-stone-200 px-2 py-1.5 cursor-pointer"
                >
                  Quitar todas
                </button>
              )}
            </div>
          </div>

          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
              {photoPreviews.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="relative aspect-square rounded-xl overflow-hidden border border-stone-700 bg-stone-950"
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {(photoFiles.length > 0 || photoUrl.trim().length > 0) && (
          <button
            type="submit"
            disabled={photoSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider px-5 py-3 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {photoSubmitting
              ? 'Subiendo y publicando...'
              : `Subir y Publicar ahora (${photoFiles.length || 1})`}
          </button>
        )}

        {photoStepMessage && (
          <div className="p-3 rounded-xl text-xs bg-orange-500/15 text-orange-200 border border-orange-500/30">
            {photoStepMessage}
          </div>
        )}

        {photoStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              photoStatus.type === 'success'
                ? 'bg-zinc-950 text-orange-400 border border-orange-500/70'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}
          >
            {photoStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{photoStatus.message}</span>
          </div>
        )}
      </form>

      {/* Fotos publicadas en la galería */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-display text-sm font-bold text-white uppercase">
              Postales publicadas actualmente ({galleryCustomCount > 0 ? galleryCustomCount : '6 de muestra'})
            </h4>
            <p
              className={`text-[11px] mt-0.5 ${
                galleryCustomCount > 0 ? 'text-orange-400 font-medium' : 'text-stone-400'
              }`}
            >
              {galleryCustomCount > 0
                ? 'Estas fotos ya están cargadas en Cloudinary/Firestore y visibles en vivo en la web. No necesitás volver a subirlas.'
                : 'Todavía no subiste fotos propias. Mientras tanto la web muestra las 6 postales iniciales de demostración.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onLoadGalleryItems}
            disabled={galleryLoading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 border border-orange-500/70 hover:border-orange-400 text-orange-400 text-xs font-semibold px-3 py-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-orange-500 ${galleryLoading ? 'animate-spin' : ''}`}
            />
            Actualizar
          </button>
        </div>

        {galleryCustomCount > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryItems.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-xl overflow-hidden bg-stone-900 border border-stone-800 flex flex-col"
              >
                <div
                  onClick={() => setPreviewIndex(idx)}
                  className="relative aspect-[16/10] bg-stone-950 overflow-hidden cursor-pointer group"
                >
                  <img
                    src={item.cloudinaryThumb}
                    alt={item.sector}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-orange-500 text-zinc-950 font-bold text-[10px] px-2 py-0.5 shadow-md">
                    ✓ Publicada en la web
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewIndex(idx);
                    }}
                    aria-label={`Ampliar postal ${item.sector}`}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-zinc-900/35 hover:bg-zinc-900/55 backdrop-blur-md border border-orange-500/70 hover:border-orange-400 text-orange-400 flex items-center justify-center cursor-pointer transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-200 truncate">{item.sector}</span>
                  <button
                    type="button"
                    disabled={photoBusyId === item.id}
                    onClick={() => handlePhotoDeleteClick(item)}
                    aria-label={
                      confirmDeleteId === item.id
                        ? `Confirmar eliminación de postal ${item.sector}`
                        : `Eliminar postal ${item.sector}`
                    }
                    className={`rounded-lg cursor-pointer shrink-0 transition-colors disabled:opacity-40 ${
                      confirmDeleteId === item.id
                        ? 'px-2 py-1 text-[10px] font-bold bg-zinc-950 border border-red-500 text-red-400'
                        : 'p-1.5 text-stone-400 hover:text-red-500 hover:bg-stone-800'
                    }`}
                  >
                    {confirmDeleteId === item.id ? '¿Borrar?' : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewIndex !== null && galleryItems[previewIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de fotografía"
          className="fixed inset-0 z-[70] bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 overscroll-contain"
          onClick={() => setPreviewIndex(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-3xl overflow-hidden overscroll-contain bg-stone-900 border border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              aria-label="Cerrar vista previa"
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-zinc-950/85 border border-orange-500/70 hover:border-orange-400 text-orange-400 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {galleryItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length)
                  }
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-zinc-950/85 border border-orange-500/70 hover:border-orange-400 text-orange-400 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewIndex((prev) => (prev + 1) % galleryItems.length)
                  }
                  aria-label="Foto siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-zinc-950/85 border border-orange-500/70 hover:border-orange-400 text-orange-400 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <img
              src={galleryItems[previewIndex].cloudinaryUrl || galleryItems[previewIndex].cloudinaryThumb}
              alt={galleryItems[previewIndex].sector}
              className="w-full max-h-[78vh] object-contain bg-stone-950"
            />

            <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  1ra Edición · Reto al Filo
                </span>
                <p className="mt-0.5 text-sm sm:text-base font-bold text-white">
                  {galleryItems[previewIndex].sector}
                </p>
              </div>
              {galleryItems.length > 1 && (
                <span className="text-xs font-mono text-stone-400">
                  {previewIndex + 1} / {galleryItems.length}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
