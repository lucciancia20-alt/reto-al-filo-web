export const RACE_CONFIG = {
  title: 'Reto al Filo - 2da Edición',
  subtitle: 'Abril 2027',
  targetDateIso: '2027-04-10T08:00:00-03:00',
  whatsappNumber: '5491100000000',
  heroImage:
    'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1920&q=80',
  googleMapsUrl: 'https://maps.google.com/?q=-31.9785,-64.5592',
  locationName: 'Reserva Natural Base del Cerro — Villa Yacanto, Córdoba',

  circuits: {
    '21K': {
      id: '21K',
      tabLabel: '21K Competitivo',
      distanceLabel: '21K',
      elevationGain: '+1.150 m',
      hydrationCount: 4,
      cutoffTime: '5 hs',
      summaryBadge: 'Exigencia Alta · Terreno Técnico de Cumbre',
      description:
        'Ascenso sostenido por sendero de bosque nativo hasta el filo rocoso a 2.150 msnm, con crestas técnicas y descenso rápido hacia el valle.',
      stats: [
        { label: 'Distancia y Desnivel', value: '21K · +1.150 m', sub: 'Terreno técnico de alta montaña' },
        { label: 'Puestos de Hidratación', value: '4 Puestos', sub: 'KM 4.5, KM 9.5, KM 14.0 y KM 18.0' },
        { label: 'Tiempo de Corte', value: '5 hs', sub: 'Cierre general a las 13:00 hs' },
      ],
      waypoints: [
        { km: 0, alt: 1200, label: 'Largada (1.200m)' },
        { km: 2.5, alt: 1360 },
        { km: 4.5, alt: 1520, hydration: true, label: 'PA1 · Bosque (KM 4.5)' },
        { km: 7.0, alt: 1710 },
        { km: 9.5, alt: 1890, hydration: true, label: 'PA2 · Filo Norte (KM 9.5)' },
        { km: 12.5, alt: 2150, peak: true, label: 'Cumbre El Filo (2.150m)' },
        { km: 14.0, alt: 1920, hydration: true, label: 'PA3 · Collado (KM 14.0)' },
        { km: 16.2, alt: 1640 },
        { km: 18.0, alt: 1450, hydration: true, label: 'PA4 · Arroyo (KM 18.0)' },
        { km: 21.0, alt: 1200, label: 'Meta (21K)' },
      ],
    },
    '10K': {
      id: '10K',
      tabLabel: '10K Montaña',
      distanceLabel: '10K',
      elevationGain: '+480 m',
      hydrationCount: 2,
      cutoffTime: '3 hs',
      summaryBadge: 'Exigencia Media · Ideal Debutantes en Trail',
      description:
        'Recorrido ágil y panorámico por senderos de montaña, cruzando arroyos serranos y alcanzando el Mirador del Filo a 1.620 msnm.',
      stats: [
        { label: 'Distancia y Desnivel', value: '10K · +480 m', sub: 'Sendero serrano y huella ancha' },
        { label: 'Puestos de Hidratación', value: '2 Puestos', sub: 'KM 4.0 y KM 7.5' },
        { label: 'Tiempo de Corte', value: '3 hs', sub: 'Cierre general a las 11:00 hs' },
      ],
      waypoints: [
        { km: 0, alt: 1200, label: 'Largada (1.200m)' },
        { km: 2.0, alt: 1330 },
        { km: 4.0, alt: 1460, hydration: true, label: 'PA1 · Quebrada (KM 4.0)' },
        { km: 5.5, alt: 1620, peak: true, label: 'Mirador del Filo (1.620m)' },
        { km: 7.5, alt: 1380, hydration: true, label: 'PA2 · Vado del Río (KM 7.5)' },
        { km: 10.0, alt: 1200, label: 'Meta (10K)' },
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
      sector: 'Cumbre El Filo · 2.150 msnm',
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
      sector: 'Ascenso Bosque Nativo · KM 4.5',
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
      sector: 'Bajada Técnica del Collado · KM 14',
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
        'El predio de largada y llegada se encuentra en la Reserva Natural Base del Cerro (Villa Yacanto, Córdoba). El acceso vehicular está señalizado desde el ingreso principal por ripio consolidado apto para todo tipo de vehículos, con sector de estacionamiento gratuito a 150 metros del arco de largada.',
      hasMapButton: true,
    },
    {
      id: 'reglamento',
      question: 'Reglamento',
      answer:
        'El tiempo máximo de corte es de 5 horas para los 21K (con corte intermedio en Cumbre a las 3 hs de carrera) y 3 horas para los 10K. Está terminantemente prohibido arrojar envoltorios de geles, botellas o cualquier tipo de residuo fuera de los cestos de los puestos de hidratación (penalización con descalificación directa). Es requisito excluyente presentar apto médico vigente (emitido dentro de los últimos 12 meses) y deslinde de responsabilidad firmado al retirar el kit.',
    },
  ],
};

export function buildWhatsAppUrl(distance = '21K') {
  const message = `Hola! Quiero inscribirme al Reto al Filo - 2da Edición en la distancia de ${distance}`;
  return `https://wa.me/${RACE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
