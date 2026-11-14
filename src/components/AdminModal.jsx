import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Lock,
  Save,
  RotateCcw,
  Camera,
  Clock,
  MapPin,
  Droplets,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShieldCheck,
  Users,
  RefreshCw,
} from 'lucide-react';
import { GPX_TRACKS, parseGpxXml } from '../data/gpxTracks';
import {
  addPhotoToFirestore,
  fetchGalleryPhotos,
  deletePhotoFromFirestore,
  uploadImageToCloudinary,
  subscribeToAdminAuth,
  signInAdminWithGoogle,
  signInAdminWithEmail,
  sendAdminPasswordReset,
  signOutAdmin,
  isFirebaseConfigured,
  fetchRegistrations,
  updateRegistrationStatus,
  deleteRegistrationRecord,
} from '../firebase/config';
import AdminLoginView from './admin/AdminLoginView';
import AdminGeneralTab from './admin/AdminGeneralTab';
import AdminCircuitsTab from './admin/AdminCircuitsTab';
import AdminScheduleFaqTab from './admin/AdminScheduleFaqTab';
import AdminPhotosTab from './admin/AdminPhotosTab';
import AdminRegistrationsTab from './admin/AdminRegistrationsTab';

const DEFAULT_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const DEFAULT_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'reto_al_filo';

const sanitizeExcelCell = (value) => {
  const str = String(value ?? '');
  return /^\s*[=+\-@]/.test(str) ? `'${str}` : str;
};

