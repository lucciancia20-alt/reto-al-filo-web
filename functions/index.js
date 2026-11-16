'use strict';

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { processRegistration } = require('./lib/processRegistration');

initializeApp();
const db = getFirestore();

/**
 * Al crearse `registrations/{id}`: genera `publicStatus/code-{code}` y suma a `stats/summary`.
 * - `retry: false`: evita tormentas de reintentos (la transacción es idempotente igualmente).
 * - `maxInstances`: tope de costo ante abuso de altas.
 */
exports.onRegistrationCreate = onDocumentCreated(
  {
    document: 'registrations/{registrationId}',
    region: 'southamerica-east1',
    retry: false,
    maxInstances: 5,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (event) => {
    const registrationId = event.params.registrationId;
    const data = event.data && event.data.data();

    try {
      await processRegistration(db, FieldValue, registrationId, data, logger);
    } catch (error) {
      logger.error('Fallo procesando inscripción.', {
        registrationId,
        message: error && error.message,
        code: error && error.code,
      });
      // Mejor esfuerzo: dejar rastro visible para el admin. "Sincronizar" reconstruye todo.
      try {
        await db
          .collection('registrations')
          .doc(registrationId)
          .set({ publicSyncError: String((error && error.code) || 'unknown') }, { merge: true });
      } catch (markError) {
        logger.error('No se pudo registrar publicSyncError.', {
          registrationId,
          message: markError && markError.message,
        });
      }
    }
  }
);
