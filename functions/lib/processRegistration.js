'use strict';

const {
  STATS_FIELDS,
  isValidCode,
  normalizeCode,
  publicStatusKey,
  buildPublicStatusPayload,
  statsContribution,
} = require('./publicStatus');

/**
 * Procesa una inscripción nueva de forma idempotente.
 *
 * En UNA transacción:
 *  1. Lee la inscripción: si ya tiene `publicSyncedAt`, es un reintento y no hace nada.
 *  2. Crea `publicStatus/code-{code}` (si no existe).
 *  3. Suma +1 a `stats/summary` (increment).
 *  4. Marca la inscripción con `publicSyncedAt` (el marcador que garantiza la idempotencia).
 *
 * Colisión: si `publicStatus/code-{code}` ya existe con datos distintos a los esperados,
 * no se pisa; se marca `codeConflict: true` en la inscripción para revisión del admin.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {{ increment: (n: number) => any, serverTimestamp: () => any }} FieldValue
 * @param {string} registrationId
 * @param {object} data Datos de la inscripción
 * @param {{ info: Function, warn: Function, error: Function }} logger
 * @returns {Promise<{ status: 'created'|'already-processed'|'adopted'|'conflict'|'invalid' }>}
 */
async function processRegistration(db, FieldValue, registrationId, data, logger) {
  if (!registrationId || !data || !isValidCode(data.code)) {
    logger.error('Inscripción con código inválido; se omite.', {
      registrationId,
      code: data && data.code,
    });
    return { status: 'invalid' };
  }

  const regRef = db.collection('registrations').doc(registrationId);
  const publicRef = db.collection('publicStatus').doc(publicStatusKey(data.code));
  const statsRef = db.collection('stats').doc('summary');
  const expected = buildPublicStatusPayload(data);

  const status = await db.runTransaction(async (tx) => {
    // Todas las lecturas ANTES de cualquier escritura.
    const [regSnap, publicSnap] = await Promise.all([tx.get(regRef), tx.get(publicRef)]);

    if (!regSnap.exists) return 'invalid'; // borrada antes de procesarse
    if (regSnap.get('publicSyncedAt')) return 'already-processed';

    let outcome = 'created';
    const regUpdate = { publicSyncedAt: FieldValue.serverTimestamp() };

    if (!publicSnap.exists) {
      tx.create(publicRef, expected);
    } else {
      const existing = publicSnap.data();
      const sameRunner =
        normalizeCode(existing.code) === expected.code &&
        existing.initials === expected.initials &&
        existing.distance === expected.distance;
      if (sameRunner) {
        // Convivencia durante la migración: el cliente ya lo creó con los mismos datos.
        outcome = 'adopted';
      } else {
        outcome = 'conflict';
        regUpdate.codeConflict = true;
      }
    }

    // El contador se actualiza siempre una única vez por inscripción (marcador publicSyncedAt).
    // Si el cliente (versión anterior) también suma, el admin puede recalcular con "Sincronizar".
    const contribution = statsContribution(data);
    const statsUpdate = { updatedAt: Date.now() };
    for (const field of STATS_FIELDS) {
      if (contribution[field]) statsUpdate[field] = FieldValue.increment(contribution[field]);
    }
    tx.set(statsRef, statsUpdate, { merge: true });
    tx.update(regRef, regUpdate);
    return outcome;
  });

  const logFn = status === 'conflict' ? logger.warn : logger.info;
  logFn.call(logger, 'Inscripción procesada.', { registrationId, code: data.code, status });
  return { status };
}

module.exports = { processRegistration };