export default function AdminModal({
  isOpen,
  onClose,
  raceConfig,
  onSaveConfig,
  onResetConfig,
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [activeTab, setActiveTab] = useState('general');
  const [editDistance, setEditDistance] = useState('27K');
  const [draft, setDraft] = useState(() => structuredClone(raceConfig));

  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);
  const [gpxStatus, setGpxStatus] = useState('');

  // Estado para carga de fotos de muestra (1ra Edición) en Cloudinary + Firestore
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadPreset, setUploadPreset] = useState(DEFAULT_UPLOAD_PRESET);
  const [photoSector, setPhotoSector] = useState('');
  const [photoStatus, setPhotoStatus] = useState(null);
  const [photoStepMessage, setPhotoStepMessage] = useState('');
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryCustomCount, setGalleryCustomCount] = useState(0);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [photoBusyId, setPhotoBusyId] = useState('');

  // Estado para gestión de corredores inscriptos
  const [registrations, setRegistrations] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [regsError, setRegsError] = useState('');
  const [regsSource, setRegsSource] = useState('firestore');
  const [regSearch, setRegSearch] = useState('');
  const [regDistanceFilter, setRegDistanceFilter] = useState('all');
  const [regStatusFilter, setRegStatusFilter] = useState('all');
  const [bibDrafts, setBibDrafts] = useState({});
  const [regBusyId, setRegBusyId] = useState('');

  const loadRegistrations = async () => {
    setRegsLoading(true);
    setRegsError('');
    try {
      const res = await fetchRegistrations();
      const list = res.registrations || [];
      setRegistrations(list);
      setRegsSource(res.source || 'local');
      setBibDrafts((prev) => {
        const next = { ...prev };
        for (const item of list) {
          if (next[item.id] === undefined) {
            next[item.id] = item.assignedBib || '';
          }
        }
        return next;
      });
    } catch (err) {
      setRegsError(err?.message || 'No se pudieron cargar los inscriptos.');
    } finally {
      setRegsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && unlocked && activeTab === 'registrations') {
      loadRegistrations();
    }
  }, [isOpen, unlocked, activeTab]);

  const regStats = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let count27k = 0;
    let count13k = 0;
    for (const r of registrations) {
      if (r.status === 'confirmado') confirmed += 1;
      else if (r.status === 'pendiente') pending += 1;
      if (r.distance === '27K' || r.distance === '21K') count27k += 1;
      else if (r.distance === '13K' || r.distance === '10K') count13k += 1;
    }
    return {
      total: registrations.length,
      confirmed,
      pending,
      count27k,
      count13k,
    };
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    const q = regSearch.trim().toLowerCase();
    return registrations.filter((reg) => {
      if (regDistanceFilter !== 'all' && reg.distance !== regDistanceFilter) {
        return false;
      }
      if (regStatusFilter !== 'all' && reg.status !== regStatusFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        reg.fullName,
        reg.dni,
        reg.code,
        reg.assignedBib,
        reg.city,
        reg.team,
        reg.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [registrations, regSearch, regDistanceFilter, regStatusFilter]);

  const loadGalleryItems = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetchGalleryPhotos();
      setGalleryItems(res.photos || []);
      setGalleryCustomCount(res.customCount || 0);
    } catch {
      // Ignorar fallos silenciosos
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && unlocked && activeTab === 'photos') {
      loadGalleryItems();
    }
  }, [isOpen, unlocked, activeTab]);

  useEffect(() => {
    return () => {
      for (const item of photoPreviews) {
        if (item?.url) {
          URL.revokeObjectURL(item.url);
        }
      }
    };
  }, [photoPreviews]);

  useEffect(() => {
    if (isOpen) {
      setDraft(structuredClone(raceConfig));
      setSaveFeedback(null);
      setGpxStatus('');
      setAuthError('');
      setAuthInfo('');
    }
  }, [isOpen, raceConfig]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const unsubscribe = subscribeToAdminAuth((user) => {
      if (user) {
        setAdminUser(user);
        setUnlocked(true);
        setAuthError('');
      } else {
        setAdminUser(null);
        setUnlocked(false);
      }
    });
    return unsubscribe;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const firebaseReady = isFirebaseConfigured();

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError('');
    setAuthInfo('');
    try {
      const user = await signInAdminWithGoogle();
      setAdminUser(user);
      setUnlocked(true);
    } catch (err) {
      setAuthError(err.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthInfo('');
    try {
      const user = await signInAdminWithEmail(emailInput, passwordInput);
      setAdminUser(user);
      setUnlocked(true);
      setPasswordInput('');
    } catch (err) {
      setAuthError(err.message || 'No se pudo iniciar sesión con correo.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setAuthLoading(true);
    setAuthError('');
    setAuthInfo('');
    try {
      const res = await sendAdminPasswordReset(emailInput);
      setAuthInfo(
        `Te enviamos un enlace para crear o restablecer tu clave a ${res.email}. Revisá Recibidos o Spam.`
      );
    } catch (err) {
      setAuthError(err.message || 'No se pudo enviar el correo de recuperación.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOutAdmin();
    setAdminUser(null);
    setUnlocked(false);
    setAuthError('');
    setAuthInfo('');
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

  const updatePaymentField = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      payment: {
        ...(prev.payment || {}),
        [field]: value,
      },
    }));
  };

  const handleConfirmRegistration = async (reg) => {
    setRegBusyId(reg.id);
    setRegsError('');
    try {
      const assignedBib = String(bibDrafts[reg.id] ?? reg.assignedBib ?? '').trim();
      await updateRegistrationStatus(reg.id, {
        status: 'confirmado',
        assignedBib,
      });
      setRegistrations((prev) =>
        prev.map((item) =>
          item.id === reg.id
            ? { ...item, status: 'confirmado', assignedBib, updatedAt: Date.now() }
            : item
        )
      );
    } catch (err) {
      setRegsError(err?.message || 'No se pudo confirmar la inscripción.');
    } finally {
      setRegBusyId('');
    }
  };

  const handleChangeRegStatus = async (reg, nextStatus) => {
    setRegBusyId(reg.id);
    setRegsError('');
    try {
      const assignedBib = String(bibDrafts[reg.id] ?? reg.assignedBib ?? '').trim();
      await updateRegistrationStatus(reg.id, {
        status: nextStatus,
        assignedBib,
      });
      setRegistrations((prev) =>
        prev.map((item) =>
          item.id === reg.id
            ? { ...item, status: nextStatus, assignedBib, updatedAt: Date.now() }
            : item
        )
      );
    } catch (err) {
      setRegsError(err?.message || 'No se pudo actualizar el estado.');
    } finally {
      setRegBusyId('');
    }
  };

  const handleDeleteRegistration = async (reg) => {
    if (
      !window.confirm(
        `¿Eliminar la inscripción de ${reg.fullName} (${reg.code})? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    setRegBusyId(reg.id);
    setRegsError('');
    try {
      await deleteRegistrationRecord(reg.id);
      setRegistrations((prev) => prev.filter((item) => item.id !== reg.id));
    } catch (err) {
      setRegsError(err?.message || 'No se pudo eliminar la inscripción.');
    } finally {
      setRegBusyId('');
    }
  };

  const buildRunnerWhatsappUrl = (reg) => {
    const digits = String(reg.phone || '').replace(/[^\d]/g, '').replace(/^0+/, '');
    const fullPhone =
      digits.length === 10 && !digits.startsWith('54') ? `549${digits}` : digits;
    const bib = String(bibDrafts[reg.id] ?? reg.assignedBib ?? '').trim();
    const bibText = bib ? ` Tu dorsal asignado es el #${bib}.` : '';
    const msg = `¡Hola ${reg.fullName}! Te confirmamos desde Reto al Filo - 2da Edición que tu inscripción (${reg.code}) en ${reg.distance} está CONFIRMADA.${bibText} ¡Nos vemos en Tornquist!`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');

      const headers = [
        'Código',
        'Estado',
        'Dorsal',
        'Distancia',
        'Valor',
        'Nombre y Apellido',
        'DNI',
        'Fecha de Nacimiento',
        'Género',
        'Teléfono',
        'Email',
        'Localidad',
        'Team',
        'Talle Remera',
        'Contacto Emergencia',
        'Tel. Emergencia',
        'Observaciones Médicas',
        'Comprobante URL',
        'Fecha Inscripción',
      ];

      const rows = registrations.map((r) =>
        [
          r.code || '',
          (r.status || '').toUpperCase(),
          bibDrafts[r.id] ?? r.assignedBib ?? '',
          r.distance || '',
          r.priceSnapshot || '',
          r.fullName || '',
          r.dni || '',
          r.birthDate || '',
          r.gender || '',
          r.phone || '',
          r.email || '',
          r.city || '',
          r.team || '',
          r.shirtSize || '',
          r.emergencyContactName || '',
          r.emergencyContactPhone || '',
          r.medicalNotes || '',
          r.receiptUrl || '',
          r.createdAt ? new Date(r.createdAt).toLocaleString('es-AR') : '',
        ].map(sanitizeExcelCell)
      );

      const titleRow = [
        'RETO AL FILO - 2DA EDICIÓN (2027) · PLANILLA DE CORREDORES INSCRIPTOS',
      ];
      const subtitleRow = [
        `Exportado el ${new Date().toLocaleString('es-AR')} · Total: ${registrations.length} inscriptos`,
      ];

      const sheetData = [titleRow, subtitleRow, headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      const lastColIdx = headers.length - 1;
      const lastColLetter = XLSX.utils.encode_col(lastColIdx);
      const lastRowNumber = 3 + rows.length;

      // Título y subtítulo combinados a lo ancho de todas las columnas de la tabla
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIdx } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIdx } },
      ];

      // Autofiltro de tabla en la fila de encabezados (fila 3)
      ws['!autofilter'] = { ref: `A3:${lastColLetter}${lastRowNumber}` };

      // Alturas de filas para título, subtítulo y encabezados
      ws['!rows'] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 24 }];

      // Autoajuste de ancho de columnas según encabezados y contenido
      ws['!cols'] = headers.map((header, colIdx) => {
        let maxLen = String(header).length;
        for (const row of rows) {
          const len = String(row[colIdx] ?? '').length;
          if (len > maxLen) maxLen = len;
        }
        return { wch: Math.min(Math.max(maxLen + 3, 12), 48) };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inscriptos');
      XLSX.writeFile(
        wb,
        `reto-al-filo-inscriptos-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (err) {
      setRegsError(err?.message || 'No se pudo generar la planilla Excel.');
    }
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
        km: editDistance === '27K' ? 12 : 5,
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
      const targetKm = editDistance === '27K' ? 26.7 : 12.5;
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
    const defaultGain = editDistance === '27K' ? '+1.510 m' : '+671 m';
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
        {
          day: 'Sábado 10',
          time: '14:00 hs',
          title: 'Nuevo hito',
          tag: 'Predio',
          description: '',
        },
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

  const handleClearSelectedPhotos = () => {
    for (const item of photoPreviews) {
      if (item?.url) URL.revokeObjectURL(item.url);
    }
    setPhotoFiles([]);
    setPhotoPreviews([]);
  };

  const handleSelectPhotoFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    handleClearSelectedPhotos();
    const previews = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPhotoFiles(files);
    setPhotoPreviews(previews);
    setPhotoStatus(null);
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    setPhotoSubmitting(true);
    setPhotoStatus(null);
    setPhotoStepMessage('');

    try {
      const sectorText = photoSector.trim();

      if (photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i += 1) {
          const file = photoFiles[i];
          setPhotoStepMessage(
            `Subiendo foto ${i + 1} de ${photoFiles.length} a Cloudinary (${DEFAULT_CLOUD_NAME || 'nube configurada'})...`
          );
          const uploaded = await uploadImageToCloudinary(file, {
            cloudName: DEFAULT_CLOUD_NAME,
            uploadPreset,
            folder: 'reto-al-filo/galeria',
            resourceType: 'image',
          });
          setPhotoStepMessage(
            `Publicando foto ${i + 1} de ${photoFiles.length} en Firestore...`
          );
          await addPhotoToFirestore({
            cloudinaryUrl: uploaded.secureUrl,
            sector: sectorText,
            edicion: 1,
          });
        }

        const totalUploaded = photoFiles.length;
        handleClearSelectedPhotos();
        setPhotoSector('');
        await loadGalleryItems();
        setPhotoStatus({
          type: 'success',
          message: `¡${totalUploaded} ${totalUploaded === 1 ? 'foto subida y publicada' : 'fotos subidas y publicadas'} en la Galería de 1ra Edición!`,
        });
      } else {
        const finalUrl = photoUrl.trim();
        if (!finalUrl) {
          throw new Error(
            'Elegí al menos una foto de tu dispositivo o pegá una URL de Cloudinary.'
          );
        }

        setPhotoStepMessage('Publicando foto en Firestore...');
        await addPhotoToFirestore({
          cloudinaryUrl: finalUrl,
          sector: sectorText,
          edicion: 1,
        });

        setPhotoUrl('');
        setPhotoSector('');
        await loadGalleryItems();
        setPhotoStatus({
          type: 'success',
          message: '¡Foto publicada en la Galería de 1ra Edición!',
        });
      }
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

  const handleDeleteGalleryPhoto = async (photo) => {
    if (!window.confirm('¿Quitar esta foto de la galería pública?')) return;
    setPhotoBusyId(photo.id);
    setPhotoStatus(null);
    try {
      await deletePhotoFromFirestore(photo.id);
      await loadGalleryItems();
      setPhotoStatus({
        type: 'success',
        message: 'Foto eliminada de la galería pública.',
      });
    } catch (err) {
      setPhotoStatus({
        type: 'error',
        message: err?.message || 'No se pudo eliminar la foto.',
      });
    } finally {
      setPhotoBusyId('');
    }
  };

  const activeCircuitDraft = draft.circuits[editDistance];
  const activeTrack = activeCircuitDraft.customGpx || GPX_TRACKS[editDistance];
  const circuitInputBorderClass =
    editDistance === '13K'
      ? 'border border-red-500 focus:border-red-400 focus:outline-none'
      : 'border border-cyan-500 focus:border-cyan-400 focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Panel de Administración Reto al Filo"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl ${unlocked ? 'h-[88dvh] sm:h-[680px]' : 'h-auto'} max-h-[92dvh] rounded-3xl bg-stone-900 border border-stone-700 shadow-2xl flex flex-col overflow-hidden text-stone-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="px-4 sm:px-5 py-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              {unlocked ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-black text-white uppercase truncate">
                Panel de Organización · Reto al Filo
              </h2>
              <p className="text-xs text-stone-400 truncate">
                {unlocked && adminUser?.email
                  ? `Sesión activa: ${adminUser.email}`
                  : 'Editá horarios, puestos de hidratación, GPX y fotos sin tocar código'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {unlocked && (
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Cerrar sesión de administrador"
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-semibold px-3 py-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de administración"
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!unlocked ? (
          <AdminLoginView
            firebaseReady={firebaseReady}
            authLoading={authLoading}
            emailInput={emailInput}
            setEmailInput={setEmailInput}
            passwordInput={passwordInput}
            setPasswordInput={setPasswordInput}
            authError={authError}
            authInfo={authInfo}
            onGoogleSignIn={handleGoogleSignIn}
            onEmailSignIn={handleEmailSignIn}
            onPasswordReset={handlePasswordReset}
          />
        ) : (
          <>
            {/* Navegación por pestañas del Admin */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-stone-950/90 border-b border-stone-800 shrink-0">
              {[
                { id: 'general', label: 'General & Pagos', icon: MapPin },
                { id: 'circuits', label: 'Circuitos & GPX', icon: Droplets },
                { id: 'schedule_faq', label: 'Horarios & FAQ', icon: Clock },
                { id: 'photos', label: 'Galería 1ra Edición', icon: Camera },
                { id: 'registrations', label: 'Inscriptos', icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
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
                <AdminGeneralTab
                  draft={draft}
                  setDraft={setDraft}
                  onUpdateCircuitField={updateCircuitField}
                  onUpdatePaymentField={updatePaymentField}
                />
              )}

              {activeTab === 'circuits' && (
                <AdminCircuitsTab
                  editDistance={editDistance}
                  onSelectDistance={(d) => {
                    setEditDistance(d);
                    setGpxStatus('');
                  }}
                  activeCircuitDraft={activeCircuitDraft}
                  activeTrack={activeTrack}
                  circuitInputBorderClass={circuitInputBorderClass}
                  gpxStatus={gpxStatus}
                  onUpdateCircuitField={updateCircuitField}
                  onStationChange={handleStationChange}
                  onAddStation={handleAddStation}
                  onRemoveStation={handleRemoveStation}
                  onGpxFileUpload={handleGpxFileUpload}
                  onClearCustomGpx={handleClearCustomGpx}
                />
              )}

              {activeTab === 'schedule_faq' && (
                <AdminScheduleFaqTab
                  schedule={draft.schedule}
                  faqs={draft.faqs}
                  onScheduleChange={handleScheduleChange}
                  onAddSchedule={handleAddSchedule}
                  onRemoveSchedule={handleRemoveSchedule}
                  onFaqChange={handleFaqChange}
                />
              )}

              {activeTab === 'photos' && (
                <AdminPhotosTab
                  defaultCloudName={DEFAULT_CLOUD_NAME}
                  photoFiles={photoFiles}
                  photoPreviews={photoPreviews}
                  photoUrl={photoUrl}
                  setPhotoUrl={setPhotoUrl}
                  uploadPreset={uploadPreset}
                  setUploadPreset={setUploadPreset}
                  photoSector={photoSector}
                  setPhotoSector={setPhotoSector}
                  photoStatus={photoStatus}
                  photoStepMessage={photoStepMessage}
                  photoSubmitting={photoSubmitting}
                  galleryItems={galleryItems}
                  galleryCustomCount={galleryCustomCount}
                  galleryLoading={galleryLoading}
                  photoBusyId={photoBusyId}
                  onSelectPhotoFiles={handleSelectPhotoFiles}
                  onClearSelectedPhotos={handleClearSelectedPhotos}
                  onAddPhoto={handleAddPhoto}
                  onLoadGalleryItems={loadGalleryItems}
                  onDeleteGalleryPhoto={handleDeleteGalleryPhoto}
                />
              )}

              {activeTab === 'registrations' && (
                <AdminRegistrationsTab
                  regStats={regStats}
                  registrationsCount={registrations.length}
                  filteredRegistrations={filteredRegistrations}
                  regsLoading={regsLoading}
                  regsError={regsError}
                  regsSource={regsSource}
                  regSearch={regSearch}
                  setRegSearch={setRegSearch}
                  regDistanceFilter={regDistanceFilter}
                  setRegDistanceFilter={setRegDistanceFilter}
                  regStatusFilter={regStatusFilter}
                  setRegStatusFilter={setRegStatusFilter}
                  bibDrafts={bibDrafts}
                  setBibDrafts={setBibDrafts}
                  regBusyId={regBusyId}
                  onExportExcel={handleExportExcel}
                  onConfirmRegistration={handleConfirmRegistration}
                  onChangeRegStatus={handleChangeRegStatus}
                  onDeleteRegistration={handleDeleteRegistration}
                  buildRunnerWhatsappUrl={buildRunnerWhatsappUrl}
                />
              )}

              {saveFeedback && activeTab !== 'photos' && activeTab !== 'registrations' && (
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

                  {photoFiles.length > 0 || photoUrl.trim().length > 0 ? (
                    <button
                      type="submit"
                      form="admin-photo-form"
                      disabled={photoSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider px-6 py-3 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      {photoSubmitting
                        ? 'Subiendo y publicando...'
                        : `Subir y Publicar (${photoFiles.length || 1})`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setTimeout(() => {
                          document
                            .getElementById('galeria')
                            ?.scrollIntoView({ behavior: 'smooth' });
                        }, 80);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider px-6 py-3 shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      ✓ Listo · Ver Galería en la Web
                    </button>
                  )}
                </>
              ) : activeTab === 'registrations' ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold px-4 py-2.5 cursor-pointer"
                  >
                    Cerrar Panel
                  </button>

                  <button
                    type="button"
                    onClick={loadRegistrations}
                    disabled={regsLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider px-5 py-2.5 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${regsLoading ? 'animate-spin' : ''}`} />
                    {regsLoading ? 'Actualizando...' : 'Actualizar Inscriptos'}
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
