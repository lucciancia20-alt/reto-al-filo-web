import emailjs from '@emailjs/browser';

export const EMAILJS_SERVICE_ID = 'service_g95to2m';
export const EMAILJS_TEMPLATE_ID = 'template_huzo9hw';
export const EMAILJS_PUBLIC_KEY = 'CFqaVqNNdftgIXIYp';
export const DEFAULT_NOTIFICATION_EMAIL = 'lciancia1972@gmail.com';

if (EMAILJS_PUBLIC_KEY) {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

/**
 * Normaliza el correo de destino aplicando fallback seguro al email por defecto.
 */
export function resolveNotificationEmail(rawEmail) {
  return String(rawEmail ?? '').trim() || DEFAULT_NOTIFICATION_EMAIL;
}

/**
 * Envía la notificación de inscripción vía EmailJS con logs de diagnóstico completos.
 */
export async function sendRegistrationNotificationEmail({
  notificationEmail,
  registration,
  uploadedUrl = '',
  raceTitle = '',
}) {
  const toEmail = resolveNotificationEmail(notificationEmail);
  const runnerEmail = String(registration?.email || '').trim();

  const templateParams = {
    to_email: toEmail,
    email: toEmail,
    reply_to: runnerEmail || toEmail,
    carrera: String(raceTitle || '').trim() || 'RETO AL FILO',
    codigo: registration?.code || '-',
    nombre: registration?.fullName || '-',
    distancia: registration?.distance || '-',
    dni: registration?.dni || '-',
    categoria: registration?.gender || '-',
    celular: registration?.phone || '-',
    localidad: registration?.city || '-',
    team: String(registration?.team || '').trim() || 'Sin agrupación',
    remera: registration?.shirtSize || '-',
    comprobante_url: registration?.receiptUrl || uploadedUrl || 'Pendiente de adjuntar',
  };

  console.log('Enviando email EmailJS...', templateParams);

  try {
    return await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      { publicKey: EMAILJS_PUBLIC_KEY }
    );
  } catch (err) {
    console.error('[Reto al Filo] Error en envío EmailJS:', {
      status: err?.status,
      text: err?.text,
      err,
    });
    throw err;
  }
}
