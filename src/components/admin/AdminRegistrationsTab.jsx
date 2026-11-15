import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { resolveRunnerCategory } from '../../data/raceConfig';

export default function AdminRegistrationsTab({
  raceConfig,
  regStats,
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
            ? 'border-orange-500 text-orange-400 font-bold'
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
            ? 'bg-stone-950 border-rose-500 ring-1 ring-rose-500/70 text-white font-bold'
            : 'bg-zinc-900/80 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white font-medium'
        }`}
      >
        {hasDuplicates && (
          <span aria-hidden="true" className="text-[11px] leading-none text-rose-400">
            ⚠
          </span>
        )}
        <span>{label}</span>
        <span className={hasDuplicates ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
          ({count})
        </span>
        {isActive && (
          <span
            aria-hidden="true"
            className="ml-0.5 text-[10px] leading-none text-rose-400 font-bold"
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
            inactiveClass: 'bg-stone-950 border-stone-400/40',
            activeClass: 'bg-stone-950 border-white',
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
            inactiveClass: 'bg-stone-950 border-emerald-500/45',
            activeClass: 'bg-stone-950 border-emerald-400',
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
            inactiveClass: 'bg-stone-950 border-amber-500/45',
            activeClass: 'bg-stone-950 border-amber-400',
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
            inactiveClass: 'bg-stone-950 border-cyan-500/45',
            activeClass: 'bg-stone-950 border-cyan-400',
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
            inactiveClass: 'bg-stone-950 border-red-500/45',
            activeClass: 'bg-stone-950 border-red-500',
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
            className={`rounded-2xl border-2 p-2.5 text-center cursor-pointer hover:bg-white/5 transition-all ${stat.tone} ${
              stat.isActive ? stat.activeClass : stat.inactiveClass
            } ${hasSpecificFilter && !stat.isActive ? 'opacity-55 hover:opacity-100' : 'opacity-100'}`}
          >
            <span
              className={`flex items-center justify-center gap-1.5 text-[10px] leading-4 uppercase tracking-wider font-bold ${
                stat.isActive ? 'text-white' : stat.labelClass
              }`}
            >
              {stat.isActive && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stat.dotClass}`} />}
              <span>{stat.label}</span>
            </span>
            <span className="font-display text-xl font-black">{stat.value}</span>
          </button>
        ))}
      </div>

      {/* Controles de filtro y exportación */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3 space-y-2.5">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-1.5 sm:gap-2">
          <select
            aria-label="Filtrar por distancia"
            value={regDistanceFilter}
            onChange={(e) => setRegDistanceFilter(e.target.value)}
            className={`rounded-xl bg-stone-950 border focus:outline-none pl-2.5 pr-5 py-1.5 text-xs transition-colors shrink-0 ${
              regDistanceFilter === '27K'
                ? 'text-cyan-400 font-bold border-cyan-500/60 focus:border-cyan-400'
                : regDistanceFilter === '13K'
                  ? 'text-red-500 font-bold border-red-500/60 focus:border-red-500'
                  : 'text-white border-white/15 focus:border-orange-400'
            }`}
          >
            <option value="all" className="bg-stone-950 text-white font-normal">
              Todas las distancias
            </option>
            <option value="27K" className="bg-stone-950 text-cyan-400 font-bold">
              Solo 27K
            </option>
            <option value="13K" className="bg-stone-950 text-red-500 font-bold">
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
            className={`rounded-xl bg-stone-950 border focus:outline-none pl-2.5 pr-5 py-1.5 text-xs transition-colors shrink-0 ${
              regStatusFilter === 'pendiente'
                ? 'text-amber-400 border-amber-500/60 focus:border-amber-400 font-bold'
                : regStatusFilter === 'confirmado'
                  ? 'text-emerald-400 border-emerald-500/60 focus:border-emerald-400 font-bold'
                  : 'text-white border-white/15 focus:border-orange-400'
            }`}
          >
            <option value="all" className="bg-stone-950 text-white font-normal">
              Todos los estados
            </option>
            <option value="pendiente" className="bg-stone-950 text-amber-400 font-bold">
              Pendientes
            </option>
            <option value="confirmado" className="bg-stone-950 text-emerald-400 font-bold">
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-950 hover:bg-white/5 text-emerald-400 border border-emerald-500/60 text-xs font-bold px-2.5 sm:px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            Exportar Excel (.XLSX)
          </button>

          <button
            type="button"
            onClick={onPrintAccreditationSheet}
            disabled={(regStats.confirmed || 0) === 0}
            title="Imprimir planilla A4 de acreditación y seguridad SOS ordenada por dorsal"
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-950 hover:bg-white/5 text-amber-300 border border-amber-500/60 text-xs font-bold px-2.5 sm:px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            Imprimir Planilla Acreditación / SOS
          </button>

          <a
            href="https://www.mercadopago.com.ar/activities"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir actividad y transferencias recibidas en Mercado Pago"
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-950 hover:bg-white/5 text-sky-400 border border-sky-500/60 text-xs font-bold px-2.5 sm:px-3 py-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Wallet className="w-3.5 h-3.5 shrink-0" />
            <span>Mercado Pago</span>
            <ExternalLink className="w-3 h-3 opacity-80 shrink-0" />
          </a>
        </div>

        {/* Resumen en vivo de Talles (Confirmados / Activos) y Acreditación */}
        <div className="pt-2 border-t border-stone-800/80 flex flex-col xl:flex-row xl:items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1">
              <Shirt className="w-3.5 h-3.5 text-amber-400" />
              Talles (Conf/Tot):
            </span>
            {(regStats.shirtSizes || []).map((item) => {
              const isSelected = regShirtFilter === item.size;
              return (
                <button
                  key={item.size}
                  type="button"
                  onClick={() => setRegShirtFilter?.(isSelected ? 'all' : item.size)}
                  title={`Filtrar por talle ${item.size}: ${item.confirmed} confirmados de ${item.total} inscriptos no rechazados`}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 font-mono transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/70 shadow-sm text-white font-bold'
                      : 'bg-zinc-900/80 border-amber-500/60 text-white hover:border-amber-400'
                  }`}
                >
                  <span className="font-bold text-amber-300">{item.size}:</span>
                  <span>
                    <strong className="text-emerald-400">{item.confirmed}</strong>/{item.total}
                  </span>
                </button>
              );
            })}
            {regShirtFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setRegShirtFilter?.('all')}
                className="text-[10px] text-orange-400 hover:text-orange-300 underline ml-1 cursor-pointer"
              >
                Limpiar talle
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-0.5">
              <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
              Mesa Kit:
            </span>
            <button
              type="button"
              onClick={() =>
                setRegCheckInFilter?.(regCheckInFilter === 'checked' ? 'all' : 'checked')
              }
              className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                regCheckInFilter === 'checked'
                  ? 'bg-amber-500/25 border-amber-400 ring-1 ring-amber-400/70 text-white font-bold'
                  : 'bg-zinc-900/80 border-amber-500/60 text-white hover:border-amber-400'
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
              className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                regCheckInFilter === 'pending_checkin'
                  ? 'bg-amber-500/25 border-amber-400 ring-1 ring-amber-400/70 text-white font-bold'
                  : 'bg-zinc-900/80 border-amber-500/60 text-white hover:border-amber-400'
              }`}
            >
              Pendientes de retirar ({regStats.pendingCheckInCount || 0})
            </button>
          </div>
        </div>

        <p className="text-[11px] text-stone-400">
          Mostrando <strong className="text-stone-200">{filteredRegistrations.length}</strong> de{' '}
          <strong className="text-stone-200">{registrationsCount}</strong> inscripciones · Fuente:{' '}
          <span className="font-mono text-amber-300">
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
                className="w-full rounded-xl bg-stone-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-stone-500"
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
              <p className="text-sm font-bold text-stone-200">
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
            const statusBadgeClass =
              reg.status === 'confirmado'
                ? 'bg-stone-950 text-emerald-400 border-emerald-500/60'
                : reg.status === 'rechazado'
                  ? 'bg-stone-950 text-rose-400 border-rose-500/60'
                  : 'bg-stone-950 text-amber-400 border-amber-500/60';

            return (
              <div
                key={reg.id}
                className="rounded-xl bg-stone-950 border border-stone-800 hover:border-stone-700 transition-colors overflow-hidden"
              >
                {/* Fila operativa compacta (1-2 renglones) */}
                <div className="px-2.5 py-2.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
                  {/* Identificación rápida del corredor (estructura fija en 2 líneas) */}
                  <div className="min-w-[270px] flex-1 space-y-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-stone-950 border border-amber-500/50 text-amber-300 shrink-0">
                        {reg.code}
                      </span>
                      <span
                        className={`text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${
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
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-stone-400 shrink-0">
                        DNI {reg.dni}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${statusBadgeClass}`}
                      >
                        {reg.status}
                      </span>
                      {reg.checkedIn && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shrink-0">
                          Kit ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones operativas en línea */}
                  <div className="flex flex-wrap items-center gap-1 shrink-0">
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
                            ? `w-12 rounded-lg bg-stone-950 border border-rose-500 px-1 py-1 text-xs font-mono text-rose-300 text-center ${
                                isBibLocked
                                  ? 'font-bold cursor-default'
                                  : 'focus:border-rose-400 focus:outline-none'
                              }`
                            : isBibLocked
                              ? 'w-12 rounded-lg bg-stone-950 border border-orange-500/40 px-1 py-1 text-xs font-mono font-bold text-orange-400 text-center cursor-default'
                              : 'w-12 rounded-lg bg-stone-950 border border-orange-500 focus:border-orange-400 focus:outline-none px-1 py-1 text-xs font-mono text-white text-center'
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
                      disabled={isBusy || isAlreadySaved}
                      onClick={() => handleSaveOrConfirm(reg)}
                      title={
                        isAlreadySaved
                          ? 'Inscripción confirmada y dorsal guardado'
                          : isConfirmed
                            ? 'Guardar nuevo número de dorsal'
                            : 'Guardar número de dorsal y confirmar inscripción'
                      }
                      className={`inline-flex items-center gap-1 rounded-lg font-display font-black text-[10px] sm:text-[11px] uppercase px-2 py-1 transition-colors ${
                        isAlreadySaved
                          ? 'bg-zinc-950 text-zinc-400 border border-emerald-500/70 cursor-default'
                          : 'bg-stone-950 hover:bg-white/5 text-emerald-400 border border-emerald-500/70 cursor-pointer disabled:opacity-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {isAlreadySaved
                        ? 'Confirmado'
                        : isConfirmed
                          ? 'Guardar Dorsal'
                          : 'Confirmar'}
                    </button>

                    {(isConfirmed || reg.checkedIn) && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onToggleCheckIn?.(reg)}
                        title={
                          reg.checkedIn
                            ? 'Kit acreditado y entregado (clic para desmarcar)'
                            : 'Marcar kit entregado / corredor acreditado en mesa'
                        }
                        className={`inline-flex items-center gap-1 rounded-lg border text-[10px] sm:text-[11px] font-bold px-2 py-1 transition-colors cursor-pointer disabled:opacity-50 ${
                          reg.checkedIn
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-stone-950 border-amber-500/60 text-amber-300 hover:bg-white/5 hover:border-amber-400'
                        }`}
                      >
                        <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden md:inline">
                          {reg.checkedIn ? 'Kit OK' : 'Acreditar'}
                        </span>
                      </button>
                    )}

                    {reg.receiptUrl && (
                      <a
                        href={reg.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver comprobante adjunto"
                        className="inline-flex items-center gap-1 rounded-lg bg-stone-950 hover:bg-white/5 text-sky-400 border border-sky-500/60 text-[10px] sm:text-[11px] font-bold px-2 py-1 transition-colors"
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
                        className="inline-flex items-center gap-1 rounded-lg bg-stone-950 hover:bg-white/5 text-emerald-400 border border-emerald-500/60 text-[10px] sm:text-[11px] font-bold px-2 py-1 transition-colors"
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
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/35 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                          Categoría Oficial: <strong className="text-white">{cat.fullCategory}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-stone-900 border border-stone-700 px-2 py-1 text-[11px] text-stone-200">
                          Edad al día de carrera:{' '}
                          <strong className="font-mono text-amber-300">
                            {cat.age !== null ? `${cat.age} años` : 'Sin fecha'}
                          </strong>
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                            reg.checkedIn
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-stone-900 border-stone-700 text-stone-400'
                          }`}
                        >
                          Mesa Kit: {reg.checkedIn ? 'Kit entregado ✓' : 'Pendiente de retiro'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5">
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
                        <div>
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
                            className="rounded-lg bg-stone-950 hover:bg-white/5 border border-amber-500/50 text-amber-400 text-[11px] font-semibold px-2.5 py-1 transition-colors cursor-pointer disabled:opacity-50"
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
