import { RACE_CONFIG } from '../data/raceConfig';

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
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'reto-al-filo';
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
