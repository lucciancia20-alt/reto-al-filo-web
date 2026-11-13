import { RACE_CONFIG, mergeRaceConfig } from '../data/raceConfig';

const LOCAL_CONFIG_STORAGE_KEY = 'reto_al_filo_config_v1';

/**
 * Configuración de Firebase leída desde variables de entorno de Vite (.env.local).
 * Ningún módulo de firebase/* se importa de forma estática para mantener
 * el bundle inicial liviano en conexiones móviles de montaña.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'reto-al-filo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'reto-al-filo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'reto-al-filo.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '707903621149',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:707903621149:web:3e66823ee1f1df32a31ef4',
};

let firestoreBundlePromise = null;
const bibQueryCache = new Map();

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
        const { getApps, getApp, initializeApp } = firebaseAppModule;
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
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
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'wr4ml3tn';
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
    dorsales: Array.isArray(data.dorsales) ? data.dorsales.map(String) : [],
    sector: data.sector || 'Circuito Reto al Filo',
    edicion: Number(data.edicion) || 1,
    timestamp: data.timestamp || Date.now(),
    visible: data.visible !== false,
    aspectClass: data.aspectClass || 'aspect-[4/3]',
  };
}

/**
 * Filtra el dataset local de demostración (6 fotos de la 1ra Edición).
 */
export function filterDemoPhotos(cleanBib, edicion = 1) {
  const basePhotos = RACE_CONFIG.demoPhotos.filter(
    (item) => item.visible !== false && (item.edicion || 1) === edicion
  );

  if (!cleanBib) {
    return basePhotos.map((item) => normalizePhotoRecord(item.id, item));
  }

  return basePhotos
    .filter((item) =>
      item.dorsales.some((dorsal) => dorsal === cleanBib || dorsal.includes(cleanBib))
    )
    .map((item) => normalizePhotoRecord(item.id, item));
}

/**
 * Busca fotografías por número de dorsal:
 * - Si el input está vacío, devuelve las 6 fotos destacadas sin gastar lecturas de Firestore.
 * - Si Firestore está configurado, ejecuta una query indexada:
 *   where("visible", "==", true), where("edicion", "==", edicion),
 *   where("dorsales", "array-contains", cleanBib), limit(20)
 * - Incluye caché en memoria por dorsal y fallback transparente al dataset local
 *   si la colección de Firestore aún no tiene documentos o si no hay señal móvil.
 */
export async function searchPhotosByBib(rawBib, { edicion = 1 } = {}) {
  const cleanBib = String(rawBib || '').trim().replace(/^#/, '');

  if (!cleanBib) {
    return {
      photos: filterDemoPhotos('', edicion),
      source: 'demo-showcase',
    };
  }

  const cacheKey = `${edicion}:${cleanBib}`;
  if (bibQueryCache.has(cacheKey)) {
    return bibQueryCache.get(cacheKey);
  }

  if (isFirebaseConfigured()) {
    try {
      const bundle = await getFirestoreDb();
      if (bundle) {
        const { db, firestore } = bundle;
        const { collection, query, where, limit, getDocs } = firestore;

        const photosQuery = query(
          collection(db, 'photos'),
          where('visible', '==', true),
          where('edicion', '==', edicion),
          where('dorsales', 'array-contains', cleanBib),
          limit(20)
        );

        const snapshot = await getDocs(photosQuery);
        if (!snapshot.empty) {
          const firestorePhotos = snapshot.docs.map((docSnap) =>
            normalizePhotoRecord(docSnap.id, docSnap.data())
          );
          const result = {
            photos: firestorePhotos,
            source: 'firestore',
          };
          bibQueryCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (error) {
      console.warn(
        '[Reto al Filo] Fallback a galería demo local para dorsal:',
        cleanBib,
        error?.code || error?.message
      );
    }
  }

  const demoMatches = filterDemoPhotos(cleanBib, edicion);
  const fallbackResult = {
    photos: demoMatches,
    source: 'demo-fallback',
  };
  bibQueryCache.set(cacheKey, fallbackResult);
  return fallbackResult;
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
 * Publica una nueva fotografía etiquetada por dorsales en la colección `photos` de Firestore.
 */
export async function addPhotoToFirestore({ cloudinaryUrl, dorsales, sector, edicion = 1 }) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase no está configurado en las variables de entorno.');
  }

  const bundle = await getFirestoreDb();
  if (!bundle) {
    throw new Error('No se pudo inicializar Firestore.');
  }

  const cleanDorsales = Array.isArray(dorsales)
    ? dorsales.map((d) => String(d).trim().replace(/^#/, '')).filter(Boolean)
    : String(dorsales || '')
        .split(',')
        .map((d) => d.trim().replace(/^#/, ''))
        .filter(Boolean);

  if (!cloudinaryUrl || cleanDorsales.length === 0) {
    throw new Error('Ingresá la URL de la foto y al menos un número de dorsal.');
  }

  const { db, firestore } = bundle;
  const { collection, addDoc } = firestore;
  const thumbUrl = getCloudinaryUrl(cloudinaryUrl, { width: 800 });
  const fullUrl = getCloudinaryUrl(cloudinaryUrl, { width: 1600 });

  const docRef = await addDoc(collection(db, 'photos'), {
    cloudinaryUrl: fullUrl,
    cloudinaryThumb: thumbUrl,
    dorsales: cleanDorsales,
    sector: sector?.trim() || 'Circuito Reto al Filo',
    edicion: Number(edicion) || 1,
    timestamp: Date.now(),
    visible: true,
  });

  // Limpiar caché de búsquedas para que los dorsales nuevos aparezcan inmediatamente
  for (const bib of cleanDorsales) {
    bibQueryCache.delete(`${Number(edicion) || 1}:${bib}`);
  }

  return { id: docRef.id, dorsales: cleanDorsales };
}

/**
 * Sube una imagen directamente desde el navegador a Cloudinary usando un Upload Preset sin firma (Unsigned).
 */
export async function uploadImageToCloudinary(file, { cloudName, uploadPreset } = {}) {
  if (!file) {
    throw new Error('Seleccioná un archivo de imagen para subir.');
  }

  const targetCloud = (
    cloudName ||
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
    'wr4ml3tn'
  ).trim();
  const targetPreset = (
    uploadPreset ||
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
    'reto_al_filo'
  ).trim();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', targetPreset);
  formData.append('folder', 'reto-al-filo');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(targetCloud)}/image/upload`,
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
  };
}
