import React, { useState } from 'react';
import {
  Landmark,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Plus,
  Trash2,
  FileText,
  RotateCcw,
  Eye,
} from 'lucide-react';
import {
  RACE_CONFIG,
  DEFAULT_RACE_TITLE,
  DEFAULT_WAIVER_CLAUSES,
  DEFAULT_MEDICAL_BODY_TEXT,
  THEME_COLOR_OPTIONS,
  getRaceTitle,
  getRaceFullTitle,
  parseTargetDateParts,
  buildTargetDateIso,
  syncScheduleWithTargetDate,
} from '../../data/raceConfig';
import {
  resolveNotificationEmail,
  sendRegistrationNotificationEmail,
} from '../../utils/emailNotification';
import { openPrintableWaiver, openPrintableMedicalCert } from '../../utils/printableDocs';
import ResizableTextarea from './ResizableTextarea';

export default function AdminGeneralTab({
  draft,
  setDraft,
  onUpdateCircuitField,
  onUpdatePaymentField,
}) {
  const { datePart, timePart, formattedTime, formattedShortDate, formattedDayMonth } =
    parseTargetDateParts(draft.targetDateIso);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestStatus, setEmailTestStatus] = useState(null);

  const handleTestEmailSend = async () => {
    const targetEmail = resolveNotificationEmail(draft.notificationEmail);
    setTestingEmail(true);
    setEmailTestStatus(null);
    try {
      const response = await sendRegistrationNotificationEmail({
        notificationEmail: targetEmail,
        raceTitle: getRaceFullTitle(draft),
        registration: {
          code: 'RAF-PRUEBA',
          fullName: 'Prueba Panel Organización',
          distance: '27K',
          dni: '00000000',
          gender: 'Prueba',
          phone: draft.whatsappNumber || '5492915228310',
          email: targetEmail,
          city: 'Tornquist, Buenos Aires',
          team: getRaceTitle(draft),
          shirtSize: 'M',
          receiptUrl: 'Envío de prueba desde Panel de Organización',
        },
      });
      setEmailTestStatus({
        type: 'success',
        message: `OK (${response?.status ?? 200}): Correo de prueba enviado a ${targetEmail}.`,
      });
    } catch (err) {
      const detail = [
        err?.status ? `HTTP ${err.status}` : '',
        err?.text || err?.message || 'Error desconocido al enviar',
      ]
        .filter(Boolean)
        .join(' - ');
      setEmailTestStatus({
        type: 'error',
        message: `Error EmailJS: ${detail}`,
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTargetDateChange = (nextDate, nextTime) => {
    const nextIso = buildTargetDateIso(nextDate, nextTime);
    setDraft((prev) => ({
      ...prev,
      targetDateIso: nextIso,
      schedule: syncScheduleWithTargetDate(prev.schedule, nextIso),
    }));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Título de la Carrera
          </label>
          <input
            type="text"
            value={draft.title ?? ''}
            placeholder={DEFAULT_RACE_TITLE}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Edición <span className="text-[11px] font-normal text-stone-400">(opcional · ej: 2da EDICIÓN)</span>
          </label>
          <input
            type="text"
            value={draft.edition ?? ''}
            placeholder="Dejar vacío para ocultar"
            onChange={(e) => setDraft({ ...draft, edition: e.target.value })}
            className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Subtítulo / Mes y Año
          </label>
          <input
            type="text"
            value={draft.subtitle}
            onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
            className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Fecha y Hora de Largada <span className="text-[11px] font-normal text-stone-400">(Sincronizado: {formattedTime})</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              aria-label="Fecha de largada"
              value={datePart}
              onChange={(e) => handleTargetDateChange(e.target.value, timePart)}
              className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-2.5 py-1.5 text-sm font-mono font-semibold text-white [color-scheme:dark]"
            />
            <input
              type="time"
              aria-label="Hora de largada"
              value={timePart}
              onChange={(e) => handleTargetDateChange(datePart, e.target.value)}
              className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-2.5 py-1.5 text-sm font-mono font-semibold text-white [color-scheme:dark]"
            />
          </div>
          <p className="mt-1 text-[11px] text-stone-400">
            Cuenta regresiva del Hero → <span className="font-mono text-orange-400">{formattedShortDate}</span>
            {' · '}
            {formattedDayMonth} · {formattedTime}
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            WhatsApp de la Organización (internacional sin signos)
          </label>
          <input
            type="text"
            placeholder="5492915228310"
            value={draft.whatsappNumber ?? ''}
            onChange={(e) => setDraft({ ...draft, whatsappNumber: e.target.value })}
            className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Email de Notificaciones
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="email"
              placeholder="lciancia1972@gmail.com"
              value={draft.notificationEmail ?? ''}
              onChange={(e) => {
                setDraft({ ...draft, notificationEmail: e.target.value });
                if (emailTestStatus) setEmailTestStatus(null);
              }}
              className="flex-1 min-w-0 rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
            />
            <button
              type="button"
              disabled={testingEmail}
              onClick={handleTestEmailSend}
              title="Enviar correo de prueba real a esta dirección con EmailJS"
              className="inline-flex items-center gap-1 rounded-xl bg-stone-950 hover:bg-stone-800 border border-orange-500/60 hover:border-orange-400 text-orange-400 font-medium text-xs px-2.5 py-1.5 shrink-0 cursor-pointer transition-colors disabled:opacity-50"
            >
              {testingEmail ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{testingEmail ? 'Enviando...' : 'Probar envío'}</span>
            </button>
          </div>
          {emailTestStatus && (
            <p
              role="status"
              className={`mt-1 text-[11px] flex items-center gap-1 ${
                emailTestStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {emailTestStatus.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{emailTestStatus.message}</span>
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            URL de Google Maps del Predio
          </label>
          <input
            type="url"
            value={draft.googleMapsUrl}
            onChange={(e) => setDraft({ ...draft, googleMapsUrl: e.target.value })}
            className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-stone-300 mb-1">
            Nombre del Predio / Localidad
          </label>
          <input
            type="text"
            value={draft.locationName}
            onChange={(e) => setDraft({ ...draft, locationName: e.target.value })}
            className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
          />
        </div>

        {/* Selector compacto de Tema / Marca Blanca */}
        <div className="sm:col-span-2 rounded-xl bg-zinc-950 border border-stone-800 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-stone-200">
              Color de la Carrera / Tema
            </span>
            <span className="block text-[11px] text-stone-400">
              Activo:{' '}
              <strong className="text-white">
                {(THEME_COLOR_OPTIONS.find((t) => t.id === (draft.themeColor || 'orange')) || THEME_COLOR_OPTIONS[0]).label}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0" role="radiogroup" aria-label="Color de la Carrera / Tema">
            {THEME_COLOR_OPTIONS.map((option) => {
              const isSelected = (draft.themeColor || 'orange') === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={option.label}
                  title={option.label}
                  onClick={() => setDraft((prev) => ({ ...prev, themeColor: option.id }))}
                  style={
                    option.secondaryHex
                      ? {
                          background: `linear-gradient(135deg, ${option.hex} 52%, ${option.secondaryHex} 52%)`,
                        }
                      : { backgroundColor: option.hex }
                  }
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110'
                      : 'border border-white/25 hover:scale-105 opacity-85 hover:opacity-100'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Precios y Datos Bancarios de Inscripción */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-2.5">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-orange-500 shrink-0" />
          <div>
            <h4 className="font-display text-sm font-medium text-white uppercase tracking-wide">
              Valores y Cuenta Bancaria para Inscripciones
            </h4>
            <p className="text-[11px] text-stone-400">
              Estos datos se muestran dentro del formulario de inscripción web antes de subir el
              comprobante.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Valor Inscripción <span className="text-cyan-400 font-medium">27K</span>
            </label>
            <input
              type="text"
              value={draft.circuits?.['27K']?.price || ''}
              onChange={(e) => onUpdateCircuitField('27K', 'price', e.target.value)}
              placeholder="$45.000"
              className="w-full rounded-xl bg-zinc-950 border border-cyan-500 focus:border-cyan-400 focus:outline-none px-3 py-1.5 text-sm font-mono font-medium text-cyan-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Valor Inscripción <span className="text-red-500 font-medium">13K</span>
            </label>
            <input
              type="text"
              value={draft.circuits?.['13K']?.price || ''}
              onChange={(e) => onUpdateCircuitField('13K', 'price', e.target.value)}
              placeholder="$32.000"
              className="w-full rounded-xl bg-zinc-950 border border-red-500 focus:border-red-500 focus:outline-none px-3 py-1.5 text-sm font-mono font-medium text-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Alias (Banco / Mercado Pago)
            </label>
            <input
              type="text"
              value={draft.payment?.bankAlias || ''}
              onChange={(e) => onUpdatePaymentField('bankAlias', e.target.value)}
              placeholder="RETO.AL.FILO"
              className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">CBU / CVU</label>
            <input
              type="text"
              value={draft.payment?.bankCbu || ''}
              onChange={(e) => onUpdatePaymentField('bankCbu', e.target.value)}
              placeholder="0000003100000000000000"
              className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Titular de la Cuenta
            </label>
            <input
              type="text"
              value={draft.payment?.bankHolder || ''}
              onChange={(e) => onUpdatePaymentField('bankHolder', e.target.value)}
              placeholder="Organización Reto al Filo"
              className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Banco / Billetera
            </label>
            <input
              type="text"
              value={draft.payment?.bankEntity || ''}
              onChange={(e) => onUpdatePaymentField('bankEntity', e.target.value)}
              placeholder="Mercado Pago / Banco Provincia"
              className="w-full rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Instrucciones para el Corredor
            </label>
            <ResizableTextarea
              rows={1}
              value={draft.payment?.instructions || ''}
              onChange={(e) => onUpdatePaymentField('instructions', e.target.value)}
              className="rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-2 text-xs text-stone-200"
            />
          </div>
        </div>
      </div>

      {/* Qué incluye la inscripción (Kit del Corredor y Cobertura) */}
      {(() => {
        const kitList = Array.isArray(draft.kitIncludes)
          ? draft.kitIncludes
          : RACE_CONFIG.kitIncludes;

        const handleKitItemChange = (index, value) => {
          setDraft((prev) => {
            const current = Array.isArray(prev.kitIncludes)
              ? [...prev.kitIncludes]
              : [...RACE_CONFIG.kitIncludes];
            current[index] = value;
            return { ...prev, kitIncludes: current };
          });
        };

        const handleAddKitItem = () => {
          setDraft((prev) => {
            const current = Array.isArray(prev.kitIncludes)
              ? [...prev.kitIncludes]
              : [...RACE_CONFIG.kitIncludes];
            current.push('');
            return { ...prev, kitIncludes: current };
          });
        };

        const handleRemoveKitItem = (index) => {
          setDraft((prev) => {
            const current = Array.isArray(prev.kitIncludes)
              ? prev.kitIncludes
              : RACE_CONFIG.kitIncludes;
            return {
              ...prev,
              kitIncludes: current.filter((_, idx) => idx !== index),
            };
          });
        };

        return (
          <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <h4 className="font-display text-sm font-medium text-white uppercase tracking-wide">
                    ¿Qué incluye la Inscripción? (Kit del Corredor)
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Visible en la web pública y dentro del formulario de inscripción al elegir
                    distancia.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddKitItem}
                className="inline-flex items-center gap-1 rounded-xl bg-zinc-950 text-orange-400 border border-orange-500/70 hover:border-orange-400 text-xs font-medium px-3 py-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar ítem</span>
              </button>
            </div>

            <div className="space-y-2">
              {kitList.map((item, idx) => (
                <div key={`admin-kit-${idx}`} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleKitItemChange(idx, e.target.value)}
                    placeholder="Ej. Remera técnica oficial del evento"
                    aria-label={`Ítem incluido en el kit ${idx + 1}`}
                    className="flex-1 min-w-0 rounded-xl bg-zinc-950 border border-orange-500/50 focus:border-orange-400 focus:outline-none px-3 py-1.5 text-xs font-mono font-semibold text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveKitItem(idx)}
                    aria-label={`Quitar ítem ${idx + 1}`}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-900 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Documentos Legales: Deslinde A4 y Apto Médico A4 */}
      {(() => {
        const DEFAULT_WAIVER_TEXT = DEFAULT_WAIVER_CLAUSES.join('\n');
        const DEFAULT_MEDICAL_TEXT = DEFAULT_MEDICAL_BODY_TEXT;

        const waiverText =
          typeof draft.waiverCustomText === 'string' && draft.waiverCustomText.trim()
            ? draft.waiverCustomText
            : DEFAULT_WAIVER_TEXT;

        const medicalText =
          typeof draft.medicalCustomText === 'string' && draft.medicalCustomText.trim()
            ? draft.medicalCustomText
            : DEFAULT_MEDICAL_TEXT;

        const waiverIsDefault = !draft.waiverCustomText || draft.waiverCustomText.trim() === '';
        const medicalIsDefault = !draft.medicalCustomText || draft.medicalCustomText.trim() === '';

        return (
          <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500 shrink-0" />
              <div>
                <h4 className="font-display text-sm font-medium text-white uppercase tracking-wide">
                  Documentos Legales (Deslinde y Apto Médico A4)
                </h4>
                <p className="text-[11px] text-stone-400">
                  Editá el texto que aparece impreso en el Deslinde y en el Apto Médico. Usá{' '}
                  <code className="text-orange-400 bg-zinc-900 px-1 rounded">{'{RACE_TITLE}'}</code>{' '}
                  donde quieras que aparezca el nombre del evento.
                </p>
              </div>
            </div>

            {/* Deslinde de Responsabilidad */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-stone-300">
                  Cláusulas del Deslinde Oficial A4{' '}
                  <span className="text-[11px] font-normal text-stone-400">
                    (una cláusula por línea · formato: «Título: texto completo»)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openPrintableWaiver({ raceConfig: draft })}
                    title="Vista previa A4 del Deslinde con el texto actual"
                    className="inline-flex items-center gap-1 rounded-xl bg-zinc-950 text-orange-400 border border-orange-500/70 hover:border-orange-400 text-xs font-medium px-2.5 py-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Vista previa A4</span>
                  </button>
                  {!waiverIsDefault && (
                    <button
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, waiverCustomText: '' }))}
                      title="Restaurar el texto original del Deslinde"
                      className="inline-flex items-center gap-1 rounded-xl bg-zinc-950 text-stone-400 border border-stone-700 hover:border-rose-500 hover:text-rose-400 text-xs font-medium px-2.5 py-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar original</span>
                    </button>
                  )}
                  {waiverIsDefault && (
                    <span className="text-[11px] text-emerald-500 font-medium">✓ Texto oficial</span>
                  )}
                </div>
              </div>
              <ResizableTextarea
                rows={8}
                value={waiverText}
                onChange={(e) => setDraft((prev) => ({ ...prev, waiverCustomText: e.target.value }))}
                placeholder={DEFAULT_WAIVER_TEXT}
                className="rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-2 text-xs text-stone-200 font-mono"
              />
            </div>

            {/* Apto Médico */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-stone-300">
                  Cuerpo del Certificado de Aptitud Médica A4
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openPrintableMedicalCert({ raceConfig: draft })}
                    title="Vista previa A4 del Apto Médico con el texto actual"
                    className="inline-flex items-center gap-1 rounded-xl bg-zinc-950 text-orange-400 border border-orange-500/70 hover:border-orange-400 text-xs font-medium px-2.5 py-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Vista previa A4</span>
                  </button>
                  {!medicalIsDefault && (
                    <button
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, medicalCustomText: '' }))}
                      title="Restaurar el texto original del Apto Médico"
                      className="inline-flex items-center gap-1 rounded-xl bg-zinc-950 text-stone-400 border border-stone-700 hover:border-rose-500 hover:text-rose-400 text-xs font-medium px-2.5 py-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar original</span>
                    </button>
                  )}
                  {medicalIsDefault && (
                    <span className="text-[11px] text-emerald-500 font-medium">✓ Texto oficial</span>
                  )}
                </div>
              </div>
              <ResizableTextarea
                rows={4}
                value={medicalText}
                onChange={(e) => setDraft((prev) => ({ ...prev, medicalCustomText: e.target.value }))}
                placeholder={DEFAULT_MEDICAL_TEXT}
                className="rounded-xl bg-zinc-950 border border-orange-500/60 focus:border-orange-400 focus:outline-none px-3 py-2 text-xs text-stone-200 font-mono"
              />
              <p className="text-[11px] text-stone-500">
                Este texto aparece luego del nombre y DNI del corredor en la sección «Certifico que…».
                Los campos de Nombre, DNI, Distancia, Firma y Sello Médico siempre se imprimen fijos y no se ven afectados.
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
