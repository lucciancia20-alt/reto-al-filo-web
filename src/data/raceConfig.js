export const DEFAULT_RACE_TITLE = 'Reto al Filo';
export const DEFAULT_TARGET_DATE_ISO = '2027-04-10T09:00:00-03:00';
export const DEFAULT_RESIDENT_DISCOUNT_ENABLED = true;
export const DEFAULT_RESIDENT_DISCOUNT_PERCENT = 20;
export const DEFAULT_RESIDENT_LOCALITIES = [
  'Tornquist',
  'Sierra de la Ventana',
  'Saldungaray',
  'Villa Ventana',
  'Chasicó',
  'Tres Picos',
  'Villa Serrana La Gruta',
  'San Andrés de la Sierra',
  'Pelicurá',
];
export const DEFAULT_TEAMS_BENEFIT_ENABLED = true;
export const DEFAULT_TEAMS_BENEFIT_EMAIL = 'retoalfilo@gmail.com';

/**
 * Texto por defecto de las cláusulas del Deslinde de Responsabilidad A4.
 * Cada elemento del array es una cláusula numerada (renderizada como <li>).
 */
export const DEFAULT_WAIVER_CLAUSES = [
  'Estado físico y entrenamiento: Declaro bajo juramento encontrarme física, clínica y psicológicamente apto/a para participar en la competencia de trail running / carrera de montaña denominada {RACE_TITLE} en la distancia en la que me inscribo, habiendo realizado los controles médicos pertinentes y comprometiéndome a presentar el Certificado / Apto Médico vigente en la acreditación.',
  'Asunción de riesgos de montaña: Comprendo que el trail running en ambiente serrano implica riesgos inherentes tales como terreno irregular, piedra suelta, desniveles pronunciados, cruces de arroyo, exposición al viento, frío o lluvia, fauna silvestre y eventual retraso en la evacuación por accesos agrestes. Asumo dichos riesgos libre y voluntariamente.',
  'Exención de responsabilidad: Eximo expresamente a la Organización de {RACE_TITLE}, su Dirección Técnica, propietarios de los campos y predios atravesados, sponsors, voluntarios, personal médico y municipios involucrados de toda responsabilidad civil, penal o patrimonial por accidentes, lesiones, extravíos, daños materiales o muerte que pudiera sufrir o provocar antes, durante o después del evento, salvo dolo comprobado.',
  'Reglamento, equipamiento y cortes horarios: Acepto íntegramente el reglamento de carrera, la obligación de portar en todo momento el equipamiento obligatorio exigido para mi distancia, respetar las marcaciones del circuito y acatar los cortes horarios o decisiones de suspensión/evacuación dispuestas por el equipo de seguridad o Dirección de Carrera.',
  'Cuidado del ambiente serrano: Me comprometo a no arrojar ningún tipo de residuo ni envoltorio fuera de los cestos habilitados en los Puestos de Abastecimiento y llegada (causal de descalificación directa) y a respetar la flora, fauna y tranqueras de la zona.',
  'Derechos de imagen y datos médicos: Autorizo a la Organización a utilizar fotografías, videos e imágenes captadas durante el evento con fines informativos o promocionales sin compensación económica, y autorizo al personal médico y de rescate a brindarme atención de urgencia utilizando la información médica declarada.',
];

/**
 * Texto por defecto del cuerpo del Certificado de Aptitud Médica A4.
 * El placeholder {RACE_TITLE} se reemplaza en tiempo de ejecución.
 */
export const DEFAULT_MEDICAL_BODY_TEXT =
  'ha sido evaluado/a clínicamente y mediante los estudios complementarios que consideré pertinentes en función de su edad y antecedentes, encontrándose actualmente APTO/A FÍSICAMENTE y sin contraindicaciones médicas aparentes para participar en competencias de Trail Running / Carrera de Montaña de esfuerzo físico intenso y competitivo (modalidad indicada en el campo de distancia, en ambiente serrano), correspondiente al evento {RACE_TITLE}.';

export const VALID_THEME_COLORS = ['orange', 'naranja', 'red', 'blue', 'green', 'yellow', 'cyan'];

export const THEME_COLOR_OPTIONS = [
  { id: 'orange', label: 'Ámbar + Verde (Oficial RAF)', hex: '#fbbf24', secondaryHex: '#1b4332' },
  { id: 'naranja', label: 'Naranja', hex: '#f97316' },
  { id: 'red', label: 'Rojo', hex: '#fb2c36' },
  { id: 'blue', label: 'Azul', hex: '#3b82f6' },
  { id: 'green', label: 'Verde', hex: '#22c55e' },
  { id: 'yellow', label: 'Amarillo', hex: '#eab308' },
  { id: 'cyan', label: 'Cian', hex: '#06b6d4' },
];

