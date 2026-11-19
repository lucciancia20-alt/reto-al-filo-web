import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { GPX_TRACKS, parseGpxXml } from '../data/gpxTracks';
import {
  syncScheduleWithTargetDate,
  resolveRunnerCategory,
  resolveFrozenRegistrationPricing,
  getRaceTitle,
  getRaceFullTitle,
} from '../data/raceConfig';
import { openPrintableAccreditationSheet } from '../utils/printableDocs';
import {
  addPhotoToFirestore,
  fetchGalleryPhotos,
  deletePhotoFromFirestore,
  saveGalleryOrderToFirestore,
  uploadImageToCloudinary,
  subscribeToAdminAuth,
  signInAdminWithGoogle,
  signInAdminWithEmail,
  sendAdminPasswordReset,
  signOutAdmin,
  isFirebaseConfigured,
  fetchRegistrations,
  fetchRegistrationStats,
  updateRegistrationStatus,
  batchUpdateRegistrationBibs,
  deleteRegistrationRecord,
  syncPublicRunnerStatus,
  syncAllPublicRunnerStatuses,
} from '../firebase/config';
import AdminLoginView from './admin/AdminLoginView';
import AdminGeneralTab from './admin/AdminGeneralTab';
import AdminCircuitsTab from './admin/AdminCircuitsTab';
import AdminScheduleFaqTab from './admin/AdminScheduleFaqTab';
import AdminPhotosTab from './admin/AdminPhotosTab';
import AdminRegistrationsTab from './admin/AdminRegistrationsTab';
import AdminSessionConflictModal from './AdminSessionConflictModal';
import { useAdminSession } from '../hooks/useAdminSession';

const DEFAULT_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const DEFAULT_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'reto_al_filo';

const REGS_CACHE_TTL_MS = 5 * 60 * 1000;

const sanitizeExcelCell = (value) => {
  const str = String(value ?? '');
  return /^\s*[=+\-@]/.test(str) ? `'${str}` : str;
};

const normalizeBibNumber = (value) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) && num > 0 ? num : null;
};

