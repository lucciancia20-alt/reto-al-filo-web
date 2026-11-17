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
  Ruler,
  Printer,
  FileCheck2,
  PackageCheck,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import {
  RACE_CONFIG,
  buildWhatsAppUrl,
  getRaceFullTitle,
  calculateRunnerAgeAtRace,
  resolveRunnerCategory,
  getMaxBirthDateIso,
  formatBirthDateDmy,
} from '../data/raceConfig';
import {
  validateUploadFile,
  uploadImageToCloudinary,
  submitRunnerRegistration,
} from '../firebase/config';
import { sendRegistrationNotificationEmail } from '../utils/emailNotification';
import { openPrintableWaiver, openPrintableMedicalCert } from '../utils/printableDocs';

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHIRT_SIZE_GUIDE = [
  { size: 'XS', width: '46 cm', length: '64 cm' },
  { size: 'S', width: '49 cm', length: '67 cm' },
  { size: 'M', width: '52 cm', length: '70 cm' },
  { size: 'L', width: '55 cm', length: '72 cm' },
  { size: 'XL', width: '58 cm', length: '75 cm' },
  { size: 'XXL', width: '61 cm', length: '78 cm' },
];
const GENDERS = ['Femenino', 'Masculino', 'Otro'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-', 'No sabe'];

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
  bloodType: 'No sabe',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalNotes: '',
};

const MIN_BIRTH_DATE_ISO = '1926-01-01';
const UNDERAGE_ERROR_MSG =
  'La edad mínima para inscribirse es de 18 años cumplidos al día de la carrera.';
const INVALID_BIRTHDATE_MSG =
  'Ingresá una Fecha de Nacimiento válida (desde 01/01/1926 y con al menos 18 años al día de la carrera).';

