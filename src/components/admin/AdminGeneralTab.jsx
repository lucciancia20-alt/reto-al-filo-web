import React, { useEffect, useState } from 'react';
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
  Handshake,
  Upload,
  MapPin,
  X,
  Users,
  Mail,
} from 'lucide-react';
import { uploadImageToCloudinary } from '../../firebase/config';
import {
  RACE_CONFIG,
  DEFAULT_RACE_TITLE,
  DEFAULT_WAIVER_CLAUSES,
  DEFAULT_MEDICAL_BODY_TEXT,
  DEFAULT_RESIDENT_DISCOUNT_PERCENT,
  DEFAULT_RESIDENT_LOCALITIES,
  DEFAULT_TEAMS_BENEFIT_EMAIL,
  DEFAULT_TEAMS_FREE_EVERY,
  DEFAULT_TEAMS_GROUP_DISCOUNT_PERCENT,
  THEME_COLOR_OPTIONS,
  getRaceTitle,
  getRaceFullTitle,
  parseTargetDateParts,
  buildTargetDateIso,
  syncScheduleWithTargetDate,
  parseResidentLocalities,
  computeRegistrationPricing,
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
  const [uploadingSponsorIdx, setUploadingSponsorIdx] = useState(null);
  const [sponsorUploadError, setSponsorUploadError] = useState('');
  const [newLocalityInput, setNewLocalityInput] = useState('');
  const [localitiesText, setLocalitiesText] = useState(() => {
    const list = Array.isArray(draft.residentLocalities)
      ? draft.residentLocalities
      : DEFAULT_RESIDENT_LOCALITIES;
    return list.join(', ');
  });

  useEffect(() => {
    const currentList = Array.isArray(draft.residentLocalities)
      ? draft.residentLocalities
      : DEFAULT_RESIDENT_LOCALITIES;
    const parsedCurrent = parseResidentLocalities(localitiesText, []);
    if (JSON.stringify(parsedCurrent) !== JSON.stringify(currentList)) {
      setLocalitiesText(currentList.join(', '));
    }
  }, [draft.residentLocalities, localitiesText]);

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
            className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
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
            className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
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
            className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
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
              className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-2.5 py-1.5 text-sm font-mono font-semibold text-white [color-scheme:dark]"
            />
            <input
              type="time"
              aria-label="Hora de largada"
              value={timePart}
              onChange={(e) => handleTargetDateChange(datePart, e.target.value)}
              className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-2.5 py-1.5 text-sm font-mono font-semibold text-white [color-scheme:dark]"
            />
          </div>
          <p className="mt-1 text-[11px] text-stone-400">
            Cuenta regresiva del Hero → <span className="font-mono text-amber-200/90">{formattedShortDate}</span>
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
            className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
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
                const nextEmail = e.target.value;
                setDraft((prev) => ({
                  ...prev,
                  notificationEmail: nextEmail,
                  teamsBenefitEmail: nextEmail,
                }));
                if (emailTestStatus) setEmailTestStatus(null);
              }}
              className="flex-1 min-w-0 rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
            />
            <button
              type="button"
              disabled={testingEmail}
              onClick={handleTestEmailSend}
              title="Enviar correo de prueba real a esta dirección con EmailJS"
              className="inline-flex items-center gap-1 rounded-xl bg-transparent border border-amber-300/45 hover:border-amber-200/75 text-amber-200/90 hover:text-amber-100 font-medium text-xs px-2.5 py-1.5 shrink-0 cursor-pointer transition-colors disabled:opacity-50"
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
            className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
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
            className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
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
          <Landmark className="w-4 h-4 text-amber-300/90 shrink-0" />
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
              className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-amber-200/90"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">CBU / CVU</label>
            <input
              type="text"
              value={draft.payment?.bankCbu || ''}
              onChange={(e) => onUpdatePaymentField('bankCbu', e.target.value)}
              placeholder="0000003100000000000000"
              className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
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
              className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
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
              className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
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
              className="rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-2 text-xs text-stone-200"
            />
          </div>
        </div>
      </div>

      {/* Descuento Residentes del Distrito */}
      {(() => {
        const discountEnabled =
          typeof draft.residentDiscountEnabled === 'boolean'
            ? draft.residentDiscountEnabled
            : RACE_CONFIG.residentDiscountEnabled;

        const currentLocalities = Array.isArray(draft.residentLocalities)
          ? draft.residentLocalities
          : DEFAULT_RESIDENT_LOCALITIES;

        const isDefaultLocalities =
          JSON.stringify(currentLocalities) === JSON.stringify(DEFAULT_RESIDENT_LOCALITIES);

        const previewConfig = {
          ...draft,
          residentDiscountEnabled: true,
        };
        const preview27 = computeRegistrationPricing(
          draft.circuits?.['27K']?.price || RACE_CONFIG.circuits['27K'].price,
          previewConfig,
          true
        );
        const preview13 = computeRegistrationPricing(
          draft.circuits?.['13K']?.price || RACE_CONFIG.circuits['13K'].price,
          previewConfig,
          true
        );

        const handleToggleResidentDiscount = () => {
          setDraft((prev) => ({
            ...prev,
            residentDiscountEnabled: !(
              typeof prev.residentDiscountEnabled === 'boolean'
                ? prev.residentDiscountEnabled
                : RACE_CONFIG.residentDiscountEnabled
            ),
          }));
        };

        const handlePercentChange = (rawVal) => {
          if (rawVal === '') {
            setDraft((prev) => ({ ...prev, residentDiscountPercent: '' }));
            return;
          }
          const parsed = Number.parseInt(rawVal, 10);
          if (!Number.isFinite(parsed)) return;
          const clamped = Math.min(100, Math.max(1, parsed));
          setDraft((prev) => ({ ...prev, residentDiscountPercent: clamped }));
        };

        const handlePercentBlur = () => {
          setDraft((prev) => {
            const parsed = Number(prev.residentDiscountPercent);
            const normalized =
              prev.residentDiscountPercent !== '' &&
              prev.residentDiscountPercent !== null &&
              Number.isFinite(parsed) &&
              parsed >= 1
                ? Math.min(100, Math.max(1, Math.round(parsed)))
                : DEFAULT_RESIDENT_DISCOUNT_PERCENT;
            return { ...prev, residentDiscountPercent: normalized };
          });
        };

        const handleAddLocalities = () => {
          const added = parseResidentLocalities(newLocalityInput, []);
          if (added.length === 0) return;
          setDraft((prev) => {
            const existing = Array.isArray(prev.residentLocalities)
              ? prev.residentLocalities
              : DEFAULT_RESIDENT_LOCALITIES;
            return {
              ...prev,
              residentLocalities: parseResidentLocalities([...existing, ...added], []),
            };
          });
          setNewLocalityInput('');
        };

        const handleRemoveLocality = (index) => {
          setDraft((prev) => {
            const existing = Array.isArray(prev.residentLocalities)
              ? prev.residentLocalities
              : DEFAULT_RESIDENT_LOCALITIES;
            return {
              ...prev,
              residentLocalities: existing.filter((_, idx) => idx !== index),
            };
          });
        };

        const handleLocalitiesTextChange = (value) => {
          setLocalitiesText(value);
          setDraft((prev) => ({
            ...prev,
            residentLocalities: parseResidentLocalities(value, []),
          }));
        };

        const handleLocalitiesTextBlur = () => {
          setDraft((prev) => {
            const cleaned = parseResidentLocalities(
              localitiesText,
              DEFAULT_RESIDENT_LOCALITIES
            );
            setLocalitiesText(cleaned.join(', '));
            return {
              ...prev,
              residentLocalities: cleaned,
            };
          });
        };

        const handleRestoreDefaultLocalities = () => {
          setLocalitiesText(DEFAULT_RESIDENT_LOCALITIES.join(', '));
          setDraft((prev) => ({
            ...prev,
            residentLocalities: [...DEFAULT_RESIDENT_LOCALITIES],
          }));
        };

        return (
          <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-amber-300/90 shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-display text-sm font-medium text-white uppercase tracking-wide">
                    Descuento Residentes del Distrito
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Beneficio automático en el formulario de inscripción con verificación de DNI al
                    retirar el kit.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className={`text-[11px] font-semibold ${
                    discountEnabled ? 'text-emerald-300/90' : 'text-stone-400'
                  }`}
                >
                  {discountEnabled ? 'Beneficio Activo' : 'Desactivado'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={discountEnabled}
                  aria-label="Activar o desactivar descuento para residentes del distrito"
                  onClick={handleToggleResidentDiscount}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full bg-transparent border transition-colors cursor-pointer ${
                    discountEnabled
                      ? 'border-emerald-300/75'
                      : 'border-stone-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                      discountEnabled
                        ? 'translate-x-5.5 bg-emerald-300'
                        : 'translate-x-1 bg-stone-400'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-stretch">
              <div className="rounded-xl bg-zinc-950 border border-stone-800 p-2.5 flex flex-col justify-between">
                <label
                  htmlFor="admin-resident-percent"
                  className="block text-xs font-semibold text-stone-300 mb-1.5"
                >
                  Porcentaje de Descuento (1% a 100%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="admin-resident-percent"
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={draft.residentDiscountPercent ?? DEFAULT_RESIDENT_DISCOUNT_PERCENT}
                    onChange={(e) => handlePercentChange(e.target.value)}
                    onBlur={handlePercentBlur}
                    className="w-24 rounded-xl bg-stone-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-bold text-emerald-300/90 text-center"
                  />
                  <span className="text-sm font-mono font-bold text-stone-300">% OFF</span>
                </div>
              </div>

              <div className="sm:col-span-2 rounded-xl bg-zinc-950 border border-stone-800 p-2.5 flex flex-col justify-between gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-300">
                    Vista previa en vivo ({preview27.configuredPercent}% OFF)
                  </span>
                  {!discountEnabled && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-400">
                      Apagado en formulario
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-stone-950 border border-cyan-500/40 px-2.5 py-1.5 flex items-center justify-between gap-2">
                    <span className="font-bold text-cyan-400">27K</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-stone-500 line-through text-[11px]">
                        {preview27.originalPrice}
                      </span>
                      <span className="text-stone-500">→</span>
                      <span className="font-bold text-emerald-400">{preview27.finalAmount}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-stone-950 border border-red-500/40 px-2.5 py-1.5 flex items-center justify-between gap-2">
                    <span className="font-bold text-red-400">13K</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-stone-500 line-through text-[11px]">
                        {preview13.originalPrice}
                      </span>
                      <span className="text-stone-500">→</span>
                      <span className="font-bold text-emerald-400">{preview13.finalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Localidades habilitadas (chips + alta rápida + edición por comas) */}
            <div className="rounded-xl bg-zinc-950 border border-stone-800 p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="block text-xs font-semibold text-stone-200">
                    Localidades habilitadas ({currentLocalities.length})
                  </span>
                  <span className="block text-[11px] text-stone-400">
                    El formulario detecta tildes, mayúsculas y espacios extras automáticamente.
                  </span>
                </div>
                {!isDefaultLocalities && (
                  <button
                    type="button"
                    onClick={handleRestoreDefaultLocalities}
                    className="inline-flex items-center gap-1 rounded-xl bg-transparent text-stone-300 border border-stone-700 hover:border-amber-200/75 hover:text-amber-200 text-[11px] font-medium px-2.5 py-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar localidades oficiales</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {currentLocalities.map((loc, idx) => (
                  <span
                    key={`${loc}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-transparent border border-emerald-300/45 px-2.5 py-1 text-[11px] font-medium text-emerald-300/90"
                  >
                    <span>{loc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLocality(idx)}
                      aria-label={`Quitar localidad ${loc}`}
                      title={`Quitar ${loc}`}
                      className="text-stone-400 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {currentLocalities.length === 0 && (
                  <span className="text-[11px] text-amber-200/90 italic">
                    Lista vacía: al guardar se restaurarán las localidades oficiales por defecto.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newLocalityInput}
                  onChange={(e) => setNewLocalityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLocalities();
                    }
                  }}
                  placeholder="Agregar localidad (ej. Dufaur o varias separadas por coma)"
                  aria-label="Agregar nueva localidad habilitada"
                  className="flex-1 min-w-0 rounded-xl bg-stone-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddLocalities}
                  className="inline-flex items-center gap-1 rounded-xl bg-transparent text-amber-200/90 hover:text-amber-100 border border-amber-300/45 hover:border-amber-200/75 text-xs font-medium px-3 py-1.5 cursor-pointer shrink-0 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </div>

              <div>
                <label
                  htmlFor="admin-resident-localities-text"
                  className="block text-[11px] text-stone-400 mb-1"
                >
                  Edición directa separada por comas:
                </label>
                <input
                  id="admin-resident-localities-text"
                  type="text"
                  value={localitiesText}
                  onChange={(e) => handleLocalitiesTextChange(e.target.value)}
                  onBlur={handleLocalitiesTextBlur}
                  placeholder={DEFAULT_RESIDENT_LOCALITIES.join(', ')}
                  className="w-full rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-xs font-mono text-stone-200"
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Beneficios para Teams (Tarjeta en Hero) */}
      {(() => {
        const teamsBenefitEnabled =
          typeof draft.teamsBenefitEnabled === 'boolean'
            ? draft.teamsBenefitEnabled
            : RACE_CONFIG.teamsBenefitEnabled;

        const teamsShowGroupCoupon = draft.teamsShowGroupCoupon !== false;
        const teamsShowFreePasses = draft.teamsShowFreePasses !== false;

        const orgEmailValue =
          String(draft.notificationEmail ?? '') !== ''
            ? draft.notificationEmail
            : draft.teamsBenefitEmail ?? '';
        const previewTeamsEmail =
          String(draft.notificationEmail || '').trim() ||
          String(draft.teamsBenefitEmail || '').trim() ||
          DEFAULT_TEAMS_BENEFIT_EMAIL;

        const rawTeamsFreeEvery = Number(draft.teamsFreeEvery);
        const previewTeamsFreeEvery =
          draft.teamsFreeEvery !== '' &&
          draft.teamsFreeEvery !== null &&
          Number.isFinite(rawTeamsFreeEvery) &&
          rawTeamsFreeEvery >= 1
            ? Math.min(100, Math.max(1, Math.round(rawTeamsFreeEvery)))
            : DEFAULT_TEAMS_FREE_EVERY;

        const handleTeamsFreeEveryChange = (rawVal) => {
          if (rawVal === '') {
            setDraft((prev) => ({ ...prev, teamsFreeEvery: '' }));
            return;
          }
          const parsed = Number.parseInt(rawVal, 10);
          if (!Number.isFinite(parsed)) return;
          const clamped = Math.min(100, Math.max(1, parsed));
          setDraft((prev) => ({ ...prev, teamsFreeEvery: clamped }));
        };

        const handleTeamsFreeEveryBlur = () => {
          setDraft((prev) => {
            const parsed = Number(prev.teamsFreeEvery);
            const normalized =
              prev.teamsFreeEvery !== '' &&
              prev.teamsFreeEvery !== null &&
              Number.isFinite(parsed) &&
              parsed >= 1
                ? Math.min(100, Math.max(1, Math.round(parsed)))
                : DEFAULT_TEAMS_FREE_EVERY;
            return { ...prev, teamsFreeEvery: normalized };
          });
        };

        const rawTeamsGroupDiscount = Number(draft.teamsGroupDiscountPercent);
        const previewTeamsGroupDiscount =
          draft.teamsGroupDiscountPercent !== '' &&
          draft.teamsGroupDiscountPercent !== null &&
          Number.isFinite(rawTeamsGroupDiscount) &&
          rawTeamsGroupDiscount >= 1
            ? Math.min(100, Math.max(1, Math.round(rawTeamsGroupDiscount)))
            : DEFAULT_TEAMS_GROUP_DISCOUNT_PERCENT;

        const handleTeamsGroupDiscountChange = (rawVal) => {
          if (rawVal === '') {
            setDraft((prev) => ({ ...prev, teamsGroupDiscountPercent: '' }));
            return;
          }
          const parsed = Number.parseInt(rawVal, 10);
          if (!Number.isFinite(parsed)) return;
          const clamped = Math.min(100, Math.max(1, parsed));
          setDraft((prev) => ({ ...prev, teamsGroupDiscountPercent: clamped }));
        };

        const handleTeamsGroupDiscountBlur = () => {
          setDraft((prev) => {
            const parsed = Number(prev.teamsGroupDiscountPercent);
            const normalized =
              prev.teamsGroupDiscountPercent !== '' &&
              prev.teamsGroupDiscountPercent !== null &&
              Number.isFinite(parsed) &&
              parsed >= 1
                ? Math.min(100, Math.max(1, Math.round(parsed)))
                : DEFAULT_TEAMS_GROUP_DISCOUNT_PERCENT;
            return { ...prev, teamsGroupDiscountPercent: normalized };
          });
        };

        return (
          <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-4 h-4 text-amber-300/90 shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-display text-sm font-medium text-white uppercase tracking-wide">
                    Beneficios para Teams (Tarjeta en Hero)
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Muestra u oculta el cartel promocional de Running Teams en el costado izquierdo
                    del Hero.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className={`text-[11px] font-semibold ${
                    teamsBenefitEnabled ? 'text-emerald-300/90' : 'text-stone-400'
                  }`}
                >
                  {teamsBenefitEnabled ? 'Tarjeta Activa' : 'Oculta'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={teamsBenefitEnabled}
                  aria-label="Mostrar u ocultar tarjeta de Beneficios para Teams en el Hero"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      teamsBenefitEnabled: !(
                        typeof prev.teamsBenefitEnabled === 'boolean'
                          ? prev.teamsBenefitEnabled
                          : RACE_CONFIG.teamsBenefitEnabled
                      ),
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full bg-transparent border transition-colors cursor-pointer ${
                    teamsBenefitEnabled
                      ? 'border-emerald-300/75'
                      : 'border-stone-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                      teamsBenefitEnabled
                        ? 'translate-x-5.5 bg-emerald-300'
                        : 'translate-x-1 bg-stone-400'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-teams-benefit-email"
                className="block text-xs font-semibold text-stone-300 mb-1"
              >
                Email de coordinación para Profesores / Entrenadores
              </label>
              <input
                id="admin-teams-benefit-email"
                type="email"
                value={orgEmailValue}
                onChange={(e) => {
                  const nextEmail = e.target.value;
                  setDraft((prev) => ({
                    ...prev,
                    notificationEmail: nextEmail,
                    teamsBenefitEmail: nextEmail,
                  }));
                  if (emailTestStatus) setEmailTestStatus(null);
                }}
                onBlur={(e) => {
                  const trimmed = e.target.value.trim();
                  if (trimmed !== e.target.value) {
                    setDraft((prev) => ({
                      ...prev,
                      notificationEmail: trimmed,
                      teamsBenefitEmail: trimmed,
                    }));
                  }
                }}
                placeholder={DEFAULT_TEAMS_BENEFIT_EMAIL}
                className="w-full rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-semibold text-white"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-stone-400">
                  Vista previa en la cinta del Hero:
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-[2px] theme-poster-ribbon text-[var(--theme-ribbon-text)] font-display font-extrabold text-xs tracking-tight px-2.5 py-1 leading-tight">
                  <Mail className="w-3.5 h-3.5 text-[var(--theme-ribbon-text)] shrink-0 stroke-[2.5]" />
                  <span>{previewTeamsEmail}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-stretch pt-1">
              <div className="rounded-xl bg-zinc-950 border border-stone-800 p-2.5 flex flex-col justify-between gap-2">
                <div>
                  <label
                    htmlFor="admin-teams-group-discount"
                    className="block text-xs font-semibold text-stone-300 mb-1"
                  >
                    Descuento Código Grupal (% OFF)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="admin-teams-group-discount"
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={draft.teamsGroupDiscountPercent ?? DEFAULT_TEAMS_GROUP_DISCOUNT_PERCENT}
                      onChange={(e) => handleTeamsGroupDiscountChange(e.target.value)}
                      onBlur={handleTeamsGroupDiscountBlur}
                      className="w-24 rounded-xl bg-stone-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-bold text-amber-200/90 text-center"
                    />
                    <span className="text-xs font-mono font-semibold text-stone-300">% OFF</span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-teams-free-every"
                    className="block text-xs font-semibold text-stone-300 mb-1"
                  >
                    1 cupo FREE cada cuántos inscriptos
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="admin-teams-free-every"
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={draft.teamsFreeEvery ?? DEFAULT_TEAMS_FREE_EVERY}
                      onChange={(e) => handleTeamsFreeEveryChange(e.target.value)}
                      onBlur={handleTeamsFreeEveryBlur}
                      className="w-24 rounded-xl bg-stone-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-sm font-mono font-bold text-amber-200/90 text-center"
                    />
                    <span className="text-xs font-semibold text-stone-300">
                      {previewTeamsFreeEvery === 1 ? 'inscripto' : 'inscriptos'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 rounded-xl bg-transparent border border-stone-800 p-2.5 flex flex-col justify-center gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-300">
                    Vista previa en el cartel del Hero
                  </span>
                  {!teamsShowGroupCoupon && !teamsShowFreePasses && (
                    <span className="text-[10px] font-medium text-amber-200/90">
                      Ambos apagados: tarjeta oculta en portada
                    </span>
                  )}
                </div>
                <div className="rounded-lg bg-transparent border border-amber-300/35 p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2.5">
                    <div
                      className={`flex-1 min-w-0 rounded-[3px] bg-[#F5ECD2] px-2.5 py-0.5 font-display text-[11.5px] sm:text-xs font-bold text-zinc-900 leading-snug transition-opacity ${
                        teamsShowGroupCoupon ? '' : 'opacity-40'
                      }`}
                    >
                      Código Grupal:{' '}
                      <strong className="font-black text-[var(--theme-strip-accent)]">
                        {previewTeamsGroupDiscount}% OFF
                      </strong>{' '}
                      para el Team
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`min-w-[26px] text-right text-[11px] font-semibold ${
                          teamsShowGroupCoupon ? 'text-emerald-300/90' : 'text-stone-400'
                        }`}
                      >
                        {teamsShowGroupCoupon ? 'ON' : 'OFF'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={teamsShowGroupCoupon}
                        aria-label="Mostrar u ocultar barra de Código Grupal para el Team"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            teamsShowGroupCoupon: prev.teamsShowGroupCoupon === false,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-transparent border transition-colors cursor-pointer ${
                          teamsShowGroupCoupon ? 'border-emerald-300/75' : 'border-stone-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                            teamsShowGroupCoupon
                              ? 'translate-x-5.5 bg-emerald-300'
                              : 'translate-x-1 bg-stone-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2.5">
                    <div
                      className={`flex-1 min-w-0 rounded-[3px] bg-[#F5ECD2] px-2.5 py-0.5 font-display text-[11.5px] sm:text-xs font-bold text-zinc-900 leading-snug transition-opacity ${
                        teamsShowFreePasses ? '' : 'opacity-40'
                      }`}
                    >
                      Cupones{' '}
                      <strong className="font-black text-[var(--theme-strip-accent)]">
                        100% OFF
                      </strong>
                      : Profe y Pases Libres
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`min-w-[26px] text-right text-[11px] font-semibold ${
                          teamsShowFreePasses ? 'text-emerald-300/90' : 'text-stone-400'
                        }`}
                      >
                        {teamsShowFreePasses ? 'ON' : 'OFF'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={teamsShowFreePasses}
                        aria-label="Mostrar u ocultar barra de Cupones 100% OFF Profe y Pases Libres"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            teamsShowFreePasses: prev.teamsShowFreePasses === false,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-transparent border transition-colors cursor-pointer ${
                          teamsShowFreePasses ? 'border-emerald-300/75' : 'border-stone-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                            teamsShowFreePasses
                              ? 'translate-x-5.5 bg-emerald-300'
                              : 'translate-x-1 bg-stone-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                <PackageCheck className="w-4 h-4 text-amber-300/90 shrink-0" />
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
                className="inline-flex items-center gap-1 rounded-xl bg-transparent text-amber-200/90 hover:text-amber-100 border border-amber-300/45 hover:border-amber-200/75 text-xs font-medium px-3 py-1.5 cursor-pointer transition-colors"
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
                    className="flex-1 min-w-0 rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-1.5 text-xs font-mono font-semibold text-white"
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

      {/* Sponsors Oficiales (Zócalo "Nos acompañan:") */}
      {(() => {
        const sponsorsList = Array.isArray(draft.sponsors) ? draft.sponsors : [];

        const handleSponsorFieldChange = (index, field, value) => {
          setDraft((prev) => {
            const current = Array.isArray(prev.sponsors) ? [...prev.sponsors] : [];
            current[index] = {
              ...(current[index] || {}),
              [field]: value,
            };
            return { ...prev, sponsors: current };
          });
        };

        const handleAddSponsor = () => {
          setSponsorUploadError('');
          setDraft((prev) => {
            const current = Array.isArray(prev.sponsors) ? [...prev.sponsors] : [];
            current.push({
              id: `sponsor-${Date.now()}-${current.length}`,
              name: '',
              logoUrl: '',
              linkUrl: '',
              invertOnDark: false,
            });
            return { ...prev, sponsors: current };
          });
        };

        const handleRemoveSponsor = (index) => {
          setSponsorUploadError('');
          setDraft((prev) => {
            const current = Array.isArray(prev.sponsors) ? prev.sponsors : [];
            return {
              ...prev,
              sponsors: current.filter((_, idx) => idx !== index),
            };
          });
        };

        const handleUploadSponsorLogo = async (index, file) => {
          if (!file) return;
          setUploadingSponsorIdx(index);
          setSponsorUploadError('');
          try {
            const uploaded = await uploadImageToCloudinary(file, {
              folder: 'reto-al-filo/sponsors',
              resourceType: 'image',
            });
            handleSponsorFieldChange(index, 'logoUrl', uploaded.secureUrl);
          } catch (err) {
            setSponsorUploadError(
              err?.message || 'No se pudo subir el logo a Cloudinary. Revisá el archivo o pegá la URL.'
            );
          } finally {
            setUploadingSponsorIdx(null);
          }
        };

        return (
          <div className="rounded-2xl bg-stone-950 border border-stone-800 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Handshake className="w-4 h-4 text-amber-300/90 shrink-0" />
                <div>
                  <h4 className="font-display text-sm font-medium text-white uppercase tracking-wide">
                    Sponsors Oficiales (Zócalo «Nos acompañan:»)
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Subí el logo de cada sponsor y agregá su link a Instagram o sitio web. Si el logo es negro (ej. ENA), activá «Blanco sobre oscuro».
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddSponsor}
                className="inline-flex items-center gap-1 rounded-xl bg-transparent text-amber-200/90 hover:text-amber-100 border border-amber-300/45 hover:border-amber-200/75 text-xs font-medium px-3 py-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Sponsor</span>
              </button>
            </div>

            {sponsorUploadError && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{sponsorUploadError}</span>
              </p>
            )}

            {sponsorsList.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-1">
                Todavía no hay sponsors cargados. Mientras esté vacío, en el pie de página se muestra «Espacio disponible para marcas y sponsors oficiales».
              </p>
            ) : (
              <div className="space-y-2.5">
                {sponsorsList.map((sp, idx) => {
                  const isUploading = uploadingSponsorIdx === idx;
                  return (
                    <div
                      key={sp.id || `sponsor-row-${idx}`}
                      className="rounded-xl bg-zinc-950 border border-stone-800 p-2.5 flex flex-col sm:flex-row sm:items-center gap-2.5"
                    >
                      {/* Vista previa del logo sobre fondo oscuro */}
                      <div className="w-24 h-12 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center px-2 shrink-0 overflow-hidden">
                        {sp.logoUrl ? (
                          <img
                            src={sp.logoUrl}
                            alt={sp.name || `Sponsor ${idx + 1}`}
                            className={`max-h-9 max-w-full object-contain ${
                              sp.invertOnDark ? 'brightness-0 invert' : ''
                            }`}
                          />
                        ) : (
                          <span className="text-[10px] text-stone-500 text-center leading-tight">
                            Sin logo
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={sp.name || ''}
                          onChange={(e) => handleSponsorFieldChange(idx, 'name', e.target.value)}
                          placeholder="Nombre (ej. ENA Sport)"
                          aria-label={`Nombre del sponsor ${idx + 1}`}
                          className="w-full rounded-lg bg-stone-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-2.5 py-1.5 text-xs font-mono font-semibold text-white"
                        />
                        <input
                          type="text"
                          value={sp.linkUrl || ''}
                          onChange={(e) => handleSponsorFieldChange(idx, 'linkUrl', e.target.value)}
                          placeholder="Instagram o Web (ej. @enasport o https://...)"
                          aria-label={`Link web o Instagram del sponsor ${idx + 1}`}
                          className="w-full rounded-lg bg-stone-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-2.5 py-1.5 text-xs font-mono text-white"
                        />
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={sp.logoUrl || ''}
                            onChange={(e) => handleSponsorFieldChange(idx, 'logoUrl', e.target.value)}
                            placeholder="URL del logo o subir →"
                            aria-label={`URL del logo del sponsor ${idx + 1}`}
                            className="flex-1 min-w-0 rounded-lg bg-stone-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-2.5 py-1.5 text-xs font-mono text-stone-300"
                          />
                          <label
                            title="Subir archivo de logo (PNG, WebP, SVG o JPG)"
                            className={`inline-flex items-center gap-1 rounded-lg bg-transparent border border-amber-300/45 hover:border-amber-200/75 text-amber-200/90 hover:text-amber-100 text-[11px] font-medium px-2 py-1.5 shrink-0 transition-colors ${
                              isUploading ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                            }`}
                          >
                            {isUploading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>{isUploading ? '...' : 'Subir'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = '';
                                handleUploadSponsorLogo(idx, file);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleSponsorFieldChange(idx, 'invertOnDark', !sp.invertOnDark)
                          }
                          title="Invierte logos negros a blanco puro para que contrasten en el pie de página oscuro"
                          className={`rounded-lg bg-transparent border px-2 py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
                            sp.invertOnDark
                              ? 'border-stone-200/85 text-stone-100'
                              : 'text-stone-400 border-stone-700 hover:border-stone-500 hover:text-stone-200'
                          }`}
                        >
                          {sp.invertOnDark ? 'Blanco ✓' : 'Color original'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveSponsor(idx)}
                          aria-label={`Quitar sponsor ${idx + 1}`}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-900 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              <FileText className="w-4 h-4 text-amber-300/90 shrink-0" />
              <div>
                <h4 className="font-display text-sm font-medium text-white uppercase tracking-wide">
                  Documentos Legales (Deslinde y Apto Médico A4)
                </h4>
                <p className="text-[11px] text-stone-400">
                  Editá el texto que aparece impreso en el Deslinde y en el Apto Médico. Usá{' '}
                  <code className="text-amber-200/90 bg-transparent border border-amber-300/35 px-1 rounded">{'{RACE_TITLE}'}</code>{' '}
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
                    className="inline-flex items-center gap-1 rounded-xl bg-transparent text-amber-200/90 hover:text-amber-100 border border-amber-300/45 hover:border-amber-200/75 text-xs font-medium px-2.5 py-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Vista previa A4</span>
                  </button>
                  {!waiverIsDefault && (
                    <button
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, waiverCustomText: '' }))}
                      title="Restaurar el texto original del Deslinde"
                      className="inline-flex items-center gap-1 rounded-xl bg-transparent text-stone-400 border border-stone-700 hover:border-rose-400/70 hover:text-rose-300 text-xs font-medium px-2.5 py-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar original</span>
                    </button>
                  )}
                  {waiverIsDefault && (
                    <span className="text-[11px] text-emerald-300/90 font-medium">✓ Texto oficial</span>
                  )}
                </div>
              </div>
              <ResizableTextarea
                rows={8}
                value={waiverText}
                onChange={(e) => setDraft((prev) => ({ ...prev, waiverCustomText: e.target.value }))}
                placeholder={DEFAULT_WAIVER_TEXT}
                className="rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-2 text-xs text-stone-200 font-mono"
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
                    className="inline-flex items-center gap-1 rounded-xl bg-transparent text-amber-200/90 hover:text-amber-100 border border-amber-300/45 hover:border-amber-200/75 text-xs font-medium px-2.5 py-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Vista previa A4</span>
                  </button>
                  {!medicalIsDefault && (
                    <button
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, medicalCustomText: '' }))}
                      title="Restaurar el texto original del Apto Médico"
                      className="inline-flex items-center gap-1 rounded-xl bg-transparent text-stone-400 border border-stone-700 hover:border-rose-400/70 hover:text-rose-300 text-xs font-medium px-2.5 py-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar original</span>
                    </button>
                  )}
                  {medicalIsDefault && (
                    <span className="text-[11px] text-emerald-300/90 font-medium">✓ Texto oficial</span>
                  )}
                </div>
              </div>
              <ResizableTextarea
                rows={4}
                value={medicalText}
                onChange={(e) => setDraft((prev) => ({ ...prev, medicalCustomText: e.target.value }))}
                placeholder={DEFAULT_MEDICAL_TEXT}
                className="rounded-xl bg-zinc-950 border border-amber-300/40 focus:border-amber-200/80 focus:outline-none px-3 py-2 text-xs text-stone-200 font-mono"
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
