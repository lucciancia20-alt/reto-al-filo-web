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
} from 'lucide-react';

export default function AdminRegistrationsTab({
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
  bibDrafts,
  setBibDrafts,
  regBusyId,
  onExportExcel,
  onConfirmRegistration,
  onChangeRegStatus,
  onDeleteRegistration,
  buildRunnerWhatsappUrl,
}) {
  const [expandedIds, setExpandedIds] = useState({});
  const [editingBibIds, setEditingBibIds] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'asc' });

  const handleSort = (field) => {
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

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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

  return (
    <div className="space-y-3">
      {/* Resumen de contadores (filtros rápidos sincronizados) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          {
            label: 'Total',
            value: regStats.total,
            tone: 'text-stone-100 border-stone-300',
            activeRing: 'border-2 ring-1 ring-stone-300/60',
            labelClass: 'text-white',
            isActive: regDistanceFilter === 'all' && regStatusFilter === 'all',
            onClick: () => {
              setRegDistanceFilter('all');
              setRegStatusFilter('all');
            },
          },
          {
            label: 'Confirmados',
            value: regStats.confirmed,
            tone: 'text-emerald-400 border-emerald-500',
            activeRing: 'border-2 ring-1 ring-emerald-500/60',
            labelClass: 'text-emerald-400',
            isActive: regStatusFilter === 'confirmado',
            onClick: () =>
              setRegStatusFilter(regStatusFilter === 'confirmado' ? 'all' : 'confirmado'),
          },
          {
            label: 'Pendientes',
            value: regStats.pending,
            tone: 'text-amber-400 border-amber-500',
            activeRing: 'border-2 ring-1 ring-amber-500/60',
            labelClass: 'text-amber-400',
            isActive: regStatusFilter === 'pendiente',
            onClick: () =>
              setRegStatusFilter(regStatusFilter === 'pendiente' ? 'all' : 'pendiente'),
          },
          {
            label: '27K',
            value: regStats.count27k,
            tone: 'text-cyan-400 border-cyan-500',
            activeRing: 'border-2 ring-1 ring-cyan-500/60',
            labelClass: 'text-cyan-400',
            isActive: regDistanceFilter === '27K',
            onClick: () =>
              setRegDistanceFilter(regDistanceFilter === '27K' ? 'all' : '27K'),
          },
          {
            label: '13K',
            value: regStats.count13k,
            tone: 'text-red-500 border-red-500',
            activeRing: 'border-2 ring-1 ring-red-500/60',
            labelClass: 'text-red-500',
            isActive: regDistanceFilter === '13K',
            onClick: () =>
              setRegDistanceFilter(regDistanceFilter === '13K' ? 'all' : '13K'),
          },
        ].map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={stat.onClick}
            aria-pressed={stat.isActive}
            className={`rounded-2xl bg-stone-950 p-2.5 text-center cursor-pointer hover:brightness-125 hover:scale-[1.01] transition-all ${stat.tone} ${
              stat.isActive ? stat.activeRing : 'border'
            }`}
          >
            <span className={`block text-[10px] uppercase tracking-wider font-semibold ${stat.labelClass}`}>
              {stat.label}
            </span>
            <span className="font-display text-xl font-black">{stat.value}</span>
          </button>
        ))}
      </div>

      {/* Controles de búsqueda, filtro y exportación */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3 space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={regSearch}
              onChange={(e) => setRegSearch(e.target.value)}
              placeholder="Buscar por nombre, DNI, código RAF, dorsal, localidad..."
              className="w-full rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none pl-9 pr-3 py-2 text-xs sm:text-sm text-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filtrar por distancia"
              value={regDistanceFilter}
              onChange={(e) => setRegDistanceFilter(e.target.value)}
              className={`rounded-xl bg-stone-900 border focus:outline-none px-3 py-2 text-xs transition-colors ${
                regDistanceFilter === '27K'
                  ? 'text-cyan-400 font-bold border-cyan-500/60 focus:border-cyan-400'
                  : regDistanceFilter === '13K'
                    ? 'text-red-500 font-bold border-red-500/60 focus:border-red-500'
                    : 'text-white border-white/15 focus:border-orange-400'
              }`}
            >
              <option value="all" className="bg-stone-900 text-white font-normal">
                Todas las distancias
              </option>
              <option value="27K" className="bg-stone-900 text-cyan-400 font-bold">
                Solo 27K
              </option>
              <option value="13K" className="bg-stone-900 text-red-500 font-bold">
                Solo 13K
              </option>
            </select>

            <select
              aria-label="Filtrar por estado"
              value={regStatusFilter}
              onChange={(e) => setRegStatusFilter(e.target.value)}
              className={`rounded-xl bg-stone-900 border focus:outline-none px-3 py-2 text-xs transition-colors ${
                regStatusFilter === 'pendiente'
                  ? 'text-amber-400 border-amber-500/60 focus:border-amber-400 font-bold'
                  : regStatusFilter === 'confirmado'
                    ? 'text-emerald-400 border-emerald-500/60 focus:border-emerald-400 font-bold'
                    : 'text-white border-white/15 focus:border-orange-400'
              }`}
            >
              <option value="all" className="bg-stone-900 text-white font-normal">
                Todos los estados
              </option>
              <option value="pendiente" className="bg-stone-900 text-amber-400 font-bold">
                Pendientes
              </option>
              <option value="confirmado" className="bg-stone-900 text-emerald-400 font-bold">
                Confirmados
              </option>
              <option value="rechazado" className="bg-stone-900 text-white font-normal">
                Rechazados
              </option>
            </select>

            <button
              type="button"
              onClick={onExportExcel}
              disabled={registrationsCount === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-bold px-3.5 py-2 cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Excel (.XLSX)
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
        <div className="rounded-xl bg-rose-500/15 border border-rose-500/35 p-3 text-xs text-rose-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{regsError}</span>
        </div>
      )}

      {regsLoading ? (
        <div className="rounded-2xl bg-stone-950 border border-stone-800 p-8 text-center text-xs text-stone-400">
          Cargando listado de corredores inscriptos...
        </div>
      ) : filteredRegistrations.length === 0 ? (
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
        <div className="space-y-2">
          {/* Barra compacta de encabezados ordenables */}
          <div className="px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mr-0.5 hidden sm:inline">
                Ordenar:
              </span>
              {renderSortButton('fullName', 'Nombre y Apellido')}
              {renderSortButton('dni', 'DNI')}
              {renderSortButton('status', 'Estado')}
            </div>

            <div className="flex items-center shrink-0 lg:mr-[378px]">
              {renderSortButton('bib', 'Dorsal #')}
            </div>
          </div>

          {sortedRegistrations.map((reg) => {
            const isBusy = regBusyId === reg.id;
            const isExpanded = Boolean(expandedIds[reg.id]);
            const bibValue = bibDrafts[reg.id] ?? reg.assignedBib ?? '';
            const isConfirmed = reg.status === 'confirmado';
            const isEditingBib = Boolean(editingBibIds[reg.id]);
            const isBibLocked = isConfirmed && !isEditingBib;
            const savedBib = String(reg.assignedBib ?? '').trim();
            const currentBib = String(bibValue ?? '').trim();
            const isAlreadySaved = isConfirmed && !isEditingBib && currentBib === savedBib;
            const statusBadgeClass =
              reg.status === 'confirmado'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : reg.status === 'rechazado'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40';

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
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-stone-900 border border-stone-700 text-amber-300 shrink-0">
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
                    </div>
                  </div>

                  {/* Acciones operativas en línea */}
                  <div className="flex flex-wrap items-center gap-1 shrink-0">
                    <div className="flex items-center gap-1">
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
                        value={bibValue}
                        onChange={(e) =>
                          setBibDrafts((prev) => ({
                            ...prev,
                            [reg.id]: e.target.value,
                          }))
                        }
                        placeholder="Dorsal"
                        className={
                          isBibLocked
                            ? 'w-12 rounded-lg bg-stone-950 border border-orange-500/40 px-1 py-1 text-xs font-mono font-bold text-orange-400 text-center cursor-default'
                            : 'w-12 rounded-lg bg-stone-900 border border-orange-500 focus:border-orange-400 focus:outline-none px-1 py-1 text-xs font-mono text-white text-center'
                        }
                      />
                      {isBibLocked && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => startEditingBib(reg.id)}
                          aria-label={`Editar dorsal de ${reg.fullName}`}
                          title="Editar dorsal"
                          className="p-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-orange-500/30 hover:border-orange-500/60 text-stone-400 hover:text-orange-400 transition-colors cursor-pointer disabled:opacity-40"
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
                          ? 'bg-white/10 text-white/40 border border-white/10 cursor-default'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 border border-emerald-400/50 cursor-pointer disabled:opacity-50'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${isAlreadySaved ? 'text-emerald-400' : ''}`}
                      />
                      {isAlreadySaved
                        ? 'Confirmado'
                        : isConfirmed
                          ? 'Guardar Dorsal'
                          : 'Confirmar'}
                    </button>

                    {reg.receiptUrl && (
                      <a
                        href={reg.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver comprobante adjunto"
                        className="inline-flex items-center gap-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/35 text-[10px] sm:text-[11px] font-bold px-2 py-1"
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
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-[10px] sm:text-[11px] font-bold px-2 py-1"
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
                          ? 'bg-orange-500/15 border-orange-500 text-orange-300'
                          : 'bg-stone-900 border-stone-700 text-stone-300 hover:border-orange-500/60 hover:text-white'
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
                      className="p-1 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-900 cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Panel expandible (Acordeón con datos complementarios) */}
                {isExpanded && (
                  <div className="border-t border-stone-800/90 bg-stone-900/60 px-3.5 py-2.5 space-y-2 text-xs text-stone-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5">
                      <div className="truncate">
                        <span className="text-stone-500">Email: </span>
                        <span className="text-stone-100">{reg.email}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Nacimiento: </span>
                        <span className="text-stone-100">{reg.birthDate}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Género: </span>
                        <span className="text-stone-100">{reg.gender}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Talle remera: </span>
                        <strong className="text-amber-300">{reg.shirtSize}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500">Localidad: </span>
                        <span className="text-stone-100">{reg.city}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Team: </span>
                        <span className="text-stone-100">{reg.team || 'Libre'}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Teléfono: </span>
                        <span className="font-mono text-stone-100">{reg.phone}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Emergencia: </span>
                        <span className="text-stone-100">
                          {reg.emergencyContactName} ({reg.emergencyContactPhone})
                        </span>
                      </div>
                      <div className="sm:col-span-2 md:col-span-4 text-stone-200">
                        <span className="text-stone-500">Observaciones médicas: </span>
                        <span className={reg.medicalNotes ? 'text-amber-200' : 'text-stone-400'}>
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
                          className="rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-semibold px-2.5 py-1 cursor-pointer disabled:opacity-50"
                        >
                          Pasar a Pendiente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
