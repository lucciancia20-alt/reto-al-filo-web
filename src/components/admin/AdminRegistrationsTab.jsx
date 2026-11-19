import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Download,
  AlertCircle,
  Users,
  ExternalLink,
  Trash2,
  CheckCircle2,
  MessageCircle,
  ChevronDown,
  Pencil,
  Wallet,
  Printer,
  PackageCheck,
  Shirt,
  Hash,
  Upload,
  Wand2,
  Check,
  X,
} from 'lucide-react';
import { resolveRunnerCategory } from '../../data/raceConfig';

const DNI_HEADER_KEYS = new Set([
  'dni',
  'documento',
  'nro documento',
  'numero documento',
  'numero de documento',
  'doc',
]);

const CODE_HEADER_KEYS = new Set(['codigo', 'code', 'codigo raf', 'cod']);

const BIB_HEADER_KEYS = new Set([
  'dorsal',
  'nro dorsal',
  'numero dorsal',
  'numero de dorsal',
  'nro',
  'numero',
  'bib',
  'chip',
  'nro chip',
  'numero chip',
  '#',
]);

const stripSpreadsheetPrefix = (value) => String(value ?? '').replace(/^'+/, '').trim();

const normalizeExcelHeader = (value) => {
  const raw = String(value ?? '').trim();
  if (raw === '#') return '#';
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, ' ')
    .trim();
};

const normalizeLookupDni = (value) =>
  stripSpreadsheetPrefix(value).replace(/[.\s-]+/g, '').trim().toUpperCase();

const normalizeLookupCode = (value) =>
  stripSpreadsheetPrefix(value).toUpperCase().replace(/[^A-Z0-9-]/g, '');

const isConfirmedStatus = (status) => {
  const st = String(status || '').toLowerCase();
  return st === 'confirmado' || st === 'confirmed';
};

const is13kDistance = (distance) => distance === '13K' || distance === '10K';
const is27kDistance = (distance) => distance === '27K' || distance === '21K';

function collectDuplicateBibs(registrations, overrideBibById) {
  const counts = new Map();
  for (const reg of registrations) {
    const bib = overrideBibById.has(reg.id)
      ? overrideBibById.get(reg.id)
      : String(reg.assignedBib ?? '').trim();
    if (!bib) continue;
    counts.set(bib, (counts.get(bib) || 0) + 1);
  }
  const duplicates = [];
  for (const [bib, count] of counts.entries()) {
    if (count > 1) duplicates.push(bib);
  }
  return duplicates.sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
}

function buildRangePreview({ registrations, start13k, start27k, scope, order }) {
  const s13 = Number.parseInt(start13k, 10);
  const s27 = Number.parseInt(start27k, 10);
  if (!Number.isInteger(s13) || s13 < 1 || !Number.isInteger(s27) || s27 < 1) {
    return { error: 'Los números iniciales de 13K y 27K deben ser enteros mayores o iguales a 1.' };
  }

  const confirmed = registrations.filter((r) => isConfirmedStatus(r.status));
  if (confirmed.length === 0) {
    return { error: 'No hay corredores confirmados para asignar dorsales.' };
  }

  const sorted = [...confirmed].sort((a, b) => {
    if (order === 'alphabetical') {
      const cmp = String(a.fullName || '').localeCompare(String(b.fullName || ''), 'es', {
        sensitivity: 'base',
      });
      return cmp !== 0 ? cmp : (a.createdAt || 0) - (b.createdAt || 0);
    }
    const diff = (a.createdAt || 0) - (b.createdAt || 0);
    if (diff !== 0) return diff;
    return String(a.fullName || '').localeCompare(String(b.fullName || ''), 'es', {
      sensitivity: 'base',
    });
  });

  const list13 = sorted.filter((r) => is13kDistance(r.distance));
  const list27 = sorted.filter((r) => is27kDistance(r.distance));

  const assignments = [];

  if (scope === 'all') {
    if (list13.length > 0 && list27.length > 0) {
      const end13 = s13 + list13.length - 1;
      const end27 = s27 + list27.length - 1;
      if (s13 <= end27 && s27 <= end13) {
        return {
          error: `Los rangos se superponen: 13K usa #${s13}–#${end13} y 27K usa #${s27}–#${end27}. Ajustá los números de inicio para evitar dorsales duplicados.`,
        };
      }
    }
    list13.forEach((reg, idx) => assignments.push({ reg, newBib: String(s13 + idx) }));
    list27.forEach((reg, idx) => assignments.push({ reg, newBib: String(s27 + idx) }));
  } else {
    const usedBibs = new Set();
    for (const r of registrations) {
      const n = Number(String(r.assignedBib ?? '').trim());
      if (Number.isInteger(n) && n > 0) usedBibs.add(n);
    }

    const assignFreeFrom = (targets, startNum) => {
      let cursor = startNum;
      for (const reg of targets) {
        if (String(reg.assignedBib ?? '').trim()) continue;
        while (usedBibs.has(cursor)) {
          cursor += 1;
        }
        assignments.push({ reg, newBib: String(cursor) });
        usedBibs.add(cursor);
        cursor += 1;
      }
    };

    assignFreeFrom(list13, s13);
    assignFreeFrom(list27, s27);
  }

  const overrideById = new Map();
  const changes = [];
  let count13k = 0;
  let count27k = 0;

  for (const { reg, newBib } of assignments) {
    overrideById.set(reg.id, newBib);
    const oldBib = String(reg.assignedBib ?? '').trim();
    if (oldBib === newBib) continue;
    changes.push({
      id: reg.id,
      fullName: reg.fullName || 'Sin nombre',
      dni: reg.dni || '',
      distance: reg.distance || '',
      oldBib,
      newBib,
    });
    if (is13kDistance(reg.distance)) count13k += 1;
    else if (is27kDistance(reg.distance)) count27k += 1;
  }

  if (changes.length === 0) {
    return {
      notice:
        scope === 'missing'
          ? 'Todos los corredores confirmados ya tienen dorsal asignado (0 escrituras en Firestore).'
          : 'Los dorsales de todos los confirmados ya coinciden con el rango indicado (0 escrituras en Firestore).',
    };
  }

  const duplicateWarnings = collectDuplicateBibs(registrations, overrideById);

  return {
    preview: {
      source: 'range',
      changes,
      count13k,
      count27k,
      unchangedCount: assignments.length - changes.length,
      duplicateWarnings,
    },
  };
}

function detectSpreadsheetColumns(rows) {
  const limit = Math.min(rows.length, 20);
  for (let r = 0; r < limit; r += 1) {
    const row = Array.isArray(rows[r]) ? rows[r] : [];
    const normalized = row.map(normalizeExcelHeader);

    let dniCol = normalized.findIndex((h) => DNI_HEADER_KEYS.has(h));
    if (dniCol === -1) {
      dniCol = normalized.findIndex((h) => h.includes('dni') || h.includes('documento'));
    }

    let codeCol = normalized.findIndex((h) => CODE_HEADER_KEYS.has(h));
    if (codeCol === -1) {
      codeCol = normalized.findIndex((h) => h.includes('codigo raf'));
    }

    let bibCol = normalized.findIndex((h) => BIB_HEADER_KEYS.has(h));
    if (bibCol === -1) {
      bibCol = normalized.findIndex((h) => h.includes('dorsal') || h.includes('bib'));
    }

    if (bibCol !== -1 && (dniCol !== -1 || codeCol !== -1)) {
      return { headerRowIdx: r, dniCol, codeCol, bibCol };
    }
  }
  return null;
}