function getBirthDateValidationError(birthDateStr, raceDateIso, maxBirthDateIso) {
  const raw = String(birthDateStr || '').trim();
  if (!raw) return INVALID_BIRTHDATE_MSG;

  const age = calculateRunnerAgeAtRace(raw, raceDateIso);
  if (raw > maxBirthDateIso || (age !== null && age < 18)) {
    return UNDERAGE_ERROR_MSG;
  }
  if (raw < MIN_BIRTH_DATE_ISO || age === null) {
    return INVALID_BIRTHDATE_MSG;
  }
  return '';
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
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [confirmedReg, setConfirmedReg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDistance(initialDistance);
      setSubmitError('');
      setBirthDateError('');
      setSubmitStep('');
      setShowTermsModal(false);
      setShowSizeGuide(false);
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

  const kitItems = (
    Array.isArray(raceConfig?.kitIncludes) ? raceConfig.kitIncludes : RACE_CONFIG.kitIncludes
  ).filter((item) => String(item || '').trim());

  const mandatoryGear = raceConfig?.mandatoryGear || RACE_CONFIG.mandatoryGear;
  const gear27 = (
    Array.isArray(mandatoryGear?.['27K']) ? mandatoryGear['27K'] : RACE_CONFIG.mandatoryGear['27K']
  ).filter((item) => String(item || '').trim());
  const gear13 = (
    Array.isArray(mandatoryGear?.['13K']) ? mandatoryGear['13K'] : RACE_CONFIG.mandatoryGear['13K']
  ).filter((item) => String(item || '').trim());

  const reglamentFaq = (raceConfig?.faqs || RACE_CONFIG.faqs).find((f) => f.id === 'reglamento');
  const ageCategories = raceConfig?.ageCategories || RACE_CONFIG.ageCategories;

  // Nombres de distancia dinámicos desde circuits (con fallback)
  const label27 = circuits?.['27K']?.tabLabel || '27K Competitivo';
  const label13 = circuits?.['13K']?.tabLabel || '13K Competitivo';

  const distances = ['27K', '13K'].map((id) => {
    const c = circuits[id] || RACE_CONFIG.circuits[id];
    const stationCount = Array.isArray(c.hydrationStations)
      ? c.hydrationStations.length
      : c.hydrationCount;
    return {
      id,
      title: c.tabLabel || (id === '13K' ? '13K Competitivo' : '27K Competitivo'),
      price: c.price || RACE_CONFIG.circuits[id].price,
      elevation: `${c.elevationGain} D+`,
      details: `${stationCount} Puestos de Hidratación · Corte ${c.cutoffTime}`,
    };
  });

  const activeDistanceInfo =
    distances.find((d) => d.id === selectedDistance) || distances[0];

  const raceDateIso = raceConfig?.targetDateIso || RACE_CONFIG.targetDateIso;
  const maxBirthDateIso = getMaxBirthDateIso(raceDateIso, 18);
  const runnerAgeAtRace = calculateRunnerAgeAtRace(form.birthDate, raceDateIso);
  const isRunnerAdult =
    Boolean(form.birthDate) &&
    form.birthDate >= MIN_BIRTH_DATE_ISO &&
    form.birthDate <= maxBirthDateIso &&
    runnerAgeAtRace !== null &&
    runnerAgeAtRace >= 18;
  const runnerCategoryPreview = isRunnerAdult
    ? resolveRunnerCategory(
        { birthDate: form.birthDate, gender: form.gender, distance: selectedDistance },
        raceConfig
      )
    : null;

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBirthDateChange = (rawValue) => {
    handleFieldChange('birthDate', rawValue);

    if (!rawValue) {
      setBirthDateError('');
      if (submitError === UNDERAGE_ERROR_MSG || submitError === INVALID_BIRTHDATE_MSG) {
        setSubmitError('');
      }
      return;
    }

    const yearPrefix = Number(String(rawValue).slice(0, 4));
    if (!Number.isFinite(yearPrefix) || yearPrefix < 1000) {
      return;
    }

    const validationMsg = getBirthDateValidationError(rawValue, raceDateIso, maxBirthDateIso);
    setBirthDateError(validationMsg);
    if (!validationMsg && (submitError === UNDERAGE_ERROR_MSG || submitError === INVALID_BIRTHDATE_MSG)) {
      setSubmitError('');
    }
  };

  const handleBirthDateBlur = () => {
    if (!form.birthDate) {
      setBirthDateError('');
      return;
    }
    setBirthDateError(
      getBirthDateValidationError(form.birthDate, raceDateIso, maxBirthDateIso)
    );
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
    setBirthDateError('');
    setSubmitStep('');
    setAcceptedTerms(false);
    setShowTermsModal(false);
    setShowSizeGuide(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const birthValidationError = getBirthDateValidationError(
      form.birthDate,
      raceDateIso,
      maxBirthDateIso
    );
    if (birthValidationError) {
      setBirthDateError(birthValidationError);
      setSubmitError(birthValidationError);
      return;
    }
    setBirthDateError('');

    if (!receiptFile) {
      setSubmitError(
        'Adjuntá la foto, captura o PDF del comprobante de transferencia para completar tu inscripción.'
      );
      return;
    }

    if (!acceptedTerms) {
      setSubmitError(
        'Debés aceptar el Reglamento Oficial y el Deslinde de Responsabilidad antes de confirmar tu inscripción.'
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
        birthDate: formatBirthDateDmy(form.birthDate),
        targetDateIso: raceDateIso,
        acceptedTerms: true,
        distance: selectedDistance,
        priceSnapshot: activeDistanceInfo.price,
        receiptUrl: uploaded.secureUrl,
        receiptPublicId: uploaded.publicId,
        receiptFormat: uploaded.format || '',
      });

      void (async () => {
        try {
          await sendRegistrationNotificationEmail({
            notificationEmail: raceConfig?.notificationEmail,
            raceTitle: getRaceFullTitle(raceConfig),
            registration: created,
            uploadedUrl: uploaded.secureUrl,
          });
        } catch (err) {
          console.error('[Inscripción] Error enviando notificación EmailJS en segundo plano:', {
            status: err?.status,
            text: err?.text,
            err,
          });
        }
      })();
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

  const cleanPhone =
    String(raceConfig?.whatsappNumber || RACE_CONFIG.whatsappNumber).replace(/[^\d]/g, '') ||
    RACE_CONFIG.whatsappNumber;

  const confirmationWhatsappHref = confirmedReg
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `¡Hola! Acabo de inscribirme a ${getRaceFullTitle(raceConfig)}. Mi código es *${confirmedReg.code}* - *${confirmedReg.fullName}* (*${confirmedReg.distance}*). Ya adjunté el comprobante en la web.`
      )}`
    : buildWhatsAppUrl(selectedDistance, raceConfig.whatsappNumber, raceConfig);

  const supportWhatsappHref = buildWhatsAppUrl(
    selectedDistance,
    raceConfig.whatsappNumber,
    raceConfig
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-zinc-950/85 backdrop-blur-sm animate-fadeIn overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-inscripcion-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[92dvh] rounded-3xl bg-zinc-950 border border-stone-700/90 shadow-2xl text-stone-100 flex flex-col overflow-hidden overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera fija */}
        <div className="px-4 sm:px-6 py-4 bg-zinc-950 border-b border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Mountain className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-amber-400 truncate">
                Inscripción Oficial Online · {getRaceFullTitle(raceConfig, ' · ')}
                {raceConfig.subtitle ? ` · ${raceConfig.subtitle}` : ''}
              </span>
              <h3
                id="modal-inscripcion-title"
                className="font-display text-lg sm:text-xl font-black text-white truncate"
              >
                {confirmedReg ? '¡Inscripción Recibida!' : 'Formulario de Inscripción'}
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
                <div className="mt-2 inline-block rounded-xl bg-zinc-950 border border-emerald-500/40 px-4 py-2">
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

              <div className="rounded-2xl bg-zinc-950 border border-stone-800 p-4 space-y-2 text-xs sm:text-sm">
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
                <div className="flex justify-between gap-3 py-1 border-b border-stone-800/80">
                  <span className="text-stone-400">Grupo Sanguíneo / RH</span>
                  <span className="font-mono font-bold text-amber-300">
                    {confirmedReg.bloodType || 'No sabe'}
                  </span>
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

              {/* Descargas A4 pre-llenadas para Acreditación */}
              <div className="rounded-2xl bg-amber-500/10 border border-orange-500/50 p-4 space-y-2.5">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    Documentación para presentar al retirar tu kit
                  </span>
                  <p className="mt-0.5 text-xs text-stone-200 leading-relaxed">
                    Descargá e imprimí tu <strong className="text-white">Deslinde</strong> (ya
                    pre-llenado con tus datos) y el <strong className="text-white">Modelo de Apto Médico</strong> para llevar firmados a la acreditación.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openPrintableWaiver({ raceConfig, runner: confirmedReg })}
                    className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600/85 hover:bg-orange-600 text-zinc-950 font-display font-bold text-xs uppercase tracking-wider px-3.5 py-2 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 shrink-0" />
                    <span>Deslinde Oficial (A4 / PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPrintableMedicalCert({ raceConfig, runner: confirmedReg })}
                    className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 hover:bg-stone-800 text-amber-300 border border-orange-500/70 font-display font-bold text-xs uppercase tracking-wider px-3.5 py-2 transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4 shrink-0" />
                    <span>Modelo Apto Médico (A4)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 bg-zinc-950 border-t border-stone-800 flex flex-col sm:flex-row gap-2.5 shrink-0">
              <a
                href={confirmationWhatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-display font-black text-xs sm:text-sm uppercase tracking-wide px-4 py-3 shadow-lg shadow-emerald-500/20"
              >
                <MessageCircle className="w-4 h-4 fill-stone-950 shrink-0" />
                Avisar por WhatsApp a la Organización
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
            autoComplete="on"
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
                        ? 'bg-zinc-950 border-red-500 shadow-lg shadow-red-500/20'
                        : 'bg-zinc-950 border-cyan-500 shadow-lg shadow-cyan-500/20'
                      : is13K
                        ? 'bg-zinc-950/80 border-red-500/70 hover:border-red-500'
                        : 'bg-zinc-950/80 border-cyan-500/70 hover:border-cyan-500';
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

                {kitItems.length > 0 && (
                  <div className="mt-3 rounded-2xl bg-zinc-950/90 border border-orange-500/35 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Tu inscripción incluye</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-stone-200">
                      {kitItems.map((item, idx) => (
                        <div key={`modal-kit-${idx}`} className="flex items-start gap-1.5 leading-snug">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* 2. Datos Bancarios para Transferir */}
              <section className="rounded-2xl bg-zinc-950 border border-orange-500/40 p-4 space-y-3">
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
                  <div className="rounded-xl bg-zinc-950 border border-orange-500/40 p-2.5 flex items-center justify-between gap-2">
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

                  <div className="rounded-xl bg-zinc-950 border border-orange-500/40 p-2.5 flex items-center justify-between gap-2">
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
                      Nombre y Apellido completos <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-fullname"
                      name="fullName"
                      type="text"
                      required
                      autoComplete="name"
                      value={form.fullName}
                      onChange={(e) => handleFieldChange('fullName', e.target.value)}
                      placeholder="Ej. María Gómez"
                      className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-dni"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      DNI <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-dni"
                      name="dni"
                      type="text"
                      inputMode="numeric"
                      required
                      autoComplete="on"
                      value={form.dni}
                      onChange={(e) => handleFieldChange('dni', e.target.value)}
                      placeholder="Ej. 34567890"
                      className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm font-mono text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-birthdate"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Fecha de Nacimiento <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-birthdate"
                      name="birthDate"
                      type="date"
                      min={MIN_BIRTH_DATE_ISO}
                      max={maxBirthDateIso}
                      required
                      autoComplete="bday"
                      value={form.birthDate}
                      onChange={(e) => handleBirthDateChange(e.target.value)}
                      onBlur={handleBirthDateBlur}
                      onInvalid={(e) => {
                        if (form.birthDate) {
                          e.preventDefault();
                          const msg = getBirthDateValidationError(
                            form.birthDate,
                            raceDateIso,
                            maxBirthDateIso
                          );
                          setBirthDateError(msg || UNDERAGE_ERROR_MSG);
                          setSubmitError(msg || UNDERAGE_ERROR_MSG);
                        }
                      }}
                      className={`w-full rounded-xl bg-zinc-950 border transition-colors focus:outline-none px-3.5 py-2.5 text-sm font-mono text-white [color-scheme:dark] ${
                        birthDateError
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-orange-500/40 focus:border-orange-500'
                      }`}
                    />
                    {birthDateError && (
                      <div
                        role="alert"
                        className="mt-2 rounded-xl bg-zinc-950 border border-red-500 p-2.5 text-[11px] text-white flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                        <span>{birthDateError}</span>
                      </div>
                    )}
                    {!birthDateError && runnerCategoryPreview && (
                      <p className="mt-1.5 rounded-lg bg-zinc-950 border border-orange-500/35 px-2.5 py-1 text-[11px] text-stone-300">
                        Edad al día de carrera:{' '}
                        <strong className="text-white font-semibold">
                          {runnerAgeAtRace} años
                        </strong>{' '}
                        · Categoría:{' '}
                        <strong className="text-white font-semibold">
                          {runnerCategoryPreview.genderLabel}{' '}
                          {runnerCategoryPreview.bracketLabel}
                        </strong>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="reg-gender"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Categoría / Género <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="reg-gender"
                      name="gender"
                      autoComplete="sex"
                      value={form.gender}
                      onChange={(e) => handleFieldChange('gender', e.target.value)}
                      className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm text-white"
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
                      Celular / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="Ej. 291 4000000"
                      className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="corredor@mail.com"
                      className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-city"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Localidad / Provincia <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-city"
                      name="city"
                      type="text"
                      required
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      placeholder="Ej. Bahía Blanca, Bs. As."
                      className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm text-white"
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
                      name="organization"
                      type="text"
                      autoComplete="organization"
                      value={form.team}
                      onChange={(e) => handleFieldChange('team', e.target.value)}
                      placeholder="Ej. Sierra Trail Runners o Libre"
                      className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  {/* Talle de Remera + Guía de Talles (cm) */}
                  <div className="sm:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="block text-xs font-semibold text-stone-300">
                        Talle de Remera Oficial <span className="text-red-500">*</span>
                      </span>
                      <button
                        type="button"
                        aria-expanded={showSizeGuide}
                        onClick={() => setShowSizeGuide((prev) => !prev)}
                        className="inline-flex items-center gap-1 rounded-lg bg-zinc-950 hover:bg-stone-800 border border-orange-500/60 text-white text-[11px] font-semibold px-2.5 py-1 transition-colors cursor-pointer"
                      >
                        <Ruler className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{showSizeGuide ? 'Ocultar medidas' : 'Guía de talles (cm)'}</span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform duration-150 ${
                            showSizeGuide ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
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
                                ? 'bg-zinc-950 border-orange-500 ring-1 ring-orange-500/60 text-orange-400 font-bold'
                                : 'bg-zinc-950 text-white border-orange-500/40 hover:border-orange-500'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>

                    {showSizeGuide && (
                      <div className="mt-2 rounded-xl bg-zinc-950 border border-orange-500/45 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-white font-semibold text-[11px] uppercase tracking-wider">
                            Medidas aproximadas · Corte Unisex
                          </span>
                          <span className="text-[10px] text-stone-400">
                            Medida en prenda plana (Axila × Largo)
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px]">
                                <th className="py-1 pr-2">Talle</th>
                                <th className="py-1 px-2">Ancho (Axila a Axila)</th>
                                <th className="py-1 pl-2">Largo Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-800/70">
                              {SHIRT_SIZE_GUIDE.map((row) => {
                                const isSelected = form.shirtSize === row.size;
                                return (
                                  <tr
                                    key={row.size}
                                    onClick={() => handleFieldChange('shirtSize', row.size)}
                                    className={`cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-zinc-950 text-white font-bold border border-orange-500/80 outline outline-1 outline-orange-500/80 -outline-offset-1 rounded-md'
                                        : 'text-stone-300 hover:bg-zinc-950'
                                    }`}
                                  >
                                    <td className="py-1 pr-2 font-display font-bold">{row.size}</td>
                                    <td className="py-1 px-2 font-mono">{row.width}</td>
                                    <td className="py-1 pl-2 font-mono">{row.length}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contacto de Emergencia y Datos Médicos */}
                <div className="rounded-2xl bg-orange-500/10 border border-orange-500/40 p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Seguridad en Montaña (Contacto de Emergencia)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 items-end gap-3">
                    <div>
                      <label
                        htmlFor="reg-emergency-name"
                        className="block text-xs font-semibold text-stone-300 mb-1"
                      >
                        Nombre del Contacto <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="reg-emergency-name"
                        name="emergencyContactName"
                        type="text"
                        required
                        autoComplete="on"
                        value={form.emergencyContactName}
                        onChange={(e) =>
                          handleFieldChange('emergencyContactName', e.target.value)
                        }
                        placeholder="Ej. Carlos Gómez (Familiar)"
                        className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-emergency-phone"
                        className="block text-xs font-semibold text-stone-300 mb-1"
                      >
                        Teléfono de Emergencia <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="reg-emergency-phone"
                        name="emergencyContactPhone"
                        type="tel"
                        required
                        autoComplete="on"
                        value={form.emergencyContactPhone}
                        onChange={(e) =>
                          handleFieldChange('emergencyContactPhone', e.target.value)
                        }
                        placeholder="Ej. 291 4001122"
                        className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-blood-type"
                        className="block text-xs font-semibold text-stone-300 mb-1"
                      >
                        Grupo Sanguíneo y Factor RH <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="reg-blood-type"
                        name="bloodType"
                        value={form.bloodType}
                        onChange={(e) => handleFieldChange('bloodType', e.target.value)}
                        className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm font-mono text-white"
                      >
                        {BLOOD_TYPES.map((bt) => (
                          <option key={bt} value={bt}>
                            {bt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="reg-medical"
                        className="block text-xs font-semibold text-stone-300 mb-1 sm:whitespace-nowrap"
                      >
                        Obra Social / Alergias / Obs. Médicas
                      </label>
                      <input
                        id="reg-medical"
                        name="medicalNotes"
                        type="text"
                        autoComplete="on"
                        value={form.medicalNotes}
                        onChange={(e) =>
                          handleFieldChange('medicalNotes', e.target.value)
                        }
                        placeholder="Ej. OSDE · Sin alergias"
                        className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. Adjuntar Comprobante */}
              <section className="space-y-2.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-white">
                  4 · Adjuntar Comprobante de Pago <span className="text-red-500">*</span>
                </span>
                <div className="rounded-2xl border border-dashed border-orange-500/40 hover:border-orange-500 transition-colors bg-zinc-950/70 p-4 flex flex-col sm:flex-row items-center gap-4">
                  {receiptPreview ? (
                    <img
                      src={receiptPreview}
                      alt="Vista previa del comprobante de pago"
                      className="w-20 h-20 rounded-xl object-cover border border-orange-500/40 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-zinc-950 border border-orange-500/40 flex items-center justify-center text-stone-500 shrink-0">
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
                      <label className="inline-flex items-center gap-2 rounded-xl bg-orange-600/85 hover:bg-orange-600 text-zinc-950 font-display font-bold text-xs uppercase tracking-wider px-4 py-2.5 cursor-pointer transition-colors">
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

              {/* 5. Aceptación Legal de Reglamento y Deslinde */}
              <section className="rounded-2xl bg-zinc-950 border border-orange-500/50 p-4 space-y-3">
                <label
                  htmlFor="reg-accept-terms"
                  className="flex items-start gap-2.5 cursor-pointer select-none"
                >
                  <input
                    id="reg-accept-terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (e.target.checked && submitError.includes('Reglamento')) {
                        setSubmitError('');
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-orange-500 bg-zinc-950 text-amber-500 accent-amber-500 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-stone-200 leading-relaxed">
                    <strong className="text-white">
                      Leí y acepto el Reglamento Oficial y el Deslinde de Responsabilidad
                    </strong>{' '}
                    <span className="text-red-500 font-bold">*</span>
                    <span className="block text-[11px] text-stone-400 mt-0.5">
                      Me comprometo a presentar el Apto Médico vigente y el Deslinde firmado al
                      retirar mi kit.
                    </span>
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    aria-expanded={showTermsModal}
                    onClick={() => setShowTermsModal((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-950 border border-orange-500/80 text-orange-400 hover:text-orange-400 text-[11px] font-semibold px-3 py-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {showTermsModal
                        ? 'Cerrar vista de Reglamento'
                        : 'Leer Reglamento y Deslinde'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openPrintableWaiver({
                        raceConfig,
                        runner: {
                          ...form,
                          birthDate: formatBirthDateDmy(form.birthDate),
                          distance: selectedDistance,
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-950 border border-orange-500/80 text-orange-400 hover:text-orange-400 text-[11px] font-semibold px-3 py-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 shrink-0" />
                    <span>Deslinde A4</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openPrintableMedicalCert({
                        raceConfig,
                        runner: {
                          ...form,
                          birthDate: formatBirthDateDmy(form.birthDate),
                          distance: selectedDistance,
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-950 border border-orange-500/80 text-orange-400 hover:text-orange-400 text-[11px] font-semibold px-3 py-1.5 cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Modelo Apto Médico A4</span>
                  </button>
                </div>

                {showTermsModal && (
                  <div className="rounded-xl bg-zinc-950 border border-stone-700 p-3.5 max-h-60 overflow-y-auto overscroll-contain space-y-2.5 text-[11px] text-stone-300 leading-relaxed">
                    <div>
                      <h4 className="font-display font-bold text-amber-400 uppercase text-xs">
                        Reglamento General · {getRaceFullTitle(raceConfig)}
                      </h4>
                      <p className="mt-1">
                        {reglamentFaq?.answer || RACE_CONFIG.faqs[2].answer}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="rounded-lg bg-zinc-950 border border-cyan-500/40 p-2.5">
                        <span className="block font-bold text-cyan-400 text-[10px] uppercase">
                          Obligatorios {label27}
                        </span>
                        <ul className="mt-1 space-y-0.5 list-disc pl-3.5">
                          {gear27.map((g, i) => (
                            <li key={`m27-${i}`}>{g}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-zinc-950 border border-red-500/40 p-2.5">
                        <span className="block font-bold text-red-400 text-[10px] uppercase">
                          Obligatorios {label13}
                        </span>
                        <ul className="mt-1 space-y-0.5 list-disc pl-3.5">
                          {gear13.map((g, i) => (
                            <li key={`m13-${i}`}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {ageCategories?.ruleNote && (
                      <p className="text-stone-300">
                        <strong className="text-white">Categorías: </strong>
                        {ageCategories.ruleNote}
                      </p>
                    )}

                    <div className="pt-1 border-t border-stone-800">
                      <h5 className="font-bold text-white uppercase text-[10px]">
                        Síntesis del Deslinde de Responsabilidad
                      </h5>
                      <p className="mt-1">
                        El/la participante declara estar apto/a física y médicamente para esfuerzos
                        de trail running en montaña, asume los riesgos propios del terreno serrano y
                        exime a la Organización, dueños de campos y equipo técnico de
                        responsabilidad por incidentes derivados de la actividad, aceptando controles
                        de material, cortes horarios y normas ambientales sin arrojar residuos.
                      </p>
                    </div>
                  </div>
                )}
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
                  className="rounded-xl bg-zinc-950 border border-red-500 p-3 text-xs text-white flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
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
            <div className="px-4 sm:px-6 py-3.5 bg-zinc-950 border-t border-stone-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="min-h-[44px] rounded-xl bg-zinc-950 border border-orange-500/80 text-red-500 hover:text-red-500 text-xs font-semibold px-5 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
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
