import React, { useMemo, useState } from 'react';
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  Search,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tag,
  Sparkles,
  Users,
  ChevronDown,
} from 'lucide-react';

const PAGE_SIZE = 50;

function sanitizeSpreadsheetCell(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const str = String(value ?? '');
  return /^\s*[=+\-@]/.test(str) ? `'${str}` : str;
}

function escapeCsvField(value) {
  const safe = String(sanitizeSpreadsheetCell(value));
  if (/[",\n\r;]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function formatCouponDateTime(ms) {
  const num = Number(ms);
  if (!num) return '-';
  try {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(num));
  } catch {
    return new Date(num).toLocaleString('es-AR');
  }
}

function formatUsadosPorText(usadosPor = []) {
  if (!Array.isArray(usadosPor) || usadosPor.length === 0) return '-';
  return usadosPor
    .map((u) => {
      const parts = [u.nombre || 'Corredor'];
      if (u.dni) parts.push(`DNI ${u.dni}`);
      if (u.registrationCode) parts.push(u.registrationCode);
      return parts.join(' · ');
    })
    .join(' | ');
}

async function copyTextToClipboard(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

export default function AdminCouponsTab({
  coupons = [],
  couponsLoading = false,
  couponsError = '',
  couponsGenerating = false,
  couponBusyCode = '',
  onGenerateBatch,
  onCreateGroupCoupon,
  onDeleteCoupon,
}) {
  const [creationMode, setCreationMode] = useState('pase_libre');

  // Modalidad A: Lote de pases libres 100% OFF, 1 uso
  const [batchQuantity, setBatchQuantity] = useState('10');
  const [batchLabel, setBatchLabel] = useState('');

  // Modalidad B: Código grupal para Teams (10% OFF, tope editable default 15)
  const [groupCode, setGroupCode] = useState('');
  const [groupDiscount, setGroupDiscount] = useState('10');
  const [groupMaxUses, setGroupMaxUses] = useState('15');
  const [groupLabel, setGroupLabel] = useState('');

  const [createFeedback, setCreateFeedback] = useState(null);
  const [lastBatchCodes, setLastBatchCodes] = useState([]);

  // Filtros y tabla
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [labelFilter, setLabelFilter] = useState('all');
  const [showAllRows, setShowAllRows] = useState(false);
  const [expandedCodes, setExpandedCodes] = useState({});

  const [copiedKey, setCopiedKey] = useState('');
  const [confirmDeleteCode, setConfirmDeleteCode] = useState('');
  const [exportError, setExportError] = useState('');

  const stats = useMemo(() => {
    let available = 0;
    let exhausted = 0;
    let totalUsesConsumed = 0;
    let totalUsesCapacity = 0;
    const labelsSet = new Set();

    for (const c of coupons) {
      const uses = Number(c.usosActuales) || 0;
      const maxUses = Math.max(1, Number(c.maxUsos) || 1);
      totalUsesConsumed += uses;
      totalUsesCapacity += maxUses;
      if (uses >= maxUses) exhausted += 1;
      else available += 1;
      if (c.label) labelsSet.add(c.label);
    }

    return {
      total: coupons.length,
      available,
      exhausted,
      totalUsesConsumed,
      totalUsesCapacity,
      labels: Array.from(labelsSet).sort((a, b) => a.localeCompare(b, 'es')),
    };
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return coupons.filter((c) => {
      const isExhausted = (Number(c.usosActuales) || 0) >= (Number(c.maxUsos) || 1);
      const effectiveStatus = isExhausted ? 'agotado' : 'disponible';

      if (statusFilter !== 'all' && effectiveStatus !== statusFilter) return false;
      if (modeFilter !== 'all' && c.tipo !== modeFilter) return false;
      if (labelFilter === '__none__' && c.label) return false;
      if (labelFilter !== 'all' && labelFilter !== '__none__' && c.label !== labelFilter) {
        return false;
      }
      if (!q) return true;

      const usersText = (Array.isArray(c.usadosPor) ? c.usadosPor : [])
        .map((u) => [u.nombre, u.dni, u.registrationCode].filter(Boolean).join(' '))
        .join(' ');
      const haystack = [
        c.code,
        c.label,
        `${c.descuento}%`,
        c.tipo === 'grupal' ? 'grupal team' : 'pase libre',
        usersText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [coupons, searchQuery, statusFilter, modeFilter, labelFilter]);

  const visibleCoupons = showAllRows
    ? filteredCoupons
    : filteredCoupons.slice(0, PAGE_SIZE);

  const triggerCopyFeedback = (key) => {
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? '' : prev));
    }, 2000);
  };

  const handleCopySingle = async (code) => {
    await copyTextToClipboard(code);
    triggerCopyFeedback(`single-${code}`);
  };

  const handleCopyBulk = async () => {
    const availableInFilter = filteredCoupons.filter(
      (c) => (Number(c.usosActuales) || 0) < (Number(c.maxUsos) || 1)
    );
    const source = availableInFilter.length > 0 ? availableInFilter : filteredCoupons;
    if (source.length === 0) return;
    await copyTextToClipboard(source.map((c) => c.code).join('\n'));
    triggerCopyFeedback('bulk');
  };

  const handleCopyLastBatch = async () => {
    if (lastBatchCodes.length === 0) return;
    await copyTextToClipboard(lastBatchCodes.join('\n'));
    triggerCopyFeedback('last-batch');
  };

  const handleExportCsv = () => {
    setExportError('');
    if (filteredCoupons.length === 0) return;
    try {
      const headers = [
        'Código',
        'Modalidad',
        'Descuento (%)',
        'Etiqueta',
        'Usos Actuales',
        'Máx. Usos',
        'Estado',
        'Usado Por (Nombre / DNI)',
        'Fecha Creación',
      ];
      const lines = [
        headers.map(escapeCsvField).join(','),
        ...filteredCoupons.map((c) => {
          const isExhausted = (Number(c.usosActuales) || 0) >= (Number(c.maxUsos) || 1);
          return [
            c.code,
            c.tipo === 'grupal' ? 'Grupal Team' : 'Pase Libre',
            `${c.descuento}%`,
            c.label || '-',
            c.usosActuales ?? 0,
            c.maxUsos ?? 1,
            isExhausted ? 'Agotado' : 'Disponible',
            formatUsadosPorText(c.usadosPor),
            formatCouponDateTime(c.createdAt),
          ]
            .map(escapeCsvField)
            .join(',');
        }),
      ];
      const csvContent = `\uFEFF${lines.join('\r\n')}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reto-al-filo-cupones-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err?.message || 'No se pudo exportar el archivo CSV.');
    }
  };

  const handleExportExcel = async () => {
    setExportError('');
    if (filteredCoupons.length === 0) return;
    try {
      const XLSX = await import('xlsx');
      const headers = [
        'Código',
        'Modalidad',
        'Descuento %',
        'Etiqueta',
        'Usos Actuales',
        'Máx. Usos',
        'Estado',
        'Usado Por (Nombre / DNI)',
        'Fecha Creación',
      ];
      const rows = filteredCoupons.map((c) => {
        const isExhausted = (Number(c.usosActuales) || 0) >= (Number(c.maxUsos) || 1);
        return [
          sanitizeSpreadsheetCell(c.code),
          c.tipo === 'grupal' ? 'Grupal Team' : 'Pase Libre',
          c.descuento,
          sanitizeSpreadsheetCell(c.label || '-'),
          Number(c.usosActuales) || 0,
          Number(c.maxUsos) || 1,
          isExhausted ? 'Agotado' : 'Disponible',
          sanitizeSpreadsheetCell(formatUsadosPorText(c.usadosPor)),
          formatCouponDateTime(c.createdAt),
        ];
      });
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = [
        { wch: 18 },
        { wch: 14 },
        { wch: 12 },
        { wch: 20 },
        { wch: 13 },
        { wch: 11 },
        { wch: 12 },
        { wch: 42 },
        { wch: 19 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Cupones');
      XLSX.writeFile(
        wb,
        `reto-al-filo-cupones-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (err) {
      setExportError(err?.message || 'No se pudo generar la planilla Excel.');
    }
  };

  const handleSubmitBatchFree = async (e) => {
    e.preventDefault();
    setCreateFeedback(null);
    setLastBatchCodes([]);

    const qty = Number.parseInt(batchQuantity, 10);
    if (!Number.isFinite(qty) || qty < 1 || qty > 500) {
      setCreateFeedback({
        type: 'error',
        message: 'Ingresá una cantidad válida entre 1 y 500 pases libres.',
      });
      return;
    }

    try {
      const res = await onGenerateBatch({
        quantity: qty,
        descuento: 100,
        label: batchLabel.trim(),
      });
      const createdList = res?.coupons || [];
      setLastBatchCodes(createdList.map((c) => c.code));
      setCreateFeedback({
        type: 'success',
        message: `Se generaron ${createdList.length} ${
          createdList.length === 1 ? 'pase libre' : 'pases libres'
        } (100% OFF · 1 uso c/u${batchLabel.trim() ? ` · ${batchLabel.trim()}` : ''}).`,
      });
    } catch (err) {
      setCreateFeedback({
        type: 'error',
        message: err?.message || 'No se pudieron generar los pases libres.',
      });
    }
  };

  const handleSubmitGroupCoupon = async (e) => {
    e.preventDefault();
    setCreateFeedback(null);
    setLastBatchCodes([]);

    const cleanCode = String(groupCode || '').trim().toUpperCase().replace(/\s+/g, '');
    const pct = Number.parseInt(groupDiscount, 10);
    const maxUses = Number.parseInt(groupMaxUses, 10);

    if (!cleanCode) {
      setCreateFeedback({
        type: 'error',
        message: 'Ingresá un código personalizado para el Team (ej. TEAMHALCONES10).',
      });
      return;
    }
    if (!Number.isFinite(pct) || pct < 1 || pct > 100) {
      setCreateFeedback({
        type: 'error',
        message: 'Ingresá un porcentaje de descuento entre 1% y 100%.',
      });
      return;
    }
    if (!Number.isFinite(maxUses) || maxUses < 1 || maxUses > 500) {
      setCreateFeedback({
        type: 'error',
        message: 'El tope máximo de usos debe estar entre 1 y 500.',
      });
      return;
    }

    try {
      const res = await onCreateGroupCoupon({
        code: cleanCode,
        descuento: pct,
        maxUsos: maxUses,
        label: groupLabel.trim(),
      });
      if (res?.coupon?.code) {
        setLastBatchCodes([res.coupon.code]);
      }
      setGroupCode('');
      setGroupLabel('');
      setCreateFeedback({
        type: 'success',
        message: `Código grupal ${res?.coupon?.code || cleanCode} creado (${pct}% OFF · 0 / ${maxUses} usos).`,
      });
    } catch (err) {
      setCreateFeedback({
        type: 'error',
        message: err?.message || 'No se pudo crear el código grupal.',
      });
    }
  };

  const handleDeleteClick = async (coupon) => {
    if (confirmDeleteCode !== coupon.code) {
      setConfirmDeleteCode(coupon.code);
      setTimeout(() => {
        setConfirmDeleteCode((prev) => (prev === coupon.code ? '' : prev));
      }, 3000);
      return;
    }
    setConfirmDeleteCode('');
    await onDeleteCoupon(coupon);
  };

  const toggleExpandUsers = (code) => {
    setExpandedCodes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <div className="space-y-4">
      {/* Gestor de Creación: Modalidad A (Lote Pases Libres 100%) vs Modalidad B (Código Grupal Teams) */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 sm:p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-amber-300/90 shrink-0" />
            <div>
              <h4 className="font-display text-sm font-medium text-white uppercase tracking-wide">
                Gestor de Cupones con Tope de Usos
              </h4>
              <p className="text-[11px] text-stone-400">
                Elegí la modalidad: lote de pases libres 100% OFF (1 uso) o código grupal para Teams con tope editable.
              </p>
            </div>
          </div>
        </div>

        {/* Selector de modalidad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setCreationMode('pase_libre');
              setCreateFeedback(null);
            }}
            className={`rounded-xl p-3 bg-transparent text-left transition-colors cursor-pointer flex items-center gap-2.5 ${
              creationMode === 'pase_libre'
                ? 'border-2 border-amber-200/80 text-amber-200'
                : 'border border-stone-800 text-stone-300 hover:border-amber-300/50 hover:text-amber-200/90'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <div className="min-w-0">
              <span className="block font-display text-xs font-bold uppercase tracking-wide">
                A · Lote de Pases Libres (100% OFF)
              </span>
              <span className="block text-[11px] text-stone-400">
                Códigos <span className="font-mono">RAF-FREE-XXXXXX</span> · 1 uso c/u
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setCreationMode('grupal');
              setCreateFeedback(null);
            }}
            className={`rounded-xl p-3 bg-transparent text-left transition-colors cursor-pointer flex items-center gap-2.5 ${
              creationMode === 'grupal'
                ? 'border-2 border-amber-200/80 text-amber-200'
                : 'border border-stone-800 text-stone-300 hover:border-amber-300/50 hover:text-amber-200/90'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <div className="min-w-0">
              <span className="block font-display text-xs font-bold uppercase tracking-wide">
                B · Código Grupal para Teams (10% OFF)
              </span>
              <span className="block text-[11px] text-stone-400">
                Código único personalizado · Tope de usos editable
              </span>
            </div>
          </button>
        </div>

        {creationMode === 'pase_libre' ? (
          <form onSubmit={handleSubmitBatchFree} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label
                  htmlFor="coupon-free-quantity"
                  className="block text-xs font-semibold text-stone-300 mb-1"
                >
                  Cantidad de pases libres (1 a 500)
                </label>
                <input
                  id="coupon-free-quantity"
                  type="number"
                  min={1}
                  max={500}
                  step={1}
                  value={batchQuantity}
                  onChange={(e) => setBatchQuantity(e.target.value)}
                  placeholder="Ej. 100"
                  className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-2 text-sm font-mono font-bold text-white"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-stone-300 mb-1">
                  Regla fija de Pase Libre
                </span>
                <div className="rounded-xl bg-transparent border border-amber-300/40 px-3 py-2 text-xs font-mono font-bold text-amber-200/90 flex items-center justify-between">
                  <span>100% OFF ($0)</span>
                  <span className="text-stone-400 font-normal">1 uso / código</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="coupon-free-label"
                  className="block text-xs font-semibold text-stone-300 mb-1"
                >
                  Etiqueta <span className="text-stone-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="coupon-free-label"
                  type="text"
                  maxLength={60}
                  value={batchLabel}
                  onChange={(e) => setBatchLabel(e.target.value)}
                  placeholder="Ej. Preparador físico / Manager / Sponsors"
                  className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={couponsGenerating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-transparent border border-amber-200/75 hover:border-amber-100 text-amber-200 hover:text-amber-100 font-display font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {couponsGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando lote...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Generar Pases Libres
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitGroupCoupon} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label
                  htmlFor="coupon-group-code"
                  className="block text-xs font-semibold text-stone-300 mb-1"
                >
                  Código personalizado
                </label>
                <input
                  id="coupon-group-code"
                  type="text"
                  maxLength={30}
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="Ej. TEAMHALCONES10"
                  className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-2 text-sm font-mono font-bold uppercase text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="coupon-group-discount"
                  className="block text-xs font-semibold text-stone-300 mb-1"
                >
                  Descuento (% OFF)
                </label>
                <input
                  id="coupon-group-discount"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={groupDiscount}
                  onChange={(e) => setGroupDiscount(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-2 text-sm font-mono font-bold text-sky-300"
                />
              </div>

              <div>
                <label
                  htmlFor="coupon-group-maxuses"
                  className="block text-xs font-semibold text-stone-300 mb-1"
                >
                  Tope de usos (maxUsos)
                </label>
                <input
                  id="coupon-group-maxuses"
                  type="number"
                  min={1}
                  max={500}
                  step={1}
                  value={groupMaxUses}
                  onChange={(e) => setGroupMaxUses(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-2 text-sm font-mono font-bold text-amber-200/90"
                />
              </div>

              <div>
                <label
                  htmlFor="coupon-group-label"
                  className="block text-xs font-semibold text-stone-300 mb-1"
                >
                  Etiqueta del Team
                </label>
                <input
                  id="coupon-group-label"
                  type="text"
                  maxLength={60}
                  value={groupLabel}
                  onChange={(e) => setGroupLabel(e.target.value)}
                  placeholder="Ej. Halcones Running Team"
                  className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-stone-400">
                No acumulable con el descuento de residentes (prevalece el porcentaje mayor).
              </span>
              <button
                type="submit"
                disabled={couponsGenerating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-transparent border border-amber-200/75 hover:border-amber-100 text-amber-200 hover:text-amber-100 font-display font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {couponsGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando código...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Crear Código Grupal
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {createFeedback && (
          <div
            role="status"
            className={`rounded-xl bg-transparent p-3 text-xs flex flex-wrap items-center justify-between gap-2 ${
              createFeedback.type === 'success'
                ? 'border border-emerald-300/45 text-emerald-300/90'
                : 'border border-red-400/55 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {createFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{createFeedback.message}</span>
            </div>
            {createFeedback.type === 'success' && lastBatchCodes.length > 0 && (
              <button
                type="button"
                onClick={handleCopyLastBatch}
                className="inline-flex items-center gap-1.5 rounded-lg bg-transparent border border-emerald-300/50 hover:border-emerald-200 text-emerald-300/90 hover:text-emerald-200 px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {copiedKey === 'last-batch' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡{lastBatchCodes.length} copiado(s)!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>
                      {lastBatchCodes.length > 1
                        ? 'Copiar lote recién generado'
                        : 'Copiar código'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl bg-transparent border border-stone-800 px-3 py-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Total Códigos
          </span>
          <span className="font-mono text-xl font-bold text-white">{stats.total}</span>
        </div>
        <div className="rounded-xl bg-transparent border border-emerald-300/45 px-3 py-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300/90">
            Disponibles
          </span>
          <span className="font-mono text-xl font-bold text-emerald-300/90">{stats.available}</span>
        </div>
        <div className="rounded-xl bg-transparent border border-stone-700 px-3 py-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Agotados
          </span>
          <span className="font-mono text-xl font-bold text-stone-200">{stats.exhausted}</span>
        </div>
        <div className="rounded-xl bg-transparent border border-amber-300/45 px-3 py-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-200/90">
            Usos Consumidos
          </span>
          <span className="font-mono text-xl font-bold text-amber-300/90">
            {stats.totalUsesConsumed}
            <span className="text-xs font-normal text-stone-400"> / {stats.totalUsesCapacity}</span>
          </span>
        </div>
      </div>

      {/* Filtros y exportación */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAllRows(false);
              }}
              placeholder="Buscar código, equipo, nombre o DNI..."
              aria-label="Buscar cupones"
              className="w-full rounded-xl bg-zinc-950 border border-stone-700 focus:border-amber-200/80 focus:outline-none pl-8 pr-3 py-1.5 text-xs text-white"
            />
          </div>

          <select
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setShowAllRows(false);
            }}
            className="rounded-xl bg-zinc-950 border border-stone-700 focus:border-amber-200/80 focus:outline-none px-2.5 py-1.5 text-xs text-white"
          >
            <option value="all">Estado: Todos</option>
            <option value="disponible">Disponible</option>
            <option value="agotado">Agotado</option>
          </select>

          <select
            aria-label="Filtrar por modalidad"
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setShowAllRows(false);
            }}
            className="rounded-xl bg-zinc-950 border border-stone-700 focus:border-amber-200/80 focus:outline-none px-2.5 py-1.5 text-xs text-white"
          >
            <option value="all">Modalidad: Todas</option>
            <option value="pase_libre">Pases Libres (100%)</option>
            <option value="grupal">Grupales Teams</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            {stats.labels.length > 0 && (
              <select
                aria-label="Filtrar por etiqueta"
                value={labelFilter}
                onChange={(e) => {
                  setLabelFilter(e.target.value);
                  setShowAllRows(false);
                }}
                className="rounded-xl bg-zinc-950 border border-stone-700 focus:border-amber-200/80 focus:outline-none px-2.5 py-1.5 text-xs text-white"
              >
                <option value="all">Etiqueta: Todas</option>
                <option value="__none__">Sin etiqueta</option>
                {stats.labels.map((lbl) => (
                  <option key={lbl} value={lbl}>
                    {lbl}
                  </option>
                ))}
              </select>
            )}
            <span className="text-[11px] text-stone-400">
              Mostrando <strong className="text-white">{filteredCoupons.length}</strong> de{' '}
              {coupons.length} códigos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={filteredCoupons.length === 0}
              onClick={handleCopyBulk}
              title="Copia los códigos disponibles filtrados (o todos los filtrados)"
              className="inline-flex items-center gap-1.5 rounded-xl bg-transparent border border-amber-300/45 hover:border-amber-200/75 text-amber-200/90 hover:text-amber-100 text-xs font-semibold px-3 py-1.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copiedKey === 'bulk' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300/90" />
                  <span>¡Copiados!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar códigos</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={filteredCoupons.length === 0}
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl bg-transparent border border-sky-300/45 hover:border-sky-300/80 text-sky-300/90 hover:text-sky-200 text-xs font-semibold px-3 py-1.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              disabled={filteredCoupons.length === 0}
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-xl bg-transparent border border-emerald-300/45 hover:border-emerald-300/80 text-emerald-300/90 hover:text-emerald-200 text-xs font-semibold px-3 py-1.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {exportError && (
          <p className="text-xs text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{exportError}</span>
          </p>
        )}
      </div>

      {couponsError && (
        <div
          role="alert"
          className="rounded-xl bg-transparent border border-red-400/55 p-3 text-xs text-red-400 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{couponsError}</span>
        </div>
      )}

      {/* Tabla de cupones */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden">
        {couponsLoading ? (
          <div className="p-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-300/90" />
            <span>Cargando cupones desde Firestore...</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400 space-y-1">
            <Ticket className="w-7 h-7 mx-auto text-stone-600" />
            <p className="font-semibold text-stone-300">
              {coupons.length === 0
                ? 'Todavía no creaste cupones.'
                : 'No hay cupones que coincidan con el filtro aplicado.'}
            </p>
            <p className="text-[11px] text-stone-500">
              {coupons.length === 0
                ? 'Usá el gestor de arriba para generar pases libres o códigos grupales de Teams.'
                : 'Probá limpiando la búsqueda o cambiando los filtros.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-800 bg-zinc-950/80 text-[10px] uppercase tracking-wider text-stone-400">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Modalidad / Etiqueta</th>
                    <th className="py-2.5 px-3">Descuento</th>
                    <th className="py-2.5 px-3">Usos</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Usado por (Nombre / DNI)</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80">
                  {visibleCoupons.map((coupon) => {
                    const uses = Number(coupon.usosActuales) || 0;
                    const maxUses = Math.max(1, Number(coupon.maxUsos) || 1);
                    const isExhausted = uses >= maxUses;
                    const isFree = coupon.descuento >= 100;
                    const isGroup = coupon.tipo === 'grupal';
                    const isBusy = couponBusyCode === coupon.code;
                    const isConfirmDelete = confirmDeleteCode === coupon.code;
                    const usadosPor = Array.isArray(coupon.usadosPor) ? coupon.usadosPor : [];
                    const isUsersExpanded = Boolean(expandedCodes[coupon.code]);

                    return (
                      <tr key={coupon.code} className="hover:bg-zinc-950/60 transition-colors align-top">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono font-bold text-white tracking-wider">
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopySingle(coupon.code)}
                              title={`Copiar ${coupon.code}`}
                              aria-label={`Copiar código ${coupon.code}`}
                              className="p-1 rounded-md text-stone-400 hover:text-amber-200 hover:bg-transparent cursor-pointer transition-colors"
                            >
                              {copiedKey === `single-${coupon.code}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-300/90" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${
                                isGroup ? 'text-amber-200/90' : 'text-amber-300/90'
                              }`}
                            >
                              {isGroup ? (
                                <>
                                  <Users className="w-3 h-3 shrink-0" />
                                  Grupal Team
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 shrink-0" />
                                  Pase Libre
                                </>
                              )}
                            </span>
                            {coupon.label && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-transparent border border-stone-700 px-2 py-0.5 text-[11px] text-stone-200">
                                <Tag className="w-3 h-3 text-amber-300/90 shrink-0" />
                                <span>{coupon.label}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold font-mono bg-transparent ${
                              isFree
                                ? 'border-amber-300/45 text-amber-200/90'
                                : 'border-sky-300/45 text-sky-300/90'
                            }`}
                          >
                            {coupon.descuento}% OFF
                          </span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold">
                          <span className={isExhausted ? 'text-stone-400' : 'text-white'}>
                            {uses}
                          </span>
                          <span className="text-stone-500 font-normal"> / {maxUses}</span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-transparent ${
                              isExhausted
                                ? 'border-stone-700 text-stone-400'
                                : 'border-emerald-300/45 text-emerald-300/90'
                            }`}
                          >
                            {isExhausted ? 'Agotado' : 'Disponible'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          {usadosPor.length === 0 ? (
                            <span className="text-stone-500 text-[11px]">Sin usar</span>
                          ) : usadosPor.length === 1 ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-white">
                                {usadosPor[0].nombre || 'Corredor registrado'}
                              </div>
                              <div className="text-[11px] font-mono text-stone-400 flex flex-wrap items-center gap-x-2">
                                {usadosPor[0].dni && <span>DNI {usadosPor[0].dni}</span>}
                                {usadosPor[0].registrationCode && (
                                  <span className="text-amber-200/90">
                                    {usadosPor[0].registrationCode}
                                  </span>
                                )}
                                {usadosPor[0].fecha && (
                                  <span>· {formatCouponDateTime(usadosPor[0].fecha)}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <button
                                type="button"
                                onClick={() => toggleExpandUsers(coupon.code)}
                                aria-expanded={isUsersExpanded}
                                className="inline-flex items-center gap-1 rounded-lg bg-transparent border border-stone-700 hover:border-amber-300/55 text-stone-200 px-2 py-1 text-[11px] font-semibold cursor-pointer transition-colors"
                              >
                                <span>Ver {usadosPor.length} corredores</span>
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform ${
                                    isUsersExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                              {isUsersExpanded && (
                                <ul className="space-y-1 rounded-lg bg-zinc-950 border border-stone-800 p-2 text-[11px]">
                                  {usadosPor.map((entry, idx) => (
                                    <li
                                      key={`${coupon.code}-u-${idx}`}
                                      className="flex flex-wrap items-center justify-between gap-x-2 border-b border-stone-800/70 last:border-b-0 pb-1 last:pb-0"
                                    >
                                      <span className="font-semibold text-white">
                                        {entry.nombre || 'Corredor'}
                                      </span>
                                      <span className="font-mono text-stone-400">
                                        {entry.dni ? `DNI ${entry.dni}` : ''}
                                        {entry.registrationCode ? ` · ${entry.registrationCode}` : ''}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {uses === 0 ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDeleteClick(coupon)}
                              title={
                                isConfirmDelete
                                  ? 'Confirmar eliminación de cupón'
                                  : `Eliminar cupón ${coupon.code}`
                              }
                              className={`inline-flex items-center gap-1 rounded-lg bg-transparent border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-40 ${
                                isConfirmDelete
                                  ? 'border-red-400/70 text-red-400'
                                  : 'border-transparent text-stone-400 hover:border-red-400/60 hover:text-red-400'
                              }`}
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              {isConfirmDelete && <span>¿Borrar?</span>}
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-500 uppercase">
                              {isExhausted ? 'Agotado' : 'En uso'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!showAllRows && filteredCoupons.length > PAGE_SIZE && (
              <div className="p-3 bg-zinc-950 border-t border-stone-800 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllRows(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-transparent border border-amber-300/45 hover:border-amber-200/75 text-amber-200/90 hover:text-amber-100 text-xs font-semibold px-4 py-1.5 cursor-pointer transition-colors"
                >
                  Mostrar todos ({filteredCoupons.length} códigos)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