export const RACE_CONFIG = {
  title: DEFAULT_RACE_TITLE,
  edition: '2da Edición',
  subtitle: 'Abril 2027',
  themeColor: 'orange',
  targetDateIso: DEFAULT_TARGET_DATE_ISO,
  whatsappNumber: '5492915228310',
  notificationEmail: 'lciancia1972@gmail.com',
  heroImage: '/images/hero-trail-runners.jpg',
  googleMapsUrl: 'https://maps.google.com/?q=-38.079253,-61.965131',
  locationName: 'Base del Cerro Providencia — Tornquist Buenos Aires',

  payment: {
    bankAlias: 'RETO.AL.FILO',
    bankCbu: '0000003100000000000000',
    bankHolder: 'Organización Reto al Filo',
    bankEntity: 'Mercado Pago / Banco Provincia',
    instructions:
      'Transferí el valor correspondiente a tu distancia y adjuntá la captura o foto del comprobante en este formulario para confirmar tu inscripción.',
  },

  circuits: {
    '27K': {
      id: '27K',
      tabLabel: '27K Competitivo',
      distanceLabel: '27K',
      price: '$45.000',
      elevationGain: '+1.510 m',
      hydrationCount: 4,
      cutoffTime: '5 hs',
      summaryBadge: 'Exigencia Alta · Terreno Técnico de Cumbre',
      description:
        'Recorrido serrano técnico de 26,7 km por los cordones de Tornquist con dos ascensos fuertes (919 msnm en el KM 4,3 y 937 msnm en el KM 24,1), crestas rocosas y descenso hacia el valle de largada.',
      stats: [
        {
          label: 'Distancia y Desnivel',
          value: '27K · +1.510 m',
          sub: '26,7 km reales · Alt. máx 937 msnm',
        },
        {
          label: 'Puestos de Hidratación',
          value: '4 Puestos',
          sub: 'KM 6.0, KM 12.0, KM 18.5 y KM 23.0',
        },
        {
          label: 'Tiempo de Corte',
          value: '5 hs',
          sub: 'Cierre general a las 13:00 hs',
        },
      ],
      hydrationStations: [
        { id: 'pa-27-1', km: 6.0, label: 'PA1 · Quebrada' },
        { id: 'pa-27-2', km: 12.0, label: 'PA2 · Filo' },
        { id: 'pa-27-3', km: 18.5, label: 'PA3 · Valle' },
        { id: 'pa-27-4', km: 23.0, label: 'PA4 · Arroyo' },
      ],
    },
    '13K': {
      id: '13K',
      tabLabel: '13K Competitivo',
      distanceLabel: '13K',
      price: '$32.000',
      elevationGain: '+671 m',
      hydrationCount: 2,
      cutoffTime: '3 hs',
      summaryBadge: 'Exigencia Media · Ideal Debutantes en Trail',
      description:
        'Trazado ágil y panorámico de 12,5 km por senderos de montaña en Tornquist, con subida principal hasta los 902 msnm en el KM 8 y vistas abiertas del cordón serrano.',
      stats: [
        {
          label: 'Distancia y Desnivel',
          value: '13K · +671 m',
          sub: '12,5 km reales · Alt. máx 902 msnm',
        },
        {
          label: 'Puestos de Hidratación',
          value: '2 Puestos',
          sub: 'KM 5.0 y KM 10.0',
        },
        {
          label: 'Tiempo de Corte',
          value: '3 hs',
          sub: 'Cierre general a las 11:00 hs',
        },
      ],
      hydrationStations: [
        { id: 'pa-13-1', km: 5.0, label: 'PA1 · Ascenso' },
        { id: 'pa-13-2', km: 10.0, label: 'PA2 · Cumbre/Filo' },
      ],
    },
  },

  demoPhotos: [
    {
      id: 'demo-1',
      cloudinaryUrl:
        'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1400&q=85',
      cloudinaryThumb:
        'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80',
      sector: 'Cumbre El Filo · 937 msnm',
      edicion: 1,
      timestamp: 1712746800000,
      visible: true,
      aspectClass: 'aspect-[4/5]',
    },
    {
      id: 'demo-2',
      cloudinaryUrl:
        'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=1400&q=85',
      cloudinaryThumb:
        'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=800&q=80',
      sector: 'Filo Norte · KM 9.5',
      edicion: 1,
      timestamp: 1712747400000,
      visible: true,
      aspectClass: 'aspect-[4/3]',
    },
    {
      id: 'demo-3',
      cloudinaryUrl:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85',
      cloudinaryThumb:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      sector: 'Cruce de Arroyo · KM 18',
      edicion: 1,
      timestamp: 1712748000000,
      visible: true,
      aspectClass: 'aspect-[3/4]',
    },
    {
      id: 'demo-4',
      cloudinaryUrl:
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85',
      cloudinaryThumb:
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
      sector: 'Ascenso Quebrada · KM 4.5',
      edicion: 1,
      timestamp: 1712748600000,
      visible: true,
      aspectClass: 'aspect-[4/3]',
    },
    {
      id: 'demo-5',
      cloudinaryUrl:
        'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1400&q=85',
      cloudinaryThumb:
        'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=800&q=80',
      sector: 'Bajada Técnica del Valle · KM 14.5',
      edicion: 1,
      timestamp: 1712749200000,
      visible: true,
      aspectClass: 'aspect-[4/5]',
    },
    {
      id: 'demo-6',
      cloudinaryUrl:
        'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=1400&q=85',
      cloudinaryThumb:
        'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=800&q=80',
      sector: 'Sendero de Montaña · Postales',
      edicion: 1,
      timestamp: 1712749800000,
      visible: true,
      aspectClass: 'aspect-[16/10]',
    },
  ],

  schedule: [
    {
      day: 'Sábado 10',
      time: '06:00 hs',
      title: 'Acreditación y entrega de kits',
      description:
        'Recepción de certificado médico obligatorio, deslinde firmado, control de elementos obligatorios y entrega de remera oficial + dorsal con chip.',
      tag: 'Carpa Central',
    },
    {
      day: 'Sábado 10',
      time: '07:30 hs',
      title: 'Charla Técnica obligatoria',
      description:
        'Reporte meteorológico actualizado en cumbre, estado de los senderos, colores de cintas de marcación y protocolo de seguridad en montaña.',
      tag: 'Arco de Largada',
    },
    {
      day: 'Sábado 10',
      time: '09:00 hs',
      title: 'Largada 27K y 13K',
      description:
        'Salida puntual de ambas distancias desde el arco principal del predio hacia el sendero de ascenso.',
      tag: 'Puntual',
    },
    {
      day: 'Sábado 10',
      time: '13:30 hs',
      title: 'Premiación y Tercer Tiempo',
      description:
        'Entrega de premios a podios generales y categorías por edad, sorteos de sponsors y almuerzo de camaradería en la base del cerro.',
      tag: 'Escenario Base',
    },
  ],

  faqs: [
    {
      id: 'elementos-obligatorios',
      question: 'Elementos obligatorios',
      answer:
        'El equipamiento obligatorio se adapta a la exigencia técnica y de cumbre de cada distancia. Revisá la lista diferenciada para 27K y 13K antes de largar:',
    },
    {
      id: 'como-llegar',
      question: 'Cómo llegar al predio',
      answer:
        'El predio de largada y llegada está ubicado en la zona serrana de Tornquist / Sierra de la Ventana (Prov. de Buenos Aires). El acceso vehicular está señalizado desde el ingreso principal por camino consolidado apto para todo tipo de vehículos, con sector de estacionamiento gratuito a pocos metros del arco de largada.',
      hasMapButton: true,
    },
    {
      id: 'reglamento',
      question: 'Reglamento',
      answer:
        'El tiempo máximo de corte es de 5 horas para los 27K (con corte intermedio a las 3 hs de carrera) y 3 horas para los 13K. Está terminantemente prohibido arrojar envoltorios de geles, botellas o cualquier tipo de residuo fuera de los cestos de los puestos de hidratación (penalización con descalificación directa). Es requisito excluyente presentar apto médico vigente (emitido dentro de los últimos 12 meses) y deslinde de responsabilidad firmado al retirar el kit.',
    },
  ],

  kitIncludes: [
    'Remera técnica oficial del evento',
    'Dorsal oficial + Chip de cronometraje electrónico',
    'Medalla Finisher metálica para quienes crucen la meta',
    'Hidratación y abastecimiento sólido/líquido en circuito y llegada',
    'Seguro de accidentes personales para cada corredor acreditado',
    'Asistencia médica y equipo de rescate en sierra',
    'Tercer Tiempo y sorteos en la base del cerro',
  ],

  sponsors: [],

  mandatoryGear: {
    '27K': [
      'Mochila o chaleco de hidratación con capacidad mínima de 1,0 L',
      'Campera rompevientos / impermeable',
      'Manta térmica de emergencia',
      'Silbato de emergencia (náutico o incorporado en mochila)',
      'Teléfono celular con carga suficiente y número SOS de la organización agendado',
      'Eco-vaso o recipiente reutilizable (no se entregan vasos descartables en PA)',
      'Dorsal oficial visible al frente durante todo el recorrido',
    ],
    '13K': [
      'Reserva de hidratación mínima de 500 ml (cinturón, soft flask, caramañola o chaleco)',
      'Eco-vaso o recipiente reutilizable (no se entregan vasos descartables en PA)',
      'Silbato de emergencia',
      'Dorsal oficial visible al frente durante todo el recorrido',
      'Campera rompevientos (sujeta al parte meteorológico oficial previo a la largada)',
    ],
    note: 'El control de equipamiento podrá realizarse en la acreditación, en el ingreso al corral de largada o en cualquier puesto del recorrido.',
  },

  ageCategories: {
    title: 'Categorías por Edad y Premiación',
    ruleNote:
      'Para todas las categorías (Damas y Caballeros en 27K y 13K) la edad se computa al día de la carrera. La premiación de la Clasificación General (Top 3) no es acumulativa con las categorías por edad.',
    generalPodium: 'Top 3 General Damas y Caballeros (27K y 13K)',
    categoryPodium: '1° al 3° Puesto por Categoría en Damas y Caballeros (27K y 13K)',
    brackets: [
      { id: 'cat-18-29', label: '18 a 29 años' },
      { id: 'cat-30-39', label: '30 a 39 años' },
      { id: 'cat-40-49', label: '40 a 49 años' },
      { id: 'cat-50-59', label: '50 a 59 años' },
      { id: 'cat-60-plus', label: '60+ años' },
    ],
  },

  // Textos editables de los documentos legales (Deslinde y Apto Médico).
  // Vacío = se usa el texto por defecto definido en DEFAULT_WAIVER_CLAUSES / DEFAULT_MEDICAL_BODY_TEXT.
  waiverCustomText: '',
  medicalCustomText: '',

  // Descuento automático para residentes del Partido de Tornquist
  residentDiscountEnabled: DEFAULT_RESIDENT_DISCOUNT_ENABLED,
  residentDiscountPercent: DEFAULT_RESIDENT_DISCOUNT_PERCENT,
  residentLocalities: DEFAULT_RESIDENT_LOCALITIES,

  // Tarjeta promocional de Beneficios para Teams en el Hero
  teamsBenefitEnabled: DEFAULT_TEAMS_BENEFIT_ENABLED,
  teamsBenefitEmail: '',
};

