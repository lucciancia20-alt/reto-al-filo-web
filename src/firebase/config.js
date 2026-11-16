import { RACE_CONFIG, mergeRaceConfig, calculateRunnerAgeAtRace } from '../data/raceConfig';

const LOCAL_CONFIG_STORAGE_KEY = 'reto_al_filo_config_v2';
const LOCAL_REGISTRATIONS_STORAGE_KEY = 'reto_al_filo_registrations_v1';
const LOCAL_GALLERY_STORAGE_KEY = 'reto_al_filo_gallery_v1';

/**
 * Configuración de Firebase leída desde variables de entorno de Vite (.env.local).
 * Ningún módulo de firebase/* se importa de forma estática para mantener
 * el bundle inicial liviano en conexiones móviles de montaña.
 */
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'reto-al-filo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'reto-al-filo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'reto-al-filo.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '707903621149',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:707903621149:web:3e66823ee1f1df32a31ef4',
};

let firestoreBundlePromise = null;
let authBundlePromise = null;

const DEFAULT_ADMIN_EMAILS = ['lciancia1972@gmail.com', 'lucianociancia86@gmail.com'];

function resolveFirebaseApp(firebaseAppModule) {
  const { getApps, getApp, initializeApp } = firebaseAppModule;
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

/**
 * Verifica si existen credenciales configuradas para habilitar consultas a Firestore.
 */
export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

/**
 * Inicializa Firebase y Firestore bajo demanda (Lazy Loading) y memoiza la instancia
 * junto con las funciones del SDK modular para evitar múltiples descargas.
 */
export async function getFirestoreDb() {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!firestoreBundlePromise) {
    firestoreBundlePromise = Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
    ])
      .then(([firebaseAppModule, firestoreModule]) => {
        const app = resolveFirebaseApp(firebaseAppModule);
        const db = firestoreModule.getFirestore(app);
        return {
          db,
          firestore: firestoreModule,
        };
      })
      .catch((error) => {
        firestoreBundlePromise = null;
        throw error;
      });
  }

  return firestoreBundlePromise;
}

/**
 * Helper de escalabilidad para Cloudinary:
 * Transforma una URL de Cloudinary o un publicId insertando parámetros de
 * optimización automática (f_auto,q_auto,w_{width}) sin alterar URLs externas (Unsplash).
 */
