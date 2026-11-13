import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Upload,
  Camera,
  Clock,
  MapPin,
  Droplets,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { GPX_TRACKS, interpolatePointAtKm, parseGpxXml } from '../data/gpxTracks';
import { addPhotoToFirestore, uploadImageToCloudinary } from '../firebase/config';

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || 'reto2027';
const DEFAULT_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const DEFAULT_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'reto_al_filo';

export default function AdminModal({
  isOpen,
  onClose,
  raceConfig,
  onSaveConfig,
  onResetConfig,
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [activeTab, setActiveTab] = useState('general');
  const [editDistance, setEditDistance] = useState('21K');
  const [draft, setDraft] = useState(() => structuredClone(raceConfig));

  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);
  const [gpxStatus, setGpxStatus] = useState('');

  // Estado para carga de nuevas fotos por dorsal en Cloudinary + Firestore
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadPreset, setUploadPreset] = useState(DEFAULT_UPLOAD_PRESET);
  const [photoBibs, setPhotoBibs] = useState('');
  const [photoSector, setPhotoSector] = useState('');
  const [photoEdition, setPhotoEdition] = useState(1);
  const [photoStatus, setPhotoStatus] = useState(null);
  const [photoStepMessage, setPhotoStepMessage] = useState('');
  const [photoSubmitting, setPhotoSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  useEffect(() => {
    if (isOpen) {
      setDraft(structuredClone(raceConfig));
      setSaveFeedback(null);
      setGpxStatus('');
    }
  }, [isOpen, raceConfig]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setUnlocked(true);
      setPinError('');
    } else {
      setPinError('Clave incorrecta. Verificá el PIN de organización.');
    }
  };

  const updateCircuitField = (distKey, field, value) => {
    setDraft((prev) => ({
      ...prev,
      circuits: {
        ...prev.circuits,
        [distKey]: {
          ...prev.circuits[distKey],
          [field]: value,
        },
      },
    }));
  };

  const handleStationChange = (index, field, value) => {
    setDraft((prev) => {
      const list = [...(prev.circuits[editDistance].hydrationStations || [])];
      list[index] = {
        ...list[index],
        [field]: field === 'km' ? Number(value) : value,
      };
      return {
        ...prev,
        circuits: {
          ...prev.circuits,
          [editDistance]: {
            ...prev.circuits[editDistance],
            hydrationStations: list,
          },
        },
      };
    });
  };

  const handleAddStation = () => {
    setDraft((prev) => {
      const list = [...(prev.circuits[editDistance].hydrationStations || [])];
      const nextNum = list.length + 1;
      list.push({
        id: `pa-${editDistance}-${Date.now()}`,
        km: editDistance === '21K' ? 10 : 5,
        label: `PA${nextNum} · Nuevo Puesto`,
      });
      return {
        ...prev,
        circuits: {
          ...prev.circuits,
          [editDistance]: {
            ...prev.circuits[editDistance],
            hydrationStations: list,
          },
        },
      };
    });
  };

  const handleRemoveStation = (index) => {
    setDraft((prev) => {
      const list = (prev.circuits[editDistance].hydrationStations || []).filter(
        (_, i) => i !== index
      );
      return {
        ...prev,
        circuits: {
          ...prev.circuits,
          [editDistance]: {
            ...prev.circuits[editDistance],
            hydrationStations: list,
          },
        },
      };
    });
  };

  const handleGpxFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGpxStatus('Procesando archivo GPX...');
    try {
      const xmlText = await file.text();
      const targetKm = editDistance === '21K' ? 21.0 : 10.0;
      const parsed = parseGpxXml(xmlText, targetKm);
      setDraft((prev) => ({
        ...prev,
        circuits: {
          ...prev.circuits,
          [editDistance]: {
            ...prev.circuits[editDistance],
            elevationGain: `+${parsed.elevationGain} m`,
            customGpx: parsed,
          },
        },
      }));
      setGpxStatus(
        `GPX cargado: ${parsed.points.length} puntos · ${parsed.rawTotalKm} km GPS · +${parsed.elevationGain} m D+`
      );
    } catch (err) {
      setGpxStatus(`Error al leer GPX: ${err.message}`);
    }
  };

  const handleClearCustomGpx = () => {
    const defaultGain = editDistance === '21K' ? '+1.532 m' : '+666 m';
    setDraft((prev) => ({
      ...prev,
      circuits: {
        ...prev.circuits,
        [editDistance]: {
          ...prev.circuits[editDistance],
          elevationGain: defaultGain,
          customGpx: null,
        },
      },
    }));
    setGpxStatus('Restaurado al track GPX oficial de COROS.');
  };

  const handleScheduleChange = (index, field, value) => {
    setDraft((prev) => {
      const next = [...prev.schedule];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, schedule: next };
    });
  };

  const handleAddSchedule = () => {
    setDraft((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        { time: '14:00 hs', title: 'Nuevo hito', tag: 'Predio', description: '' },
      ],
    }));
  };

  const handleRemoveSchedule = (index) => {
    setDraft((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  };

  const handleFaqChange = (index, field, value) => {
    setDraft((prev) => {
      const next = [...prev.faqs];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, faqs: next };
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveFeedback(null);
    const res = await onSaveConfig(draft);
    setSaving(false);

    if (res.persistedTo === 'firestore') {
      setSaveFeedback({
        type: 'success',
        message:
          'Cambios guardados en Firestore y aplicados en vivo para todos los corredores.',
      });
    } else if (res.errorCode === 'permission-denied') {
      setSaveFeedback({
        type: 'warning',
        message:
          'Guardado en este navegador (localStorage). Para sincronizar entre todos los celulares, habilitá las reglas de escritura para `settings/raceConfig` en Firebase Firestore.',
      });
    } else {
      setSaveFeedback({
        type: 'warning',
        message: 'Cambios aplicados y guardados localmente en este dispositivo.',
      });
    }
  };

  const handleReset = async () => {
    setSaving(true);
    await onResetConfig();
    setSaving(false);
    setSaveFeedback({
      type: 'success',
      message: 'Configuración restaurada a los valores originales del código.',
    });
  };

  const handleSelectPhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoStatus(null);
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    setPhotoSubmitting(true);
    setPhotoStatus(null);
    setPhotoStepMessage('');

    try {
      let finalUrl = photoUrl.trim();

      if (photoFile) {
        setPhotoStepMessage(
          `Subiendo imagen a Cloudinary (${DEFAULT_CLOUD_NAME || 'nube configurada'})...`
        );
        const uploaded = await uploadImageToCloudinary(photoFile, {
          cloudName: DEFAULT_CLOUD_NAME,
          uploadPreset,
        });
        finalUrl = uploaded.secureUrl;
      }

      if (!finalUrl) {
        throw new Error('Elegí una foto de tu dispositivo o pegá una URL de Cloudinary.');
      }

      setPhotoStepMessage('Guardando dorsal en Firestore...');
      const res = await addPhotoToFirestore({
        cloudinaryUrl: finalUrl,
        dorsales: photoBibs,
        sector: photoSector,
        edicion: Number(photoEdition),
      });

      setPhotoStatus({
        type: 'success',
        message: `¡Foto subida y publicada! (ID: ${res.id}) · Dorsales: #${res.dorsales.join(', #')}`,
      });
      setPhotoFile(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview('');
      setPhotoUrl('');
      setPhotoBibs('');
      setPhotoSector('');
    } catch (err) {
      setPhotoStatus({
        type: 'error',
        message: err.message || 'No se pudo subir la foto.',
      });
    } finally {
      setPhotoStepMessage('');
      setPhotoSubmitting(false);
    }
  };

  const activeCircuitDraft = draft.circuits[editDistance];
  const activeTrack = activeCircuitDraft.customGpx || GPX_TRACKS[editDistance];

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Panel de Administración Reto al Filo"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[88dvh] sm:h-[680px] max-h-[92dvh] rounded-3xl bg-stone-900 border border-stone-700 shadow-2xl flex flex-col overflow-hidden text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="px-4 sm:px-5 py-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-display text-lg font-black text-white uppercase">
                Panel de Organización · Reto al Filo
              </h2>
              <p className="text-xs text-stone-400">
                Editá horarios, puestos de hidratación, GPX y fotos sin tocar código
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de administración"
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!unlocked ? (
          <form onSubmit={handleUnlock} className="my-auto p-8 max-w-sm mx-auto w-full text-center">
            <Lock className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="mt-3 font-display text-xl font-extrabold text-white">
              Acceso Restringido
            </h3>
            <p className="mt-1.5 text-xs text-stone-400">
              Ingresá el PIN de organizador para editar la carrera en vivo.
            </p>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN de organizador"
              autoFocus
              className="mt-5 w-full rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-400 focus:outline-none px-4 py-3 text-center text-white font-mono tracking-widest"
            />
            {pinError && <p className="mt-2 text-xs text-rose-400">{pinError}</p>}
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-black uppercase text-sm py-3 cursor-pointer"
            >
              Ingresar al Panel
            </button>
          </form>
        ) : (
          <>
            {/* Navegación por pestañas del Admin */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-stone-950/90 border-b border-stone-800 shrink-0">
              {[
                { id: 'general', label: 'General & Contacto', icon: MapPin },
                { id: 'circuits', label: 'Circuitos & GPX', icon: Droplets },
                { id: 'schedule_faq', label: 'Horarios & FAQ', icon: Clock },
                { id: 'photos', label: 'Fotos por Dorsal', icon: Camera },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                        : 'bg-stone-900 text-stone-300 border border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Título de la Carrera
                    </label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Subtítulo / Mes y Año
                    </label>
                    <input
                      type="text"
                      value={draft.subtitle}
                      onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Fecha y Hora Largada (Formato ISO)
                    </label>
                    <input
                      type="text"
                      value={draft.targetDateIso}
                      onChange={(e) => setDraft({ ...draft, targetDateIso: e.target.value })}
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 px-3.5 py-2.5 text-sm font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Número WhatsApp Inscripciones (con código país)
                    </label>
                    <input
                      type="text"
                      value={draft.whatsappNumber}
                      onChange={(e) => setDraft({ ...draft, whatsappNumber: e.target.value })}
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 px-3.5 py-2.5 text-sm font-mono text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Nombre del Predio / Localidad
                    </label>
                    <input
                      type="text"
                      value={draft.locationName}
                      onChange={(e) => setDraft({ ...draft, locationName: e.target.value })}
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      URL de Google Maps del Predio
                    </label>
                    <input
                      type="url"
                      value={draft.googleMapsUrl}
                      onChange={(e) => setDraft({ ...draft, googleMapsUrl: e.target.value })}
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 px-3.5 py-2.5 text-sm font-mono text-white"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'circuits' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    {['21K', '10K'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setEditDistance(d);
                          setGpxStatus('');
                        }}
                        className={`px-4 py-2 rounded-xl font-display font-bold text-xs uppercase cursor-pointer ${
                          editDistance === d
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-stone-950 text-stone-300 border border-stone-800'
                        }`}
                      >
                        Circuito {d}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Desnivel Positivo
                      </label>
                      <input
                        type="text"
                        value={activeCircuitDraft.elevationGain}
                        onChange={(e) =>
                          updateCircuitField(editDistance, 'elevationGain', e.target.value)
                        }
                        className="w-full rounded-xl bg-stone-950 border border-stone-700 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Tiempo de Corte
                      </label>
                      <input
                        type="text"
                        value={activeCircuitDraft.cutoffTime}
                        onChange={(e) =>
                          updateCircuitField(editDistance, 'cutoffTime', e.target.value)
                        }
                        className="w-full rounded-xl bg-stone-950 border border-stone-700 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Etiqueta Nivel
                      </label>
                      <input
                        type="text"
                        value={activeCircuitDraft.summaryBadge}
                        onChange={(e) =>
                          updateCircuitField(editDistance, 'summaryBadge', e.target.value)
                        }
                        className="w-full rounded-xl bg-stone-950 border border-stone-700 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Descripción del Circuito
                      </label>
                      <textarea
                        rows={2}
                        value={activeCircuitDraft.description}
                        onChange={(e) =>
                          updateCircuitField(editDistance, 'description', e.target.value)
                        }
                        className="w-full rounded-xl bg-stone-950 border border-stone-700 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  {/* Puestos de Hidratación dinámicos sobre el GPX */}
                  <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="font-display text-sm font-bold text-white uppercase">
                          Puestos de Hidratación ({editDistance})
                        </h4>
                        <p className="text-[11px] text-stone-400">
                          Ingresá el kilómetro y se ubican automáticamente sobre la altura y mapa
                          GPS real.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddStation}
                        className="inline-flex items-center gap-1 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold px-3 py-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Puesto
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(activeCircuitDraft.hydrationStations || []).map((st, idx) => {
                        const interp = interpolatePointAtKm(activeTrack.points, st.km);
                        return (
                          <div
                            key={st.id || idx}
                            className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-stone-900 p-2.5 rounded-xl border border-stone-800"
                          >
                            <div className="w-24 shrink-0">
                              <label className="block text-[10px] text-stone-400">KM</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max={activeTrack.totalKm}
                                value={st.km}
                                onChange={(e) => handleStationChange(idx, 'km', e.target.value)}
                                className="w-full rounded-lg bg-stone-950 border border-stone-700 px-2.5 py-1.5 text-xs font-mono text-white"
                              />
                            </div>
                            <div className="flex-1 min-w-[140px]">
                              <label className="block text-[10px] text-stone-400">
                                Nombre del Puesto
                              </label>
                              <input
                                type="text"
                                value={st.label}
                                onChange={(e) => handleStationChange(idx, 'label', e.target.value)}
                                className="w-full rounded-lg bg-stone-950 border border-stone-700 px-2.5 py-1.5 text-xs text-white"
                              />
                            </div>
                            <div className="text-[11px] font-mono text-sky-300 px-2 whitespace-nowrap">
                              {interp.alt} msnm
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveStation(idx)}
                              aria-label="Eliminar puesto"
                              className="p-2 text-stone-400 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cargar nuevo archivo .GPX */}
                  <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="font-display text-sm font-bold text-white uppercase">
                        Reemplazar Track .GPX ({editDistance})
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        Subí un archivo .gpx exportado de Garmin, COROS, Strava o Wikiloc para
                        actualizar el mapa y la altimetría.
                      </p>
                      {gpxStatus && (
                        <p className="mt-1 text-xs text-amber-300 font-medium">{gpxStatus}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {activeCircuitDraft.customGpx && (
                        <button
                          type="button"
                          onClick={handleClearCustomGpx}
                          className="rounded-xl bg-stone-800 hover:bg-stone-700 text-xs text-stone-200 px-3 py-2 cursor-pointer"
                        >
                          Usar GPX original
                        </button>
                      )}
                      <label className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold px-3.5 py-2 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Subir archivo .GPX
                        <input
                          type="file"
                          accept=".gpx"
                          onChange={handleGpxFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'schedule_faq' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-display text-sm font-bold text-white uppercase">
                        Cronograma del Día de Carrera
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddSchedule}
                        className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Horario
                      </button>
                    </div>

                    <div className="space-y-3">
                      {draft.schedule.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-2.5"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              value={item.time}
                              onChange={(e) => handleScheduleChange(idx, 'time', e.target.value)}
                              placeholder="06:00 hs"
                              className="sm:col-span-3 rounded-lg bg-stone-900 border border-stone-700 px-3 py-1.5 text-xs font-mono text-amber-300"
                            />
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleScheduleChange(idx, 'title', e.target.value)}
                              placeholder="Título"
                              className="sm:col-span-5 rounded-lg bg-stone-900 border border-stone-700 px-3 py-1.5 text-xs font-bold text-white"
                            />
                            <input
                              type="text"
                              value={item.tag}
                              onChange={(e) => handleScheduleChange(idx, 'tag', e.target.value)}
                              placeholder="Lugar"
                              className="sm:col-span-3 rounded-lg bg-stone-900 border border-stone-700 px-3 py-1.5 text-xs text-stone-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSchedule(idx)}
                              aria-label="Quitar horario"
                              className="sm:col-span-1 justify-self-end p-1.5 text-stone-400 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={item.description}
                            onChange={(e) =>
                              handleScheduleChange(idx, 'description', e.target.value)
                            }
                            className="w-full rounded-lg bg-stone-900 border border-stone-700 px-3 py-1.5 text-xs text-stone-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display text-sm font-bold text-white uppercase mb-3">
                      Preguntas Frecuentes (FAQ)
                    </h4>
                    <div className="space-y-3">
                      {draft.faqs.map((faq, idx) => (
                        <div
                          key={faq.id}
                          className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-2"
                        >
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                            className="w-full rounded-lg bg-stone-900 border border-stone-700 px-3 py-1.5 text-xs font-bold text-white"
                          />
                          <textarea
                            rows={3}
                            value={faq.answer}
                            onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                            className="w-full rounded-lg bg-stone-900 border border-stone-700 px-3 py-1.5 text-xs text-stone-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'photos' && (
                <form
                  id="admin-photo-form"
                  onSubmit={handleAddPhoto}
                  className="rounded-2xl bg-stone-950 border border-stone-800 p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display text-base font-bold text-white uppercase">
                        Subir Foto Directa a Cloudinary + Firestore
                      </h4>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Elegí una imagen desde tu celular o PC (se sube a tu nube{' '}
                        <span className="font-mono text-amber-300">
                          {DEFAULT_CLOUD_NAME || 'no configurada'}
                        </span>
                        ) o pegá un link existente y etiquetá los dorsales.
                      </p>
                    </div>
                  </div>

                  {/* Selector de archivo local */}
                  <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/60 p-4 flex flex-col sm:flex-row items-center gap-4">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Vista previa de foto seleccionada"
                        className="w-24 h-24 rounded-xl object-cover border border-stone-700 shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-stone-500 shrink-0">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}

                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-xs font-semibold text-stone-200">
                        {photoFile
                          ? `Archivo seleccionado: ${photoFile.name}`
                          : 'Seleccioná una foto (.jpg, .png, .webp) desde tu dispositivo'}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Se optimiza y almacena automáticamente en la carpeta{' '}
                        <span className="font-mono">reto-al-filo</span>.
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <label className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-bold text-xs uppercase tracking-wider px-4 py-2 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          {photoFile ? 'Cambiar Foto' : 'Elegir Foto del Celular/PC'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSelectPhotoFile}
                            className="hidden"
                          />
                        </label>
                        {photoFile && (
                          <button
                            type="button"
                            onClick={() => {
                              if (photoPreview) URL.revokeObjectURL(photoPreview);
                              setPhotoFile(null);
                              setPhotoPreview('');
                            }}
                            className="text-xs text-stone-400 hover:text-stone-200 px-2 py-1 cursor-pointer"
                          >
                            Quitar archivo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Upload Preset (Unsigned en Cloudinary)
                      </label>
                      <input
                        type="text"
                        value={uploadPreset}
                        onChange={(e) => setUploadPreset(e.target.value)}
                        placeholder="reto_al_filo"
                        className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2.5 text-sm font-mono text-amber-300"
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
                        className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Números de Dorsal (separados por coma)
                      </label>
                      <input
                        type="text"
                        required
                        value={photoBibs}
                        onChange={(e) => setPhotoBibs(e.target.value)}
                        placeholder="101, 205"
                        className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2.5 text-sm font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Sector del Circuito
                      </label>
                      <input
                        type="text"
                        value={photoSector}
                        onChange={(e) => setPhotoSector(e.target.value)}
                        placeholder="Cumbre El Filo · KM 12"
                        className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Edición
                      </label>
                      <select
                        value={photoEdition}
                        onChange={(e) => setPhotoEdition(Number(e.target.value))}
                        className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2.5 text-sm text-white"
                      >
                        <option value={1}>1ra Edición (2026)</option>
                        <option value={2}>2da Edición (Abril 2027)</option>
                      </select>
                    </div>
                  </div>

                  {photoStepMessage && (
                    <div className="p-3 rounded-xl text-xs bg-amber-500/15 text-amber-200 border border-amber-500/30">
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
              )}

              {saveFeedback && activeTab !== 'photos' && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    saveFeedback.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                  }`}
                >
                  {saveFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{saveFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Footer fijo con altura constante en todas las pestañas */}
            <div className="px-4 sm:px-5 py-3.5 bg-stone-950 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {activeTab === 'photos' ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold px-4 py-2.5 cursor-pointer"
                  >
                    Cerrar Panel
                  </button>

                  <button
                    type="submit"
                    form="admin-photo-form"
                    disabled={photoSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider px-6 py-3 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    {photoSubmitting ? 'Subiendo y publicando...' : 'Subir y Publicar Foto'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold px-4 py-2.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurar valores originales
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider px-6 py-3 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar Cambios en Vivo'}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
