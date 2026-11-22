/**
 * Optimiza dinámicamente una URL de Cloudinary insertando formato automático (WebP/AVIF),
 * compresión inteligente y límite de ancho sin modificar la URL original almacenada en Firestore.
 *
 * @param {string} url - URL original de la imagen.
 * @param {number} [width=1200] - Ancho máximo en píxeles (c_limit).
 * @returns {string} URL optimizada o el valor original si no corresponde a Cloudinary.
 */
export function optimizeCloudinaryUrl(url, width = 1200) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  if (url.includes('f_auto') && url.includes('q_auto')) {
    return url;
  }

  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

/**
 * Arma la URL optimizada de visualización para un comprobante de pago:
 * - Si es una imagen alojada en Cloudinary (`/image/upload/`), inyecta `f_auto,q_auto,w_1200,c_limit`
 *   (si todavía no tiene transformaciones `f_auto`/`q_auto`).
 * - Si es un PDF (`/raw/upload/`, extensión `.pdf` o `format: 'pdf'`), devuelve la URL intacta.
 *
 * @param {string} url - URL original almacenada en Firestore.
 * @param {{ width?: number, format?: string }} [options]
 * @returns {string}
 */
export function getOptimizedReceiptUrl(url, { width = 1200, format = '' } = {}) {
  if (typeof url !== 'string') {
    return url;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  const lowerFormat = String(format || '').trim().toLowerCase();
  const pathname = trimmed.split(/[?#]/)[0].toLowerCase();
  if (
    lowerFormat === 'pdf' ||
    trimmed.includes('/raw/upload/') ||
    pathname.endsWith('.pdf')
  ) {
    return trimmed;
  }

  if (!trimmed.includes('res.cloudinary.com') || !trimmed.includes('/image/upload/')) {
    return trimmed;
  }

  if (trimmed.includes('f_auto') && trimmed.includes('q_auto')) {
    return trimmed;
  }

  return trimmed.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
}

/**
 * Comprime una imagen de comprobante en el navegador mediante HTML5 Canvas antes de subirla:
 * - Solo procesa imágenes (`image/*`, excluyendo SVG); los PDF u otros archivos se devuelven intactos.
 * - Redimensiona manteniendo proporción a un máximo de `maxDimension` px en su lado más largo (nunca agranda).
 * - Exporta como JPEG (`quality = 0.78`) sobre fondo blanco para preservar legibilidad de transparencias.
 * - Si falla cualquier paso o el resultado es igual/más pesado que el original, hace fallback al archivo original.
 *
 * @param {File} file
 * @param {{ maxDimension?: number, quality?: number, outputType?: string }} [options]
 * @returns {Promise<File>}
 */
export async function compressReceiptImage(
  file,
  { maxDimension = 1200, quality = 0.78, outputType = 'image/jpeg' } = {}
) {
  if (!file || typeof file !== 'object') {
    return file;
  }

  const mime = String(file.type || '').toLowerCase();
  const fileName = String(file.name || '');

  // Nunca tocar PDFs ni archivos que no sean imágenes rasterizadas
  if (
    mime === 'application/pdf' ||
    fileName.toLowerCase().endsWith('.pdf') ||
    !mime.startsWith('image/') ||
    mime === 'image/svg+xml'
  ) {
    return file;
  }

  if (typeof document === 'undefined' || typeof Image === 'undefined' || typeof URL === 'undefined') {
    return file;
  }

  let objectUrl = '';
  try {
    objectUrl = URL.createObjectURL(file);

    const img = await new Promise((resolve, reject) => {
      const imageEl = new Image();
      imageEl.onload = () => resolve(imageEl);
      imageEl.onerror = () => reject(new Error('No se pudo decodificar la imagen del comprobante.'));
      imageEl.src = objectUrl;
    });

    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;
    if (!origWidth || !origHeight) {
      return file;
    }

    const longestSide = Math.max(origWidth, origHeight);
    const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
    const targetWidth = Math.max(1, Math.round(origWidth * scale));
    const targetHeight = Math.max(1, Math.round(origHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (outputType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise((resolve) => {
      canvas.toBlob((result) => resolve(result), outputType, quality);
    });

    // Liberar memoria de bitmap en dispositivos móviles
    canvas.width = 0;
    canvas.height = 0;

    if (!blob || blob.size === 0) {
      return file;
    }

    // Fallback si la compresión no redujo el tamaño respecto del original
    if (typeof file.size === 'number' && file.size > 0 && blob.size >= file.size) {
      return file;
    }

    const ext = outputType === 'image/webp' ? 'webp' : 'jpg';
    const baseName = (fileName || 'comprobante').replace(/\.[^.]+$/, '');

    return new File([blob], `${baseName}.${ext}`, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}