function buildExcelPreview({ rows, registrations, fileName }) {
  const cols = detectSpreadsheetColumns(rows);
  if (!cols) {
    return {
      error:
        'No se detectaron las columnas necesarias en la primera hoja. Asegurate de tener una columna Dorsal / Bib / Chip y una columna DNI o Código RAF.',
    };
  }

  const byCode = new Map();
  const byDni = new Map();
  for (const reg of registrations) {
    const codeKey = normalizeLookupCode(reg.code);
    if (codeKey) byCode.set(codeKey, reg);

    const dniKey = normalizeLookupDni(reg.dni);
    if (dniKey) {
      if (!byDni.has(dniKey)) byDni.set(dniKey, []);
      byDni.get(dniKey).push(reg);
    }
  }

  const matchedById = new Map();
  let unmatchedCount = 0;
  let ambiguousCount = 0;
  let emptyBibCount = 0;

  for (let r = cols.headerRowIdx + 1; r < rows.length; r += 1) {
    const row = Array.isArray(rows[r]) ? rows[r] : [];
    if (row.every((cell) => String(cell ?? '').trim() === '')) continue;

    const rawBib = stripSpreadsheetPrefix(row[cols.bibCol]).slice(0, 20);
    if (!rawBib) {
      emptyBibCount += 1;
      continue;
    }

    const rawCode = cols.codeCol !== -1 ? normalizeLookupCode(row[cols.codeCol]) : '';
    const rawDni = cols.dniCol !== -1 ? normalizeLookupDni(row[cols.dniCol]) : '';

    let matchedReg = null;
    if (rawCode) {
      matchedReg =
        byCode.get(rawCode) ||
        (/^\d{4,}$/.test(rawCode) ? byCode.get(`RAF-${rawCode}`) : null) ||
        null;
    }

    if (!matchedReg && rawDni) {
      const dniMatches = byDni.get(rawDni) || [];
      if (dniMatches.length === 1) {
        matchedReg = dniMatches[0];
      } else if (dniMatches.length > 1) {
        ambiguousCount += 1;
        continue;
      }
    }

    if (!matchedReg) {
      unmatchedCount += 1;
      continue;
    }

    matchedById.set(matchedReg.id, { reg: matchedReg, newBib: rawBib });
  }

  const overrideById = new Map();
  const changes = [];
  let unchangedCount = 0;
  let count13k = 0;
  let count27k = 0;

  for (const [id, { reg, newBib }] of matchedById.entries()) {
    overrideById.set(id, newBib);
    const oldBib = String(reg.assignedBib ?? '').trim();
    if (oldBib === newBib) {
      unchangedCount += 1;
      continue;
    }
    changes.push({
      id,
      fullName: reg.fullName || 'Sin nombre',
      dni: reg.dni || '',
      distance: reg.distance || '',
      oldBib,
      newBib,
    });
    if (is13kDistance(reg.distance)) count13k += 1;
    else if (is27kDistance(reg.distance)) count27k += 1;
  }

  if (changes.length === 0) {
    if (matchedById.size === 0) {
      return {
        error: `No se pudo cruzar ninguna fila de "${fileName}" con los inscriptos actuales (revisá Código RAF o DNI, y que la columna Dorsal tenga valores).`,
      };
    }
    return {
      notice: `Todos los dorsales coincidentes (${unchangedCount}) ya estaban cargados con el mismo número (0 escrituras en Firestore).`,
    };
  }

  const duplicateWarnings = collectDuplicateBibs(registrations, overrideById);

  return {
    preview: {
      source: 'excel',
      fileName,
      changes,
      count13k,
      count27k,
      unchangedCount,
      unmatchedCount,
      ambiguousCount,
      emptyBibCount,
      duplicateWarnings,
    },
  };
}

