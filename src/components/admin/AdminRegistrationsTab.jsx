import React from 'react';
import {
  Search,
  Download,
  AlertCircle,
  Users,
  ExternalLink,
  Trash2,
  CheckCircle2,
  MessageCircle,
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
  return (
    <div className="space-y-4">
      {/* Resumen de contadores */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          {
            label: 'Total',
            value: regStats.total,
            tone: 'text-stone-100 border-stone-300',
          },
          {
            label: 'Confirmados',
            value: regStats.confirmed,
            tone: 'text-green-400 border-green-500',
          },
          {
            label: 'Pendientes',
            value: regStats.pending,
            tone: 'text-yellow-400 border-yellow-500',
          },
          {
            label: '27K',
            value: regStats.count27k,
            tone: 'text-cyan-400 border-cyan-500',
          },
          {
            label: '13K',
            value: regStats.count13k,
            tone: 'text-red-500 border-red-500',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl bg-stone-950 border p-3 text-center ${stat.tone}`}
          >
            <span className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
              {stat.label}
            </span>
            <span className="font-display text-xl font-black">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Controles de búsqueda, filtro y exportación */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-3">
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
              className="rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-2 text-xs text-white"
            >
              <option value="all">Todas las distancias</option>
              <option value="27K">Solo 27K</option>
              <option value="13K">Solo 13K</option>
            </select>

            <select
              aria-label="Filtrar por estado"
              value={regStatusFilter}
              onChange={(e) => setRegStatusFilter(e.target.value)}
              className="rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-2 text-xs text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmado">Confirmados</option>
              <option value="rechazado">Rechazados</option>
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
        <div className="space-y-3">
          {filteredRegistrations.map((reg) => {
            const isBusy = regBusyId === reg.id;
            const bibValue = bibDrafts[reg.id] ?? reg.assignedBib ?? '';
            const statusBadgeClass =
              reg.status === 'confirmado'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : reg.status === 'rechazado'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40';

            return (
              <div
                key={reg.id}
                className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-3"
              >
                {/* Encabezado de la ficha */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-stone-900 border border-stone-700 text-amber-300">
                        {reg.code}
                      </span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-md border ${
                          reg.distance === '13K'
                            ? 'bg-red-500/20 border-red-500 text-red-400'
                            : 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        }`}
                      >
                        {reg.distance}
                      </span>
                      <span
                        className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusBadgeClass}`}
                      >
                        {reg.status}
                      </span>
                      {reg.assignedBib && (
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Dorsal #{reg.assignedBib}
                        </span>
                      )}
                    </div>
                    <h4 className="mt-1.5 font-display text-base font-extrabold text-white">
                      {reg.fullName}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {reg.receiptUrl && (
                      <a
                        href={reg.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/35 text-xs font-bold px-3 py-2"
                      >
                        Ver Comprobante
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onDeleteRegistration(reg)}
                      aria-label={`Eliminar inscripción de ${reg.fullName}`}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-400 hover:bg-stone-900 cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Datos detallados */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-300 bg-stone-900/70 border border-stone-800/80 rounded-xl p-3">
                  <div>
                    <span className="text-stone-500">DNI: </span>
                    <span className="font-mono text-stone-100">{reg.dni}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Nac.: </span>
                    <span>{reg.birthDate}</span>
                    <span className="text-stone-500"> ({reg.gender})</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Remera: </span>
                    <strong className="text-amber-300">{reg.shirtSize}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500">Localidad: </span>
                    <span>{reg.city}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Team: </span>
                    <span>{reg.team || 'Libre'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Tel: </span>
                    <span className="font-mono">{reg.phone}</span>
                  </div>
                  <div className="sm:col-span-2 truncate">
                    <span className="text-stone-500">Email: </span>
                    <span>{reg.email}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Emergencia: </span>
                    <span>
                      {reg.emergencyContactName} ({reg.emergencyContactPhone})
                    </span>
                  </div>
                  {reg.medicalNotes && (
                    <div className="sm:col-span-3 text-rose-200/90">
                      <span className="text-stone-400">Observaciones médicas: </span>
                      {reg.medicalNotes}
                    </div>
                  )}
                </div>

                {/* Acciones de dorsal, aprobación y WhatsApp */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor={`bib-${reg.id}`}
                      className="text-[11px] font-semibold text-stone-400"
                    >
                      Dorsal #
                    </label>
                    <input
                      id={`bib-${reg.id}`}
                      type="text"
                      value={bibValue}
                      onChange={(e) =>
                        setBibDrafts((prev) => ({
                          ...prev,
                          [reg.id]: e.target.value,
                        }))
                      }
                      placeholder="105"
                      className="w-20 rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-2.5 py-2 text-xs font-mono text-white text-center"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onConfirmRegistration(reg)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-display font-black text-xs uppercase px-3.5 py-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmar y Guardar Dorsal
                  </button>

                  {reg.status !== 'pendiente' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onChangeRegStatus(reg, 'pendiente')}
                      className="rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-3 py-2 cursor-pointer disabled:opacity-50"
                    >
                      Pasar a Pendiente
                    </button>
                  )}

                  {reg.phone && (
                    <a
                      href={buildRunnerWhatsappUrl(reg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-bold px-3 py-2 ml-auto"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Confirmar por WhatsApp
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
