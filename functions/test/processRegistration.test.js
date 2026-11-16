'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { processRegistration } = require('../lib/processRegistration');
const { buildPublicStatusPayload, isValidCode } = require('../lib/publicStatus');

const INC = (n) => ({ __inc: n });
const FieldValue = { increment: INC, serverTimestamp: () => ({ __ts: true }) };
const logger = { info() {}, warn() {}, error() {} };

/** Firestore falso mínimo con transacciones, create/set(merge)/update. */
function makeDb(initial = {}) {
  const store = new Map(Object.entries(initial));
  const ref = (path) => ({ path });
  const snap = (path) => {
    const data = store.get(path);
    return { exists: data !== undefined, data: () => data, get: (f) => data && data[f] };
  };
  const db = {
    store,
    collection: (c) => ({ doc: (id) => ref(`${c}/${id}`) }),
    async runTransaction(fn) {
      const writes = [];
      const tx = {
        get: async (r) => snap(r.path),
        create: (r, d) => {
          if (store.has(r.path)) throw new Error('ALREADY_EXISTS');
          writes.push(() => store.set(r.path, { ...d }));
        },
        update: (r, d) => writes.push(() => store.set(r.path, { ...store.get(r.path), ...d })),
        set: (r, d, opts) =>
          writes.push(() => {
            const prev = opts?.merge ? store.get(r.path) || {} : {};
            const next = { ...prev };
            for (const [k, v] of Object.entries(d)) {
              next[k] = v && v.__inc !== undefined ? (Number(prev[k]) || 0) + v.__inc : v;
            }
            store.set(r.path, next);
          }),
      };
      const result = await fn(tx);
      writes.forEach((w) => w());
      return result;
    },
  };
  return db;
}

const REG = {
  code: 'RAF-12345',
  fullName: 'Juan Pablo Perez',
  distance: '27K',
  status: 'pendiente',
  shirtSize: 'M',
  dni: '30123456',
};

test('valida formatos de código', () => {
  assert.ok(isValidCode('raf-12345'));
  assert.ok(isValidCode('RAF-A1B2C3D4'));
  assert.ok(!isValidCode('XYZ-1'));
});

test('crea publicStatus sin datos personales y suma stats una vez', async () => {
  const db = makeDb({ 'registrations/r1': { ...REG } });
  const res = await processRegistration(db, FieldValue, 'r1', REG, logger);
  assert.equal(res.status, 'created');

  const pub = db.store.get('publicStatus/code-RAF-12345');
  assert.deepEqual(Object.keys(pub).sort(), [
    'assignedBib', 'checkedIn', 'code', 'distance', 'initials', 'shirtSize', 'status', 'updatedAt',
  ]);
  assert.equal(pub.initials, 'J. P. P.');
  assert.equal(pub.status, 'pending');

  const stats = db.store.get('stats/summary');
  assert.equal(stats.total, 1);
  assert.equal(stats.pending, 1);
  assert.equal(stats.d27k, 1);
  assert.ok(db.store.get('registrations/r1').publicSyncedAt);
});

test('es idempotente ante reintentos del trigger', async () => {
  const db = makeDb({ 'registrations/r1': { ...REG } });
  await processRegistration(db, FieldValue, 'r1', REG, logger);
  const again = await processRegistration(db, FieldValue, 'r1', REG, logger);
  assert.equal(again.status, 'already-processed');
  assert.equal(db.store.get('stats/summary').total, 1);
});

test('adopta publicStatus preexistente idéntico (migración)', async () => {
  const db = makeDb({
    'registrations/r1': { ...REG },
    'publicStatus/code-RAF-12345': buildPublicStatusPayload(REG),
  });
  const res = await processRegistration(db, FieldValue, 'r1', REG, logger);
  assert.equal(res.status, 'adopted');
  assert.equal(db.store.get('registrations/r1').codeConflict, undefined);
});

test('no pisa un publicStatus ajeno y marca codeConflict', async () => {
  const foreign = buildPublicStatusPayload({ ...REG, fullName: 'Otro Corredor', distance: '13K' });
  const db = makeDb({
    'registrations/r1': { ...REG },
    'publicStatus/code-RAF-12345': foreign,
  });
  const res = await processRegistration(db, FieldValue, 'r1', REG, logger);
  assert.equal(res.status, 'conflict');
  assert.equal(db.store.get('publicStatus/code-RAF-12345').initials, 'O. C.');
  assert.equal(db.store.get('registrations/r1').codeConflict, true);
});

test('omite códigos inválidos o inscripciones borradas', async () => {
  const db = makeDb({});
  assert.equal((await processRegistration(db, FieldValue, 'r1', { ...REG, code: 'MAL' }, logger)).status, 'invalid');
  assert.equal((await processRegistration(db, FieldValue, 'r2', REG, logger)).status, 'invalid');
  assert.equal(db.store.size, 0);
});
