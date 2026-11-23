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
  MapPin,
  Tag,
} from 'lucide-react';
import {
  RACE_CONFIG,
  DEFAULT_RESIDENT_LOCALITIES,
  buildWhatsAppUrl,
  getRaceFullTitle,
  calculateRunnerAgeAtRace,
  resolveRunnerCategory,
  getMaxBirthDateIso,
  formatBirthDateDmy,
  matchResidentLocality,
  computeRegistrationPricing,
} from '../data/raceConfig';
import {
  validateUploadFile,
  uploadImageToCloudinary,
  submitRunnerRegistration,
  submitInstallmentReceipt,
  fetchPublicRunnerStatus,
} from '../firebase/config';
import {
  sendRegistrationNotificationEmail,
  sendInstallmentNotificationEmail,
} from '../utils/emailNotification';
import { openPrintableWaiver, openPrintableMedicalCert } from '../utils/printableDocs';
import { compressReceiptImage, getOptimizedReceiptUrl } from '../utils/cloudinary';

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHIRT_SIZE_GUIDE = [
  { size: 'XS', width: '46 cm', length: '64 cm' },
  { size: 'S', width: '49 cm', length: '67 cm' },
  { size: 'M', width: '52 cm', length: '70 cm' },
  { size: 'L', width: '55 cm', length: '72 cm' },
  { size: 'XL', width: '58 cm', length: '75 cm' },
  { size: 'XXL', width: '61 cm', length: '78 cm' },
];
const GENDERS = ['Masculino', 'Femenino'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-', 'No sabe'];

const INITIAL_FORM = {
  fullName: '',
  dni: '',
  birthDate: '',
  gender: '',
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

const INITIAL_INSTALLMENT_FORM = {
  installmentNumber: 2,
  code: '',
  dni: '',
  fullName: '',
};

export default function RegistrationModal({
  isOpen,
  onClose,
  initialDistance = '27K',
  initialTab = 'register',
  raceConfig = RACE_CONFIG,
}) {
  const [modalTab, setModalTab] = useState(initialTab);
  const [selectedDistance, setSelectedDistance] = useState(initialDistance);
  const [paymentPlan, setPaymentPlan] = useState('total');
  const [form, setForm] = useState(INITIAL_FORM);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [residentCheckboxManual, setResidentCheckboxManual] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [confirmedReg, setConfirmedReg] = useState(null);

  const [instForm, setInstForm] = useState(INITIAL_INSTALLMENT_FORM);
  const [instFile, setInstFile] = useState(null);
  const [instPreview, setInstPreview] = useState('');
  const [instSubmitting, setInstSubmitting] = useState(false);
  const [instStep, setInstStep] = useState('');
  const [instError, setInstError] = useState('');
  const [confirmedInstallment, setConfirmedInstallment] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setModalTab(initialTab === 'installment' ? 'installment' : 'register');
      setSelectedDistance(initialDistance);
      setSubmitError('');
      setBirthDateError('');
      setSubmitStep('');
      setInstError('');
      setInstStep('');
      setShowTermsModal(false);
      setShowSizeGuide(false);
    }
  }, [initialDistance, initialTab, isOpen]);

  useEffect(() => {
    return () => {
      if (receiptPreview) {
        URL.revokeObjectURL(receiptPreview);
      }
      if (instPreview) {
        URL.revokeObjectURL(instPreview);
      }
    };
  }, [receiptPreview, instPreview]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting && !instSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, submitting, instSubmitting]);

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

  const residentDiscountEnabled = Boolean(
    raceConfig?.residentDiscountEnabled ?? RACE_CONFIG.residentDiscountEnabled
  );
  const residentLocalities =
    Array.isArray(raceConfig?.residentLocalities) && raceConfig.residentLocalities.length > 0
      ? raceConfig.residentLocalities
      : DEFAULT_RESIDENT_LOCALITIES;
  const matchedLocality = residentDiscountEnabled
    ? matchResidentLocality(form.city, residentLocalities)
    : null;
  const isResidentActive = Boolean(
    residentDiscountEnabled && (residentCheckboxManual || matchedLocality)
  );
  const pricing = computeRegistrationPricing(
    activeDistanceInfo.price,
    raceConfig,
    isResidentActive
  );
  const residentDiscountPercent = pricing.configuredPercent;
  const maxInstallments = pricing.maxInstallments;
  const effectivePaymentPlan = maxInstallments > 1 ? paymentPlan : 'total';

  const renderResidentDiscountSummary = (compact = false) => {
    if (!pricing.isLocalResident) return null;
    return (
      <div
        className={`rounded-xl bg-zinc-950 border border-emerald-500/45 ${
          compact ? 'p-2.5' : 'p-3'
        } space-y-1.5`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-stone-400 line-through font-mono">
              {pricing.originalPrice}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-950 text-emerald-400 border border-emerald-500/50">
              <Tag className="w-3 h-3 shrink-0" />
              -{pricing.discountPercentApplied}% Residente
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
              Monto exacto a transferir
            </span>
            <span className="font-display text-lg sm:text-xl font-black text-emerald-300 font-mono">
              {pricing.finalAmount}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-amber-200 leading-snug border-t border-emerald-500/25 pt-1.5">
          Beneficio exclusivo para residentes del Partido de Tornquist. Se verificará el domicilio
          en el DNI al retirar el kit.
        </p>
      </div>
    );
  };

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

  const handleResidentCheckboxChange = (checked) => {
    setResidentCheckboxManual(checked);
    if (checked) {
      if (!matchResidentLocality(form.city, residentLocalities) && residentLocalities[0]) {
        handleFieldChange('city', residentLocalities[0]);
      }
    } else if (matchResidentLocality(form.city, residentLocalities)) {
      handleFieldChange('city', '');
    }
  };

  const handleResidentLocalitySelect = (locality) => {
    setResidentCheckboxManual(true);
    handleFieldChange('city', locality);
  };

  const handleCityChange = (rawCity) => {
    handleFieldChange('city', rawCity);
    if (!residentDiscountEnabled) return;
    const matched = matchResidentLocality(rawCity, residentLocalities);
    setResidentCheckboxManual(Boolean(matched));
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

  const handleSelectInstReceipt = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateUploadFile(file);
    } catch (err) {
      e.target.value = '';
      if (instPreview) {
        URL.revokeObjectURL(instPreview);
      }
      setInstFile(null);
      setInstPreview('');
      setInstError(err.message || 'Archivo de comprobante no válido.');
      return;
    }

    if (instPreview) {
      URL.revokeObjectURL(instPreview);
    }

    setInstFile(file);
    if (file.type.startsWith('image/')) {
      setInstPreview(URL.createObjectURL(file));
    } else {
      setInstPreview('');
    }
    setInstError('');
  };

  const handleClearInstReceipt = () => {
    if (instPreview) {
      URL.revokeObjectURL(instPreview);
    }
    setInstFile(null);
    setInstPreview('');
  };

  const handleResetAll = () => {
    handleClearReceipt();
    handleClearInstReceipt();
    setForm(INITIAL_FORM);
    setPaymentPlan('total');
    setInstForm(INITIAL_INSTALLMENT_FORM);
    setResidentCheckboxManual(false);
    setConfirmedReg(null);
    setConfirmedInstallment(null);
    setSubmitError('');
    setBirthDateError('');
    setSubmitStep('');
    setInstError('');
    setInstStep('');
    setAcceptedTerms(false);
    setShowTermsModal(false);
    setShowSizeGuide(false);
  };

  const handleInstSubmit = async (e) => {
    e.preventDefault();
    setInstError('');

    const cleanDni = String(instForm.dni || '').trim();
    const cleanName = String(instForm.fullName || '').trim();
    const cleanCode = String(instForm.code || '').trim();
    const instNum = Number(instForm.installmentNumber) === 3 ? 3 : 2;

    if (!cleanDni) {
      setInstError('Ingresá el DNI con el que te inscribiste.');
      return;
    }
    if (!cleanName) {
      setInstError('Ingresá tu Nombre y Apellido.');
      return;
    }
    if (!instFile) {
      setInstError(
        `Adjuntá la foto, captura o PDF del comprobante de la Cuota ${instNum} de 3.`
      );
      return;
    }

    setInstSubmitting(true);
    try {
      if (cleanCode) {
        setInstStep('Verificando código de inscripción...');
        const lookup = await fetchPublicRunnerStatus(cleanCode);
        if (lookup?.invalidQuery) {
          throw new Error(
            'El código RAF ingresado no tiene un formato válido (ejemplo: RAF-12345). Si no lo recordás, dejalo vacío.'
          );
        }
      }

      setInstStep(`Optimizando y subiendo comprobante de Cuota ${instNum}/3...`);
      const fileToUpload = await compressReceiptImage(instFile, {
        maxDimension: 1200,
        quality: 0.78,
      });
      const uploaded = await uploadImageToCloudinary(fileToUpload, {
        folder: 'reto-al-filo/comprobantes',
        resourceType: 'auto',
      });

      setInstStep('Asociando comprobante a tu inscripción...');
      const saved = await submitInstallmentReceipt({
        code: cleanCode,
        dni: cleanDni,
        fullName: cleanName,
        installmentNumber: instNum,
        receiptUrl: uploaded.secureUrl,
        receiptPublicId: uploaded.publicId,
        receiptFormat: uploaded.format || '',
      });

      void (async () => {
        try {
          await sendInstallmentNotificationEmail({
            notificationEmail: raceConfig?.notificationEmail,
            raceTitle: getRaceFullTitle(raceConfig),
            submission: saved,
            uploadedUrl: uploaded.secureUrl,
          });
        } catch (err) {
          console.error('[Cuotas] Error enviando notificación EmailJS en segundo plano:', err);
        }
      })();

      setConfirmedInstallment(saved);
    } catch (err) {
      setInstError(
        err?.message || 'No se pudo cargar el comprobante de la cuota. Intentá nuevamente.'
      );
    } finally {
      setInstSubmitting(false);
      setInstStep('');
    }
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

    if (!form.gender) {
      setSubmitError('Seleccioná tu género (Masculino o Femenino) para completar tu inscripción.');
      return;
    }

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
      setSubmitStep('Optimizando y subiendo comprobante de pago de forma segura...');
      const fileToUpload = await compressReceiptImage(receiptFile, {
        maxDimension: 1200,
        quality: 0.78,
      });
      const uploaded = await uploadImageToCloudinary(fileToUpload, {
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
        priceSnapshot: pricing.finalAmount,
        isLocalResident: pricing.isLocalResident,
        discountPercentApplied: pricing.discountPercentApplied,
        originalPrice: pricing.originalPrice,
        finalAmount: pricing.finalAmount,
        paymentPlan: effectivePaymentPlan,
        installmentsTotal: effectivePaymentPlan === 'cuotas' ? maxInstallments : 1,
        installmentAmount:
          effectivePaymentPlan === 'cuotas' ? pricing.installmentAmount : pricing.finalAmount,
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
        `¡Hola! Acabo de inscribirme a ${getRaceFullTitle(raceConfig)}. Mi código es *${confirmedReg.code}* - *${confirmedReg.fullName}* (*${confirmedReg.distance}*${
          confirmedReg.paymentPlan === 'cuotas'
            ? ` · Pago en ${confirmedReg.installmentsTotal || 3} Cuotas - Cuota 1/${confirmedReg.installmentsTotal || 3}: ${confirmedReg.installmentAmount}`
            : ''
        }). Ya adjunté el comprobante en la web.`
      )}`
    : buildWhatsAppUrl(selectedDistance, raceConfig.whatsappNumber, raceConfig);

  const installmentWhatsappHref = confirmedInstallment
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `¡Hola! Acabo de subir en la web el comprobante de la *Cuota ${confirmedInstallment.installmentNumber}* para mi inscripción en ${getRaceFullTitle(raceConfig)} (${
          confirmedInstallment.code ? `Código *${confirmedInstallment.code}* · ` : ''
        }DNI *${confirmedInstallment.dni}* - *${confirmedInstallment.fullName}*).`
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
                {confirmedReg
                  ? '¡Inscripción Recibida!'
                  : confirmedInstallment
                    ? `¡Cuota ${confirmedInstallment.installmentNumber}/3 Recibida!`
                    : modalTab === 'installment'
                      ? 'Cargar Comprobante de Cuota 2 o 3'
                      : 'Formulario de Inscripción'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting || instSubmitting}
            aria-label="Cerrar ventana de inscripción"
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de navegación: Nueva Inscripción vs Ya me inscribí (Subir Cuota 2 o 3) */}
        {!confirmedReg && !confirmedInstallment && (
          <div className="px-4 sm:px-6 py-2.5 bg-stone-950 border-b border-stone-800 grid grid-cols-2 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setModalTab('register');
                setInstError('');
              }}
              className={`min-h-[38px] rounded-xl font-display font-bold text-xs uppercase tracking-wider px-3 py-2 border shadow-none transition-colors cursor-pointer ${
                modalTab === 'register'
                  ? 'bg-zinc-950 border-orange-500 text-orange-400'
                  : 'bg-zinc-950 border-orange-500/40 text-stone-300 hover:text-white hover:border-orange-500'
              }`}
            >
              Nueva Inscripción
            </button>
            <button
              type="button"
              onClick={() => {
                setModalTab('installment');
                setSubmitError('');
              }}
              className={`min-h-[38px] rounded-xl font-display font-bold text-xs uppercase tracking-wider px-3 py-2 border shadow-none transition-colors cursor-pointer ${
                modalTab === 'installment'
                  ? 'bg-zinc-950 border-orange-500 text-orange-400'
                  : 'bg-zinc-950 border-orange-500/40 text-stone-300 hover:text-white hover:border-orange-500'
              }`}
            >
              Ya me inscribí · Subir Cuota 2 o 3
            </button>
          </div>
        )}

        {confirmedInstallment ? (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-5">
              <div className="rounded-2xl bg-zinc-950 border border-[#3E5C23] p-5 text-center">
                <CheckCircle2 className="w-12 h-12 text-[#3E5C23] mx-auto" />
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#3E5C23]">
                  Comprobante de Cuota {confirmedInstallment.installmentNumber} de 3 Recibido
                </p>
                <p className="mt-2 text-xs sm:text-sm text-stone-200 max-w-md mx-auto">
                  Tu comprobante quedó vinculado a tu inscripción (
                  <strong className="text-white font-mono">DNI {confirmedInstallment.dni}</strong>
                  {confirmedInstallment.code ? ` · ${confirmedInstallment.code}` : ''}). La
                  organización lo verificará desde el panel.
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-950 border border-stone-800 p-4 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between gap-3 py-1 border-b border-stone-800/80">
                  <span className="text-stone-400">Corredor/a</span>
                  <span className="font-bold text-white text-right">
                    {confirmedInstallment.fullName}
                  </span>
                </div>
                <div className="flex justify-between gap-3 py-1 border-b border-stone-800/80">
                  <span className="text-stone-400">DNI</span>
                  <span className="font-mono text-stone-100">{confirmedInstallment.dni}</span>
                </div>
                {confirmedInstallment.code && (
                  <div className="flex justify-between gap-3 py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Código RAF</span>
                    <span className="font-mono font-bold text-amber-400">
                      {confirmedInstallment.code}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-3 py-1 border-b border-stone-800/80">
                  <span className="text-stone-400">Cuota informada</span>
                  <span className="font-bold text-amber-300">
                    Cuota {confirmedInstallment.installmentNumber} de 3
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 pt-1">
                  <span className="text-stone-400">Comprobante adjunto</span>
                  <a
                    href={getOptimizedReceiptUrl(confirmedInstallment.receiptUrl, {
                      format: confirmedInstallment.receiptFormat,
                    })}
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

            <div className="px-4 sm:px-6 py-4 bg-zinc-950 border-t border-stone-800 flex flex-col sm:flex-row gap-2.5 shrink-0">
              <a
                href={installmentWhatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E441A] hover:bg-[#243614] text-amber-400 font-display font-black text-xs sm:text-sm uppercase tracking-wide px-4 py-3 transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
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
        ) : confirmedReg ? (
          <>
            {/* Pantalla de Confirmación */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-5">
              <div className="rounded-2xl bg-zinc-950 border border-[#3E5C23] p-5 text-center">
                <CheckCircle2 className="w-12 h-12 text-[#3E5C23] mx-auto" />
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#3E5C23]">
                  Ficha y Comprobante Recibidos
                </p>
                <div className="mt-2 inline-block rounded-xl bg-zinc-950 border border-[#3E5C23] px-4 py-2">
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
                {confirmedReg.gender && (
                  <div className="flex justify-between gap-3 py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Género</span>
                    <span className="font-bold text-stone-100">{confirmedReg.gender}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3 py-1 border-b border-stone-800/80">
                  <span className="text-stone-400">Distancia y Monto</span>
                  <div className="text-right">
                    <span
                      className={`font-bold ${
                        confirmedReg.distance === '13K' ? 'text-red-500' : 'text-cyan-400'
                      }`}
                    >
                      {confirmedReg.distance}{' '}
                      {confirmedReg.isLocalResident && confirmedReg.originalPrice && (
                        <span className="text-stone-500 line-through font-normal text-xs mr-1">
                          {confirmedReg.originalPrice}
                        </span>
                      )}
                      ({confirmedReg.finalAmount || confirmedReg.priceSnapshot})
                    </span>
                    {confirmedReg.isLocalResident && (
                      <div className="mt-1 flex flex-col items-end gap-0.5">
                        <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-950 border border-[#3E5C23] text-[#3E5C23]">
                          Residente (-{confirmedReg.discountPercentApplied || 0}%)
                        </span>
                        <span className="text-[10px] text-amber-300">
                          Presentá tu DNI para verificar domicilio al retirar el kit.
                        </span>
                      </div>
                    )}
                    {confirmedReg.paymentPlan === 'cuotas' && (
                      <div className="mt-1 flex flex-col items-end gap-0.5">
                        <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-950 border border-orange-500/70 text-amber-300">
                          {confirmedReg.installmentsTotal || 3} Cuotas · Cuota 1/{confirmedReg.installmentsTotal || 3} ({confirmedReg.installmentAmount})
                        </span>
                        <span className="text-[10px] text-stone-300">
                          Podrás cargar {confirmedReg.installmentsTotal === 2 ? 'la Cuota 2' : 'las Cuotas 2 y 3'} desde la pestaña &ldquo;Ya me inscribí&rdquo;.
                        </span>
                      </div>
                    )}
                  </div>
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
                    href={getOptimizedReceiptUrl(confirmedReg.receiptUrl, {
                      format: confirmedReg.receiptFormat,
                    })}
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
              <div className="rounded-2xl bg-zinc-950 border border-orange-500/50 p-4 space-y-2.5">
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
                    className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 hover:bg-stone-800 text-amber-300 border border-orange-500/70 font-display font-bold text-xs uppercase tracking-wider px-3.5 py-2 transition-colors cursor-pointer"
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
                className="flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E441A] hover:bg-[#243614] text-amber-400 font-display font-black text-xs sm:text-sm uppercase tracking-wide px-4 py-3 transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
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
        ) : modalTab === 'installment' ? (
          <form
            id="runner-installment-form"
            autoComplete="on"
            onSubmit={handleInstSubmit}
            className="flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
              {/* 1. Qué cuota estás abonando */}
              <section className="space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-widest text-amber-400">
                  1 · Seleccioná la Cuota a Informar
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {[2, 3].map((num) => {
                    const active = Number(instForm.installmentNumber) === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() =>
                          setInstForm((prev) => ({ ...prev, installmentNumber: num }))
                        }
                        className={`rounded-2xl p-3.5 border shadow-none text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          active
                            ? 'bg-zinc-950 border-orange-500'
                            : 'bg-zinc-950 border-orange-500/40 hover:border-orange-500'
                        }`}
                      >
                        <div>
                          <span
                            className={`block font-display text-sm sm:text-base font-black uppercase ${
                              active ? 'text-orange-400' : 'text-white'
                            }`}
                          >
                            Cuota {num}
                          </span>
                          <span className="block text-[11px] text-stone-300 mt-0.5">
                            {num === 2
                              ? 'Segunda cuota (plan de 2 o 3 cuotas)'
                              : 'Tercera cuota (inscriptos hasta 31/01)'}
                          </span>
                        </div>
                        <CheckCircle2
                          className={`w-5 h-5 shrink-0 ${
                            active ? 'text-orange-400' : 'text-stone-700'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 2. Datos bancarios rápidos + valores de referencia */}
              <section className="rounded-2xl bg-zinc-950 border border-orange-500/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    2 · Datos Bancarios para Transferir tu Cuota
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {distances.map((item) => {
                    const generalP = computeRegistrationPricing(item.price, raceConfig, false);
                    const residentP = computeRegistrationPricing(item.price, raceConfig, true);
                    const is13K = item.id === '13K';
                    return (
                      <div
                        key={`inst-ref-${item.id}`}
                        className="rounded-xl bg-zinc-950 border border-orange-500/40 p-2.5 space-y-1 shadow-none"
                      >
                        <span
                          className={`font-display font-bold text-xs ${
                            is13K ? 'text-red-500' : 'text-cyan-400'
                          }`}
                        >
                          {item.title}
                        </span>
                        <div className="flex items-center justify-between text-stone-300">
                          <span>Plan 3 cuotas (1/3):</span>
                          <strong className="font-mono text-white">
                            {generalP.installment3Amount}
                            {residentDiscountEnabled
                              ? ` · Res: ${residentP.installment3Amount}`
                              : ''}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-stone-300">
                          <span>Plan 2 cuotas (1/2):</span>
                          <strong className="font-mono text-white">
                            {generalP.installment2Amount}
                            {residentDiscountEnabled
                              ? ` · Res: ${residentP.installment2Amount}`
                              : ''}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl bg-zinc-950 border border-orange-500/40 p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block text-[10px] uppercase text-stone-400">Alias</span>
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
                      <span className="block text-[10px] uppercase text-stone-400">CBU / CVU</span>
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
              </section>

              {/* 3. Identificación del corredor ya inscripto */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    3 · Datos con los que te Inscribiste
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="inst-dni"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      DNI del Corredor/a <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="inst-dni"
                      type="text"
                      inputMode="numeric"
                      required
                      value={instForm.dni}
                      onChange={(e) =>
                        setInstForm((prev) => ({ ...prev, dni: e.target.value }))
                      }
                      placeholder="Ej. 34567890"
                      className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm font-mono text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="inst-code"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Código RAF <span className="text-stone-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      id="inst-code"
                      type="text"
                      value={instForm.code}
                      onChange={(e) =>
                        setInstForm((prev) => ({ ...prev, code: e.target.value }))
                      }
                      placeholder="Ej. RAF-12345"
                      className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm font-mono text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="inst-fullname"
                      className="block text-xs font-semibold text-stone-300 mb-1"
                    >
                      Nombre y Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="inst-fullname"
                      type="text"
                      required
                      value={instForm.fullName}
                      onChange={(e) =>
                        setInstForm((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      placeholder="Ej. María Gómez"
                      className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>
              </section>

              {/* 4. Adjuntar comprobante de la cuota */}
              <section className="space-y-2.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-white">
                  4 · Adjuntar Comprobante de Cuota {instForm.installmentNumber} de 3{' '}
                  <span className="text-red-500">*</span>
                </span>
                <div className="rounded-2xl border border-dashed border-orange-500/40 hover:border-orange-500 transition-colors bg-zinc-950/70 p-4 flex flex-col sm:flex-row items-center gap-4">
                  {instPreview ? (
                    <img
                      src={instPreview}
                      alt="Vista previa del comprobante de cuota"
                      className="w-20 h-20 rounded-xl object-cover border border-orange-500/40 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-zinc-950 border border-orange-500/40 flex items-center justify-center text-stone-500 shrink-0">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <p className="text-xs font-semibold text-stone-200 truncate">
                      {instFile
                        ? `Comprobante listo: ${instFile.name}`
                        : `Subí la captura, foto o PDF de la Cuota ${instForm.installmentNumber}/3`}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Formatos aceptados: JPG, PNG, WEBP o PDF (máx. 8 MB).
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label className="inline-flex items-center gap-2 rounded-xl bg-orange-600/85 hover:bg-orange-600 text-zinc-950 font-display font-bold text-xs uppercase tracking-wider px-4 py-2.5 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        {instFile ? 'Cambiar Comprobante' : 'Adjuntar Comprobante'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={handleSelectInstReceipt}
                          className="hidden"
                        />
                      </label>
                      {instFile && (
                        <button
                          type="button"
                          onClick={handleClearInstReceipt}
                          className="text-xs text-stone-400 hover:text-stone-200 px-2 py-1.5 cursor-pointer"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {instStep && (
                <div className="rounded-xl bg-amber-500/15 border border-amber-500/35 p-3 text-xs text-amber-200 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
                  <span>{instStep}</span>
                </div>
              )}

              {instError && (
                <div
                  role="alert"
                  className="rounded-xl bg-zinc-950 border border-red-500 p-3 text-xs text-white flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{instError}</span>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-3.5 bg-zinc-950 border-t border-stone-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={instSubmitting}
                className="min-h-[44px] rounded-xl bg-zinc-950 border border-orange-500/80 text-red-500 hover:text-red-500 text-xs font-semibold px-5 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={instSubmitting}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider py-3 px-6 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {instSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo Comprobante...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Enviar Comprobante de Cuota {instForm.installmentNumber}/3
                  </>
                )}
              </button>
            </div>
          </form>
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
                    const itemPricing = computeRegistrationPricing(
                      item.price,
                      raceConfig,
                      isResidentActive
                    );
                    const cardClass = active
                      ? is13K
                        ? 'bg-zinc-950 border-red-500 shadow-none'
                        : 'bg-zinc-950 border-cyan-400 shadow-none'
                      : is13K
                        ? 'bg-zinc-950 border-red-500/50 hover:border-red-500 shadow-none'
                        : 'bg-zinc-950 border-cyan-500/50 hover:border-cyan-400 shadow-none';
                    const titleClass = is13K ? 'text-red-500' : 'text-cyan-400';
                    const priceBadgeClass = is13K
                      ? 'bg-zinc-950 text-red-500 border border-red-500/70'
                      : 'bg-zinc-950 text-cyan-400 border border-cyan-500/70';
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
                        className={`w-full text-left rounded-2xl p-3.5 border transition-colors cursor-pointer flex items-center justify-between gap-2 ${cardClass}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span
                              className={`font-display text-base sm:text-lg font-black ${titleClass}`}
                            >
                              {item.title}
                            </span>
                            {itemPricing.isLocalResident ? (
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-2 py-0.5 rounded-md ${priceBadgeClass}`}
                              >
                                <span className="line-through text-stone-400 font-normal text-[11px]">
                                  {itemPricing.originalPrice}
                                </span>
                                <span>{itemPricing.finalAmount}</span>
                              </span>
                            ) : (
                              <span
                                className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${priceBadgeClass}`}
                              >
                                {item.price}
                              </span>
                            )}
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
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      2 · Modalidad de Pago y Transferencia (
                      {effectivePaymentPlan === 'cuotas'
                        ? `Cuota 1/${maxInstallments}: ${pricing.installmentAmount}`
                        : pricing.isLocalResident
                          ? pricing.finalAmount
                          : activeDistanceInfo.price}
                      )
                    </span>
                  </div>
                  {pricing.isLocalResident && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-950 border border-emerald-500/50 text-emerald-400">
                      -{pricing.discountPercentApplied}% Residente
                    </span>
                  )}
                </div>

                {/* Aviso de fechas límite para pagar en cuotas */}
                <div className="rounded-xl bg-zinc-950 border border-orange-500/40 p-3 text-[11px] text-stone-300 space-y-1 shadow-none">
                  <span className="block font-display font-bold uppercase tracking-wider text-amber-400">
                    Condiciones de Financiación por Fecha
                  </span>
                  <ul className="space-y-0.5 text-stone-200 leading-snug">
                    <li>
                      • <strong className="text-white">Hasta el 31 de enero:</strong> se puede
                      abonar hasta en <strong className="text-amber-300">3 cuotas</strong>.
                    </li>
                    <li>
                      • <strong className="text-white">Del 1 al 27 de febrero:</strong> se puede
                      abonar hasta en <strong className="text-amber-300">2 cuotas</strong>.
                    </li>
                    <li>
                      • <strong className="text-white">Después del 27 de febrero:</strong>{' '}
                      únicamente en <strong className="text-amber-300">1 solo pago</strong>.
                    </li>
                  </ul>
                </div>

                {/* Selector: Pago Total vs Cuotas habilitadas según fecha */}
                {maxInstallments > 1 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentPlan('total')}
                        className={`text-left rounded-xl p-3 border shadow-none transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          effectivePaymentPlan === 'total'
                            ? 'bg-zinc-950 border-orange-500'
                            : 'bg-zinc-950 border-orange-500/40 hover:border-orange-500'
                        }`}
                      >
                        <div>
                          <span
                            className={`block font-display text-xs sm:text-sm font-bold uppercase ${
                              effectivePaymentPlan === 'total' ? 'text-orange-400' : 'text-white'
                            }`}
                          >
                            Pago Total (1 pago)
                          </span>
                          <span className="block text-[11px] text-stone-300 mt-0.5">
                            Transferís hoy:{' '}
                            <strong className="text-amber-300 font-mono">
                              {pricing.finalAmount}
                            </strong>
                          </span>
                        </div>
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            effectivePaymentPlan === 'total' ? 'text-orange-400' : 'text-stone-700'
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentPlan('cuotas')}
                        className={`text-left rounded-xl p-3 border shadow-none transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          effectivePaymentPlan === 'cuotas'
                            ? 'bg-zinc-950 border-orange-500'
                            : 'bg-zinc-950 border-orange-500/40 hover:border-orange-500'
                        }`}
                      >
                        <div>
                          <span
                            className={`flex items-center gap-1.5 font-display text-xs sm:text-sm font-bold uppercase ${
                              effectivePaymentPlan === 'cuotas' ? 'text-orange-400' : 'text-white'
                            }`}
                          >
                            <span>Pago en {maxInstallments} Cuotas</span>
                          </span>
                          <span className="block text-[11px] text-stone-300 mt-0.5">
                            {maxInstallments} cuotas de{' '}
                            <strong className="text-amber-300 font-mono">
                              {pricing.installmentAmount}
                            </strong>{' '}
                            (Total {pricing.finalAmount})
                          </span>
                        </div>
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            effectivePaymentPlan === 'cuotas'
                              ? 'text-orange-400'
                              : 'text-stone-700'
                          }`}
                        />
                      </button>
                    </div>

                    {effectivePaymentPlan === 'cuotas' && (
                      <div className="rounded-xl bg-zinc-950 border border-orange-500/40 p-3 text-xs text-stone-200 space-y-1 shadow-none">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-amber-400 uppercase text-[11px]">
                            Monto a transferir hoy (Cuota 1 de {maxInstallments})
                          </span>
                          <span className="font-display text-base sm:text-lg font-black text-amber-300 font-mono">
                            {pricing.installmentAmount}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 leading-snug">
                          Subí hoy el comprobante de la{' '}
                          <strong className="text-white">Cuota 1/{maxInstallments}</strong>. Tiempo
                          después podrás cargar{' '}
                          <strong className="text-white">
                            {maxInstallments === 3 ? 'las Cuotas 2 y 3' : 'la Cuota 2/2'}
                          </strong>{' '}
                          desde la pestaña{' '}
                          <strong className="text-amber-300">
                            &ldquo;Ya me inscribí · Subir Cuota 2 o 3&rdquo;
                          </strong>
                          .
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl bg-zinc-950 border border-orange-500 p-3 flex items-center justify-between gap-2 shadow-none">
                    <div>
                      <span className="block font-display text-xs sm:text-sm font-bold text-orange-400 uppercase">
                        Pago Total (1 único pago)
                      </span>
                      <span className="block text-[11px] text-stone-300 mt-0.5">
                        Monto total a transferir:{' '}
                        <strong className="text-amber-300 font-mono">{pricing.finalAmount}</strong>
                      </span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  </div>
                )}

                {renderResidentDiscountSummary(false)}

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
                    <span className="block text-xs font-semibold text-stone-300 mb-1">
                      Categoría / Género <span className="text-red-500">*</span>
                    </span>
                    <div
                      className="grid grid-cols-2 gap-2"
                      role="radiogroup"
                      aria-label="Categoría / Género"
                    >
                      {GENDERS.map((g) => {
                        const active = form.gender === g;
                        return (
                          <button
                            key={g}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => {
                              handleFieldChange('gender', g);
                              if (submitError.includes('género')) {
                                setSubmitError('');
                              }
                            }}
                            className={`min-h-[42px] rounded-xl font-display font-bold text-xs sm:text-sm border transition-colors cursor-pointer ${
                              active
                                ? 'bg-zinc-950 border-orange-500 text-orange-400 font-bold'
                                : 'bg-zinc-950 text-white border-orange-500/40 hover:border-orange-500'
                            }`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
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
                      onChange={(e) => handleCityChange(e.target.value)}
                      placeholder="Ej. Bahía Blanca, Bs. As."
                      className="w-full rounded-xl bg-zinc-950 border border-orange-500/40 focus:border-orange-500 transition-colors focus:outline-none px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  {residentDiscountEnabled && (
                    <div className="sm:col-span-2 rounded-2xl bg-zinc-950 border border-emerald-500/40 p-3.5 space-y-2.5">
                      <label
                        htmlFor="reg-resident-toggle"
                        className="flex items-start gap-2.5 cursor-pointer select-none"
                      >
                        <input
                          id="reg-resident-toggle"
                          type="checkbox"
                          checked={isResidentActive}
                          onChange={(e) => handleResidentCheckboxChange(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-emerald-500 bg-zinc-950 text-emerald-500 accent-emerald-500 shrink-0 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-white">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>¿Sos residente del Partido de Tornquist?</span>
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-950 text-emerald-400 border border-emerald-500/50">
                              {residentDiscountPercent}% OFF
                            </span>
                          </span>
                          <span className="block text-[11px] text-stone-400 mt-0.5">
                            Tildá esta opción para elegir tu localidad o escribila en el campo
                            Localidad.
                          </span>
                        </div>
                      </label>

                      {isResidentActive && (
                        <div className="space-y-2.5 pt-1">
                          <div>
                            <label
                              htmlFor="reg-resident-locality"
                              className="block text-[11px] font-semibold text-emerald-300 mb-1"
                            >
                              Localidad del Partido de Tornquist
                            </label>
                            <select
                              id="reg-resident-locality"
                              value={matchedLocality || ''}
                              onChange={(e) => handleResidentLocalitySelect(e.target.value)}
                              className="w-full rounded-xl bg-stone-950 border border-emerald-500/60 focus:border-emerald-400 transition-colors focus:outline-none px-3 py-2 text-sm text-white"
                            >
                              <option value="" disabled>
                                Seleccioná tu localidad...
                              </option>
                              {residentLocalities.map((loc) => (
                                <option key={loc} value={loc}>
                                  {loc}
                                </option>
                              ))}
                            </select>
                          </div>

                          {renderResidentDiscountSummary(true)}
                        </div>
                      )}
                    </div>
                  )}

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
                  4 · Adjuntar Comprobante de Pago{' '}
                  {effectivePaymentPlan === 'cuotas'
                    ? `(Cuota 1/${maxInstallments} · ${pricing.installmentAmount})`
                    : `(${pricing.finalAmount})`}{' '}
                  <span className="text-red-500">*</span>
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
                    {pricing.isLocalResident
                      ? `Confirmar Inscripción (${selectedDistance} · ${pricing.finalAmount})`
                      : `Confirmar Inscripción (${selectedDistance})`}
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
