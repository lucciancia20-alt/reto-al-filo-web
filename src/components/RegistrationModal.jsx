import React, { useEffect, useState } from 'react';
import {
  X,
  MessageCircle,
  Mountain,
  CheckCircle2,
  ArrowUpRight,
  Copy,
  Check,
  Upload,
  FileText,
  Landmark,
  AlertCircle,
  Loader2,
  User,
  ShieldAlert,
} from 'lucide-react';
import { RACE_CONFIG, buildWhatsAppUrl } from '../data/raceConfig';
import {
  validateUploadFile,
  uploadImageToCloudinary,
  submitRunnerRegistration,
} from '../firebase/config';

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const GENDERS = ['Femenino', 'Masculino', 'Otro'];

const INITIAL_FORM = {
  fullName: '',
  dni: '',
  birthDate: '',
  gender: 'Femenino',
  phone: '',
  email: '',
  city: '',
  team: '',
  shirtSize: 'M',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalNotes: '',
};

function formatBirthDateInput(rawValue) {
  const digits = String(rawValue || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isValidBirthDate(value) {
  const match = String(value || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const maxYear = new Date().getFullYear() - 5;
  if (year < 1920 || year > maxYear || month < 1 || month > 12 || day < 1) {
    return false;
  }
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export default function RegistrationModal({
  isOpen,
  onClose,
  initialDistance = '27K',
  raceConfig = RACE_CONFIG,
}) {
  const [selectedDistance, setSelectedDistance] = useState(initialDistance);
  const [form, setForm] = useState(INITIAL_FORM);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [confirmedReg, setConfirmedReg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDistance(initialDistance);
      setSubmitError('');
      setSubmitStep('');
    }
  }, [initialDistance, isOpen]);

  useEffect(() => {
    return () => {
      if (receiptPreview) {
        URL.revokeObjectURL(receiptPreview);
      }
    };
  }, [receiptPreview]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, submitting]);

  if (!isOpen) return null;

  const circuits = raceConfig?.circuits || RACE_CONFIG.circuits;
  const payment = raceConfig?.payment || RACE_CONFIG.payment;

  const distances = ['27K', '13K'].map((id) => {
    const c = circuits[id] || RACE_CONFIG.circuits[id];
    const stationCount = Array.isArray(c.hydrationStations)
      ? c.hydrationStations.length
      : c.hydrationCount;
    return {
      id,
      title: id === '13K' ? '13K Competitivo' : '27K Competitivo',
      price: c.price || RACE_CONFIG.circuits[id].price,
      elevation: `${c.elevationGain} D+`,
      details: `${stationCount} Puestos de Hidratación · Corte ${c.cutoffTime}`,
    };
  });

  const activeDistanceInfo =
    distances.find((d) => d.id === selectedDistance) || distances[0];

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCopyText = async (field, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    }
  };

  const handleSelectReceipt = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateUploadFile(file);
    } catch (err) {
      e.target.value = '';
      if (receiptPreview) {
        URL.revokeObjectURL(receiptPreview);
      }
      setReceiptFile(null);
      setReceiptPreview('');
      setSubmitError(err.message || 'Archivo de comprobante no válido.');
      return;
    }

    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
    }

    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      setReceiptPreview(URL.createObjectURL(file));
    } else {
      setReceiptPreview('');
    }
    setSubmitError('');
  };

  const handleClearReceipt = () => {
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
    }
    setReceiptFile(null);
    setReceiptPreview('');
  };

  const handleResetAll = () => {
    handleClearReceipt();
    setForm(INITIAL_FORM);
    setConfirmedReg(null);
    setSubmitError('');
    setSubmitStep('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!isValidBirthDate(form.birthDate)) {
      setSubmitError(
        'Ingresá una Fecha de Nacimiento válida en formato DD/MM/AAAA (por ejemplo 15/06/1987).'
      );
      return;
    }

    if (!receiptFile) {
      setSubmitError(
        'Adjuntá la foto, captura o PDF del comprobante de transferencia para completar tu inscripción.'
      );
      return;
    }

    setSubmitting(true);
    try {
      setSubmitStep('Subiendo comprobante de pago de forma segura...');
      const uploaded = await uploadImageToCloudinary(receiptFile, {
        folder: 'reto-al-filo/comprobantes',
        resourceType: 'auto',
      });

      setSubmitStep('Registrando tu ficha de corredor...');
      const created = await submitRunnerRegistration({
        ...form,
        distance: selectedDistance,
        priceSnapshot: activeDistanceInfo.price,
        receiptUrl: uploaded.secureUrl,
        receiptPublicId: uploaded.publicId,
        receiptFormat: uploaded.format || '',
      });

      setConfirmedReg(created);
    } catch (err) {
      setSubmitError(
        err?.message || 'No se pudo completar la inscripción. Intentá nuevamente.'
      );
    } finally {
      setSubmitting(false);
      setSubmitStep('');
    }
  };

  const cleanPhone = String(
    raceConfig.whatsappNumber || RACE_CONFIG.whatsappNumber
  ).replace(/[^\d]/g, '');

  const confirmationWhatsappHref = confirmedReg
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hola! Ya completé mi inscripción web en Reto al Filo - 2da Edición.\nCódigo: ${confirmedReg.code}\nCorredor/a: ${confirmedReg.fullName} (DNI ${confirmedReg.dni})\nDistancia: ${confirmedReg.distance} (${confirmedReg.priceSnapshot})\nTalle remera: ${confirmedReg.shirtSize}`
      )}`
    : buildWhatsAppUrl(selectedDistance, raceConfig.whatsappNumber);

  const supportWhatsappHref = buildWhatsAppUrl(
    selectedDistance,
    raceConfig.whatsappNumber
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-sm animate-fadeIn overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-inscripcion-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[92dvh] rounded-3xl bg-stone-900 border border-stone-700/90 shadow-2xl text-stone-100 flex flex-col overflow-hidden overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera fija */}
        <div className="px-4 sm:px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Mountain className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-amber-400 truncate">
                Inscripción Oficial Online · {raceConfig.subtitle || 'Abril 2027'}
              </span>
              <h3
                id="modal-inscripcion-title"
                className="font-display text-lg sm:text-xl font-black text-white truncate"
              >
                {confirmedReg ? '¡Inscripción Enviada!' : 'Formulario de Inscripción'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar ventana de inscripción"
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedReg ? (
          <>
            {/* Pantalla de Confirmación */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-5">
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/35 p-5 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-300">
                  Ficha y Comprobante Recibidos
                </p>
                <div className="mt-2 inline-block rounded-xl bg-stone-950 border border-emerald-500/40 px-4 py-2">
                  <span className="block text-[10px] uppercase tracking-wider text-stone-400">
                    Tu Código de Inscripción
                  </span>
                  <span className="font-mono text-2xl font-black text-amber-400 tracking-wider">
                    {confirmedReg.code}
                  </span>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-stone-200 max-w-md mx-auto">
                  Tu inscripción quedó registrada como{' '}
                  <strong className="text-amber-300">pendiente de verificación</strong>. La
                  organización validará tu comprobante y confirmará tu número de dorsal.
                </p>
              </div>

              <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between gap-3 py-1 border-b border-stone-800/80">
                  <span className="text-stone-400">Corredor/a</span>
                  <span className="font-bold text-white text-right">
                    {confirmedReg.fullName}
                  </span>
                </div>
                <div className="flex justify-between gap-3 py-1 border-b border-stone-800/80">
                  <span className="text-stone-400">DNI</span>
                  <span className="font-mono text-stone-100">{confirmedReg.dni}</span>
                </div>
                <div className="flex justify-between gap-3 py-1 border-b border-stone-800/80">
                  <span className="text-stone-400">Distancia</span>
                  <span
                    className={`font-bold ${
                      confirmedReg.distance === '13K' ? 'text-red-500' : 'text-cyan-400'
                    }`}
                  >
                    {confirmedReg.distance} ({confirmedReg.priceSnapshot})
                  </span>
                </div>
                <div className="flex justify-between gap-3 py-1 border-b border-stone-800/80">
                  <span className="text-stone-400">Talle de Remera</span>
                  <span className="font-bold text-stone-100">{confirmedReg.shirtSize}</span>
                </div>
                <div className="flex justify-between items-center gap-3 pt-1">
                  <span className="text-stone-400">Comprobante adjunto</span>
                  <a
                    href={confirmedReg.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 underline"
                  >
                    Ver comprobante subido
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 bg-stone-950 border-t border-stone-800 flex flex-col sm:flex-row gap-2.5 shrink-0">
              <a
                href={confirmationWhatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-display font-black text-xs sm:text-sm uppercase tracking-wide px-4 py-3 shadow-lg shadow-emerald-500/20"
              >
                <MessageCircle className="w-4 h-4 fill-stone-950 shrink-0" />
                Enviar código por WhatsApp (opcional)
              </a>
              <button
                type="button"
                onClick={() => {
                  handleResetAll();
                  onClose();
                }}
                className="min-h-[46px] rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs sm:text-sm px-5 py-3 cursor-pointer"
              >
                Listo, cerrar
              </button>
            </div>
          </>
        ) : (
          <form
            id="runner-registration-form"
            autoComplete="off"
            onSubmit={handleSubmit}
            className="flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            {/* Cuerpo Scrolleable */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
              {/* 1. Distancia */}
              <section>
                <span className="block text-[11px] font-bold uppercase tracking-widest text-amber-400 mb-2">
                  1 · Elegí tu Distancia
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {distances.map((item) => {
                    const active = selectedDistance === item.id;
                    const is13K = item.id === '13K';
                    const cardClass = active
                      ? is13K
                        ? 'bg-stone-950 border-red-500 shadow-lg shadow-red-500/20'
                        : 'bg-stone-950 border-cyan-500 shadow-lg shadow-cyan-500/20'
                      : is13K
                        ? 'bg-stone-950/80 border-red-500/70 hover:border-red-500'
                        : 'bg-stone-950/80 border-cyan-500/70 hover:border-cyan-500';
                    const titleClass = is13K ? 'text-red-500' : 'text-cyan-400';
                    const iconClass = active
                      ? is13K
                        ? 'text-red-500'
                        : 'text-cyan-400'
                      : 'text-stone-700';

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedDistance(item.id)}
                        className={`w-full text-left rounded-2xl p-3.5 border transition-all cursor-pointer flex items-center justify-between gap-2 ${cardClass}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span
                              className={`font-display text-base sm:text-lg font-black ${titleClass}`}
                            >
                              {item.title}
                            </span>
                            <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {item.price}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-stone-300">
                            {item.elevation} · {item.details}
                          </p>
                        </div>

                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${iconClass}`} />
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 2. Datos Bancarios para Transferir */}
              <section className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    2 · Transferencia Bancaria / Mercado Pago ({activeDistanceInfo.price})
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  {payment.instructions}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl bg-stone-900 border border-stone-800 p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block text-[10px] uppercase text-stone-400">
                        Alias
                      </span>
                      <span className="font-mono font-bold text-amber-300 truncate block">
                        {payment.bankAlias}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText('alias', payment.bankAlias)}
                      className="inline-flex items-center gap-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer shrink-0"
                    >
                      {copiedField === 'alias' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Alias</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-xl bg-stone-900 border border-stone-800 p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block text-[10px] uppercase text-stone-400">
                        CBU / CVU
                      </span>
                      <span className="font-mono font-bold text-stone-100 truncate block">
                        {payment.bankCbu}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText('cbu', payment.bankCbu)}
                      className="inline-flex items-center gap-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer shrink-0"
                    >
                      {copiedField === 'cbu' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar CBU</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-stone-400">
                  Titular: <strong className="text-stone-200">{payment.bankHolder}</strong>
                </p>
              </section>

              {/* 3. Datos Personales del Corredor */}
              <section className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    3 · Datos del Corredor/a
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="reg-fullname"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Nombre y Apellido completos *
                    </label>
                    <input
                      id="reg-fullname"
                      type="text"
                      required
                      autoComplete="off"
                      value={form.fullName}
                      onChange={(e) => handleFieldChange('fullName', e.target.value)}
                      placeholder="Ej. María Gómez"
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-400 focus:outline-none px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-dni"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      DNI *
                    </label>
                    <input
                      id="reg-dni"
                      type="text"
                      inputMode="numeric"
                      required
                      autoComplete="off"
                      value={form.dni}
                      onChange={(e) => handleFieldChange('dni', e.target.value)}
                      placeholder="Ej. 34567890"
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-400 focus:outline-none px-3.5 py-2.5 text-sm font-mono text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-birthdate"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Fecha de Nacimiento *
                    </label>
                    <input
                      id="reg-birthdate"
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      autoComplete="off"
                      value={form.birthDate}
                      onChange={(e) =>
                        handleFieldChange('birthDate', formatBirthDateInput(e.target.value))
                      }
                      placeholder="DD/MM/AAAA"
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-400 focus:outline-none px-3.5 py-2.5 text-sm font-mono text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-gender"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Categoría / Género *
                    </label>
                    <select
                      id="reg-gender"
                      autoComplete="off"
                      value={form.gender}
                      onChange={(e) => handleFieldChange('gender', e.target.value)}
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-400 focus:outline-none px-3.5 py-2.5 text-sm text-white"
                    >
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-phone"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Celular / WhatsApp *
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      autoComplete="off"
                      value={form.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="Ej. 291 4000000"
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-400 focus:outline-none px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Email *
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      autoComplete="off"
                      value={form.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="corredor@mail.com"
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-400 focus:outline-none px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-city"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Localidad / Provincia *
                    </label>
                    <input
                      id="reg-city"
                      type="text"
                      required
                      autoComplete="off"
                      value={form.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      placeholder="Ej. Bahía Blanca, Bs. As."
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-400 focus:outline-none px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="reg-team"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Running Team / Agrupación (opcional)
                    </label>
                    <input
                      id="reg-team"
                      type="text"
                      autoComplete="off"
                      value={form.team}
                      onChange={(e) => handleFieldChange('team', e.target.value)}
                      placeholder="Ej. Sierra Trail Runners o Libre"
                      className="w-full rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-400 focus:outline-none px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  {/* Talle de Remera */}
                  <div className="sm:col-span-2">
                    <span className="block text-xs font-semibold text-stone-300 mb-1.5">
                      Talle de Remera Oficial *
                    </span>
                    <div className="grid grid-cols-6 gap-1.5">
                      {SHIRT_SIZES.map((size) => {
                        const active = form.shirtSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleFieldChange('shirtSize', size)}
                            className={`min-h-[42px] rounded-xl font-display font-bold text-xs sm:text-sm border transition-colors cursor-pointer ${
                              active
                                ? 'bg-amber-500 text-stone-950 border-amber-400'
                                : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-600'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Contacto de Emergencia y Datos Médicos */}
                <div className="rounded-2xl bg-orange-500/10 border border-orange-500/40 p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Seguridad en Montaña (Contacto de Emergencia)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="reg-emergency-name"
                        className="block text-xs font-semibold text-stone-300 mb-1"
                      >
                        Nombre del Contacto *
                      </label>
                      <input
                        id="reg-emergency-name"
                        type="text"
                        required
                        autoComplete="off"
                        value={form.emergencyContactName}
                        onChange={(e) =>
                          handleFieldChange('emergencyContactName', e.target.value)
                        }
                        placeholder="Ej. Carlos Gómez (Familiar)"
                        className="w-full rounded-xl bg-stone-900 border border-stone-700 focus:border-amber-400 focus:outline-none px-3.5 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-emergency-phone"
                        className="block text-xs font-semibold text-stone-300 mb-1"
                      >
                        Teléfono de Emergencia *
                      </label>
                      <input
                        id="reg-emergency-phone"
                        type="tel"
                        required
                        autoComplete="off"
                        value={form.emergencyContactPhone}
                        onChange={(e) =>
                          handleFieldChange('emergencyContactPhone', e.target.value)
                        }
                        placeholder="Ej. 291 4001122"
                        className="w-full rounded-xl bg-stone-900 border border-stone-700 focus:border-amber-400 focus:outline-none px-3.5 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="reg-medical"
                        className="block text-xs font-semibold text-stone-300 mb-1"
                      >
                        Obra Social / Alergias / Observaciones Médicas (opcional)
                      </label>
                      <input
                        id="reg-medical"
                        type="text"
                        autoComplete="off"
                        value={form.medicalNotes}
                        onChange={(e) =>
                          handleFieldChange('medicalNotes', e.target.value)
                        }
                        placeholder="Ej. OSDE · Sin alergias"
                        className="w-full rounded-xl bg-stone-900 border border-stone-700 focus:border-amber-400 focus:outline-none px-3.5 py-2.5 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. Adjuntar Comprobante */}
              <section className="space-y-2.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-white">
                  4 · Adjuntar Comprobante de Pago *
                </span>
                <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-950/70 p-4 flex flex-col sm:flex-row items-center gap-4">
                  {receiptPreview ? (
                    <img
                      src={receiptPreview}
                      alt="Vista previa del comprobante de pago"
                      className="w-20 h-20 rounded-xl object-cover border border-stone-700 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500 shrink-0">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <p className="text-xs font-semibold text-stone-200 truncate">
                      {receiptFile
                        ? `Comprobante listo: ${receiptFile.name}`
                        : 'Subí la captura de pantalla, foto o PDF del comprobante'}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Formatos aceptados: JPG, PNG, WEBP o PDF (máx. 8 MB).
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-bold text-xs uppercase tracking-wider px-4 py-2.5 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        {receiptFile ? 'Cambiar Comprobante' : 'Adjuntar Comprobante'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={handleSelectReceipt}
                          className="hidden"
                        />
                      </label>
                      {receiptFile && (
                        <button
                          type="button"
                          onClick={handleClearReceipt}
                          className="text-xs text-stone-400 hover:text-stone-200 px-2 py-1.5 cursor-pointer"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {submitStep && (
                <div className="rounded-xl bg-amber-500/15 border border-amber-500/35 p-3 text-xs text-amber-200 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
                  <span>{submitStep}</span>
                </div>
              )}

              {submitError && (
                <div
                  role="alert"
                  className="rounded-xl bg-rose-500/15 border border-rose-500/35 p-3 text-xs text-rose-200 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="text-center pt-1">
                <a
                  href={supportWhatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-emerald-400 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  ¿Tenés alguna consulta antes de transferir? Escribinos por WhatsApp
                </a>
              </div>
            </div>

            {/* Footer fijo */}
            <div className="px-4 sm:px-6 py-3.5 bg-stone-950 border-t border-stone-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="min-h-[44px] rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold px-5 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider py-3 px-6 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando Inscripción...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Inscripción ({selectedDistance})
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