const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';
const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const MONTHS_SHORT_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

/**
 * Extrae fecha y hora local de Argentina (-03:00) y sus textos formateados desde un string ISO.
 */
export function parseTargetDateParts(isoString = RACE_CONFIG.targetDateIso) {
  const raw = String(isoString || DEFAULT_TARGET_DATE_ISO).trim();
  let datePart = '2027-04-10';
  let timePart = '09:00';

  const parsedMs = Date.parse(raw);
  if (!Number.isNaN(parsedMs)) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: ARGENTINA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(parsedMs))
        .filter((p) => p.type !== 'literal')
        .map((p) => [p.type, p.value])
    );
    if (parts.year && parts.month && parts.day && parts.hour && parts.minute) {
      datePart = `${parts.year}-${parts.month}-${parts.day}`;
      timePart = `${parts.hour}:${parts.minute}`;
    }
  } else {
    const match = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (match) {
      datePart = match[1];
      timePart = match[2];
    }
  }

  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const dayNum = Number(dayStr) || 10;
  const monthIdx = Math.max(0, Math.min(11, (Number(monthStr) || 4) - 1));
  const monthFull = MONTHS_ES[monthIdx] || 'Abril';
  const monthShort = MONTHS_SHORT_ES[monthIdx] || 'Abr';

  return {
    datePart,
    timePart,
    formattedTime: `${timePart} hs`,
    formattedDayMonth: `${dayNum} de ${monthFull}`,
    formattedShortDate: `${dayNum} ${monthShort} ${yearStr || '2027'}`,
    formattedFullDate: `${dayNum} de ${monthFull} ${yearStr || '2027'}`,
    year: yearStr || '2027',
  };
}

/**
 * Devuelve un ISO de largada válido (parseable) o el fallback seguro DEFAULT_TARGET_DATE_ISO.
 */
export function resolveTargetDateIso(isoString) {
  const raw = String(isoString ?? '').trim();
  return raw && !Number.isNaN(Date.parse(raw)) ? raw : DEFAULT_TARGET_DATE_ISO;
}

/**
 * Construye un timestamp ISO válido con huso horario de Argentina (-03:00).
 */
export function buildTargetDateIso(datePart, timePart) {
  const fallback = parseTargetDateParts(RACE_CONFIG.targetDateIso);
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(String(datePart || '').trim())
    ? String(datePart).trim()
    : fallback.datePart;
  const safeTime = /^\d{2}:\d{2}$/.test(String(timePart || '').trim())
    ? String(timePart).trim()
    : fallback.timePart;
  return `${safeDate}T${safeTime}:00-03:00`;
}

/**
 * Sincroniza el horario del hito de Largada en el cronograma con la hora de targetDateIso.
 */
