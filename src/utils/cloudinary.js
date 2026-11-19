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
