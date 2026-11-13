import React, { useState, useEffect, useMemo } from 'react';
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
  LogOut,
  Mail,
  KeyRound,
  ShieldCheck,
  Users,
  Search,
  Download,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Landmark,
} from 'lucide-react';
import { GPX_TRACKS, interpolatePointAtKm, parseGpxXml } from '../data/gpxTracks';
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
  const [adminUser, setAdminUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailMode, setEmailMode] = useState('login');
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

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
        setAdminUser((prev) => {
          if (prev?.method === 'pin') return prev;
          setUnlocked(false);
          return null;
        });
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
      const user = await signInAdminWithEmail(emailInput, passwordInput, {
        mode: emailMode,
      });
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

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setAdminUser({
        email: 'PIN local',
        displayName: 'Organizador (PIN)',
        method: 'pin',
      });
      setUnlocked(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('Clave incorrecta. Verificá el PIN de organización.');
    }
  };

  const handleLogout = async () => {
    if (adminUser?.method !== 'pin') {
      await signOutAdmin();
    }
    setAdminUser(null);
    setUnlocked(false);
    setAuthError('');
    setAuthInfo('');
    setPinError('');
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

  const handleExportCsv = () => {
    const escapeCsv = (val) => {
      const str = String(val ?? '').replace(/\r?\n/g, ' ');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Codigo',
      'Estado',
      'Dorsal',
      'Distancia',
      'Valor',
      'Nombre_Apellido',
      'DNI',
      'Fecha_Nacimiento',
      'Genero',
      'Telefono',
      'Email',
      'Localidad',
      'Team',
      'Talle_Remera',
      'Contacto_Emergencia',
      'Tel_Emergencia',
      'Observaciones_Medicas',
      'Comprobante_URL',
      'Fecha_Inscripcion',
    ];

    const rows = registrations.map((r) => [
      r.code,
      r.status,
      r.assignedBib || '',
      r.distance,
      r.priceSnapshot || '',
      r.fullName,
      r.dni,
      r.birthDate,
      r.gender,
      r.phone,
      r.email,
      r.city,
      r.team || '',
      r.shirtSize,
      r.emergencyContactName,
      r.emergencyContactPhone,
      r.medicalNotes || '',
      r.receiptUrl,
      r.createdAt ? new Date(r.createdAt).toLocaleString('es-AR') : '',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reto-al-filo-inscriptos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex items-start sm:items-center justify-center">
            <div className="w-full max-w-md py-2 space-y-4">
              <div className="text-center">
                <span className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 inline-flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </span>
                <h3 className="mt-3 font-display text-xl font-extrabold text-white">
                  Acceso de Organización
                </h3>
                <p className="mt-1 text-xs text-stone-400">
                  Ingresá con tu cuenta autorizada de Google o con correo electrónico y contraseña
                  para editar la carrera en vivo.
                </p>
              </div>

              {!firebaseReady && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    Firebase no está configurado en este entorno. Podés ingresar usando el PIN de
                    respaldo al pie.
                  </span>
                </div>
              )}

              {/* Acceso directo con Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading || !firebaseReady}
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-sm px-4 py-3 shadow-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>
                  {authLoading ? 'Verificando con Google...' : 'Ingresar con Google'}
                </span>
              </button>

              {/* Divisor */}
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-stone-800" />
                <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                  o ingresá con tu correo y contraseña
                </span>
                <div className="flex-grow border-t border-stone-800" />
              </div>

              {/* Acceso con Correo electrónico y Contraseña */}
              <form
                onSubmit={handleEmailSignIn}
                className="rounded-2xl bg-stone-950/80 border border-stone-800 p-4 space-y-3"
              >
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-stone-900 border border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode('login');
                      setAuthError('');
                      setAuthInfo('');
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      emailMode === 'login'
                        ? 'bg-amber-500 text-stone-950'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode('register');
                      setAuthError('');
                      setAuthInfo('');
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      emailMode === 'register'
                        ? 'bg-amber-500 text-stone-950'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    Crear mi clave (1ra vez)
                  </button>
                </div>

                {emailMode === 'register' && (
                  <p className="text-[11px] leading-relaxed text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
                    Elegí e inventá tu propia contraseña nueva (mínimo 6 caracteres) para tu correo autorizado (<span className="font-mono">lciancia1972@gmail.com</span> o <span className="font-mono">lucianociancia86@gmail.com</span>), o ingresá con 1 clic arriba usando <strong>Ingresar con Google</strong>.
                  </p>
                )}

                <div>
                  <label
                    htmlFor="admin-email-input"
                    className="block text-xs font-semibold text-stone-300 mb-1"
                  >
                    Correo electrónico autorizado
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-email-input"
                      type="email"
                      autoComplete="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="lciancia1972@gmail.com"
                      required
                      disabled={!firebaseReady || authLoading}
                      className="w-full rounded-xl bg-stone-900 border border-stone-700 focus:border-amber-400 focus:outline-none pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-stone-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-password-input"
                    className="block text-xs font-semibold text-stone-300 mb-1"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-password-input"
                      type="password"
                      autoComplete={
                        emailMode === 'register' ? 'new-password' : 'current-password'
                      }
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder={
                        emailMode === 'register'
                          ? 'Elegí una clave (mín. 6 caracteres)'
                          : 'Tu contraseña'
                      }
                      required
                      minLength={6}
                      disabled={!firebaseReady || authLoading}
                      className="w-full rounded-xl bg-stone-900 border border-stone-700 focus:border-amber-400 focus:outline-none pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-stone-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!firebaseReady || authLoading}
                  className="w-full min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-black uppercase text-xs sm:text-sm py-2.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {authLoading
                    ? 'Ingresando...'
                    : emailMode === 'register'
                      ? 'Crear Cuenta y Entrar'
                      : 'Ingresar con Correo'}
                </button>

                {emailMode === 'login' && (
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={!firebaseReady || authLoading}
                      className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer disabled:opacity-50"
                    >
                      ¿Olvidaste tu contraseña? Enviar enlace por mail
                    </button>
                  </div>
                )}
              </form>

              {authError && (
                <div
                  role="alert"
                  className="rounded-xl bg-rose-500/15 border border-rose-500/35 p-3 text-xs text-rose-200 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              {authInfo && (
                <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/35 p-3 text-xs text-emerald-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{authInfo}</span>
                </div>
              )}

              {/* Acceso secundario plegable con PIN de respaldo */}
              <div className="pt-1 border-t border-stone-800/80 text-center">
                <button
                  type="button"
                  onClick={() => setShowPinFallback((prev) => !prev)}
                  className="text-xs font-medium text-stone-400 hover:text-stone-200 py-1.5 cursor-pointer"
                >
                  {showPinFallback
                    ? 'Ocultar acceso con PIN de respaldo'
                    : 'Ingresar con PIN de respaldo'}
                </button>

                {showPinFallback && (
                  <form onSubmit={handleUnlock} className="mt-2.5 flex gap-2">
                    <input
                      type="password"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="PIN de organizador"
                      aria-label="PIN de respaldo de organizador"
                      className="flex-1 rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-400 focus:outline-none px-3.5 py-2.5 text-center text-sm text-white font-mono tracking-widest"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-display font-bold uppercase text-xs px-4 py-2.5 cursor-pointer"
                    >
                      Entrar
                    </button>
                  </form>
                )}
                {pinError && showPinFallback && (
                  <p className="mt-2 text-xs text-rose-400">{pinError}</p>
                )}
              </div>
            </div>
          </div>
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
                <div className="space-y-5">
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

                  {/* Precios y Datos Bancarios de Inscripción */}
                  <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <h4 className="font-display text-sm font-bold text-white uppercase">
                          Valores y Cuenta Bancaria para Inscripciones
                        </h4>
                        <p className="text-[11px] text-stone-400">
                          Estos datos se muestran dentro del formulario de inscripción web antes de
                          subir el comprobante.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Valor Inscripción 27K
                        </label>
                        <input
                          type="text"
                          value={draft.circuits?.['27K']?.price || ''}
                          onChange={(e) => updateCircuitField('27K', 'price', e.target.value)}
                          placeholder="$45.000"
                          className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2 text-sm font-bold text-emerald-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Valor Inscripción 13K
                        </label>
                        <input
                          type="text"
                          value={draft.circuits?.['13K']?.price || ''}
                          onChange={(e) => updateCircuitField('13K', 'price', e.target.value)}
                          placeholder="$32.000"
                          className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2 text-sm font-bold text-emerald-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Alias (Banco / Mercado Pago)
                        </label>
                        <input
                          type="text"
                          value={draft.payment?.bankAlias || ''}
                          onChange={(e) => updatePaymentField('bankAlias', e.target.value)}
                          placeholder="RETO.AL.FILO"
                          className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2 text-sm font-mono text-amber-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          CBU / CVU
                        </label>
                        <input
                          type="text"
                          value={draft.payment?.bankCbu || ''}
                          onChange={(e) => updatePaymentField('bankCbu', e.target.value)}
                          placeholder="0000003100000000000000"
                          className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2 text-sm font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Titular de la Cuenta
                        </label>
                        <input
                          type="text"
                          value={draft.payment?.bankHolder || ''}
                          onChange={(e) => updatePaymentField('bankHolder', e.target.value)}
                          placeholder="Organización Reto al Filo"
                          className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Banco / Billetera
                        </label>
                        <input
                          type="text"
                          value={draft.payment?.bankEntity || ''}
                          onChange={(e) => updatePaymentField('bankEntity', e.target.value)}
                          placeholder="Mercado Pago / Banco Provincia"
                          className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2 text-sm text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Instrucciones para el Corredor
                        </label>
                        <textarea
                          rows={2}
                          value={draft.payment?.instructions || ''}
                          onChange={(e) => updatePaymentField('instructions', e.target.value)}
                          className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2 text-xs text-stone-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'circuits' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    {['27K', '13K'].map((d) => (
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
                <div className="space-y-5">
                  <form
                    id="admin-photo-form"
                    onSubmit={handleAddPhoto}
                    className="rounded-2xl bg-stone-950 border border-stone-800 p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="font-display text-base font-bold text-white uppercase">
                          Subir Fotos de Muestra · 1ra Edición
                        </h4>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Elegí una o varias fotos juntas desde tu celular o PC (se suben a tu nube{' '}
                          <span className="font-mono text-amber-300">
                            {DEFAULT_CLOUD_NAME || 'no configurada'}
                          </span>
                          ). Apenas subas tu primera foto, reemplazará las de demostración.
                        </p>
                      </div>
                    </div>

                    {/* Selector de uno o múltiples archivos */}
                    <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/60 p-4 space-y-4">
                      {photoPreviews.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
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
                      ) : (
                        <div className="flex items-center justify-center py-4 text-stone-500">
                          <Camera className="w-9 h-9" />
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
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

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <label className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-bold text-xs uppercase tracking-wider px-4 py-2.5 cursor-pointer transition-colors">
                            <Upload className="w-4 h-4" />
                            {photoFiles.length > 0 ? 'Cambiar Fotos' : 'Elegir Fotos'}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleSelectPhotoFiles}
                              className="hidden"
                            />
                          </label>
                          {photoFiles.length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearSelectedPhotos}
                              className="text-xs text-stone-400 hover:text-stone-200 px-2 py-1.5 cursor-pointer"
                            >
                              Quitar todas
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Lugar o descripción breve (opcional)
                        </label>
                        <input
                          type="text"
                          value={photoSector}
                          onChange={(e) => setPhotoSector(e.target.value)}
                          placeholder="Ej. Cumbre Cerro Providencia · 1ra Edición"
                          className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3.5 py-2.5 text-sm text-white"
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

                  {/* Fotos publicadas en la galería */}
                  <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-display text-sm font-bold text-white uppercase">
                          Postales publicadas actualmente ({galleryCustomCount > 0 ? galleryCustomCount : '6 de muestra'})
                        </h4>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            galleryCustomCount > 0
                              ? 'text-emerald-300 font-medium'
                              : 'text-stone-400'
                          }`}
                        >
                          {galleryCustomCount > 0
                            ? 'Estas fotos ya están cargadas en Cloudinary/Firestore y visibles en vivo en la web. No necesitás volver a subirlas.'
                            : 'Todavía no subiste fotos propias. Mientras tanto la web muestra las 6 postales iniciales de demostración.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={loadGalleryItems}
                        disabled={galleryLoading}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-semibold px-3 py-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${galleryLoading ? 'animate-spin' : ''}`} />
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
                            <div className="relative aspect-[4/3] bg-stone-950 overflow-hidden">
                              <img
                                src={item.cloudinaryThumb}
                                alt={item.sector}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 text-stone-950 font-bold text-[10px] px-2 py-0.5 shadow-md">
                                ✓ Publicada en la web
                              </span>
                            </div>
                            <div className="p-2.5 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-stone-200 truncate">
                                {item.sector}
                              </span>
                              <button
                                type="button"
                                disabled={photoBusyId === item.id}
                                onClick={() => handleDeleteGalleryPhoto(item)}
                                aria-label={`Eliminar postal ${item.sector}`}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 cursor-pointer shrink-0 disabled:opacity-40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'registrations' && (
                <div className="space-y-4">
                  {/* Resumen de contadores */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { label: 'Total', value: regStats.total, tone: 'text-white border-stone-800' },
                      {
                        label: 'Confirmados',
                        value: regStats.confirmed,
                        tone: 'text-emerald-300 border-emerald-500/30',
                      },
                      {
                        label: 'Pendientes',
                        value: regStats.pending,
                        tone: 'text-amber-300 border-amber-500/30',
                      },
                      { label: '27K', value: regStats.count27k, tone: 'text-sky-300 border-stone-800' },
                      { label: '13K', value: regStats.count13k, tone: 'text-stone-200 border-stone-800' },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={`rounded-2xl bg-stone-950 border p-3 text-center ${stat.tone}`}
                      >
                        <span className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                          {stat.label}
                        </span>
                        <span className="font-display text-xl font-black">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Controles de búsqueda, filtro y exportación */}
                  <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={regSearch}
                          onChange={(e) => setRegSearch(e.target.value)}
                          placeholder="Buscar por nombre, DNI, código RAF, dorsal, localidad..."
                          className="w-full rounded-xl bg-stone-900 border border-stone-700 focus:border-amber-400 focus:outline-none pl-9 pr-3 py-2 text-xs sm:text-sm text-white"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <select
                          aria-label="Filtrar por distancia"
                          value={regDistanceFilter}
                          onChange={(e) => setRegDistanceFilter(e.target.value)}
                          className="rounded-xl bg-stone-900 border border-stone-700 px-3 py-2 text-xs text-white"
                        >
                          <option value="all">Todas las distancias</option>
                          <option value="27K">Solo 27K</option>
                          <option value="13K">Solo 13K</option>
                        </select>

                        <select
                          aria-label="Filtrar por estado"
                          value={regStatusFilter}
                          onChange={(e) => setRegStatusFilter(e.target.value)}
                          className="rounded-xl bg-stone-900 border border-stone-700 px-3 py-2 text-xs text-white"
                        >
                          <option value="all">Todos los estados</option>
                          <option value="pendiente">Pendientes</option>
                          <option value="confirmado">Confirmados</option>
                          <option value="rechazado">Rechazados</option>
                        </select>

                        <button
                          type="button"
                          onClick={handleExportCsv}
                          disabled={registrations.length === 0}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-bold px-3.5 py-2 cursor-pointer disabled:opacity-40"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Exportar Excel (CSV)
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-400">
                      Mostrando <strong className="text-stone-200">{filteredRegistrations.length}</strong> de{' '}
                      <strong className="text-stone-200">{registrations.length}</strong> inscripciones · Fuente:{' '}
                      <span className="font-mono text-amber-300">
                        {regsSource === 'firestore' ? 'Firestore en vivo' : 'Respaldo local'}
                      </span>
                    </p>
                  </div>

                  {regsError && (
                    <div className="rounded-xl bg-rose-500/15 border border-rose-500/35 p-3 text-xs text-rose-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <span>{regsError}</span>
                    </div>
                  )}

                  {regsLoading ? (
                    <div className="rounded-2xl bg-stone-950 border border-stone-800 p-8 text-center text-xs text-stone-400">
                      Cargando listado de corredores inscriptos...
                    </div>
                  ) : filteredRegistrations.length === 0 ? (
                    <div className="rounded-2xl bg-stone-950 border border-stone-800 p-8 text-center space-y-1.5">
                      <Users className="w-8 h-8 text-stone-600 mx-auto" />
                      <p className="text-sm font-bold text-stone-200">
                        {registrations.length === 0
                          ? 'Todavía no hay corredores inscriptos desde el formulario web.'
                          : 'Ningún inscripto coincide con tu filtro actual.'}
                      </p>
                      <p className="text-xs text-stone-400">
                        Apenas alguien complete el formulario y suba su comprobante, aparecerá aquí al
                        instante.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredRegistrations.map((reg) => {
                        const isBusy = regBusyId === reg.id;
                        const bibValue = bibDrafts[reg.id] ?? reg.assignedBib ?? '';
                        const statusBadgeClass =
                          reg.status === 'confirmado'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                            : reg.status === 'rechazado'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/40';

                        return (
                          <div
                            key={reg.id}
                            className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-3"
                          >
                            {/* Encabezado de la ficha */}
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-stone-900 border border-stone-700 text-amber-300">
                                    {reg.code}
                                  </span>
                                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300">
                                    {reg.distance}
                                  </span>
                                  <span
                                    className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusBadgeClass}`}
                                  >
                                    {reg.status}
                                  </span>
                                  {reg.assignedBib && (
                                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                      Dorsal #{reg.assignedBib}
                                    </span>
                                  )}
                                </div>
                                <h4 className="mt-1.5 font-display text-base font-extrabold text-white">
                                  {reg.fullName}
                                </h4>
                              </div>

                              <div className="flex items-center gap-2">
                                {reg.receiptUrl && (
                                  <a
                                    href={reg.receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/35 text-xs font-bold px-3 py-2"
                                  >
                                    Ver Comprobante
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleDeleteRegistration(reg)}
                                  aria-label={`Eliminar inscripción de ${reg.fullName}`}
                                  className="p-2 rounded-xl text-stone-400 hover:text-rose-400 hover:bg-stone-900 cursor-pointer disabled:opacity-40"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Datos detallados */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-300 bg-stone-900/70 border border-stone-800/80 rounded-xl p-3">
                              <div>
                                <span className="text-stone-500">DNI: </span>
                                <span className="font-mono text-stone-100">{reg.dni}</span>
                              </div>
                              <div>
                                <span className="text-stone-500">Nac.: </span>
                                <span>{reg.birthDate}</span>
                                <span className="text-stone-500"> ({reg.gender})</span>
                              </div>
                              <div>
                                <span className="text-stone-500">Remera: </span>
                                <strong className="text-amber-300">{reg.shirtSize}</strong>
                              </div>
                              <div>
                                <span className="text-stone-500">Localidad: </span>
                                <span>{reg.city}</span>
                              </div>
                              <div>
                                <span className="text-stone-500">Team: </span>
                                <span>{reg.team || 'Libre'}</span>
                              </div>
                              <div>
                                <span className="text-stone-500">Tel: </span>
                                <span className="font-mono">{reg.phone}</span>
                              </div>
                              <div className="sm:col-span-2 truncate">
                                <span className="text-stone-500">Email: </span>
                                <span>{reg.email}</span>
                              </div>
                              <div>
                                <span className="text-stone-500">Emergencia: </span>
                                <span>
                                  {reg.emergencyContactName} ({reg.emergencyContactPhone})
                                </span>
                              </div>
                              {reg.medicalNotes && (
                                <div className="sm:col-span-3 text-rose-200/90">
                                  <span className="text-stone-400">Observaciones médicas: </span>
                                  {reg.medicalNotes}
                                </div>
                              )}
                            </div>

                            {/* Acciones de dorsal, aprobación y WhatsApp */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <div className="flex items-center gap-1.5">
                                <label
                                  htmlFor={`bib-${reg.id}`}
                                  className="text-[11px] font-semibold text-stone-400"
                                >
                                  Dorsal #
                                </label>
                                <input
                                  id={`bib-${reg.id}`}
                                  type="text"
                                  value={bibValue}
                                  onChange={(e) =>
                                    setBibDrafts((prev) => ({
                                      ...prev,
                                      [reg.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="105"
                                  className="w-20 rounded-xl bg-stone-900 border border-stone-700 px-2.5 py-2 text-xs font-mono text-white text-center"
                                />
                              </div>

                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleConfirmRegistration(reg)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-display font-black text-xs uppercase px-3.5 py-2 cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Confirmar y Guardar Dorsal
                              </button>

                              {reg.status !== 'pendiente' && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleChangeRegStatus(reg, 'pendiente')}
                                  className="rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-3 py-2 cursor-pointer disabled:opacity-50"
                                >
                                  Pasar a Pendiente
                                </button>
                              )}

                              {reg.phone && (
                                <a
                                  href={buildRunnerWhatsappUrl(reg)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-bold px-3 py-2 ml-auto"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  Confirmar por WhatsApp
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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