const normalizeDni = (value) =>
  String(value ?? '').replace(/[.\s-]+/g, '').trim().toUpperCase();

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
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const logoutTimerRef = useRef(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const resetTimerRef = useRef(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // ── Sesión Única Activa ────────────────────────────────────────────────────
  const handleForceClose = useCallback(() => {
    // Cierre forzado por expulsión (otra sesión tomó el control) o inactividad
    setUnlocked(false);
    setAdminUser(null);
    onClose();
  }, [onClose]);

  const {
    sessionState,
    conflictInfo,
    takeover,
    cancelEntry,
    releaseSession,
  } = useAdminSession({
    enabled: isOpen && unlocked,
    adminUser,
    onForceClose: handleForceClose,
  });

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
  const [regDuplicateFilter, setRegDuplicateFilter] = useState('none');
  const [regShirtFilter, setRegShirtFilter] = useState('all');
  const [regCheckInFilter, setRegCheckInFilter] = useState('all');
  const [bibDrafts, setBibDrafts] = useState({});
  const [regBusyId, setRegBusyId] = useState('');

  const regsAbortRef = useRef(null);
  const regsLoadedAtRef = useRef(0);
  const [remoteStats, setRemoteStats] = useState(null);
  const [syncingPublic, setSyncingPublic] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Carga con caché (TTL), deduplicación de llamadas en vuelo y cancelación al cerrar/desmontar.
  const loadRegistrations = async ({ force = false } = {}) => {
    if (regsAbortRef.current) return;
    const fresh = Date.now() - regsLoadedAtRef.current < REGS_CACHE_TTL_MS;
    if (!force && regsLoadedAtRef.current && fresh) return;

    const controller = new AbortController();
    regsAbortRef.current = controller;
    setRegsLoading(true);
    setRegsError('');
    // Contadores agregados (1 lectura) para mostrar totales mientras carga la lista completa.
    fetchRegistrationStats().then((s) => {
      if (s && !controller.signal.aborted) setRemoteStats(s);
    });
    try {
      const res = await fetchRegistrations({ signal: controller.signal });
      if (controller.signal.aborted || res.aborted) return;
      const list = res.registrations || [];
      if (res.source === 'firestore') regsLoadedAtRef.current = Date.now();
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
      if (!controller.signal.aborted) {
        setRegsError(err?.message || 'No se pudieron cargar los inscriptos.');
      }
    } finally {
      if (regsAbortRef.current === controller) {
        regsAbortRef.current = null;
        if (!controller.signal.aborted) setRegsLoading(false);
      }
    }
  };

  const handleSyncPublicStatuses = async () => {
    if (syncingPublic || registrations.length === 0) return;
    setSyncingPublic(true);
    setSyncMessage(null);
    try {
      const res = await syncAllPublicRunnerStatuses(registrations);
      setSyncMessage(
        res.ok
          ? { ok: true, text: `Sincronizados ${res.count} registros públicos.` }
          : { ok: false, text: 'No se pudo sincronizar. Reintentá.' }
      );
    } catch {
      setSyncMessage({ ok: false, text: 'No se pudo sincronizar. Reintentá.' });
    } finally {
      setSyncingPublic(false);
    }
  };

  useEffect(() => {
    if (isOpen && unlocked && sessionState === 'active' && activeTab === 'registrations') {
      loadRegistrations();
    }
  }, [isOpen, unlocked, sessionState, activeTab]);

  // Al cerrar el modal, cerrar sesión o desmontar: cancelar lectura en vuelo e invalidar caché.
  useEffect(() => {
    if (isOpen && unlocked) return undefined;
    regsAbortRef.current?.abort();
    regsAbortRef.current = null;
    regsLoadedAtRef.current = 0;
    setRegsLoading(false);
    return undefined;
  }, [isOpen, unlocked]);

  useEffect(
    () => () => {
      regsAbortRef.current?.abort();
    },
    []
  );

  const regStats = useMemo(() => {
    if (registrations.length === 0 && remoteStats) {
      return {
        total: remoteStats.total,
        confirmed: remoteStats.confirmed,
        pending: remoteStats.pending,
        count27k: remoteStats.d27k,
        count13k: remoteStats.d13k,
        checkedInCount: remoteStats.checkedIn,
        pendingCheckInCount: Math.max(0, remoteStats.confirmed - remoteStats.checkedIn),
        shirtSizes: [],
      };
    }
    let confirmed = 0;
    let pending = 0;
    let count27k = 0;
    let count13k = 0;
    let checkedInCount = 0;
    let pendingCheckInCount = 0;
    const SHIRT_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const shirtMap = new Map(SHIRT_ORDER.map((sz) => [sz, { size: sz, confirmed: 0, total: 0 }]));

    for (const r of registrations) {
      const st = String(r.status || '').toLowerCase();
      const isConfirmed = st === 'confirmado' || st === 'confirmed';
      const isPending = st === 'pendiente' || st === 'pending';
      const isRejected = st === 'rechazado' || st === 'rejected';

      if (isConfirmed) {
        confirmed += 1;
        if (r.checkedIn) checkedInCount += 1;
        else pendingCheckInCount += 1;
      } else if (isPending) {
        pending += 1;
      }

      if (r.distance === '27K' || r.distance === '21K') count27k += 1;
      else if (r.distance === '13K' || r.distance === '10K') count13k += 1;

      const sz = String(r.shirtSize || '').trim().toUpperCase();
      if (sz && !isRejected) {
        if (!shirtMap.has(sz)) {
          shirtMap.set(sz, { size: sz, confirmed: 0, total: 0 });
        }
        const entry = shirtMap.get(sz);
        entry.total += 1;
        if (isConfirmed) entry.confirmed += 1;
      }
    }
    return {
      total: registrations.length,
      confirmed,
      pending,
      count27k,
      count13k,
      checkedInCount,
      pendingCheckInCount,
      shirtSizes: Array.from(shirtMap.values()),
    };
  }, [registrations, remoteStats]);

  const duplicateInfo = useMemo(() => {
    const savedBibCounts = new Map();
    const liveBibCounts = new Map();
    const dniCounts = new Map();

    for (const r of registrations) {
      const savedBib = normalizeBibNumber(r.assignedBib);
      if (savedBib !== null) {
        savedBibCounts.set(savedBib, (savedBibCounts.get(savedBib) || 0) + 1);
      }

      const liveBib = normalizeBibNumber(bibDrafts[r.id] ?? r.assignedBib);
      if (liveBib !== null) {
        liveBibCounts.set(liveBib, (liveBibCounts.get(liveBib) || 0) + 1);
      }

      const dni = normalizeDni(r.dni);
      if (dni) {
        dniCounts.set(dni, (dniCounts.get(dni) || 0) + 1);
      }
    }

    const duplicateSavedBibs = new Set();
    for (const [bib, count] of savedBibCounts.entries()) {
      if (count > 1) duplicateSavedBibs.add(bib);
    }

    const duplicateLiveBibs = new Set();
    for (const [bib, count] of liveBibCounts.entries()) {
      if (count > 1) duplicateLiveBibs.add(bib);
    }

    const duplicateDnis = new Set();
    for (const [dni, count] of dniCounts.entries()) {
      if (count > 1) duplicateDnis.add(dni);
    }

    let duplicateBibCount = 0;
    let duplicateDniCount = 0;
    for (const r of registrations) {
      const savedBib = normalizeBibNumber(r.assignedBib);
      const liveBib = normalizeBibNumber(bibDrafts[r.id] ?? r.assignedBib);
      if (
        (savedBib !== null && duplicateSavedBibs.has(savedBib)) ||
        (liveBib !== null && duplicateLiveBibs.has(liveBib))
      ) {
        duplicateBibCount += 1;
      }

      const dni = normalizeDni(r.dni);
      if (dni && duplicateDnis.has(dni)) {
        duplicateDniCount += 1;
      }
    }

    return {
      duplicateSavedBibs,
      duplicateLiveBibs,
      duplicateDnis,
      duplicateBibCount,
      duplicateDniCount,
    };
  }, [registrations, bibDrafts]);

  const filteredRegistrations = useMemo(() => {
    const q = regSearch.trim().toLowerCase();
    const list = registrations.filter((reg) => {
      if (regDistanceFilter !== 'all' && reg.distance !== regDistanceFilter) {
        return false;
      }
      if (regStatusFilter !== 'all' && reg.status !== regStatusFilter) {
        return false;
      }
      if (regDuplicateFilter === 'dorsal') {
        const savedBib = normalizeBibNumber(reg.assignedBib);
        const liveBib = normalizeBibNumber(bibDrafts[reg.id] ?? reg.assignedBib);
        const isDupBib =
          (savedBib !== null && duplicateInfo.duplicateSavedBibs.has(savedBib)) ||
          (liveBib !== null && duplicateInfo.duplicateLiveBibs.has(liveBib));
        if (!isDupBib) return false;
      } else if (regDuplicateFilter === 'dni') {
        const dni = normalizeDni(reg.dni);
        if (!dni || !duplicateInfo.duplicateDnis.has(dni)) return false;
      }
      if (regShirtFilter !== 'all') {
        if (String(reg.shirtSize || '').trim().toUpperCase() !== regShirtFilter) {
          return false;
        }
      }
      if (regCheckInFilter === 'checked') {
        if (!reg.checkedIn) return false;
      } else if (regCheckInFilter === 'pending_checkin') {
        const isConf = reg.status === 'confirmado' || reg.status === 'confirmed';
        if (!isConf || reg.checkedIn) return false;
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

    if (regDuplicateFilter === 'dorsal') {
      return [...list].sort((a, b) => {
        const bibA =
          normalizeBibNumber(bibDrafts[a.id] ?? a.assignedBib) ??
          normalizeBibNumber(a.assignedBib) ??
          Number.MAX_SAFE_INTEGER;
        const bibB =
          normalizeBibNumber(bibDrafts[b.id] ?? b.assignedBib) ??
          normalizeBibNumber(b.assignedBib) ??
          Number.MAX_SAFE_INTEGER;
        if (bibA !== bibB) return bibA - bibB;
        return String(a.fullName || '').localeCompare(String(b.fullName || ''), 'es', {
          sensitivity: 'base',
        });
      });
    }

    if (regDuplicateFilter === 'dni') {
      return [...list].sort((a, b) => {
        const dniA = normalizeDni(a.dni);
        const dniB = normalizeDni(b.dni);
        const cmp = dniA.localeCompare(dniB, 'es', { numeric: true });
        if (cmp !== 0) return cmp;
        return String(a.fullName || '').localeCompare(String(b.fullName || ''), 'es', {
          sensitivity: 'base',
        });
      });
    }

    return list;
  }, [
    registrations,
    regSearch,
    regDistanceFilter,
    regStatusFilter,
    regDuplicateFilter,
    regShirtFilter,
    regCheckInFilter,
    duplicateInfo,
    bibDrafts,
  ]);

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
      setSaveFeedback(null);
      setGpxStatus('');
      setAuthError('');
      setAuthInfo('');
      setConfirmingLogout(false);
      setConfirmingReset(false);
      setEmailInput('');
      setPasswordInput('');
    }
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setDraft(structuredClone(raceConfig));
    }
  }, [isOpen, raceConfig]);

  // Previsualización en vivo del tema mientras el panel está abierto; al cerrar sin guardar restaura el tema guardado
  useEffect(() => {
    if (isOpen && unlocked) {
      document.documentElement.setAttribute(
        'data-theme',
        draft?.themeColor || raceConfig?.themeColor || 'orange'
      );
    }
    return () => {
      document.documentElement.setAttribute('data-theme', raceConfig?.themeColor || 'orange');
    };
  }, [isOpen, unlocked, draft?.themeColor, raceConfig?.themeColor]);

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

  const hasUnsavedChanges = useMemo(
    () => unlocked && JSON.stringify(draft) !== JSON.stringify(raceConfig),
    [unlocked, draft, raceConfig]
  );

  const handleSafeClose = useCallback(() => {
    if (sessionState === 'conflict') {
      cancelEntry();
      return;
    }
    if (
      hasUnsavedChanges &&
      !window.confirm(
        'Tenés cambios pendientes sin guardar en el borrador. ¿Querés cerrar el panel y descartarlos?'
      )
    ) {
      return;
    }
    onClose();
  }, [sessionState, cancelEntry, hasUnsavedChanges, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') handleSafeClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, handleSafeClose]);

  const scrollContainerRef = useRef(null);
  const [canScrollMore, setCanScrollMore] = useState(false);

  const checkScrollMore = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      setCanScrollMore(false);
      return;
    }
    const hasMore =
      el.scrollHeight > el.clientHeight &&
      el.scrollTop + el.clientHeight < el.scrollHeight - 20;
    setCanScrollMore(hasMore);
  }, []);

  const handleScrollDown = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    checkScrollMore();
  }, [activeTab, checkScrollMore]);

  useEffect(() => {
    if (!isOpen || !unlocked) {
      setCanScrollMore(false);
      return undefined;
    }
    const el = scrollContainerRef.current;
    if (!el) return undefined;

    const rafId = window.requestAnimationFrame(checkScrollMore);
    window.addEventListener('resize', checkScrollMore);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(checkScrollMore);
      resizeObserver.observe(el);
    }

    let mutationObserver;
    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(checkScrollMore);
      mutationObserver.observe(el, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', checkScrollMore);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [
    isOpen,
    unlocked,
    activeTab,
    editDistance,
    draft,
    galleryItems.length,
    filteredRegistrations.length,
    regsLoading,
    galleryLoading,
    checkScrollMore,
  ]);

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
    if (!confirmingLogout) {
      setConfirmingLogout(true);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = setTimeout(() => {
        setConfirmingLogout(false);
        logoutTimerRef.current = null;
      }, 3000);
      return;
    }

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    setConfirmingLogout(false);
    // 1 escritura: marcar sesión como inactiva antes de cerrar
    await releaseSession();
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
      }, reg);
      const updatedReg = {
        ...reg,
        status: 'confirmado',
        assignedBib,
        updatedAt: Date.now(),
      };
      setRegistrations((prev) =>
        prev.map((item) => (item.id === reg.id ? updatedReg : item))
      );
      syncPublicRunnerStatus(updatedReg).catch(() => {});
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
      }, reg);
      const updatedReg = {
        ...reg,
        status: nextStatus,
        assignedBib,
        updatedAt: Date.now(),
      };
      setRegistrations((prev) =>
        prev.map((item) => (item.id === reg.id ? updatedReg : item))
      );
      syncPublicRunnerStatus(updatedReg).catch(() => {});
    } catch (err) {
      setRegsError(err?.message || 'No se pudo actualizar el estado.');
    } finally {
      setRegBusyId('');
    }
  };

  const handleBatchAssignBibs = async (bibUpdates) => {
    setRegsError('');
    try {
      const res = await batchUpdateRegistrationBibs(bibUpdates, registrations);
      if (res?.updatedMap && res.updatedMap.size > 0) {
        setRegistrations((prev) =>
          prev.map((item) =>
            res.updatedMap.has(item.id) ? res.updatedMap.get(item.id) : item
          )
        );
        setBibDrafts((prev) => {
          const next = { ...prev };
          for (const id of res.updatedMap.keys()) {
            delete next[id];
          }
          return next;
        });
      }
      return {
        ok: true,
        updatedCount: res?.updatedCount || 0,
        writesCount: res?.writesCount || 0,
      };
    } catch (err) {
      const msg = err?.message || 'No se pudieron actualizar los dorsales en lote.';
      setRegsError(msg);
      throw new Error(msg);
    }
  };

  const handleToggleCheckIn = async (reg) => {
    setRegBusyId(reg.id);
    setRegsError('');
    try {
      const nextCheckedIn = !reg.checkedIn;
      const checkedInAt = nextCheckedIn ? Date.now() : null;
      await updateRegistrationStatus(reg.id, {
        checkedIn: nextCheckedIn,
        checkedInAt,
      }, reg);
      const updatedReg = {
        ...reg,
        checkedIn: nextCheckedIn,
        checkedInAt,
        updatedAt: Date.now(),
      };
      setRegistrations((prev) =>
        prev.map((item) => (item.id === reg.id ? updatedReg : item))
      );
      syncPublicRunnerStatus(updatedReg).catch(() => {});
    } catch (err) {
      setRegsError(err?.message || 'No se pudo actualizar la acreditación.');
    } finally {
      setRegBusyId('');
    }
  };

  const handlePrintAccreditationSheet = () => {
    openPrintableAccreditationSheet({
      raceConfig: draft,
      registrations,
      bibDrafts,
    });
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
      await deleteRegistrationRecord(reg.id, reg);
      const remaining = registrations.filter((item) => item.id !== reg.id);
      setRegistrations(remaining);
      const targetDni = normalizeDni(reg.dni);
      if (targetDni) {
        const fallbackSameDni = remaining.find((item) => normalizeDni(item.dni) === targetDni);
        if (fallbackSameDni) {
          syncPublicRunnerStatus(fallbackSameDni).catch(() => {});
        }
      }
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
    const msg = `¡Hola ${reg.fullName}! Te confirmamos desde ${getRaceFullTitle(draft || raceConfig)} que tu inscripción (${reg.code}) en ${reg.distance} está CONFIRMADA.${bibText} ¡Nos vemos en Tornquist!`;
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
        'Precio Base',
        'Monto Final',
        'Beneficio Residente',
        'Nombre y Apellido',
        'DNI',
        'Fecha de Nacimiento',
        'Género',
        'Edad Carrera',
        'Categoría Oficial',
        'Teléfono',
        'Email',
        'Localidad',
        'Team',
        'Talle Remera',
        'Kit / Acreditación',
        'Grupo Sanguíneo',
        'Contacto Emergencia',
        'Tel. Emergencia',
        'Observaciones Médicas',
        'Comprobante URL',
        'Fecha Inscripción',
      ];

      const rows = registrations.map((r) => {
        const cat = resolveRunnerCategory(r, draft);
        const pricing = resolveFrozenRegistrationPricing(r);
        const valorDisplay = pricing.isLocalResident
          ? `${pricing.finalAmount} (${pricing.badgeText})`
          : pricing.finalAmount;
        return [
          r.code || '',
          (r.status || '').toUpperCase(),
          bibDrafts[r.id] ?? r.assignedBib ?? '',
          r.distance || '',
          valorDisplay,
          pricing.originalPrice,
          pricing.finalAmount,
          pricing.isLocalResident ? `${pricing.badgeText} - Verificar DNI` : 'No',
          r.fullName || '',
          r.dni || '',
          r.birthDate || '',
          r.gender || '',
          cat.age !== null ? cat.age : '',
          cat.fullCategory,
          r.phone || '',
          r.email || '',
          r.city || '',
          r.team || '',
          r.shirtSize || '',
          r.checkedIn ? 'ENTREGADO' : 'PENDIENTE',
          r.bloodType || '',
          r.emergencyContactName || '',
          r.emergencyContactPhone || '',
          r.medicalNotes || '',
          r.receiptUrl || '',
          r.createdAt ? new Date(r.createdAt).toLocaleString('es-AR') : '',
        ].map(sanitizeExcelCell);
      });

      const titleRow = [
        `${getRaceFullTitle(draft || raceConfig).toUpperCase()} · PLANILLA DE CORREDORES INSCRIPTOS`,
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
    const syncedDraft = {
      ...draft,
      schedule: syncScheduleWithTargetDate(draft.schedule, draft.targetDateIso),
    };
    setDraft(syncedDraft);
    const res = await onSaveConfig(syncedDraft);
    if (res?.config) {
      setDraft(structuredClone(res.config));
    }
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
    if (!confirmingReset) {
      setConfirmingReset(true);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setConfirmingReset(false);
        resetTimerRef.current = null;
      }, 3000);
      return;
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setConfirmingReset(false);
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

  const handleReorderGalleryPhotos = async (reorderedItems) => {
    setGalleryItems(reorderedItems);
    setPhotoStatus(null);
    try {
      await saveGalleryOrderToFirestore(reorderedItems);
    } catch (err) {
      await loadGalleryItems();
      setPhotoStatus({
        type: 'error',
        message: err?.message || 'No se pudo guardar el nuevo orden de la galería.',
      });
    }
  };

  const activeCircuitDraft = draft.circuits[editDistance];
  const activeTrack = activeCircuitDraft.customGpx || GPX_TRACKS[editDistance];
  const circuitInputBorderClass =
    editDistance === '13K'
      ? 'border border-red-500 focus:border-red-500 focus:outline-none'
      : 'border border-cyan-500 focus:border-cyan-400 focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label={`Panel de Administración ${getRaceTitle(draft || raceConfig)}`}
      onClick={handleSafeClose}
    >
      {/* Modal de conflicto de sesión — se muestra por encima del panel (z-[60]) */}
      {sessionState === 'conflict' && (
        <AdminSessionConflictModal
          conflictInfo={conflictInfo}
          onTakeover={takeover}
          onCancel={cancelEntry}
        />
      )}
      <div
        className={`w-full max-w-5xl ${unlocked ? 'h-[88vh] max-h-[850px]' : 'h-auto max-h-[90dvh]'} rounded-2xl bg-stone-900 border border-orange-500/80 shadow-2xl flex flex-col justify-start overflow-hidden overscroll-contain text-stone-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="px-4 sm:px-5 py-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              {unlocked ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-medium text-white uppercase tracking-wide truncate">
                Panel de Organización · {getRaceTitle(draft || raceConfig)}
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
                aria-label={
                  confirmingLogout
                    ? 'Confirmar cierre de sesión de administrador'
                    : 'Cerrar sesión de administrador'
                }
                className={`inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold px-3.5 py-1.5 cursor-pointer transition-colors ${
                  confirmingLogout
                    ? 'bg-zinc-950 border border-red-500 text-red-400'
                    : 'bg-zinc-950 border border-orange-500/80 hover:border-orange-400 text-orange-400 hover:text-red-500'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className={confirmingLogout ? 'inline' : 'hidden sm:inline'}>
                  {confirmingLogout ? '¿Cerrar sesión?' : 'Salir'}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSafeClose}
              aria-label="Cerrar panel de administración"
              className="ml-2 p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-stone-950 border-b border-stone-800 shrink-0">
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
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-zinc-950 border border-orange-500/80 text-[11px] sm:text-xs font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
                      active ? 'text-orange-400' : 'text-zinc-300 hover:text-orange-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Contenido scrolleable */}
            <div className="relative flex-1 min-h-0 flex flex-col">
              <div
                ref={scrollContainerRef}
                onScroll={checkScrollMore}
                style={{ scrollbarGutter: 'stable' }}
                className="flex-1 min-h-0 overflow-y-scroll overscroll-contain flex flex-col justify-start items-stretch p-4 sm:px-6 sm:py-4 space-y-4"
              >
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
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollTop = 0;
                    }
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
                  mandatoryGear={draft.mandatoryGear}
                  ageCategories={draft.ageCategories}
                  circuits={draft.circuits}
                  setDraft={setDraft}
                  onScheduleChange={handleScheduleChange}
                  onAddSchedule={handleAddSchedule}
                  onRemoveSchedule={handleRemoveSchedule}
                  onFaqChange={handleFaqChange}
                />
              )}

              {activeTab === 'photos' && (
                <AdminPhotosTab
                  raceTitle={getRaceTitle(draft)}
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
                  onReorderGalleryPhotos={handleReorderGalleryPhotos}
                />
              )}

              {activeTab === 'registrations' && (
                <AdminRegistrationsTab
                  raceConfig={draft}
                  regStats={regStats}
                  allRegistrations={registrations}
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
                  regDuplicateFilter={regDuplicateFilter}
                  setRegDuplicateFilter={setRegDuplicateFilter}
                  regShirtFilter={regShirtFilter}
                  setRegShirtFilter={setRegShirtFilter}
                  regCheckInFilter={regCheckInFilter}
                  setRegCheckInFilter={setRegCheckInFilter}
                  bibDrafts={bibDrafts}
                  setBibDrafts={setBibDrafts}
                  regBusyId={regBusyId}
                  onExportExcel={handleExportExcel}
                  onPrintAccreditationSheet={handlePrintAccreditationSheet}
                  onBatchAssignBibs={handleBatchAssignBibs}
                  onConfirmRegistration={handleConfirmRegistration}
                  onChangeRegStatus={handleChangeRegStatus}
                  onToggleCheckIn={handleToggleCheckIn}
                  onDeleteRegistration={handleDeleteRegistration}
                  buildRunnerWhatsappUrl={buildRunnerWhatsappUrl}
                  duplicateBibCount={duplicateInfo.duplicateBibCount}
                  duplicateDniCount={duplicateInfo.duplicateDniCount}
                  duplicateLiveBibs={duplicateInfo.duplicateLiveBibs}
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
            </div>

            {/* Footer fijo con altura constante en todas las pestañas */}
            <div className="relative px-4 sm:px-5 py-3.5 bg-stone-950 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                {activeTab === 'photos' || activeTab === 'registrations' ? (
                  <button
                    type="button"
                    onClick={handleSafeClose}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 border border-orange-500/80 hover:border-orange-400 text-orange-400 text-xs font-semibold px-4 py-2.5 transition-colors cursor-pointer"
                  >
                    Cerrar Panel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={saving}
                    className={`inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold px-4 py-2.5 cursor-pointer transition-colors ${
                      confirmingReset
                        ? 'bg-zinc-950 border border-red-500 text-red-400'
                        : 'bg-zinc-950 border border-orange-500/80 hover:border-orange-400 text-orange-400'
                    }`}
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${confirmingReset ? 'text-red-400' : 'text-orange-500'}`} />
                    {confirmingReset ? '¿Confirmar restauración?' : 'Restaurar valores originales'}
                  </button>
                )}

                {activeTab === 'registrations' && syncMessage && (
                  <span
                    role="status"
                    className={`text-xs font-medium ${syncMessage.ok ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    {syncMessage.text}
                  </span>
                )}
              </div>

              {canScrollMore && (
                <button
                  type="button"
                  onClick={handleScrollDown}
                  title="Ir abajo"
                  aria-label="Ir abajo"
                  className="w-8 h-8 rounded-full bg-transparent hover:bg-zinc-950 border border-orange-500/80 hover:border-orange-400 text-orange-400 flex items-center justify-center shadow-none transition-colors cursor-pointer sm:absolute sm:left-1/2 sm:-translate-x-1/2"
                >
                  <ChevronDown className="w-4 h-4 text-orange-400 animate-bounce" />
                </button>
              )}

              {activeTab === 'photos' ? (
                photoFiles.length > 0 || photoUrl.trim().length > 0 ? (
                  <button
                    type="submit"
                    form="admin-photo-form"
                    disabled={photoSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-display font-medium text-xs sm:text-sm uppercase tracking-wider px-6 py-3 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
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
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 border border-orange-500 hover:border-orange-400 text-orange-400 font-display font-medium text-xs sm:text-sm uppercase tracking-wider px-6 py-3 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-orange-500" />
                    ✓ Listo · Ver Galería en la Web
                  </button>
                )
              ) : activeTab === 'registrations' ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleSyncPublicStatuses}
                    disabled={syncingPublic || regsLoading || registrations.length === 0 || regsSource !== 'firestore'}
                    title="Escribe el estado público de todos los inscriptos (consume escrituras). Usar solo cuando haga falta."
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 border border-orange-500 hover:border-orange-400 text-orange-400 font-display font-medium text-xs sm:text-sm uppercase tracking-wider px-5 py-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className={`w-4 h-4 text-orange-500 ${syncingPublic ? 'animate-pulse' : ''}`} />
                    {syncingPublic ? 'Sincronizando...' : 'Sincronizar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => loadRegistrations({ force: true })}
                    disabled={regsLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 border border-orange-500 hover:border-orange-400 text-orange-400 font-display font-medium text-xs sm:text-sm uppercase tracking-wider px-5 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 text-orange-500 ${regsLoading ? 'animate-spin' : ''}`} />
                    {regsLoading ? 'Actualizando...' : 'Actualizar Inscriptos'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saving || !hasUnsavedChanges}
                  className={`inline-flex items-center gap-2 rounded-xl font-display font-medium text-xs sm:text-sm uppercase tracking-wider px-6 py-3 transition-colors ${
                    hasUnsavedChanges || saving
                      ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50'
                      : 'bg-zinc-950 border border-orange-500/80 text-zinc-400 cursor-default'
                  }`}
                >
                  {hasUnsavedChanges || saving ? (
                    <>
                      <Save className="w-4 h-4" />
                      {saving ? 'Guardando...' : 'Guardar Cambios en Vivo'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      <span>Cambios Guardados</span>
                      <span className="text-orange-400">✓</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