export default function AdminRegistrationsTab({
  raceConfig,
  regStats,
  allRegistrations = [],
  registrationsCount,
  filteredRegistrations,
  regsLoading,
  regsError,
  regsSource,
  regSearch,
  setRegSearch,
  regDistanceFilter,
  setRegDistanceFilter,
  regStatusFilter,
  setRegStatusFilter,
  regDuplicateFilter = 'none',
  setRegDuplicateFilter,
  regShirtFilter = 'all',
  setRegShirtFilter,
  regCheckInFilter = 'all',
  setRegCheckInFilter,
  bibDrafts,
  setBibDrafts,
  regBusyId,
  onExportExcel,
  onPrintAccreditationSheet,
  onBatchAssignBibs,
  onConfirmRegistration,
  onChangeRegStatus,
  onToggleCheckIn,
  onDeleteRegistration,
  buildRunnerWhatsappUrl,
  duplicateBibCount = 0,
  duplicateDniCount = 0,
  duplicateLiveBibs,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [editingBibIds, setEditingBibIds] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'asc' });
  const [pendingStatusAction, setPendingStatusAction] = useState({});
  const [pendingKitAction, setPendingKitAction] = useState({});
  const [showBibTools, setShowBibTools] = useState(false);
  const [rangeStart13k, setRangeStart13k] = useState('1');
  const [rangeStart27k, setRangeStart27k] = useState('201');
  const [rangeScope, setRangeScope] = useState('missing');
  const [rangeOrder, setRangeOrder] = useState('createdAt');
  const [batchPreview, setBatchPreview] = useState(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [bibToolsError, setBibToolsError] = useState('');
  const [bibToolsNotice, setBibToolsNotice] = useState('');
  const excelInputRef = useRef(null);
  const statusTimersRef = useRef({});
  const kitTimersRef = useRef({});

  useEffect(() => {
    const statusTimers = statusTimersRef.current;
    const kitTimers = kitTimersRef.current;
    return () => {
      Object.values(statusTimers).forEach((timerId) => clearTimeout(timerId));
      Object.values(kitTimers).forEach((timerId) => clearTimeout(timerId));
    };
  }, []);

  const clearPendingAction = (timersRef, setState, id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setState((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const armPendingAction = (timersRef, setState, id, targetAction) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
    }
    setState((prev) => ({
      ...prev,
      [id]: targetAction,
    }));
    timersRef.current[id] = setTimeout(() => {
      delete timersRef.current[id];
      setState((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 3000);
  };

  const handleSort = (field) => {
    if (regDuplicateFilter !== 'none' && filteredRegistrations.length === 0) {
      setRegDuplicateFilter?.('none');
    }
    setSortConfig((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' }
    );
  };

  const sortedRegistrations = useMemo(() => {
    if (!sortConfig.field) return filteredRegistrations;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    const compareNames = (a, b) =>
      String(a.fullName || '').localeCompare(String(b.fullName || ''), 'es', {
        sensitivity: 'base',
      });

    return [...filteredRegistrations].sort((a, b) => {
      if (sortConfig.field === 'fullName') {
        return compareNames(a, b) * dir;
      }
      if (sortConfig.field === 'dni') {
        const digitsA = String(a.dni || '').replace(/\D/g, '');
        const digitsB = String(b.dni || '').replace(/\D/g, '');
        const numA = digitsA ? Number(digitsA) : NaN;
        const numB = digitsB ? Number(digitsB) : NaN;
        if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) {
          return (numA - numB) * dir;
        }
        return (
          String(a.dni || '').localeCompare(String(b.dni || ''), 'es', { numeric: true }) * dir ||
          compareNames(a, b)
        );
      }
      if (sortConfig.field === 'status') {
        const rankMap =
          sortConfig.direction === 'asc'
            ? { pendiente: 0, confirmado: 1, rechazado: 2 }
            : { confirmado: 0, pendiente: 1, rechazado: 2 };
        const diff = (rankMap[a.status] ?? 9) - (rankMap[b.status] ?? 9);
        return diff !== 0 ? diff : compareNames(a, b);
      }
      if (sortConfig.field === 'bib') {
        const rawA = String(bibDrafts[a.id] ?? a.assignedBib ?? '').trim();
        const rawB = String(bibDrafts[b.id] ?? b.assignedBib ?? '').trim();
        const numA = rawA !== '' ? Number(rawA) : NaN;
        const numB = rawB !== '' ? Number(rawB) : NaN;
        const hasA = rawA !== '' && Number.isFinite(numA);
        const hasB = rawB !== '' && Number.isFinite(numB);
        if (!hasA && !hasB) return compareNames(a, b);
        if (!hasA) return 1;
        if (!hasB) return -1;
        return numA !== numB ? (numA - numB) * dir : compareNames(a, b);
      }
      return 0;
    });
  }, [filteredRegistrations, sortConfig, bibDrafts]);

  const renderSortButton = (field, label) => {
    const isActive = sortConfig.field === field;
    const arrow = isActive ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇅';
    return (
      <button
        key={field}
        type="button"
        onClick={() => handleSort(field)}
        aria-label={`Ordenar por ${label}`}
        className={`inline-flex items-center gap-1 rounded-lg bg-stone-950 border px-2 py-1 text-[11px] transition-colors cursor-pointer ${
          isActive
            ? 'border-orange-500 text-orange-400 font-medium'
            : 'border-orange-500/40 text-white/85 hover:text-white font-medium'
        }`}
      >
        <span>{label}</span>
        <span className="text-[9px] leading-none">{arrow}</span>
      </button>
    );
  };

  const handleToggleDuplicateFilter = (filterValue) => {
    setSortConfig({ field: null, direction: 'asc' });
    if (regDuplicateFilter === filterValue) {
      setRegDuplicateFilter?.('none');
    } else {
      setRegDistanceFilter('all');
      setRegStatusFilter('all');
      setRegDuplicateFilter?.(filterValue);
    }
  };

  const renderDuplicateFilterButton = (filterValue, label, count) => {
    const isActive = regDuplicateFilter === filterValue;
    const hasDuplicates = count > 0;

    return (
      <button
        key={filterValue}
        type="button"
        onClick={() => handleToggleDuplicateFilter(filterValue)}
        aria-pressed={isActive}
        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] transition-colors cursor-pointer ${
          isActive
            ? 'bg-stone-950 border-red-500 ring-1 ring-red-500/50 text-white font-medium'
            : 'bg-stone-950 border-orange-500/60 text-zinc-200 hover:border-orange-400 hover:text-white font-medium'
        }`}
      >
        {hasDuplicates && (
          <span aria-hidden="true" className="text-[11px] leading-none text-red-500">
            ⚠
          </span>
        )}
        <span>{label}</span>
        <span className={hasDuplicates ? 'text-red-500 font-medium' : 'text-zinc-500'}>
          ({count})
        </span>
        {isActive && (
          <span
            aria-hidden="true"
            className="ml-0.5 text-[10px] leading-none text-red-500 font-medium"
          >
            ✕
          </span>
        )}
      </button>
    );
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const startEditingBib = (id) => {
    setEditingBibIds((prev) => ({
      ...prev,
      [id]: true,
    }));
    window.requestAnimationFrame(() => {
      const input = document.getElementById(`bib-${id}`);
      if (input) {
        input.focus();
        input.select?.();
      }
    });
  };

  const handleSaveOrConfirm = async (reg) => {
    await onConfirmRegistration(reg);
    setEditingBibIds((prev) => ({
      ...prev,
      [reg.id]: false,
    }));
  };

  const handleStatusButtonClick = async (reg, { isConfirmed, isAlreadySaved }) => {
    if (isConfirmed && !isAlreadySaved) {
      clearPendingAction(statusTimersRef, setPendingStatusAction, reg.id);
      await handleSaveOrConfirm(reg);
      return;
    }

    const targetAction = isConfirmed ? 'unconfirm' : 'confirm';
    if (pendingStatusAction[reg.id] === targetAction) {
      clearPendingAction(statusTimersRef, setPendingStatusAction, reg.id);
      if (targetAction === 'unconfirm') {
        await onChangeRegStatus(reg, 'pendiente');
      } else {
        await handleSaveOrConfirm(reg);
      }
      return;
    }

    armPendingAction(statusTimersRef, setPendingStatusAction, reg.id, targetAction);
  };

  const handleKitButtonClick = async (reg) => {
    const targetAction = reg.checkedIn ? 'revoke' : 'deliver';
    if (pendingKitAction[reg.id] === targetAction) {
      clearPendingAction(kitTimersRef, setPendingKitAction, reg.id);
      await onToggleCheckIn?.(reg);
      return;
    }

    armPendingAction(kitTimersRef, setPendingKitAction, reg.id, targetAction);
  };

  const handlePreviewRangeAssignment = () => {
    setBibToolsError('');
    setBibToolsNotice('');
    const result = buildRangePreview({
      registrations: allRegistrations,
      start13k: rangeStart13k,
      start27k: rangeStart27k,
      scope: rangeScope,
      order: rangeOrder,
    });
    if (result.error) {
      setBatchPreview(null);
      setBibToolsError(result.error);
      return;
    }
    if (result.notice) {
      setBatchPreview(null);
      setBibToolsNotice(result.notice);
      return;
    }
    setBatchPreview(result.preview);
  };

  const handleImportExcelFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setBibToolsError('');
    setBibToolsNotice('');
    setBatchPreview(null);

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      if (!firstSheetName) {
        setBibToolsError('El archivo Excel no contiene hojas.');
        return;
      }
      const ws = wb.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const result = buildExcelPreview({
        rows,
        registrations: allRegistrations,
        fileName: file.name,
      });

      if (result.error) {
        setBibToolsError(result.error);
        return;
      }
      if (result.notice) {
        setBibToolsNotice(result.notice);
        return;
      }
      setBatchPreview(result.preview);
    } catch (err) {
      setBibToolsError(err?.message || 'No se pudo leer el archivo Excel o CSV.');
    }
  };

  const handleConfirmBatchSave = async () => {
    if (!batchPreview || batchPreview.changes.length === 0 || !onBatchAssignBibs) return;
    setBatchSaving(true);
    setBibToolsError('');
    setBibToolsNotice('');
    try {
      const payload = batchPreview.changes.map((item) => ({
        id: item.id,
        assignedBib: item.newBib,
      }));
      const res = await onBatchAssignBibs(payload);
      const updatedCount = res?.updatedCount ?? payload.length;
      setEditingBibIds((prev) => {
        const next = { ...prev };
        for (const item of payload) {
          delete next[item.id];
        }
        return next;
      });
      setBatchPreview(null);
      setBibToolsNotice(
        `¡Listo! Se actualizaron ${updatedCount} ${updatedCount === 1 ? 'dorsal' : 'dorsales'} en Firestore y en la consulta pública.`
      );
    } catch (err) {
      setBibToolsError(err?.message || 'Error guardando los dorsales en lote.');
    } finally {
      setBatchSaving(false);
    }
  };

  const handleCancelBatchPreview = () => {
    setBatchPreview(null);
    setBibToolsError('');
  };

  const hasSpecificFilter =
    regDistanceFilter !== 'all' ||
    regStatusFilter !== 'all' ||
    regDuplicateFilter !== 'none' ||
    regShirtFilter !== 'all' ||
    regCheckInFilter !== 'all';

  return (
    <div className="space-y-3">
      {/* Resumen de contadores (filtros rápidos sincronizados) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          {
            label: 'Total',
            value: regStats.total,
            tone: 'text-stone-100',
            inactiveClass: 'bg-zinc-950 border-white',
            activeClass: 'bg-zinc-950 border-white ring-2 ring-white/85 ring-offset-2 ring-offset-zinc-950',
            labelClass: 'text-white',
            dotClass: 'bg-white',
            isActive: !hasSpecificFilter,
            onClick: () => {
              setRegDuplicateFilter?.('none');
              setRegDistanceFilter('all');
              setRegStatusFilter('all');
              setRegShirtFilter?.('all');
              setRegCheckInFilter?.('all');
            },
          },
          {
            label: 'Confirmados',
            value: regStats.confirmed,
            tone: 'text-emerald-400',
            inactiveClass: 'bg-zinc-950 border-emerald-400 hover:border-emerald-300',
            activeClass: 'bg-zinc-950 border-emerald-400 ring-2 ring-emerald-400/85 ring-offset-2 ring-offset-zinc-950',
            labelClass: 'text-emerald-400',
            dotClass: 'bg-emerald-400',
            isActive: regStatusFilter === 'confirmado' && regDuplicateFilter === 'none',
            onClick: () => {
              const isAlreadyActive =
                regStatusFilter === 'confirmado' &&
                regDistanceFilter === 'all' &&
                regDuplicateFilter === 'none';
              setRegDuplicateFilter?.('none');
              setRegDistanceFilter('all');
              setRegStatusFilter(isAlreadyActive ? 'all' : 'confirmado');
            },
          },
          {
            label: 'Pendientes',
            value: regStats.pending,
            tone: 'text-amber-400',
            inactiveClass: 'bg-zinc-950 border-amber-400 hover:border-amber-300',
            activeClass: 'bg-zinc-950 border-amber-400 ring-2 ring-amber-400/85 ring-offset-2 ring-offset-zinc-950',
            labelClass: 'text-amber-400',
            dotClass: 'bg-amber-400',
            isActive: regStatusFilter === 'pendiente' && regDuplicateFilter === 'none',
            onClick: () => {
              const isAlreadyActive =
                regStatusFilter === 'pendiente' &&
                regDistanceFilter === 'all' &&
                regDuplicateFilter === 'none';
              setRegDuplicateFilter?.('none');
              setRegDistanceFilter('all');
              setRegStatusFilter(isAlreadyActive ? 'all' : 'pendiente');
            },
          },
          {
            label: '27K',
            value: regStats.count27k,
            tone: 'text-cyan-400',
            inactiveClass: 'bg-zinc-950 border-cyan-400 hover:border-cyan-300',
            activeClass: 'bg-zinc-950 border-cyan-400 ring-2 ring-cyan-400/85 ring-offset-2 ring-offset-zinc-950',
            labelClass: 'text-cyan-400',
            dotClass: 'bg-cyan-300',
            isActive: regDistanceFilter === '27K' && regDuplicateFilter === 'none',
            onClick: () => {
              const isAlreadyActive =
                regDistanceFilter === '27K' &&
                regStatusFilter === 'all' &&
                regDuplicateFilter === 'none';
              setRegDuplicateFilter?.('none');
              setRegStatusFilter('all');
              setRegDistanceFilter(isAlreadyActive ? 'all' : '27K');
            },
          },
          {
            label: '13K',
            value: regStats.count13k,
            tone: 'text-red-500',
            inactiveClass: 'bg-zinc-950 border-red-500 hover:border-red-400',
            activeClass: 'bg-zinc-950 border-red-500 ring-2 ring-red-500/85 ring-offset-2 ring-offset-zinc-950',
            labelClass: 'text-red-500',
            dotClass: 'bg-red-400',
            isActive: regDistanceFilter === '13K' && regDuplicateFilter === 'none',
            onClick: () => {
              const isAlreadyActive =
                regDistanceFilter === '13K' &&
                regStatusFilter === 'all' &&
                regDuplicateFilter === 'none';
              setRegDuplicateFilter?.('none');
              setRegStatusFilter('all');
              setRegDistanceFilter(isAlreadyActive ? 'all' : '13K');
            },
          },
        ].map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={stat.onClick}
            aria-pressed={stat.isActive}
            className={`rounded-2xl border-2 p-2.5 text-center cursor-pointer transition-all ${stat.tone} ${
              stat.isActive ? stat.activeClass : stat.inactiveClass
            }`}
          >
            <span
              className={`flex items-center justify-center gap-1.5 text-[10px] leading-4 uppercase tracking-wider font-medium ${
                stat.isActive ? 'text-white' : stat.labelClass
              }`}
            >
              {stat.isActive && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stat.dotClass}`} />}
              <span>{stat.label}</span>
            </span>
            <span className="font-display text-xl font-medium">{stat.value}</span>
          </button>
        ))}
      </div>

      {/* Controles de filtro y exportación */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <select
            aria-label="Filtrar por distancia"
            value={regDistanceFilter}
            onChange={(e) => setRegDistanceFilter(e.target.value)}
            className={`w-fit rounded-xl bg-zinc-950 border focus:outline-none pl-2 pr-1.5 py-1.5 text-[11px] xl:text-xs transition-colors shrink-0 ${
              regDistanceFilter === '27K'
                ? 'text-cyan-400 font-medium border-cyan-500/60 focus:border-cyan-400'
                : regDistanceFilter === '13K'
                  ? 'text-red-500 font-medium border-red-500/60 focus:border-red-500'
                  : 'text-white font-semibold border-white/15 focus:border-orange-400'
            }`}
          >
            <option value="all" className="bg-stone-950 text-white font-normal">
              Todas las distancias
            </option>
            <option value="27K" className="bg-stone-950 text-cyan-400 font-medium">
              Solo 27K
            </option>
            <option value="13K" className="bg-stone-950 text-red-500 font-medium">
              Solo 13K
            </option>
          </select>

          <select
            aria-label="Filtrar por estado"
            value={regStatusFilter}
            onChange={(e) => {
              setRegDuplicateFilter?.('none');
              setRegStatusFilter(e.target.value);
            }}
            className={`w-fit rounded-xl bg-zinc-950 border focus:outline-none pl-2 pr-1.5 py-1.5 text-[11px] xl:text-xs transition-colors shrink-0 ${
              regStatusFilter === 'pendiente'
                ? 'text-amber-400 border-amber-500/60 focus:border-amber-400 font-medium'
                : regStatusFilter === 'confirmado'
                  ? 'text-emerald-400 border-emerald-500/60 focus:border-emerald-400 font-medium'
                  : 'text-white font-semibold border-white/15 focus:border-orange-400'
            }`}
          >
            <option value="all" className="bg-stone-950 text-white font-normal">
              Todos los estados
            </option>
            <option value="pendiente" className="bg-stone-950 text-amber-400 font-medium">
              Pendientes
            </option>
            <option value="confirmado" className="bg-stone-950 text-emerald-400 font-medium">
              Confirmados
            </option>
            <option value="rechazado" className="bg-stone-950 text-white font-normal">
              Rechazados
            </option>
          </select>

          <button
            type="button"
            onClick={onExportExcel}
            disabled={registrationsCount === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-950 hover:bg-white/5 text-emerald-400 border border-emerald-500/60 text-[11px] xl:text-xs font-medium px-2 xl:px-2.5 py-1.5 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            Exportar Excel (.XLSX)
          </button>

          <button
            type="button"
            onClick={onPrintAccreditationSheet}
            disabled={(regStats.confirmed || 0) === 0}
            title="Imprimir planilla A4 de acreditación y seguridad SOS ordenada por dorsal"
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900/80 border border-orange-500/70 hover:border-orange-400 text-orange-400 text-[11px] xl:text-xs font-medium px-2 xl:px-2.5 py-1.5 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            Imprimir Planilla Acreditación
          </button>

          <a
            href="https://www.mercadopago.com.ar/activities"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir actividad y transferencias recibidas en Mercado Pago"
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-950 hover:bg-white/5 text-sky-400 border border-sky-500/60 text-[11px] xl:text-xs font-medium px-2 xl:px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Wallet className="w-3.5 h-3.5 shrink-0" />
            <span>Mercado Pago</span>
            <ExternalLink className="w-3 h-3 opacity-80 shrink-0" />
          </a>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setShowBibTools((prev) => !prev);
              setBibToolsError('');
              setBibToolsNotice('');
            }}
            disabled={registrationsCount === 0}
            aria-expanded={showBibTools}
            title="Auto-asignar dorsales por rango o importar planilla de Bahía Corre"
            className={`inline-flex items-center gap-1.5 rounded-xl border text-[11px] xl:text-xs font-medium px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0 ${
              showBibTools
                ? 'bg-orange-500/15 border-orange-400 text-orange-300'
                : 'bg-zinc-900/80 border-orange-500/70 hover:border-orange-400 text-orange-400'
            }`}
          >
            <Hash className="w-3.5 h-3.5 shrink-0" />
            <span>Dorsales / Bahía Corre</span>
          </button>
        </div>

        {/* Panel desplegable de asignación masiva de dorsales (Rangos + Importar Excel Bahía Corre) */}
        {showBibTools && (
          <div className="pt-2.5 border-t border-stone-800/80 space-y-2.5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {/* Bloque 1: Auto-asignar por rango */}
              <div className="rounded-xl bg-zinc-950 border border-stone-800 p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 shrink-0" />
                    Auto-asignar por rango (Confirmados)
                  </h4>
                  <span className="text-[10px] text-stone-400">0 lecturas extra</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label
                      htmlFor="bib-range-13k"
                      className="block text-[10px] font-medium text-red-400 mb-1"
                    >
                      Inicio 13K
                    </label>
                    <input
                      id="bib-range-13k"
                      type="number"
                      min={1}
                      value={rangeStart13k}
                      onChange={(e) => setRangeStart13k(e.target.value)}
                      className="w-full rounded-lg bg-stone-950 border border-red-500/60 focus:border-red-400 focus:outline-none px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="bib-range-27k"
                      className="block text-[10px] font-medium text-cyan-400 mb-1"
                    >
                      Inicio 27K
                    </label>
                    <input
                      id="bib-range-27k"
                      type="number"
                      min={1}
                      value={rangeStart27k}
                      onChange={(e) => setRangeStart27k(e.target.value)}
                      className="w-full rounded-lg bg-stone-950 border border-cyan-500/60 focus:border-cyan-400 focus:outline-none px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label
                      htmlFor="bib-range-scope"
                      className="block text-[10px] font-medium text-stone-400 mb-1"
                    >
                      Alcance
                    </label>
                    <select
                      id="bib-range-scope"
                      value={rangeScope}
                      onChange={(e) => setRangeScope(e.target.value)}
                      className="w-full rounded-lg bg-stone-950 border border-stone-700 focus:border-orange-400 focus:outline-none px-2 py-1 text-[11px] text-white"
                    >
                      <option value="missing">Solo confirmados sin dorsal</option>
                      <option value="all">Reasignar todos los confirmados</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <label
                      htmlFor="bib-range-order"
                      className="text-[10px] text-stone-400 shrink-0"
                    >
                      Orden:
                    </label>
                    <select
                      id="bib-range-order"
                      value={rangeOrder}
                      onChange={(e) => setRangeOrder(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg bg-stone-950 border border-stone-700 focus:border-orange-400 focus:outline-none px-2 py-1 text-[11px] text-white"
                    >
                      <option value="createdAt">Por fecha de inscripción (1° al último)</option>
                      <option value="alphabetical">Alfabético (A → Z)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={batchSaving || (regStats.confirmed || 0) === 0}
                    onClick={handlePreviewRangeAssignment}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-stone-950 hover:bg-white/5 border border-orange-500/70 hover:border-orange-400 text-orange-400 text-[11px] font-semibold px-2.5 py-1 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    <Wand2 className="w-3.5 h-3.5 shrink-0" />
                    Previsualizar Rangos
                  </button>
                </div>
              </div>

              {/* Bloque 2: Importar Excel de Bahía Corre */}
              <div className="rounded-xl bg-zinc-950 border border-stone-800 p-3 flex flex-col justify-between gap-2.5">
                <div className="space-y-1">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    Importar desde Excel de Bahía Corre
                  </h4>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Subí la planilla <span className="font-mono text-stone-300">.xlsx / .xls / .csv</span> que devuelve Bahía Corre con los dorsales/chips. Cruza automáticamente por <strong className="text-stone-200">Código RAF</strong> o <strong className="text-stone-200">DNI</strong> y solo actualiza los registros que cambian.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-stone-500">
                    Columnas aceptadas: Dorsal / Bib / Chip + DNI o Código
                  </span>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleImportExcelFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={batchSaving || registrationsCount === 0}
                    onClick={() => excelInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-stone-950 hover:bg-white/5 border border-emerald-500/70 hover:border-emerald-400 text-emerald-400 text-[11px] font-semibold px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    Subir Excel de Bahía Corre
                  </button>
                </div>
              </div>
            </div>

            {bibToolsError && (
              <div
                role="alert"
                className="rounded-xl bg-zinc-950 border border-rose-500/70 p-2.5 text-xs text-rose-300 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{bibToolsError}</span>
              </div>
            )}

            {bibToolsNotice && (
              <div
                role="status"
                className="rounded-xl bg-zinc-950 border border-emerald-500/60 p-2.5 text-xs text-emerald-300 flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{bibToolsNotice}</span>
              </div>
            )}

            {/* Barra de vista previa y confirmación de lote */}
            {batchPreview && (
              <div className="rounded-xl bg-zinc-950 border border-orange-500/80 p-3 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-white">
                      Listos para actualizar:{' '}
                      <strong className="text-orange-400">{batchPreview.changes.length}</strong>{' '}
                      {batchPreview.changes.length === 1 ? 'dorsal' : 'dorsales'} (
                      <span className="text-red-400">{batchPreview.count13k} en 13K</span> ·{' '}
                      <span className="text-cyan-400">{batchPreview.count27k} en 27K</span>).{' '}
                      <span className="text-stone-400 font-normal">
                        Solo se escribirán los documentos que cambiaron.
                      </span>
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {batchPreview.source === 'excel'
                        ? `Archivo: ${batchPreview.fileName}`
                        : 'Asignación correlativa por rango'}
                      {batchPreview.unchangedCount > 0 &&
                        ` · ${batchPreview.unchangedCount} sin cambios (0 escrituras)`}
                      {batchPreview.unmatchedCount > 0 &&
                        ` · ${batchPreview.unmatchedCount} filas sin coincidencia`}
                      {batchPreview.ambiguousCount > 0 &&
                        ` · ${batchPreview.ambiguousCount} omitidas por DNI duplicado`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={batchSaving}
                      onClick={handleCancelBatchPreview}
                      className="inline-flex items-center gap-1 rounded-lg bg-stone-950 hover:bg-white/5 border border-stone-700 text-stone-300 text-xs font-medium px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={batchSaving || !onBatchAssignBibs}
                      onClick={handleConfirmBatchSave}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold px-3.5 py-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {batchSaving
                        ? 'Guardando...'
                        : `Confirmar y Guardar (${batchPreview.changes.length})`}
                    </button>
                  </div>
                </div>

                {batchPreview.duplicateWarnings?.length > 0 && (
                  <div className="rounded-lg bg-rose-950/40 border border-rose-500/70 px-2.5 py-1.5 text-[11px] text-rose-300">
                    <strong>⚠ Dorsales repetidos detectados:</strong> quedarán duplicados los números{' '}
                    <span className="font-mono font-semibold">
                      {batchPreview.duplicateWarnings.map((b) => `#${b}`).join(', ')}
                    </span>
                    . Revisalos antes o después desde el filtro &quot;Dorsales duplicados&quot;.
                  </div>
                )}

                <div className="max-h-32 overflow-y-auto rounded-lg bg-stone-950 border border-stone-800/90 px-2.5 py-1.5 divide-y divide-stone-800/60 text-[11px]">
                  {batchPreview.changes.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="py-1 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                            is13kDistance(item.distance)
                              ? 'border-red-500/70 text-red-400'
                              : 'border-cyan-500/70 text-cyan-400'
                          }`}
                        >
                          {item.distance}
                        </span>
                        <span className="text-white truncate">{item.fullName}</span>
                        <span className="font-mono text-[10px] text-stone-500 shrink-0">
                          DNI {item.dni}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-orange-400 shrink-0">
                        {item.oldBib ? `#${item.oldBib} → ` : ''}#{item.newBib}
                      </span>
                    </div>
                  ))}
                  {batchPreview.changes.length > 8 && (
                    <div className="py-1 text-center text-[10px] text-stone-400">
                      + {batchPreview.changes.length - 8} corredores más
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resumen en vivo de Talles (Confirmados / Activos) y Acreditación */}
        <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-stone-400 mr-0.5 shrink-0">
              <Shirt className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              Talles:
            </span>
            {(regStats.shirtSizes || []).map((item) => {
              const isSelected = regShirtFilter === item.size;
              return (
                <button
                  key={item.size}
                  type="button"
                  onClick={() => setRegShirtFilter?.(isSelected ? 'all' : item.size)}
                  title={`Filtrar por talle ${item.size}: ${item.confirmed} confirmados de ${item.total} inscriptos no rechazados`}
                  className={`inline-flex items-center gap-0.5 rounded-lg border px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-orange-500/20 border-orange-400 ring-1 ring-orange-400/70 shadow-sm text-white font-medium'
                      : 'bg-zinc-900/80 border-orange-500/60 text-white hover:border-orange-400'
                  }`}
                >
                  <span className="text-white font-semibold">{item.size}:</span>
                  <span>
                    <strong className="text-white font-medium">{item.confirmed}</strong>/{item.total}
                  </span>
                </button>
              );
            })}
            {regShirtFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setRegShirtFilter?.('all')}
                className="text-[10px] text-orange-400 hover:opacity-85 underline ml-1 cursor-pointer"
              >
                Limpiar talle
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-stone-400 mr-0.5 shrink-0">
              <PackageCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Mesa Kit:
            </span>
            <button
              type="button"
              onClick={() =>
                setRegCheckInFilter?.(regCheckInFilter === 'checked' ? 'all' : 'checked')
              }
              className={`rounded-lg border px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                regCheckInFilter === 'checked'
                  ? 'bg-zinc-950 border-orange-500 ring-1 ring-orange-500/70 text-white font-medium'
                  : 'bg-zinc-950 border-orange-500/60 text-white hover:border-orange-400'
              }`}
            >
              Kits entregados ({regStats.checkedInCount || 0})
            </button>
            <button
              type="button"
              onClick={() =>
                setRegCheckInFilter?.(
                  regCheckInFilter === 'pending_checkin' ? 'all' : 'pending_checkin'
                )
              }
              className={`rounded-lg border px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                regCheckInFilter === 'pending_checkin'
                  ? 'bg-zinc-950 border-orange-500 ring-1 ring-orange-500/70 text-white font-medium'
                  : 'bg-zinc-950 border-orange-500/60 text-white hover:border-orange-400'
              }`}
            >
              Pendientes de retirar ({regStats.pendingCheckInCount || 0})
            </button>
          </div>
        </div>

        <p className="text-[11px] text-stone-400">
          Mostrando <strong className="text-stone-200">{filteredRegistrations.length}</strong> de{' '}
          <strong className="text-stone-200">{registrationsCount}</strong> inscripciones · Fuente:{' '}
          <span className="font-mono text-white font-semibold">
            {regsSource === 'firestore' ? 'Firestore en vivo' : 'Respaldo local'}
          </span>
        </p>
      </div>

      {regsError && (
        <div className="rounded-xl bg-stone-950 border border-rose-500/60 p-3 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{regsError}</span>
        </div>
      )}

      {regsLoading ? (
        <div className="rounded-2xl bg-stone-950 border border-stone-800 p-8 text-center text-xs text-stone-400">
          Cargando listado de corredores inscriptos...
        </div>
      ) : (
        <div className="space-y-2">
          {/* Barra compacta de encabezados ordenables, buscador y accesos directos a duplicados */}
          <div className="px-2.5 py-2 rounded-xl bg-stone-950 border border-stone-800 flex flex-wrap items-center gap-2 text-[11px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mr-0.5 hidden sm:inline">
                Ordenar:
              </span>
              {renderSortButton('fullName', 'Nombre y Apellido')}
              {renderSortButton('dni', 'DNI')}
              {renderSortButton('status', 'Estado')}
              {renderSortButton('bib', 'Dorsal #')}
            </div>

            <div className="relative w-full md:w-auto md:flex-1 md:min-w-[200px] md:max-w-md md:mx-auto">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                placeholder="Buscar por nombre, DNI, código RAF, dorsal, localidad..."
                aria-label="Buscar por nombre, DNI, código RAF, dorsal o localidad"
                className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none pl-8 pr-3 py-1.5 text-xs font-mono font-semibold text-white placeholder:text-stone-500"
              />
            </div>

            <div className="ml-auto md:ml-0 flex items-center gap-2 flex-wrap shrink-0">
              {renderDuplicateFilterButton('dorsal', 'Dorsales duplicados', duplicateBibCount)}
              {renderDuplicateFilterButton('dni', 'DNI duplicados', duplicateDniCount)}
            </div>
          </div>

          {filteredRegistrations.length === 0 ? (
            <div className="rounded-2xl bg-stone-950 border border-stone-800 p-8 text-center space-y-1.5">
              <Users className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-sm font-medium text-stone-200">
                {registrationsCount === 0
                  ? 'Todavía no hay corredores inscriptos desde el formulario web.'
                  : 'Ningún inscripto coincide con tu filtro actual.'}
              </p>
              <p className="text-xs text-stone-400">
                Apenas alguien complete el formulario y suba su comprobante, aparecerá aquí al instante.
              </p>
            </div>
          ) : (
            sortedRegistrations.map((reg) => {
            const isBusy = regBusyId === reg.id;
            const isExpanded = expandedId === reg.id;
            const bibValue = bibDrafts[reg.id] ?? reg.assignedBib ?? '';
            const isConfirmed = reg.status === 'confirmado';
            const isEditingBib = Boolean(editingBibIds[reg.id]);
            const isBibLocked = isConfirmed && !isEditingBib;
            const savedBib = String(reg.assignedBib ?? '').trim();
            const currentBib = String(bibValue ?? '').trim();
            const numericBib = currentBib !== '' ? Number(currentBib) : NaN;
            const isDuplicateBib =
              Number.isFinite(numericBib) &&
              numericBib > 0 &&
              Boolean(duplicateLiveBibs?.has(numericBib));
            const isAlreadySaved = isConfirmed && !isEditingBib && currentBib === savedBib;
            const armedStatusAction = pendingStatusAction[reg.id];
            const armedKitAction = pendingKitAction[reg.id];
            const statusBadgeClass =
              reg.status === 'confirmado'
                ? 'bg-zinc-950 text-emerald-400 border-emerald-500/60'
                : reg.status === 'rechazado'
                  ? 'bg-zinc-950 text-rose-400 border-rose-500/60'
                  : 'bg-zinc-950 text-amber-400 border-amber-500/60';

            return (
              <div
                key={reg.id}
                className="rounded-xl bg-stone-950 border border-stone-800 hover:border-stone-700 transition-colors overflow-hidden"
              >
                {/* Fila operativa: apilada en móvil, en línea desde md */}
                <div className="px-2.5 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
                  {/* Identificación rápida del corredor (estructura fija en 2 líneas) */}
                  <div className="w-full md:w-auto md:flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-stone-950 border border-amber-500/60 text-white shrink-0">
                        {reg.code}
                      </span>
                      <span
                        className={`text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded-md border shrink-0 ${
                          reg.distance === '13K'
                            ? 'bg-stone-950 border-red-500 text-red-500'
                            : 'bg-stone-950 border-cyan-500 text-cyan-400'
                        }`}
                      >
                        {reg.distance}
                      </span>
                      <h4
                        title={reg.fullName}
                        className="text-[13px] font-medium text-white whitespace-nowrap truncate min-w-0"
                      >
                        {reg.fullName}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-white font-medium shrink-0">
                        DNI {reg.dni}
                      </span>
                      <span
                        className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border shrink-0 ${statusBadgeClass}`}
                      >
                        {reg.status}
                      </span>
                      {reg.checkedIn && (
                        <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border border-emerald-500/60 bg-zinc-950 text-emerald-400 shrink-0">
                          Kit ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones operativas: bloque completo en móvil, en línea desde md */}
                  <div className="w-full md:w-auto flex flex-wrap items-center gap-1.5 md:gap-1 md:shrink-0">
                    <div
                      className="flex items-center gap-1"
                      title={isDuplicateBib ? 'Dorsal repetido' : undefined}
                    >
                      <label
                        htmlFor={`bib-${reg.id}`}
                        className="text-[11px] font-semibold text-stone-400"
                      >
                        #
                      </label>
                      <input
                        id={`bib-${reg.id}`}
                        type="text"
                        inputMode="numeric"
                        readOnly={isBibLocked}
                        disabled={isBibLocked}
                        aria-label={`Número de dorsal de ${reg.fullName}`}
                        title={isDuplicateBib ? 'Dorsal repetido' : undefined}
                        value={bibValue}
                        onChange={(e) =>
                          setBibDrafts((prev) => ({
                            ...prev,
                            [reg.id]: e.target.value,
                          }))
                        }
                        placeholder="Dorsal"
                        className={
                          isDuplicateBib
                            ? `w-12 rounded-lg bg-zinc-950 border border-red-500 px-1 py-1 text-xs font-mono font-medium text-red-500 text-center ${
                                isBibLocked
                                  ? 'cursor-default'
                                  : 'focus:border-red-400 focus:outline-none'
                              }`
                            : isBibLocked
                              ? 'w-12 rounded-lg bg-zinc-950 border border-orange-500/40 px-1 py-1 text-xs font-mono font-medium text-orange-400 text-center cursor-default'
                              : 'w-12 rounded-lg bg-zinc-950 border border-orange-500 focus:border-orange-400 focus:outline-none px-1 py-1 text-xs font-mono font-semibold text-white text-center'
                        }
                      />
                      {isBibLocked && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => startEditingBib(reg.id)}
                          aria-label={`Editar dorsal de ${reg.fullName}`}
                          title="Editar dorsal"
                          className="p-1 rounded-lg bg-stone-950 hover:bg-white/5 border border-orange-500/40 hover:border-orange-500/70 text-stone-400 hover:text-orange-400 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleStatusButtonClick(reg, { isConfirmed, isAlreadySaved })}
                      title={
                        armedStatusAction === 'unconfirm'
                          ? 'Hacé clic de nuevo para pasar a Pendiente'
                          : armedStatusAction === 'confirm'
                            ? 'Hacé clic de nuevo para confirmar inscripción y dorsal'
                            : isAlreadySaved
                              ? 'Inscripción confirmada (clic para pasar a Pendiente)'
                              : isConfirmed
                                ? 'Guardar nuevo número de dorsal'
                                : 'Guardar número de dorsal y confirmar inscripción'
                      }
                      className={`inline-flex items-center gap-1 rounded-lg font-display font-medium text-[10px] sm:text-[11px] uppercase px-2 py-1 transition-colors cursor-pointer disabled:opacity-50 ${
                        armedStatusAction === 'unconfirm'
                          ? 'bg-zinc-950 text-red-400 border border-red-500'
                          : armedStatusAction === 'confirm'
                            ? 'bg-zinc-950 text-orange-400 border border-orange-500'
                            : isAlreadySaved
                              ? 'bg-zinc-950 text-zinc-300 border border-zinc-700 hover:border-zinc-500'
                              : 'bg-zinc-950 hover:bg-white/5 text-emerald-400 border border-emerald-500/70'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          armedStatusAction === 'unconfirm'
                            ? 'text-red-400'
                            : armedStatusAction === 'confirm'
                              ? 'text-orange-400'
                              : 'text-emerald-400'
                        }`}
                      />
                      {armedStatusAction === 'unconfirm'
                        ? '¿Desconfirmar?'
                        : armedStatusAction === 'confirm'
                          ? '¿Confirmar?'
                          : isAlreadySaved
                            ? 'Confirmado'
                            : isConfirmed
                              ? 'Guardar Dorsal'
                              : 'Confirmar'}
                    </button>

                    {(isConfirmed || reg.checkedIn) && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleKitButtonClick(reg)}
                        title={
                          armedKitAction === 'revoke'
                            ? 'Hacé clic de nuevo para anular la entrega del kit'
                            : armedKitAction === 'deliver'
                              ? 'Hacé clic de nuevo para acreditar y entregar el kit'
                              : reg.checkedIn
                                ? 'Kit acreditado y entregado (clic para desmarcar)'
                                : 'Marcar kit entregado / corredor acreditado en mesa'
                        }
                        className={`inline-flex items-center justify-center gap-1 md:w-[116px] whitespace-nowrap rounded-lg border text-[10px] sm:text-[11px] font-medium px-2 py-1 transition-colors cursor-pointer disabled:opacity-50 ${
                          armedKitAction === 'revoke'
                            ? 'bg-zinc-950 border-red-500 text-red-400'
                            : armedKitAction === 'deliver'
                              ? 'bg-zinc-950 border-orange-500 text-orange-300'
                              : reg.checkedIn
                                ? 'bg-zinc-950 border-emerald-500/70 text-emerald-400 hover:border-emerald-400'
                                : 'bg-zinc-950 border-orange-500/70 text-orange-400 hover:border-orange-400'
                        }`}
                      >
                        <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className={armedKitAction ? 'inline' : 'hidden md:inline'}>
                          {armedKitAction === 'revoke'
                            ? '¿Anular Kit?'
                            : armedKitAction === 'deliver'
                              ? '¿Entregar Kit?'
                              : reg.checkedIn
                                ? 'Kit OK'
                                : 'Acreditar'}
                        </span>
                      </button>
                    )}

                    {reg.receiptUrl && (
                      <a
                        href={reg.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver comprobante adjunto"
                        className="inline-flex items-center gap-1 rounded-lg bg-zinc-950 hover:bg-white/5 text-sky-400 border border-sky-500/60 text-[10px] sm:text-[11px] font-medium px-2 py-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Comprobante</span>
                      </a>
                    )}

                    {reg.phone && (
                      <a
                        href={buildRunnerWhatsappUrl(reg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar confirmación por WhatsApp"
                        aria-label={`Enviar WhatsApp a ${reg.fullName}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-zinc-950 hover:bg-white/5 text-emerald-400 border border-emerald-500/60 text-[10px] sm:text-[11px] font-medium px-2 py-1 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleExpand(reg.id)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} detalles de ${reg.fullName}`}
                      title="Ver detalles completos"
                      className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-1 text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer ${
                        isExpanded
                          ? 'bg-stone-950 border-orange-500 text-orange-400'
                          : 'bg-stone-950 border-stone-700 text-stone-300 hover:bg-white/5 hover:border-orange-500/60 hover:text-white'
                      }`}
                    >
                      <span className="hidden md:inline">Detalles</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onDeleteRegistration(reg)}
                      aria-label={`Eliminar inscripción de ${reg.fullName}`}
                      title="Eliminar inscripción"
                      className="p-1 rounded-lg bg-stone-950 text-stone-400 hover:text-rose-400 hover:bg-white/5 cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Panel expandible (Acordeón con datos complementarios) */}
                {isExpanded && (() => {
                  const cat = resolveRunnerCategory(reg, raceConfig);
                  return (
                    <div className="border-t border-stone-800/90 bg-stone-950 px-3.5 py-2.5 space-y-2 text-xs text-stone-300">
                      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-stone-800/70">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-900/80 border border-amber-500/60 px-2.5 py-1 text-[11px] text-zinc-200">
                          Categoría Oficial: <span className="text-white font-medium">{cat.fullCategory}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-900/80 border border-amber-500/60 px-2.5 py-1 text-[11px] text-zinc-200">
                          Edad al día de carrera:{' '}
                          <span className="text-white font-medium">
                            {cat.age !== null ? `${cat.age} años` : 'Sin fecha'}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-900/80 border border-amber-500/60 px-2.5 py-1 text-[11px] text-zinc-200">
                          Mesa Kit:{' '}
                          <span className="text-white font-medium">
                            {reg.checkedIn ? 'Kit entregado ✓' : 'Pendiente de retiro'}
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.2fr_1fr_0.9fr_1.4fr] gap-x-4 gap-y-1.5">
                        <div className="truncate">
                          <span className="text-stone-200">Email: </span>
                          <span className="text-white font-semibold">{reg.email}</span>
                        </div>
                        <div>
                          <span className="text-stone-200">Nacimiento: </span>
                          <span className="text-white font-semibold">{reg.birthDate}</span>
                        </div>
                        <div>
                          <span className="text-stone-200">Género: </span>
                          <span className="text-white font-semibold">{reg.gender}</span>
                        </div>
                        <div>
                          <span className="text-stone-200">Talle remera: </span>
                          <span className="text-white font-semibold">{reg.shirtSize}</span>
                        </div>
                        <div>
                          <span className="text-stone-200">Localidad: </span>
                          <span className="text-white font-semibold">{reg.city}</span>
                        </div>
                        <div>
                          <span className="text-stone-200">Team: </span>
                          <span className="text-white font-semibold">{reg.team || 'Libre'}</span>
                        </div>
                        <div>
                          <span className="text-stone-200">Teléfono: </span>
                          <span className="font-mono text-white font-semibold">{reg.phone}</span>
                        </div>
                        <div className="md:whitespace-nowrap">
                          <span className="text-stone-200">Emergencia: </span>
                          <span className="text-white font-semibold">
                            {reg.emergencyContactName} ({reg.emergencyContactPhone})
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-200">Grupo sanguíneo: </span>
                          <span className="font-mono text-white font-semibold">
                            {reg.bloodType || 'No especificado'}
                          </span>
                        </div>
                        <div className="sm:col-span-2 md:col-span-3">
                          <span className="text-stone-200">Observaciones médicas: </span>
                          <span className="text-white font-semibold">
                            {reg.medicalNotes || 'Sin observaciones médicas'}
                          </span>
                        </div>
                      </div>

                      {reg.status !== 'pendiente' && (
                        <div className="pt-1 flex justify-end border-t border-stone-800/60">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => onChangeRegStatus(reg, 'pendiente')}
                            className="rounded-lg bg-zinc-900/80 border border-orange-500/70 hover:border-orange-400 text-orange-400 text-[11px] font-semibold px-2.5 py-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Pasar a Pendiente
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })
          )}
        </div>
      )}
    </div>
  );
}
