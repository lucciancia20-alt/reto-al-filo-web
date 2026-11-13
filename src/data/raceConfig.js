export const RACE_CONFIG = {
  title: 'Reto al Filo - 2da Edición',
  subtitle: 'Abril 2027',
  targetDateIso: '2027-04-10T08:00:00-03:00',
  whatsappNumber: '5491100000000',
  heroImage:
    'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1920&q=80',
  googleMapsUrl: 'https://maps.google.com/?q=-38.079253,-61.965131',
  locationName: 'Base del Circuito Serrano — Tornquist / Sierra de la Ventana, Buenos Aires',

  circuits: {
    '21K': {
      id: '21K',
      tabLabel: '21K Competitivo',
      distanceLabel: '21K',
      elevationGain: '+1.532 m',
      hydrationCount: 4,
      cutoffTime: '5 hs',
      summaryBadge: 'Exigencia Alta · Terreno Técnico de Cumbre',
      description:
        'Recorrido serrano técnico por los cordones de Tornquist con ascenso hasta los 941 msnm, crestas rocosas y descenso hacia el valle de largada.',
      stats: [
        {
          label: 'Distancia y Desnivel',
          value: '21K · +1.532 m',
          sub: 'Track GPX oficial · Alt. máx 941 msnm',
        },
        {
          label: 'Puestos de Hidratación',
          value: '4 Puestos',
          sub: 'KM 4.5, KM 9.5, KM 14.5 y KM 18.0',
        },
        {
          label: 'Tiempo de Corte',
          value: '5 hs',
          sub: 'Cierre general a las 13:00 hs',
        },
      ],
      hydrationStations: [
        { id: 'pa-21-1', km: 4.5, label: 'PA1 · Quebrada' },
        { id: 'pa-21-2', km: 9.5, label: 'PA2 · Filo' },
        { id: 'pa-21-3', km: 14.5, label: 'PA3 · Valle' },
        { id: 'pa-21-4', km: 18.0, label: 'PA4 · Arroyo' },
      ],
    },
    '10K': {
      id: '10K',
      tabLabel: '10K Montaña',
      distanceLabel: '10K',
      elevationGain: '+666 m',
      hydrationCount: 2,
      cutoffTime: '3 hs',
      summaryBadge: 'Exigencia Media · Ideal Debutantes en Trail',
      description:
        'Trazado ágil y panorámico por senderos de montaña en Tornquist alcanzando los 945 msnm con vistas abiertas del cordón serrano.',
      stats: [
        {
          label: 'Distancia y Desnivel',
          value: '10K · +666 m',
          sub: 'Track GPX oficial · Alt. máx 945 msnm',
        },
        {
          label: 'Puestos de Hidratación',
          value: '2 Puestos',
          sub: 'KM 4.0 y KM 7.6',
        },
        {
          label: 'Tiempo de Corte',
          value: '3 hs',
          sub: 'Cierre general a las 11:00 hs',
        },
      ],
      hydrationStations: [
        { id: 'pa-10-1', km: 4.0, label: 'PA1 · Ascenso' },
        { id: 'pa-10-2', km: 7.6, label: 'PA2 · Cumbre/Filo' },
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
      sector: 'Cumbre El Filo · 941 msnm',
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
        'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=1400&q=85',
      cloudinaryThumb:
        'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80',
      dorsales: ['302'],
      sector: 'Llegada Arco Principal · Meta',
      edicion: 1,
      timestamp: 1712749800000,
      visible: true,
      aspectClass: 'aspect-[16/10]',
    },
  ],

  quickBibs: ['101', '205', '302'],

  schedule: [
    {
      time: '06:00 hs',
      title: 'Acreditación y entrega de kits',
      description:
        'Recepción de certificado médico obligatorio, deslinde firmado, control de elementos obligatorios y entrega de remera oficial + dorsal con chip.',
      tag: 'Carpa Central',
    },
    {
      time: '07:30 hs',
      title: 'Charla Técnica obligatoria',
      description:
        'Reporte meteorológico actualizado en cumbre, estado de los senderos, colores de cintas de marcación y protocolo de seguridad en montaña.',
      tag: 'Arco de Largada',
    },
    {
      time: '08:00 hs',
      title: 'Largada 21K y 10K',
      description:
        'Salida puntual de ambas distancias desde el arco principal del predio hacia el sendero de ascenso.',
      tag: 'Puntual',
    },
    {
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
        'El tiempo máximo de corte es de 5 horas para los 21K (con corte intermedio a las 3 hs de carrera) y 3 horas para los 10K. Está terminantemente prohibido arrojar envoltorios de geles, botellas o cualquier tipo de residuo fuera de los cestos de los puestos de hidratación (penalización con descalificación directa). Es requisito excluyente presentar apto médico vigente (emitido dentro de los últimos 12 meses) y deslinde de responsabilidad firmado al retirar el kit.',
    },
  ],
};

export function buildWhatsAppUrl(distance = '21K', whatsappNumber = RACE_CONFIG.whatsappNumber) {
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

  const mergeCircuit = (key) => {
    const base = RACE_CONFIG.circuits[key];
    const incoming = override.circuits?.[key];
    if (!incoming) return base;
    return {
      ...base,
      ...incoming,
      stats: Array.isArray(incoming.stats) ? incoming.stats : base.stats,
      hydrationStations: Array.isArray(incoming.hydrationStations)
        ? incoming.hydrationStations
        : base.hydrationStations,
      customGpx: incoming.customGpx || null,
    };
  };

  return {
    ...RACE_CONFIG,
    ...override,
    circuits: {
      '21K': mergeCircuit('21K'),
      '10K': mergeCircuit('10K'),
    },
    schedule: Array.isArray(override.schedule) ? override.schedule : RACE_CONFIG.schedule,
    faqs: Array.isArray(override.faqs) ? override.faqs : RACE_CONFIG.faqs,
  };
}