export function syncScheduleWithTargetDate(schedule, targetDateIso) {
  if (!Array.isArray(schedule)) return schedule;
  const { formattedTime } = parseTargetDateParts(targetDateIso);
  return schedule.map((item) => {
    if (item && typeof item.title === 'string' && /largada/i.test(item.title)) {
      return {
        ...item,
        time: formattedTime,
      };
    }
    return item;
  });
}

/**
 * Convierte un texto de tiempo de corte ("5 hs", "4,5 hs", "5:30 hs", "5 hs 30 min") a minutos.
 */
export function parseCutoffMinutes(cutoffTime) {
  const raw = String(cutoffTime || '').toLowerCase().trim();
  if (!raw) return null;

  const hhmm = raw.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (hhmm) return Number(hhmm[1]) * 60 + Number(hhmm[2]);

  const hours = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hs|hrs?|horas?)?/);
  if (!hours) return null;
  let minutes = Math.round(Number(hours[1].replace(',', '.')) * 60);

  const extraMin = raw.match(/(\d+)\s*(?:m|min|minutos?)\b/);
  if (extraMin && raw.indexOf(extraMin[0]) > raw.indexOf(hours[0])) {
    minutes += Number(extraMin[1]);
  }
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

/**
 * Obtiene la hora de largada (HH:MM) desde el cronograma sincronizado, con fallback a targetDateIso.
 */
export function getStartTime(schedule, targetDateIso) {
  const synced = syncScheduleWithTargetDate(schedule || [], targetDateIso) || [];
  const startItem = synced.find(
    (item) => item && typeof item.title === 'string' && /largada/i.test(item.title)
  );
  const match = String(startItem?.time || '').match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  return parseTargetDateParts(targetDateIso).timePart;
}

/**
 * Calcula el horario de cierre general: hora de largada + tiempo de corte. Devuelve "HH:MM hs" o null.
 */
