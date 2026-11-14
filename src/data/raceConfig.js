export const RACE_CONFIG = {
  title: 'Reto al Filo - 2da Edición',
  subtitle: 'Abril 2027',
  targetDateIso: '2027-04-10T08:00:00-03:00',
  whatsappNumber: '5492915228310',
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
      tabLabel: '13K Montaña',
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
      dorsales: ['101', '205'],
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
      dorsales: ['205'],
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
      dorsales: ['302'],
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
      dorsales: ['101'],
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
      dorsales: ['205', '302'],
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
      dorsales: ['302'],
      sector: 'Sendero de Montaña · Postales',
      edicion: 1,
      timestamp: 1712749800000,
      visible: true,
      aspectClass: 'aspect-[16/10]',
    },
  ],

  quickBibs: ['101', '205', '302'],

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
      time: '08:00 hs',
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
        'Todo corredor deberá portar durante la totalidad del recorrido: mochila o chaleco de hidratación con capacidad mínima de 1 litro, campera rompevientos impermeable con costuras termoselladas, silbato de emergencia náutico o incorporado en la mochila, manta térmica de supervivencia, vaso o eco-taza reutilizable (no se entregan vasos descartables en los puestos de abastecimiento) y número de dorsal visible al frente en todo momento.',
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
};

export function buildWhatsAppUrl(distance = '27K', whatsappNumber = RACE_CONFIG.whatsappNumber) {
  const cleanPhone = String(whatsappNumber || RACE_CONFIG.whatsappNumber).replace(/[^\d]/g, '');
  const message = `Hola! Quiero inscribirme al Reto al Filo - 2da Edición en la distancia de ${distance}`;
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
      ? text.replace(/21K/gi, '27K').replace(/10K/gi, '13K')
      : text;

  const mergeCircuit = (key, legacyKey) => {
    const base = RACE_CONFIG.circuits[key];
    const incoming = override.circuits?.[key];
    const legacy = override.circuits?.[legacyKey];
    if (!incoming) {
      return legacy?.price ? { ...base, price: legacy.price } : base;
    }
    // Sin GPX personalizado, distancia/desnivel/descripción salen siempre del track oficial (Strava)
    const usesOfficialTrack = !incoming.customGpx;
    const incomingStats = Array.isArray(incoming.stats) ? incoming.stats : base.stats;
    return {
      ...base,
      ...incoming,
      id: base.id,
      tabLabel: base.tabLabel,
      distanceLabel: base.distanceLabel,
      elevationGain: usesOfficialTrack ? base.elevationGain : incoming.elevationGain || base.elevationGain,
      description: usesOfficialTrack ? base.description : incoming.description || base.description,
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

  const nextSchedule = Array.isArray(override.schedule)
    ? override.schedule.map((item) => ({
        day: item?.day ?? 'Sábado 10',
        ...item,
        title: normalizeDistanceCopy(item?.title),
        description: normalizeDistanceCopy(item?.description),
      }))
    : RACE_CONFIG.schedule;

  const nextFaqs = Array.isArray(override.faqs)
    ? override.faqs.map((faq) => ({
        ...faq,
        question: normalizeDistanceCopy(faq?.question),
        answer: normalizeDistanceCopy(faq?.answer),
      }))
    : RACE_CONFIG.faqs;

  return {
    ...RACE_CONFIG,
    ...override,
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
  };
}
