'use strict';

/**
 * Lógica pura (sin dependencias de Firebase) para construir la proyección pública
 * y los contadores. Debe mantenerse alineada con `src/firebase/config.js` del frontend.
 */

// Código legado (RAF-12345) y formato futuro de mayor entropía (RAF-A1B2C3D4).
const CODE_PATTERN = /^RAF-(\d{5}|[A-Z0-9]{8})$/;

const STATS_FIELDS = ['total', 'pending', 'confirmed', 'rejected', 'd27k', 'd13k', 'checkedIn'];

function normalizeCode(rawCode) {
  return String(rawCode || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
}

function isValidCode(rawCode) {
  return CODE_PATTERN.test(normalizeCode(rawCode));
}

function publicStatusKey(rawCode) {
  return `code-${normalizeCode(rawCode)}`;
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

function buildPublicStatusPayload(record, now = new Date()) {
  const rawDist = String(record?.distance || '').toUpperCase();
  return {
    code: normalizeCode(record?.code).slice(0, 30) || 'SIN-COD',
    initials: getRunnerInitials(record?.fullName),
    distance: rawDist.includes('13') ? '13K' : '27K',
    status: mapStatusToPublic(record?.status),
    assignedBib: String(record?.assignedBib || '').trim().slice(0, 20),
    shirtSize: String(record?.shirtSize || '').trim().slice(0, 10),
    checkedIn: Boolean(record?.checkedIn),
    updatedAt: now.toISOString(),
  };
}

/** Aporte de un registro a cada contador de stats/summary. */
function statsContribution(record) {
  const out = Object.fromEntries(STATS_FIELDS.map((f) => [f, 0]));
  if (!record) return out;
  const status = mapStatusToPublic(record.status);
  out.total = 1;
  out[status] = 1;
  const dist = String(record.distance || '').toUpperCase();
  if (dist === '27K' || dist === '21K') out.d27k = 1;
  else if (dist === '13K' || dist === '10K') out.d13k = 1;
  if (status === 'confirmed' && record.checkedIn) out.checkedIn = 1;
  return out;
}

module.exports = {
  STATS_FIELDS,
  normalizeCode,
  isValidCode,
  publicStatusKey,
  getRunnerInitials,
  mapStatusToPublic,
  buildPublicStatusPayload,
  statsContribution,
};