export function computeClosingTime(startTime, cutoffTime) {
  const start = String(startTime || '').match(/(\d{1,2}):(\d{2})/);
  const cutoffMinutes = parseCutoffMinutes(cutoffTime);
  if (!start || cutoffMinutes == null) return null;

  const total = (Number(start[1]) * 60 + Number(start[2]) + cutoffMinutes) % (24 * 60);
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm} hs`;
}

/** Nombre de la carrera con fallback seguro (nunca vacío). */
export function getRaceTitle(cfg) {
  return String(cfg?.title ?? '').trim() || DEFAULT_RACE_TITLE;
}

/** Edición opcional ('' = oculta). Si el campo no existe se usa el valor por defecto. */
export function getRaceEdition(cfg) {
  return typeof cfg?.edition === 'string' ? cfg.edition.trim() : RACE_CONFIG.edition;
}

const ORDINAL_WORDS = {
  1: 'PRIMERA',
  2: 'SEGUNDA',
  3: 'TERCERA',
  4: 'CUARTA',
  5: 'QUINTA',
  6: 'SEXTA',
  7: 'SÉPTIMA',
  8: 'OCTAVA',
  9: 'NOVENA',
  10: 'DÉCIMA',
};

/** Convierte ordinales abreviados ("2da Edición") a palabra completa en mayúsculas ("SEGUNDA EDICIÓN"). */
export function expandOrdinalEdition(rawEdition, fallback = '') {
  const trimmed = String(rawEdition ?? '').trim();
  if (!trimmed) return fallback;
  return trimmed
    .replace(
      /\b(\d+)\s*(?:ra|da|ta|ma|na|va|er|do|to|vo|no|mo|ª|º|°)\.?(?=\s|$)/gi,
      (full, num) => ORDINAL_WORDS[Number(num)] || full
    )
    .toUpperCase();
}

/** Título completo: "Nombre - Edición" (o solo el nombre si la edición está vacía). */
export function getRaceFullTitle(cfg, separator = ' - ') {
  const edition = getRaceEdition(cfg);
  return edition ? `${getRaceTitle(cfg)}${separator}${edition}` : getRaceTitle(cfg);
}

const LEGACY_EDITION_IN_TITLE = /^(.*?)\s*[-–—·|]\s*(\d+\s*[a-zº°]*\.?\s*edici[oó]n.*)$/i;

/**
 * Resuelve título/edición. Migra configs legacy donde la edición venía embebida
 * en el título ("Reto al Filo - 2da Edición") y aún no existía el campo `edition`.
 */
function resolveTitleAndEdition(override) {
  const rawTitle = String(override?.title ?? '').trim();
  if (typeof override?.edition === 'string') {
    return { title: rawTitle || DEFAULT_RACE_TITLE, edition: override.edition.trim() };
  }
  const legacy = rawTitle.match(LEGACY_EDITION_IN_TITLE);
  if (legacy && legacy[1].trim()) {
    return { title: legacy[1].trim(), edition: legacy[2].trim() };
  }
  return { title: rawTitle || DEFAULT_RACE_TITLE, edition: RACE_CONFIG.edition };
}

export function buildWhatsAppUrl(
  distance = '27K',
  whatsappNumber = RACE_CONFIG.whatsappNumber,
  raceConfig = RACE_CONFIG
) {
  const cleanPhone = String(whatsappNumber || RACE_CONFIG.whatsappNumber).replace(/[^\d]/g, '');
  const message = `Hola! Quiero inscribirme al ${getRaceFullTitle(raceConfig)} en la distancia de ${distance}`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Combina de forma segura la configuración guardada (Firestore / localStorage) con los valores por defecto.
 */
export function mergeRaceConfig(override) {
  if (!override || typeof override !== 'object') {
    return RACE_CONFIG;
  }

  const normalizeDistanceCopy = (text) =>
    typeof text === 'string'
      ? text
          .replace(/21K/gi, '27K')
          .replace(/10K/gi, '13K')
          .replace(/13K\s+Montaña/gi, '13K Competitivo')
      : text;

  const mergeCircuit = (key, legacyKey) => {
    const base = RACE_CONFIG.circuits[key];
    const incoming = override.circuits?.[key];
    const legacy = override.circuits?.[legacyKey];
    if (!incoming) {
      return legacy?.price ? { ...base, price: legacy.price } : base;
    }
    // El desnivel y la descripción siempre respetan los valores guardados del circuito
    const usesOfficialTrack = !incoming.customGpx;
    const incomingStats = Array.isArray(incoming.stats) ? incoming.stats : base.stats;
    return {
      ...base,
      ...incoming,
      id: base.id,
      tabLabel: base.tabLabel,
      distanceLabel: base.distanceLabel,
      elevationGain: incoming.elevationGain || base.elevationGain,
      description: incoming.description || base.description,
      stats: usesOfficialTrack
        ? [base.stats[0], ...incomingStats.slice(1)]
        : incomingStats,
      hydrationStations: Array.isArray(incoming.hydrationStations)
        ? incoming.hydrationStations
        : base.hydrationStations,
      customGpx: incoming.customGpx || null,
    };
  };

  const resolvedHeroImage =
    !override.heroImage || String(override.heroImage).includes('photo-1551632811-561732d1e306')
      ? RACE_CONFIG.heroImage
      : override.heroImage;

  const resolvedTargetDateIso = resolveTargetDateIso(override.targetDateIso);

  const rawSchedule = Array.isArray(override.schedule)
    ? override.schedule.map((item) => ({
        day: item?.day ?? 'Sábado 10',
        ...item,
        title: normalizeDistanceCopy(item?.title),
        description: normalizeDistanceCopy(item?.description),
      }))
    : RACE_CONFIG.schedule;

  const nextSchedule = syncScheduleWithTargetDate(rawSchedule, resolvedTargetDateIso);

  const isLegacyGearFaqAnswer = (text) =>
    typeof text === 'string' &&
    text.includes('costuras termoselladas') &&
    text.includes('capacidad mínima de 1 litro');

  const nextFaqs = Array.isArray(override.faqs)
    ? override.faqs.map((faq) => {
        const normalizedAnswer = normalizeDistanceCopy(faq?.answer);
        const answer =
          faq?.id === 'elementos-obligatorios' && isLegacyGearFaqAnswer(normalizedAnswer)
            ? RACE_CONFIG.faqs[0].answer
            : normalizedAnswer;
        return {
          ...faq,
          question: normalizeDistanceCopy(faq?.question),
          answer,
        };
      })
    : RACE_CONFIG.faqs;

  const nextKitIncludes = Array.isArray(override.kitIncludes)
    ? override.kitIncludes.map((item) => String(item ?? ''))
    : RACE_CONFIG.kitIncludes;

  const nextSponsors = Array.isArray(override.sponsors)
    ? override.sponsors
        .filter((item) => item && typeof item === 'object')
        .map((item, idx) => ({
          id: String(item.id || `sponsor-${idx}`),
          name: String(item.name || '').trim(),
          logoUrl: String(item.logoUrl || '').trim(),
          linkUrl: String(item.linkUrl || '').trim(),
          invertOnDark: Boolean(item.invertOnDark),
        }))
    : RACE_CONFIG.sponsors;

  const incomingGear =
    override.mandatoryGear && typeof override.mandatoryGear === 'object'
      ? override.mandatoryGear
      : {};
  const nextMandatoryGear = {
    '27K': Array.isArray(incomingGear['27K'])
      ? incomingGear['27K'].map((item) => String(item ?? ''))
      : RACE_CONFIG.mandatoryGear['27K'],
    '13K': Array.isArray(incomingGear['13K'])
      ? incomingGear['13K'].map((item) => String(item ?? ''))
      : RACE_CONFIG.mandatoryGear['13K'],
    note:
      typeof incomingGear.note === 'string'
        ? incomingGear.note
        : RACE_CONFIG.mandatoryGear.note,
  };

  const incomingCats =
    override.ageCategories && typeof override.ageCategories === 'object'
      ? override.ageCategories
      : {};
  const nextAgeCategories = {
    ...RACE_CONFIG.ageCategories,
    ...incomingCats,
    brackets: Array.isArray(incomingCats.brackets)
      ? incomingCats.brackets.map((b, idx) => ({
          id: b?.id || `cat-${idx}`,
          label: String(b?.label || b?.range || ''),
        }))
      : RACE_CONFIG.ageCategories.brackets,
  };

  const { title: resolvedTitle, edition: resolvedEdition } = resolveTitleAndEdition(override);
  const resolvedThemeColor = VALID_THEME_COLORS.includes(override.themeColor)
    ? override.themeColor
    : RACE_CONFIG.themeColor;

  const resolvedResidentDiscountEnabled =
    typeof override.residentDiscountEnabled === 'boolean'
      ? override.residentDiscountEnabled
      : RACE_CONFIG.residentDiscountEnabled;

  const rawDiscountPercent = override.residentDiscountPercent;
  const parsedDiscountPercent =
    rawDiscountPercent !== undefined &&
    rawDiscountPercent !== null &&
    String(rawDiscountPercent).trim() !== ''
      ? Number(rawDiscountPercent)
      : NaN;
  const resolvedResidentDiscountPercent = Number.isFinite(parsedDiscountPercent)
    ? Math.min(100, Math.max(1, Math.round(parsedDiscountPercent)))
    : RACE_CONFIG.residentDiscountPercent;

  const resolvedResidentLocalities =
    override.residentLocalities === undefined
      ? RACE_CONFIG.residentLocalities
      : parseResidentLocalities(override.residentLocalities, RACE_CONFIG.residentLocalities);

  const resolvedNotificationEmail =
    String(override.notificationEmail || '').trim() || RACE_CONFIG.notificationEmail;

  const resolvedTeamsBenefitEnabled = true;
  const rawTeamsBenefitEmail = String(override.teamsBenefitEmail ?? '').trim();
  const customTeamsBenefitEmail =
    rawTeamsBenefitEmail &&
    rawTeamsBenefitEmail.toLowerCase() !== DEFAULT_TEAMS_BENEFIT_EMAIL.toLowerCase()
      ? rawTeamsBenefitEmail
      : '';
  const resolvedTeamsBenefitEmail =
    resolvedNotificationEmail || customTeamsBenefitEmail || DEFAULT_TEAMS_BENEFIT_EMAIL;

  return {
    ...RACE_CONFIG,
    ...override,
    title: resolvedTitle,
    edition: resolvedEdition,
    themeColor: resolvedThemeColor,
    whatsappNumber:
      String(override.whatsappNumber || '').trim() || RACE_CONFIG.whatsappNumber,
    notificationEmail: resolvedNotificationEmail,
    targetDateIso: resolvedTargetDateIso,
    heroImage: resolvedHeroImage,
    payment: {
      ...RACE_CONFIG.payment,
      ...(override.payment && typeof override.payment === 'object' ? override.payment : {}),
    },
    circuits: {
      '27K': mergeCircuit('27K', '21K'),
      '13K': mergeCircuit('13K', '10K'),
    },
    schedule: nextSchedule,
    faqs: nextFaqs,
    kitIncludes: nextKitIncludes,
    sponsors: nextSponsors,
    mandatoryGear: nextMandatoryGear,
    ageCategories: nextAgeCategories,
    waiverCustomText: typeof override.waiverCustomText === 'string' ? override.waiverCustomText : '',
    medicalCustomText: typeof override.medicalCustomText === 'string' ? override.medicalCustomText : '',
    residentDiscountEnabled: resolvedResidentDiscountEnabled,
    residentDiscountPercent: resolvedResidentDiscountPercent,
    residentLocalities: resolvedResidentLocalities,
    teamsBenefitEnabled: resolvedTeamsBenefitEnabled,
    teamsBenefitEmail: resolvedTeamsBenefitEmail,
  };
}

function toValidatedDateParts(year, month, day) {
  if (year < 1926 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function parseIsoOrDmyDate(dateStr) {
  const raw = String(dateStr || '').trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return toValidatedDateParts(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3])
    );
  }

  const dmyMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    return toValidatedDateParts(
      Number(dmyMatch[3]),
      Number(dmyMatch[2]),
      Number(dmyMatch[1])
    );
  }

  return null;
}

export function getMaxBirthDateIso(targetDateIso = RACE_CONFIG.targetDateIso, minAge = 18) {
  const targetParts = parseTargetDateParts(targetDateIso || RACE_CONFIG.targetDateIso);
  const race = parseIsoOrDmyDate(targetParts.datePart) || { year: 2027, month: 4, day: 10 };
  const targetYear = race.year - Number(minAge || 18);
  const lastDayOfMonth = new Date(targetYear, race.month, 0).getDate();
  const safeDay = Math.min(race.day, lastDayOfMonth);
  return `${String(targetYear).padStart(4, '0')}-${String(race.month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

export function formatBirthDateDmy(dateStr) {
  const parsed = parseIsoOrDmyDate(dateStr);
  if (!parsed) return String(dateStr || '').trim();
  return `${String(parsed.day).padStart(2, '0')}/${String(parsed.month).padStart(2, '0')}/${String(parsed.year).padStart(4, '0')}`;
}

export function calculateRunnerAgeAtRace(birthDateStr, targetDateIso = RACE_CONFIG.targetDateIso) {
  const birth = parseIsoOrDmyDate(birthDateStr);
  if (!birth) return null;

  const targetParts = parseTargetDateParts(targetDateIso || RACE_CONFIG.targetDateIso);
  const race = parseIsoOrDmyDate(targetParts.datePart);
  if (!race) return null;

  let age = race.year - birth.year;
  if (race.month < birth.month || (race.month === birth.month && race.day < birth.day)) {
    age -= 1;
  }

  return Number.isFinite(age) && age >= 0 && age <= 120 ? age : null;
}

function matchAgeBracket(age, brackets) {
  if (age === null || !Array.isArray(brackets) || brackets.length === 0) return null;

  for (const bracket of brackets) {
    const source = `${bracket?.range || ''} ${bracket?.label || ''}`.trim();
    const nums = source.match(/\d+/g)?.map(Number) || [];
    if (nums.length >= 2) {
      const min = Math.min(nums[0], nums[1]);
      const max = Math.max(nums[0], nums[1]);
      if (age >= min && age <= max) return bracket;
    } else if (nums.length === 1) {
      const val = nums[0];
      const lower = source.toLowerCase();
      if (
        lower.includes('hasta') ||
        lower.includes('menor') ||
        lower.includes('sub') ||
        lower.includes('<')
      ) {
        if (age <= val) return bracket;
      } else if (age >= val) {
        return bracket;
      }
    }
  }

  // Si la edad es menor al primer umbral numérico configurado, se asigna al primer tramo oficial
  const firstNums = `${brackets[0]?.range || ''} ${brackets[0]?.label || ''}`
    .match(/\d+/g)
    ?.map(Number);
  if (firstNums?.length && age < firstNums[0]) {
    return brackets[0] || null;
  }

  return brackets[brackets.length - 1] || null;
}

export function resolveRunnerCategory(runner, raceConfig = RACE_CONFIG) {
  const age = calculateRunnerAgeAtRace(
    runner?.birthDate,
    raceConfig?.targetDateIso || RACE_CONFIG.targetDateIso
  );

  const rawDist = String(runner?.distance || '').trim().toUpperCase();
  const distanceLabel = rawDist.includes('27')
    ? '27K'
    : rawDist.includes('13')
      ? '13K'
      : rawDist;

  const rawGender = String(runner?.gender || '').trim();
  const lowerGender = rawGender.toLowerCase();
  let genderLabel = '';
  let genderShort = '';
  if (
    lowerGender.includes('masc') ||
    lowerGender.includes('hombre') ||
    lowerGender.includes('varon') ||
    lowerGender.includes('varón') ||
    lowerGender.includes('caballero')
  ) {
    genderLabel = 'Caballeros';
    genderShort = 'Cab.';
  } else if (
    lowerGender.includes('fem') ||
    lowerGender.includes('mujer') ||
    lowerGender.includes('dama')
  ) {
    genderLabel = 'Damas';
    genderShort = 'Dam.';
  } else if (rawGender) {
    genderLabel = rawGender;
    genderShort = rawGender.slice(0, 4);
  }

  const brackets =
    Array.isArray(raceConfig?.ageCategories?.brackets) && raceConfig.ageCategories.brackets.length > 0
      ? raceConfig.ageCategories.brackets
      : RACE_CONFIG.ageCategories.brackets;

  const matchedBracket = matchAgeBracket(age, brackets);
  const bracketLabel =
    matchedBracket?.label || matchedBracket?.range || (age !== null ? `${age} años` : '');

  const fullParts = [distanceLabel, genderLabel, bracketLabel].filter(Boolean);
  const fullCategory = fullParts.length > 0 ? fullParts.join(' · ') : 'Sin clasificar';

  const compactRange = bracketLabel
    ? bracketLabel.replace(/años?/gi, '').replace(/\s+/g, ' ').trim()
    : '';
  const shortParts = [distanceLabel, genderShort || genderLabel, compactRange].filter(Boolean);
  const shortCategory = shortParts.length > 0 ? shortParts.join(' ') : 'Sin clasificar';

  return {
    age,
    distanceLabel,
    genderLabel,
    bracketLabel,
    fullCategory,
    shortCategory,
  };
}

/** Normaliza el nombre de una localidad sin tildes, minúsculas ni espacios extra. */
export function normalizeLocalityText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parsea una lista de localidades desde array o string separado por comas, sin duplicados. */
export function parseResidentLocalities(input, fallback = DEFAULT_RESIDENT_LOCALITIES) {
  const rawItems = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(',')
      : [];

  const seen = new Set();
  const cleaned = [];
  for (const raw of rawItems) {
    const label = String(raw ?? '').replace(/\s+/g, ' ').trim();
    if (!label) continue;
    const norm = normalizeLocalityText(label);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    cleaned.push(label);
  }

  return cleaned.length > 0 ? cleaned : fallback;
}

const LOCALITY_ALIASES = {
  'villa serrana la gruta': ['la gruta', 'villa la gruta'],
};

/** Verifica si el texto ingresado coincide con una localidad habilitada para el beneficio. */
export function matchResidentLocality(cityInput, localities = DEFAULT_RESIDENT_LOCALITIES) {
  const normInput = normalizeLocalityText(cityInput);
  if (!normInput) return null;

  const firstSegment = normalizeLocalityText(normInput.split(/[,/()\-–—·]/)[0]);
  const strippedSegment = firstSegment
    .replace(
      /\s+(?:(?:provincia|pcia\.?|prov\.?)\s+de\s+buenos\s+aires|buenos\s+aires|bs\.?\s*as\.?|partido\s+de\s+tornquist)$/i,
      ''
    )
    .trim();
  const list = Array.isArray(localities) ? localities : DEFAULT_RESIDENT_LOCALITIES;

  for (const loc of list) {
    const label = String(loc ?? '').trim();
    const normLoc = normalizeLocalityText(label);
    if (!normLoc) continue;
    const candidates = [normLoc, ...(LOCALITY_ALIASES[normLoc] || [])];
    if (
      candidates.some(
        (candidate) =>
          normInput === candidate ||
          firstSegment === candidate ||
          strippedSegment === candidate
      )
    ) {
      return label;
    }
  }

  return null;
}

/** Extrae la parte entera positiva de un string de precio en pesos argentinos. */
export function parseArsPriceNumber(rawPrice) {
  const intPart = String(rawPrice ?? '').split(',')[0];
  const digits = intPart.replace(/[^\d]/g, '');
  if (!digits) return 0;
  const num = Number.parseInt(digits, 10);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

/** Formatea un monto numérico entero en formato ARS ($45.000). */
export function formatArsPrice(amount) {
  const num = Math.max(0, Math.round(Number(amount) || 0));
  return `$${String(num).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export const THREE_INSTALLMENTS_DEADLINE_ISO = '2027-01-31';
export const TWO_INSTALLMENTS_DEADLINE_ISO = '2027-02-27';

/**
 * Determina automáticamente la cantidad máxima de cuotas habilitadas según la fecha actual
 * en horario de Argentina (America/Argentina/Buenos_Aires):
 * - Hasta el 31/01/2027 (inclusive): hasta 3 cuotas.
 * - Del 01/02/2027 al 27/02/2027 (inclusive): hasta 2 cuotas.
 * - Desde el 28/02/2027 en adelante: solo 1 pago (Pago Total).
 */
export function resolveInstallmentSchedule(nowMs = Date.now()) {
  let todayIso = '2026-11-23';
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: ARGENTINA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(nowMs))
        .filter((p) => p.type !== 'literal')
        .map((p) => [p.type, p.value])
    );
    if (parts.year && parts.month && parts.day) {
      todayIso = `${parts.year}-${parts.month}-${parts.day}`;
    }
  } catch {
    todayIso = new Date(nowMs).toISOString().slice(0, 10);
  }

  if (todayIso <= THREE_INSTALLMENTS_DEADLINE_ISO) {
    return {
      todayIso,
      maxInstallments: 3,
      phase: '3_cuotas',
    };
  }

  if (todayIso <= TWO_INSTALLMENTS_DEADLINE_ISO) {
    return {
      todayIso,
      maxInstallments: 2,
      phase: '2_cuotas',
    };
  }

  return {
    todayIso,
    maxInstallments: 1,
    phase: 'solo_total',
  };
}

/** Calcula precios base y final aplicando el descuento configurable de residentes y el plan de cuotas vigente. */
export function computeRegistrationPricing(
  rawBasePrice,
  raceConfig = RACE_CONFIG,
  isResident = false,
  customInstallmentsCount = null
) {
  const discountEnabled = Boolean(
    raceConfig?.residentDiscountEnabled ?? RACE_CONFIG.residentDiscountEnabled
  );
  const rawPercent = Number(
    raceConfig?.residentDiscountPercent ?? RACE_CONFIG.residentDiscountPercent
  );
  const configuredPercent =
    Number.isFinite(rawPercent) && rawPercent >= 1
      ? Math.min(100, Math.max(1, Math.round(rawPercent)))
      : DEFAULT_RESIDENT_DISCOUNT_PERCENT;

  const baseNumber = parseArsPriceNumber(rawBasePrice);
  const originalPrice =
    baseNumber > 0 ? formatArsPrice(baseNumber) : String(rawBasePrice || '').trim();
  const isLocalResident = Boolean(discountEnabled && isResident && baseNumber > 0);
  const discountPercentApplied = isLocalResident ? configuredPercent : 0;
  const finalAmountNumber = isLocalResident
    ? Math.round(baseNumber * (1 - discountPercentApplied / 100))
    : baseNumber;
  const finalAmount = baseNumber > 0 ? formatArsPrice(finalAmountNumber) : originalPrice;

  const schedule = resolveInstallmentSchedule();
  const maxInstallments = schedule.maxInstallments;
  const installmentsCount =
    customInstallmentsCount === 2 || customInstallmentsCount === 3
      ? customInstallmentsCount
      : maxInstallments;

  const installmentAmountNumber =
    finalAmountNumber > 0 && installmentsCount > 1
      ? Math.round(finalAmountNumber / installmentsCount)
      : finalAmountNumber;
  const installmentAmount =
    installmentAmountNumber > 0 ? formatArsPrice(installmentAmountNumber) : finalAmount;

  const installment3AmountNumber =
    finalAmountNumber > 0 ? Math.round(finalAmountNumber / 3) : 0;
  const installment3Amount =
    installment3AmountNumber > 0 ? formatArsPrice(installment3AmountNumber) : finalAmount;

  const installment2AmountNumber =
    finalAmountNumber > 0 ? Math.round(finalAmountNumber / 2) : 0;
  const installment2Amount =
    installment2AmountNumber > 0 ? formatArsPrice(installment2AmountNumber) : finalAmount;

  return {
    isLocalResident,
    discountEnabled,
    configuredPercent,
    discountPercentApplied,
    baseNumber,
    finalAmountNumber,
    originalPrice,
    finalAmount,
    maxInstallments,
    installmentPhase: schedule.phase,
    installmentsCount,
    installmentAmountNumber,
    installmentAmount,
    installment3Amount,
    installment2Amount,
  };
}

function formatStoredPrice(val) {
  if (typeof val === 'number' && Number.isFinite(val)) {
    return formatArsPrice(val);
  }
  return String(val ?? '').trim();
}

/** Lee los importes congelados en el documento del corredor sin recalcular con la config actual. */
export function resolveFrozenRegistrationPricing(reg) {
  const isLocalResident = Boolean(reg?.isLocalResident);
  const discountPercentApplied = isLocalResident
    ? Math.max(0, Math.round(Number(reg?.discountPercentApplied) || 0))
    : 0;
  const originalPrice =
    formatStoredPrice(reg?.originalPrice) || formatStoredPrice(reg?.priceSnapshot);
  const finalAmount =
    formatStoredPrice(reg?.finalAmount) || formatStoredPrice(reg?.priceSnapshot) || originalPrice;
  const badgeText = isLocalResident
    ? discountPercentApplied > 0
      ? `Residente (-${discountPercentApplied}%)`
      : 'Residente'
    : '';
  const paymentPlan = reg?.paymentPlan === 'cuotas' ? 'cuotas' : 'total';
  const storedTotal = Number(reg?.installmentsTotal);
  const installmentsTotal = paymentPlan === 'cuotas' ? (storedTotal === 2 ? 2 : 3) : 1;
  const finalNum = parseArsPriceNumber(finalAmount);
  const storedInstallment = formatStoredPrice(reg?.installmentAmount);
  const installmentAmount =
    paymentPlan === 'cuotas'
      ? storedInstallment ||
        (finalNum > 0 ? formatArsPrice(Math.round(finalNum / installmentsTotal)) : '')
      : finalAmount;

  return {
    isLocalResident,
    discountPercentApplied,
    originalPrice,
    finalAmount,
    badgeText,
    paymentPlan,
    installmentsTotal,
    installmentAmount,
  };
}

/** Normaliza el género del corredor a 'Masculino', 'Femenino' o '' si no coincide. */
export function normalizeRunnerGender(rawGender) {
  const lower = String(rawGender ?? '').trim().toLowerCase();
  if (!lower) return '';
  if (
    lower === 'm' ||
    lower.includes('masc') ||
    lower.includes('hombre') ||
    lower.includes('varon') ||
    lower.includes('varón') ||
    lower.includes('caballero')
  ) {
    return 'Masculino';
  }
  if (
    lower === 'f' ||
    lower.includes('fem') ||
    lower.includes('mujer') ||
    lower.includes('dama')
  ) {
    return 'Femenino';
  }
  return '';
}

const FREE_ENTRY_TEXT_RE = /\b(free|gratis|bonificad[oa]|sin\s*cargo|cortes[ií]a)\b/i;

/**
 * Resuelve el monto real abonado (en ARS entero) por un corredor:
 * - Devuelve 0 si es corredor/entrenador FREE (flag, texto FREE/Gratis, $0 o 100% descuento).
 * - Prioriza el monto congelado en la inscripción (`finalAmount` / `priceSnapshot`).
 * - Si el documento legacy no tiene monto guardado, usa el precio configurado en el panel
 *   aplicando el descuento de residente si corresponde.
 */
export function resolveRegistrationPaidAmount(reg, raceConfig = RACE_CONFIG) {
  if (!reg || typeof reg !== 'object') return 0;

  if (
    reg.isFree === true ||
    reg.freeEntry === true ||
    reg.isTeamFree === true ||
    Number(reg.discountPercentApplied) >= 100 ||
    FREE_ENTRY_TEXT_RE.test(String(reg.benefitType || reg.teamBenefit || ''))
  ) {
    return 0;
  }

  const storedCandidates = [reg.finalAmount, reg.priceSnapshot];
  for (const candidate of storedCandidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.max(0, Math.round(candidate));
    }
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (!trimmed) continue;
      if (FREE_ENTRY_TEXT_RE.test(trimmed)) return 0;
      const intPart = trimmed.split(',')[0];
      const digits = intPart.replace(/[^\d]/g, '');
      if (digits !== '') {
        const parsed = Number.parseInt(digits, 10);
        if (Number.isFinite(parsed)) {
          return Math.max(0, parsed);
        }
      }
    }
  }

  const rawDist = String(reg.distance || '').trim().toUpperCase();
  const distKey = rawDist === '13K' || rawDist === '10K' ? '13K' : '27K';
  const configuredPrice =
    raceConfig?.circuits?.[distKey]?.price || RACE_CONFIG.circuits[distKey].price;
  const baseNumber = parseArsPriceNumber(configuredPrice);

  if (reg.isLocalResident) {
    const savedPct = Number(reg.discountPercentApplied);
    const pct =
      Number.isFinite(savedPct) && savedPct > 0
        ? Math.min(100, Math.round(savedPct))
        : Number(raceConfig?.residentDiscountPercent ?? DEFAULT_RESIDENT_DISCOUNT_PERCENT);
    return Math.max(0, Math.round(baseNumber * (1 - Math.min(100, Math.max(0, pct)) / 100)));
  }

  return Math.max(0, baseNumber);
}
