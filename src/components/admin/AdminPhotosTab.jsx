import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
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
  const deleteTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
        deleteTimerRef.current = null;
      }
    };
  }, []);

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Lugar o descripción breve (opcional)
            </label>
            <input
              type="text"
              value={photoSector}
              onChange={(e) => setPhotoSector(e.target.value)}
              placeholder="Ej. Cumbre Cerro Providencia · 1ra Edición"
              className="w-full rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs sm:text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Upload Preset (Unsigned en Cloudinary)
            </label>
            <input
              type="text"
              value={uploadPreset}
              onChange={(e) => setUploadPreset(e.target.value)}
              placeholder="reto_al_filo"
              className="w-full rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs sm:text-sm font-mono text-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              O pegar URL existente (opcional si subís archivo)
            </label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/..."
              className="w-full rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs sm:text-sm text-white"
            />
          </div>
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
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}
          >
            {photoStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
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
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl overflow-hidden bg-stone-900 border border-stone-800 flex flex-col"
              >
                <div className="relative aspect-[16/10] bg-stone-950 overflow-hidden">
                  <img
                    src={item.cloudinaryThumb}
                    alt={item.sector}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-orange-500 text-zinc-950 font-bold text-[10px] px-2 py-0.5 shadow-md">
                    ✓ Publicada en la web
                  </span>
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
    </div>
  );
}