export function getCloudinaryUrl(urlOrPublicId, { width = 800 } = {}) {
  if (!urlOrPublicId) return '';

  // Si es una URL completa que no pertenece a Cloudinary (ej. Unsplash), se devuelve intacta
  if (urlOrPublicId.startsWith('http://') || urlOrPublicId.startsWith('https://')) {
    if (urlOrPublicId.includes('res.cloudinary.com') && urlOrPublicId.includes('/image/upload/')) {
      if (urlOrPublicId.includes('f_auto') || urlOrPublicId.includes('q_auto')) {
        return urlOrPublicId;
      }
      return urlOrPublicId.replace(
        '/image/upload/',
        `/image/upload/f_auto,q_auto,w_${width}/`
      );
    }
    return urlOrPublicId;
  }

  // Si se recibe un publicId relativo de Cloudinary
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  if (!cloudName) return '';
  const cleanId = urlOrPublicId.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width}/${cleanId}`;
}

/**
 * Normaliza un documento de foto (local o de Firestore) al esquema canónico de la galería.
 */
function normalizePhotoRecord(docId, data) {
  const fullUrl = getCloudinaryUrl(data.cloudinaryUrl, { width: 1600 });
  const thumbUrl = data.cloudinaryThumb
    ? getCloudinaryUrl(data.cloudinaryThumb, { width: 800 })
    : getCloudinaryUrl(data.cloudinaryUrl, { width: 800 });

  return {
    id: docId,
    cloudinaryUrl: fullUrl,
    cloudinaryThumb: thumbUrl,
    sector: data.sector || 'Circuito Reto al Filo',
    edicion: Number(data.edicion) || 1,
    timestamp: data.timestamp || Date.now(),
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : null,
    visible: data.visible !== false,
    aspectClass: data.aspectClass || 'aspect-[4/3]',
  };
}

/**
 * Devuelve las postales locales de demostración filtradas por visibilidad y edición.
 */
export function filterDemoPhotos(_cleanBib = '', edicion = 1) {
  return RACE_CONFIG.demoPhotos
    .filter((item) => item.visible !== false && (item.edicion || 1) === edicion)
    .map((item) => normalizePhotoRecord(item.id, item));
}

/**
 * Lee las fotografías cacheadas localmente de la galería (evita flash de demos al recargar).
 */
export function getLocalCachedGalleryPhotos() {
  try {
    const raw = window.localStorage.getItem(LOCAL_GALLERY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Lee la configuración guardada localmente en el navegador (fallback inmediato).
 */
export function getLocalCachedRaceConfig() {
  try {
    const raw = window.localStorage.getItem(LOCAL_CONFIG_STORAGE_KEY);
    if (!raw) return RACE_CONFIG;
    return mergeRaceConfig(JSON.parse(raw));
  } catch {
    return RACE_CONFIG;
  }
}

/**
 * Descarga la configuración en vivo desde Firestore (`settings/raceConfig`)
 * usando importación diferida. Si no existe o hay error de red, conserva el caché local.
 */
export async function fetchLiveRaceConfig() {
  const localConfig = getLocalCachedRaceConfig();
  if (!isFirebaseConfigured()) {
    return { config: localConfig, source: 'local' };
  }

  try {
    const bundle = await getFirestoreDb();
    if (!bundle) return { config: localConfig, source: 'local' };

    const { db, firestore } = bundle;
    const { doc, getDoc } = firestore;
    const snap = await getDoc(doc(db, 'settings', 'raceConfig'));

    if (snap.exists()) {
      const merged = mergeRaceConfig(snap.data());
      try {
        window.localStorage.setItem(LOCAL_CONFIG_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Ignorar errores de cuota de almacenamiento
      }
      return { config: merged, source: 'firestore' };
    }
  } catch (error) {
    console.warn('[Reto al Filo] No se pudo leer settings/raceConfig:', error?.code || error?.message);
  }

  return { config: localConfig, source: 'local' };
}

/**
 * Guarda la configuración editada desde el Panel Admin en localStorage y Firestore (`settings/raceConfig`).
 */
export async function saveLiveRaceConfig(nextConfig) {
  const merged = mergeRaceConfig(nextConfig);

  try {
    window.localStorage.setItem(LOCAL_CONFIG_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Ignorar error de localStorage en navegación privada estricta
  }

  if (!isFirebaseConfigured()) {
    return { ok: true, config: merged, persistedTo: 'local-only' };
  }

  try {
    const bundle = await getFirestoreDb();
    if (!bundle) {
      return { ok: true, config: merged, persistedTo: 'local-only' };
    }

    const { db, firestore } = bundle;
    const { doc, setDoc } = firestore;
    await setDoc(doc(db, 'settings', 'raceConfig'), {
      ...merged,
      updatedAt: Date.now(),
    });
    return { ok: true, config: merged, persistedTo: 'firestore' };
  } catch (error) {
    console.warn('[Reto al Filo] Error guardando en Firestore:', error?.code || error?.message);
    return {
      ok: true,
      config: merged,
      persistedTo: 'local-only',
      errorCode: error?.code || 'unknown',
    };
  }
}

/**
 * Restaura la configuración original limpiando el caché local y actualizando Firestore.
 */
export async function resetLiveRaceConfig() {
  try {
    window.localStorage.removeItem(LOCAL_CONFIG_STORAGE_KEY);
  } catch {
    // Ignorar
  }
  return saveLiveRaceConfig(RACE_CONFIG);
}

/**
 * Publica una nueva fotografía de muestra en la colección `photos` de Firestore.
 */
export async function addPhotoToFirestore({ cloudinaryUrl, sector, edicion = 1 }) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase no está configurado en las variables de entorno.');
  }

  const bundle = await getFirestoreDb();
  if (!bundle) {
    throw new Error('No se pudo inicializar Firestore.');
  }

  if (!cloudinaryUrl) {
    throw new Error('Elegí una imagen o ingresá la URL de la foto.');
  }

  const { db, firestore } = bundle;
  const { collection, addDoc } = firestore;
  const thumbUrl = getCloudinaryUrl(cloudinaryUrl, { width: 800 });
  const fullUrl = getCloudinaryUrl(cloudinaryUrl, { width: 1600 });

  const docRef = await addDoc(collection(db, 'photos'), {
    cloudinaryUrl: fullUrl,
    cloudinaryThumb: thumbUrl,
    sector: sector?.trim() || 'Postales · 1ra Edición',
    edicion: Number(edicion) || 1,
    timestamp: Date.now(),
    visible: true,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reto-gallery-updated'));
  }

  return { id: docRef.id };
}

/**
 * Obtiene las fotos de la galería desde Firestore (`photos`), ordenadas de la más reciente
 * a la más antigua. Si aún no se subieron fotos propias, devuelve las postales demo locales.
 */
export async function fetchGalleryPhotos() {
  const demoPhotos = filterDemoPhotos('', 1);

  if (!isFirebaseConfigured()) {
    return {
      photos: demoPhotos,
      customCount: 0,
      source: 'demo-showcase',
      networkError: false,
    };
  }

  try {
    const bundle = await getFirestoreDb();
    if (!bundle) {
      return {
        photos: demoPhotos,
        customCount: 0,
        source: 'demo-showcase',
        networkError: false,
      };
    }

    const { db, firestore } = bundle;
    const { collection, getDocs } = firestore;
    const snapshot = await getDocs(collection(db, 'photos'));

    const firestorePhotos = snapshot.docs
      .filter((docSnap) => docSnap.data()?.visible !== false)
      .map((docSnap) => normalizePhotoRecord(docSnap.id, docSnap.data()))
      .sort((a, b) => {
        const aHasOrder = a.order !== null && a.order !== undefined;
        const bHasOrder = b.order !== null && b.order !== undefined;
        if (aHasOrder && bHasOrder && a.order !== b.order) {
          return a.order - b.order;
        }
        if (aHasOrder !== bHasOrder) {
          return aHasOrder ? -1 : 1;
        }
        return (b.timestamp || 0) - (a.timestamp || 0);
      });

    if (firestorePhotos.length > 0) {
      try {
        window.localStorage.setItem(LOCAL_GALLERY_STORAGE_KEY, JSON.stringify(firestorePhotos));
      } catch {
        // Ignorar errores de cuota de almacenamiento
      }
      return {
        photos: firestorePhotos,
        customCount: firestorePhotos.length,
        source: 'firestore',
        networkError: false,
      };
    }

    try {
      window.localStorage.removeItem(LOCAL_GALLERY_STORAGE_KEY);
    } catch {
      // Ignorar errores de almacenamiento
    }

    return {
      photos: demoPhotos,
      customCount: 0,
      source: 'demo-showcase',
      networkError: false,
    };
  } catch (error) {
    console.warn(
      '[Reto al Filo] Fallback a postales demo locales:',
      error?.code || error?.message
    );
    const cached = getLocalCachedGalleryPhotos();
    if (cached) {
      return {
        photos: cached,
        customCount: cached.length,
        source: 'local-cache',
        networkError: true,
      };
    }
    return {
      photos: demoPhotos,
      customCount: 0,
      source: 'demo-fallback',
      networkError: true,
    };
  }
}

/**
 * Elimina una fotografía publicada en la colección `photos` de Firestore.
 */
export async function deletePhotoFromFirestore(photoId) {
  if (!photoId) {
    throw new Error('ID de fotografía inválido.');
  }
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase no está configurado en las variables de entorno.');
  }

  const bundle = await getFirestoreDb();
  if (!bundle) {
    throw new Error('No se pudo inicializar Firestore.');
  }

  const { db, firestore } = bundle;
  const { doc, deleteDoc } = firestore;
  await deleteDoc(doc(db, 'photos', photoId));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reto-gallery-updated'));
  }

  return { ok: true, id: photoId };
}

/**
 * Guarda el orden personalizado de las postales en Firestore mediante un lote (`order: index`),
 * actualiza la caché local y notifica a la galería pública.
 */
export async function saveGalleryOrderToFirestore(orderedPhotos) {
  if (!Array.isArray(orderedPhotos) || orderedPhotos.length === 0) {
    return { ok: true };
  }
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase no está configurado en las variables de entorno.');
  }

  const bundle = await getFirestoreDb();
  if (!bundle) {
    throw new Error('No se pudo inicializar Firestore.');
  }

  const { db, firestore } = bundle;
  const { doc, writeBatch } = firestore;
  const batch = writeBatch(db);

  const normalizedOrdered = orderedPhotos.map((item, idx) => {
    batch.update(doc(db, 'photos', item.id), { order: idx });
    return { ...item, order: idx };
  });

  await batch.commit();

  try {
    window.localStorage.setItem(LOCAL_GALLERY_STORAGE_KEY, JSON.stringify(normalizedOrdered));
  } catch {
    // Ignorar errores de cuota de almacenamiento
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reto-gallery-updated'));
  }

  return { ok: true };
}

export const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/**
 * Valida en cliente tipo MIME y tamaño máximo (8 MB) antes de subir a Cloudinary.
 */
export function validateUploadFile(file) {
  if (!file) {
    throw new Error('Seleccioná un archivo para subir.');
  }

  const mimeType = String(file.type || '').toLowerCase();
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(mimeType)) {
    throw new Error('Formato no permitido. Solo se aceptan archivos JPG, PNG, WEBP o PDF.');
  }

  if (typeof file.size === 'number' && file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('El archivo supera el tamaño máximo permitido de 8 MB.');
  }

  return file;
}

/**
 * Sube una imagen o comprobante (imagen o PDF) directamente desde el navegador a Cloudinary
 * usando un Upload Preset sin firma (Unsigned).
 */
export async function uploadImageToCloudinary(
  file,
  { cloudName, uploadPreset, folder = 'reto-al-filo', resourceType = 'auto' } = {}
) {
  validateUploadFile(file);

  const targetCloud = (
    cloudName ||
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
    ''
  ).trim();
  const targetPreset = (
    uploadPreset ||
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
    ''
  ).trim();

  if (!targetCloud || !targetPreset) {
    throw new Error(
      'Falta configurar VITE_CLOUDINARY_CLOUD_NAME o VITE_CLOUDINARY_UPLOAD_PRESET en las variables de entorno.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', targetPreset);
  formData.append('folder', folder || 'reto-al-filo');

  const safeResourceType = encodeURIComponent(resourceType || 'auto');
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(targetCloud)}/${safeResourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const rawMsg = payload?.error?.message || `Error HTTP ${response.status}`;
    if (rawMsg.toLowerCase().includes('preset')) {
      throw new Error(
        `No se encontró el Upload Preset "${targetPreset}" en Cloudinary (${targetCloud}). Crealo en Cloudinary -> Configuración (⚙️) -> Carga (Upload) -> Upload Presets -> Add Upload Preset con nombre "${targetPreset}" y Modo de firma "Unsigned".`
      );
    }
    throw new Error(`Error al subir a Cloudinary: ${rawMsg}`);
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
    resourceType: payload.resource_type,
    format: payload.format,
  };
}

/**
 * Proyección mínima para almacenamiento local: SOLO id, código RAF, estado y fecha.
 * Nunca se persisten datos personales (DNI, teléfono, datos médicos, etc.) en el navegador.
 */
function toLocalRegistrationStub(item) {
  return {
    id: String(item?.id || ''),
    code: String(item?.code || '').trim().toUpperCase().slice(0, 30),
    status: String(item?.status || 'pendiente'),
    createdAt: Number(item?.createdAt) || 0,
  };
}

function readLocalRegistrations() {
  try {
    const raw = window.localStorage.getItem(LOCAL_REGISTRATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const stubs = parsed.map(toLocalRegistrationStub);
    // Migración: si había datos personales guardados por versiones anteriores, se purgan.
    const hasLegacyPii = parsed.some((item) => item && Object.keys(item).length > 4);
    if (hasLegacyPii) writeLocalRegistrations(stubs);
    return stubs;
  } catch {
    return [];
  }
}

function writeLocalRegistrations(list) {
  try {
    const stubs = (Array.isArray(list) ? list : []).map(toLocalRegistrationStub);
    window.localStorage.setItem(LOCAL_REGISTRATIONS_STORAGE_KEY, JSON.stringify(stubs));
  } catch {
    // Ignorar errores de almacenamiento local
  }
}

// Purga inmediata de datos personales guardados por versiones anteriores.
if (typeof window !== 'undefined') readLocalRegistrations();

// ---------------------------------------------------------------------------
// stats/summary: contadores agregados (1 lectura en vez de N) mantenidos con increment()
// ---------------------------------------------------------------------------
const STATS_FIELDS = ['total', 'pending', 'confirmed', 'rejected', 'd27k', 'd13k', 'checkedIn'];

function statsContribution(record) {
  const out = Object.fromEntries(STATS_FIELDS.map((f) => [f, 0]));
  if (!record) return out;
  const st = String(record.status || '').trim().toLowerCase();
  const confirmed = st === 'confirmado' || st === 'confirmed';
  const rejected = st === 'rechazado' || st === 'rejected';
  out.total = 1;
  if (confirmed) out.confirmed = 1;
  else if (rejected) out.rejected = 1;
  else out.pending = 1;
  const dist = String(record.distance || '').toUpperCase();
  if (dist === '27K' || dist === '21K') out.d27k = 1;
  else if (dist === '13K' || dist === '10K') out.d13k = 1;
  if (confirmed && record.checkedIn) out.checkedIn = 1;
  return out;
}

function buildStatsDelta(before, after) {
  const a = statsContribution(before);
  const b = statsContribution(after);
  const delta = {};
  for (const f of STATS_FIELDS) {
    if (b[f] - a[f] !== 0) delta[f] = b[f] - a[f];
  }
  return delta;
}

async function applyStatsDelta(before, after) {
  const delta = buildStatsDelta(before, after);
  if (Object.keys(delta).length === 0 || !isFirebaseConfigured()) return;
  try {
    const bundle = await getFirestoreDb();
    if (!bundle) return;
    const { db, firestore } = bundle;
    const { doc, setDoc, increment } = firestore;
    const payload = { updatedAt: Date.now() };
    for (const [field, value] of Object.entries(delta)) payload[field] = increment(value);
    await setDoc(doc(db, 'stats', 'summary'), payload, { merge: true });
  } catch (error) {
    // No bloquea el flujo: el admin puede recalcular con el botón "Sincronizar".
    console.warn('[Reto al Filo] No se pudo actualizar stats/summary:', error?.code || error?.message);
  }
}

/**
 * Lee los contadores agregados (1 sola lectura). Devuelve null si no existe o no hay permisos.
 */
export async function fetchRegistrationStats() {
  if (!isFirebaseConfigured()) return null;
  try {
    const bundle = await getFirestoreDb();
    if (!bundle) return null;
    const { db, firestore } = bundle;
    const { doc, getDoc } = firestore;
    const snap = await getDoc(doc(db, 'stats', 'summary'));
    if (!snap.exists()) return null;
    const data = snap.data();
    return Object.fromEntries(STATS_FIELDS.map((f) => [f, Math.max(0, Number(data[f]) || 0)]));
  } catch {
    return null;
  }
}

function generateRegistrationCode() {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `RAF-${randomDigits}`;
}

/**
 * Registra la inscripción de un corredor junto con el link del comprobante subido.
 */
export async function submitRunnerRegistration(payload) {
  const requiredFields = [
    ['fullName', 'Nombre y Apellido'],
    ['dni', 'DNI'],
    ['birthDate', 'Fecha de Nacimiento'],
    ['phone', 'Celular / WhatsApp'],
    ['email', 'Email'],
    ['city', 'Localidad / Provincia'],
    ['emergencyContactName', 'Nombre del contacto de emergencia'],
    ['emergencyContactPhone', 'Teléfono del contacto de emergencia'],
    ['receiptUrl', 'Comprobante de transferencia'],
  ];

  for (const [key, label] of requiredFields) {
    if (!String(payload?.[key] || '').trim()) {
      throw new Error(`Completá el campo obligatorio: ${label}.`);
    }
  }

  const runnerAge = calculateRunnerAgeAtRace(
    payload.birthDate,
    payload.targetDateIso || RACE_CONFIG.targetDateIso
  );
  if (runnerAge === null || runnerAge < 18) {
    throw new Error(
      'La edad mínima para inscribirse es de 18 años cumplidos al día de la carrera.'
    );
  }

  const now = Date.now();
  const record = {
    code: generateRegistrationCode(),
    distance: payload.distance === '13K' ? '13K' : '27K',
    priceSnapshot: String(payload.priceSnapshot || '').trim(),
    fullName: String(payload.fullName).trim(),
    dni: String(payload.dni).trim(),
    birthDate: String(payload.birthDate).trim(),
    gender: String(payload.gender || 'No especificado').trim(),
    phone: String(payload.phone).trim(),
    email: String(payload.email).trim().toLowerCase(),
    city: String(payload.city).trim(),
    team: String(payload.team || '').trim(),
    shirtSize: String(payload.shirtSize || 'M').trim(),
    bloodType: String(payload.bloodType || 'No sabe').trim(),
    emergencyContactName: String(payload.emergencyContactName).trim(),
    emergencyContactPhone: String(payload.emergencyContactPhone).trim(),
    medicalNotes: String(payload.medicalNotes || '').trim(),
    acceptedTerms: Boolean(payload.acceptedTerms),
    receiptUrl: String(payload.receiptUrl).trim(),
    receiptPublicId: String(payload.receiptPublicId || '').trim(),
    receiptFormat: String(payload.receiptFormat || '').trim(),
    status: 'pendiente',
    assignedBib: '',
    createdAt: now,
    updatedAt: now,
  };

  let persistedId = `local-${now}`;
  let persistedTo = 'local-only';
  let errorCode = '';

  if (isFirebaseConfigured()) {
    try {
      const bundle = await getFirestoreDb();
      if (bundle) {
        const { db, firestore } = bundle;
        const { collection, addDoc } = firestore;
        const docRef = await addDoc(collection(db, 'registrations'), record);
        persistedId = docRef.id;
        persistedTo = 'firestore';
      }
    } catch (error) {
      errorCode = error?.code || 'unknown';
      console.warn('[Reto al Filo] Error guardando inscripción en Firestore:', errorCode);
    }
  }

  const savedRecord = { id: persistedId, ...record };
  const localList = readLocalRegistrations();
  writeLocalRegistrations([savedRecord, ...localList]);

  if (persistedTo === 'firestore') {
    await Promise.allSettled([
      syncPublicRunnerStatus(savedRecord),
      applyStatsDelta(null, savedRecord),
    ]);
  }

  return {
    ...savedRecord,
    persistedTo,
    errorCode,
  };
}

/**
 * Obtiene las inscripciones registradas desde Firestore ordenadas de la más reciente a la más antigua.
 */
export async function fetchRegistrations({ signal } = {}) {
  const localList = readLocalRegistrations().sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  if (!isFirebaseConfigured()) {
    return { registrations: localList, source: 'local' };
  }

  try {
    const bundle = await getFirestoreDb();
    if (!bundle) {
      return { registrations: localList, source: 'local' };
    }

    const { db, firestore } = bundle;
    if (signal?.aborted) return { registrations: localList, source: 'local', aborted: true };

    const { collection, getDocs } = firestore;
    const snapshot = await getDocs(collection(db, 'registrations'));

    if (signal?.aborted) return { registrations: localList, source: 'local', aborted: true };

    const remoteList = snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    writeLocalRegistrations(remoteList);
    return { registrations: remoteList, source: 'firestore' };
  } catch (error) {
    console.warn(
      '[Reto al Filo] No se pudieron leer inscripciones de Firestore:',
      error?.code || error?.message
    );
    return {
      registrations: localList,
      source: 'local',
      errorCode: error?.code || 'unknown',
    };
  }
}

/**
 * Actualiza el estado o el número de dorsal asignado de una inscripción.
 */
export async function updateRegistrationStatus(registrationId, updates, previousRecord = null) {
  if (!registrationId) {
    throw new Error('ID de inscripción inválido.');
  }

  const cleanUpdates = {
    ...updates,
    updatedAt: Date.now(),
  };

  if (
    isFirebaseConfigured() &&
    !String(registrationId).startsWith('local-')
  ) {
    const bundle = await getFirestoreDb();
    if (bundle) {
      const { db, firestore } = bundle;
      const { doc, setDoc } = firestore;
      await setDoc(doc(db, 'registrations', registrationId), cleanUpdates, {
        merge: true,
      });
      if (previousRecord) {
        await applyStatsDelta(previousRecord, { ...previousRecord, ...cleanUpdates });
      }
    }
  }

  const localList = readLocalRegistrations().map((item) =>
    item.id === registrationId ? { ...item, ...cleanUpdates } : item
  );
  writeLocalRegistrations(localList);

  return { ok: true, id: registrationId, updates: cleanUpdates };
}

/**
 * Elimina un registro de inscripción desde el Panel Admin.
 */
export async function deleteRegistrationRecord(registrationId, registrationRecord = null) {
  if (!registrationId) {
    throw new Error('ID de inscripción inválido.');
  }

  const localBefore = readLocalRegistrations();
  const targetRecord =
    registrationRecord || localBefore.find((item) => item.id === registrationId) || null;

  if (
    isFirebaseConfigured() &&
    !String(registrationId).startsWith('local-')
  ) {
    const bundle = await getFirestoreDb();
    if (bundle) {
      const { db, firestore } = bundle;
      const { doc, deleteDoc } = firestore;
      await deleteDoc(doc(db, 'registrations', registrationId));

      if (targetRecord) {
        await applyStatsDelta(targetRecord, null);
        const keysToDelete = [];
        const codeKey = normalizeCodeKey(targetRecord.code);
        // `dni-*` es un formato legado (ya no se crea); se limpia por compatibilidad.
        const dniKey = normalizeDniKey(targetRecord.dni);
        if (codeKey) keysToDelete.push(codeKey);
        if (dniKey) keysToDelete.push(dniKey);
        await Promise.allSettled(
          keysToDelete.map((key) => deleteDoc(doc(db, 'publicStatus', key)))
        );
      }
    }
  }

  const localList = localBefore.filter((item) => item.id !== registrationId);
  writeLocalRegistrations(localList);

  return { ok: true, id: registrationId };
}

function normalizeDniKey(rawDni) {
  const digits = String(rawDni || '').replace(/\D/g, '');
  return digits ? `dni-${digits}` : '';
}

function normalizeCodeKey(rawCode) {
  const cleaned = String(rawCode || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
  return cleaned ? `code-${cleaned}` : '';
}

function getRunnerInitials(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'Corredor';
  return parts
    .slice(0, 3)
    .map((p) => `${p.charAt(0).toUpperCase()}.`)
    .join(' ')
    .slice(0, 16);
}

function mapStatusToPublic(rawStatus) {
  const normalized = String(rawStatus || '').trim().toLowerCase();
  if (normalized === 'confirmed' || normalized === 'confirmado') return 'confirmed';
  if (normalized === 'rejected' || normalized === 'rechazado') return 'rejected';
  return 'pending';
}

export function buildPublicStatusPayload(record) {
  const rawDist = String(record?.distance || '').toUpperCase();
  return {
    code: String(record?.code || '').trim().toUpperCase().slice(0, 30) || 'SIN-COD',
    initials: getRunnerInitials(record?.fullName),
    distance: rawDist.includes('13') ? '13K' : '27K',
    status: mapStatusToPublic(record?.status),
    assignedBib: String(record?.assignedBib || '').trim().slice(0, 20),
    shirtSize: String(record?.shirtSize || '').trim().slice(0, 10),
    checkedIn: Boolean(record?.checkedIn),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Sincroniza la proyección pública no sensible (`publicStatus/{lookupId}`) de un corredor.
 */
export async function syncPublicRunnerStatus(record) {
  if (!record || !isFirebaseConfigured()) return { ok: false };

  try {
    const bundle = await getFirestoreDb();
    if (!bundle) return { ok: false };

    const { db, firestore } = bundle;
    const { doc, setDoc } = firestore;
    const payload = buildPublicStatusPayload(record);

    const keys = [normalizeCodeKey(record.code)].filter(Boolean);
    if (keys.length === 0) return { ok: false };

    await Promise.allSettled(
      keys.map((key) => setDoc(doc(db, 'publicStatus', key), payload, { merge: true }))
    );
    return { ok: true };
  } catch (error) {
    console.warn('[Reto al Filo] Error sincronizando publicStatus:', error?.code || error?.message);
    return { ok: false };
  }
}

/**
 * Sincroniza en lote toda la lista de inscriptos hacia `publicStatus` (solo Admin).
 */
export async function syncAllPublicRunnerStatuses(registrationsList = []) {
  if (!isFirebaseConfigured() || !Array.isArray(registrationsList) || registrationsList.length === 0) {
    return { ok: false, count: 0 };
  }

  try {
    const bundle = await getFirestoreDb();
    if (!bundle) return { ok: false, count: 0 };

    const { db, firestore } = bundle;
    const { doc, writeBatch, setDoc } = firestore;

    // Un único documento público por corredor (clave: código RAF).
    const docMap = new Map();
    const legacyDniKeys = new Set();
    for (const reg of registrationsList) {
      const codeKey = normalizeCodeKey(reg.code);
      if (codeKey) docMap.set(codeKey, buildPublicStatusPayload(reg));
      const dniKey = normalizeDniKey(reg.dni);
      if (dniKey) legacyDniKeys.add(dniKey);
    }

    const ops = [
      ...Array.from(docMap.entries()).map(([key, payload]) => ({ type: 'set', key, payload })),
      // Limpieza única de documentos `dni-*` del esquema anterior.
      ...Array.from(legacyDniKeys).map((key) => ({ type: 'delete', key })),
    ];

    const CHUNK_SIZE = 400;
    for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
      const batch = writeBatch(db);
      ops.slice(i, i + CHUNK_SIZE).forEach((op) => {
        const ref = doc(db, 'publicStatus', op.key);
        if (op.type === 'set') batch.set(ref, op.payload, { merge: true });
        else batch.delete(ref);
      });
      await batch.commit();
    }

    // Recalcula stats/summary desde la lista (fuente de verdad) por si hubo desvíos.
    const totals = Object.fromEntries(STATS_FIELDS.map((f) => [f, 0]));
    for (const reg of registrationsList) {
      const c = statsContribution(reg);
      for (const f of STATS_FIELDS) totals[f] += c[f];
    }
    await setDoc(doc(db, 'stats', 'summary'), { ...totals, updatedAt: Date.now() });

    return { ok: true, count: docMap.size };  } catch (error) {
    console.warn('[Reto al Filo] No se pudo sincronizar lote publicStatus:', error?.code || error?.message);
    return { ok: false, count: 0 };
  }
}

function buildLookupCandidates(rawQuery) {
  const upper = String(rawQuery || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!upper) return [];

  // La consulta pública es solo por código RAF (el DNI ya no se usa como clave pública).
  if (/^RAF-?\d{4,}$/.test(upper)) {
    return [`code-RAF-${upper.replace(/^RAF-?/, '')}`];
  }
  if (/^\d{4,}$/.test(upper)) {
    return [`code-RAF-${upper}`];
  }
  return [];
}
/**
 * Consulta pública segura de estado/dorsal por DNI o código RAF-XXXXX.
 */
export async function fetchPublicRunnerStatus(rawQuery) {
  const candidates = buildLookupCandidates(rawQuery);
  if (candidates.length === 0) {
    return { found: false, invalidQuery: true };
  }

  let firestoreErrorCode = '';

  if (isFirebaseConfigured()) {
    try {
      const bundle = await getFirestoreDb();
      if (bundle) {
        const { db, firestore } = bundle;
        const { doc, getDoc } = firestore;

        for (const key of candidates) {
          const snap = await getDoc(doc(db, 'publicStatus', key));
          if (snap.exists()) {
            return {
              found: true,
              source: 'firestore',
              data: snap.data(),
            };
          }
        }
      }
    } catch (error) {
      firestoreErrorCode = error?.code || 'unknown';
      console.warn('[Reto al Filo] Error consultando publicStatus:', firestoreErrorCode);
    }
  }

  // Fallback local (registraciones guardadas en el mismo navegador / modo sin rules o local)
  const localList = readLocalRegistrations();
  const upperCode = String(rawQuery || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const localMatch = localList.find((reg) => {
    const regCode = String(reg.code || '').trim().toUpperCase();
    return upperCode && (regCode === upperCode || regCode === `RAF-${upperCode}`);
  });
  if (localMatch) {
    return {
      found: true,
      source: 'local',
      data: buildPublicStatusPayload(localMatch),
    };
  }

  return {
    found: false,
    source: isFirebaseConfigured() ? 'firestore' : 'local',
    errorCode: firestoreErrorCode,
  };
}

/**
 * Devuelve la lista de correos autorizados para ingresar al Panel de Administración.
 */
export function getAllowedAdminEmails() {
  const rawEnv = import.meta.env.VITE_ADMIN_EMAILS || '';
  const fromEnv = rawEnv
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...fromEnv]));
}

/**
 * Verifica si un correo está en la lista blanca de administradores autorizados.
 */
export function isAuthorizedAdminEmail(email) {
  if (!email) return false;
  const cleanEmail = String(email).trim().toLowerCase();
  return getAllowedAdminEmails().includes(cleanEmail);
}

/**
 * Inicializa Firebase Authentication bajo demanda (Lazy Loading) y memoiza la instancia.
 */
export async function getFirebaseAuth() {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!authBundlePromise) {
    authBundlePromise = Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
    ])
      .then(([firebaseAppModule, authModule]) => {
        const app = resolveFirebaseApp(firebaseAppModule);
        const auth = authModule.getAuth(app);
        auth.languageCode = 'es';
        return {
          auth,
          authModule,
        };
      })
      .catch((error) => {
        authBundlePromise = null;
        throw error;
      });
  }

  return authBundlePromise;
}

const AUTH_ERROR_MESSAGES = {
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    'La API Key de Firebase no es válida o tiene un error de tipeo en las variables de entorno.',
  'auth/operation-not-allowed':
    'Este método de acceso todavía no está activado en Firebase Console. Entrá a Firebase Console -> Compilación -> Authentication -> Método de acceso y activá Google y/o Correo electrónico/contraseña.',
  'auth/configuration-not-found':
    'Firebase Authentication todavía no fue inicializado en este proyecto. Entrá a Firebase Console -> Compilación -> Authentication, hacé clic en "Comenzar" y activá Google y Correo electrónico/contraseña.',
  'auth/unauthorized-domain':
    'Este dominio todavía no está autorizado en Firebase Authentication. Agregalo en Firebase Console -> Authentication -> Settings -> Dominios autorizados.',
  'auth/popup-closed-by-user':
    'Cerraste la ventana de inicio de sesión antes de completar el ingreso.',
  'auth/cancelled-popup-request':
    'Se canceló la solicitud anterior de inicio de sesión. Intentá nuevamente.',
  'auth/popup-blocked':
    'El navegador bloqueó la ventana emergente de Google. Permití las ventanas emergentes para este sitio o ingresá con correo y contraseña.',
  'auth/invalid-credential':
    'El correo o la contraseña son incorrectos. Verificá los datos o usá "¿Olvidaste tu contraseña?".',
  'auth/user-not-found':
    'No existe una cuenta de administrador registrada con ese correo. Verificá los datos o ingresá con Google.',
  'auth/wrong-password':
    'Contraseña incorrecta. Verificá la clave o usá "¿Olvidaste tu contraseña?".',
  'auth/invalid-email':
    'El formato del correo electrónico no es válido.',
  'auth/email-already-in-use':
    'Ese correo ya tiene una cuenta registrada. Iniciá sesión o ingresá con Google.',
  'auth/weak-password':
    'La contraseña es muy débil. Elegí al menos 6 caracteres.',
  'auth/too-many-requests':
    'Demasiados intentos fallidos seguidos. Esperá unos minutos antes de volver a intentar.',
  'auth/network-request-failed':
    'Sin conexión a internet para verificar tu identidad en Firebase.',
};

/**
 * Traduce los errores de Firebase Authentication a mensajes accionables en español.
 */
export function formatAuthError(error) {
  const code = error?.code || '';
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }
  return error?.message || 'No se pudo completar la autenticación con Firebase.';
}

function normalizeAdminUser(user, method = 'firebase') {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email || 'Organizador',
    photoURL: user.photoURL || '',
    method,
  };
}

/**
 * Se suscribe al estado de sesión de Firebase Auth y valida la lista blanca de correos.
 */
export function subscribeToAdminAuth(onChange) {
  if (!isFirebaseConfigured()) {
    onChange(null);
    return () => {};
  }

  let active = true;
  let unsubscribeInner = null;

  getFirebaseAuth()
    .then((bundle) => {
      if (!active || !bundle) {
        onChange(null);
        return;
      }
      const { auth, authModule } = bundle;
      unsubscribeInner = authModule.onAuthStateChanged(auth, (user) => {
        if (!active) return;
        if (user && isAuthorizedAdminEmail(user.email)) {
          onChange(normalizeAdminUser(user, 'firebase'));
        } else {
          onChange(null);
        }
      });
    })
    .catch(() => {
      if (active) onChange(null);
    });

  return () => {
    active = false;
    if (typeof unsubscribeInner === 'function') {
      unsubscribeInner();
    }
  };
}

/**
 * Inicia sesión con cuenta de Google y verifica que el correo sea administrador autorizado.
 */
export async function signInAdminWithGoogle() {
  const bundle = await getFirebaseAuth();
  if (!bundle) {
    throw new Error('Firebase no está configurado en las variables de entorno.');
  }

  const { auth, authModule } = bundle;
  const provider = new authModule.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const credential = await authModule.signInWithPopup(auth, provider);
    const user = credential.user;

    if (!isAuthorizedAdminEmail(user?.email)) {
      await authModule.signOut(auth);
      throw new Error('La cuenta seleccionada no tiene permisos de administrador.');
    }

    return normalizeAdminUser(user, 'google');
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

/**
 * Inicia sesión a un administrador autorizado con correo y contraseña.
 */
export async function signInAdminWithEmail(email, password) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Ingresá tu correo electrónico de administrador.');
  }

  if (!isAuthorizedAdminEmail(cleanEmail)) {
    throw new Error('El correo ingresado no está autorizado para administrar Reto al Filo.');
  }

  if (!password || String(password).length < 6) {
    throw new Error('Ingresá una contraseña de al menos 6 caracteres.');
  }

  const bundle = await getFirebaseAuth();
  if (!bundle) {
    throw new Error('Firebase no está configurado en las variables de entorno.');
  }

  const { auth, authModule } = bundle;

  try {
    const credential = await authModule.signInWithEmailAndPassword(auth, cleanEmail, password);
    return normalizeAdminUser(credential.user, 'email');
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

/**
 * Envía un correo de restablecimiento de contraseña a un administrador autorizado.
 */
export async function sendAdminPasswordReset(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Escribí primero tu correo electrónico para enviarte el enlace de recuperación.');
  }

  if (!isAuthorizedAdminEmail(cleanEmail)) {
    throw new Error('El correo ingresado no está autorizado como administrador.');
  }

  const bundle = await getFirebaseAuth();
  if (!bundle) {
    throw new Error('Firebase no está configurado en las variables de entorno.');
  }

  const { auth, authModule } = bundle;
  try {
    await authModule.sendPasswordResetEmail(auth, cleanEmail);
    return { email: cleanEmail };
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

/**
 * Cierra la sesión actual de Firebase Auth y elimina datos locales sensibles.
 */
export async function signOutAdmin() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LOCAL_REGISTRATIONS_STORAGE_KEY);
    } catch {
      // Ignorar si localStorage no está disponible
    }
  }

  try {
    const bundle = await getFirebaseAuth();
    if (bundle) {
      await bundle.authModule.signOut(bundle.auth);
    }
  } catch (error) {
    console.warn('[Reto al Filo] Error cerrando sesión:', error?.code || error?.message);
  }
}
