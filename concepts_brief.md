# Reto al Filo - 2da Edición (One-Page Landing & Arquitectura Base)

* **Author:** Luciano
* **Date:** 2026-11-13

## Overview

Aplicación web de página única (One-Page Landing) orientada a dispositivos móviles (Mobile First) para la carrera de trail running "Reto al Filo - 2da Edición" (10 de abril de 2027). Construida con Vite, React, Tailwind CSS y `lucide-react`.

Su propósito es informar a los corredores sobre los circuitos diferenciados (`21K Competitivo` y `10K Montaña`), cronograma y reglamento con carga inicial liviana apta para señales móviles débiles en montaña, canalizar inscripciones mediante un flujo directo a WhatsApp con distancia preseleccionada, y proveer una galería fotográfica de la 1ra Edición filtrable por número de dorsal preparada para escalar con Firestore (bajo carga diferida) y Cloudinary.

### 1. Hero Section y Flujo de Conversión (WhatsApp Modal)
* **Composición:** Imagen de fondo a pantalla completa (`100dvh`) con superposición oscura gradual y fondo CSS de respaldo inmediato para garantizar contraste bajo luz solar directa incluso antes de que descargue la imagen externa.
* **Placeholder Unsplash (Hero):** `https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1920&q=80`
* **Contenido:**
  * Título central: `"Reto al Filo - 2da Edición"`
  * Subtítulo: `"Abril 2027"`
  * Contador regresivo dinámico hacia `2027-04-10T08:00:00-03:00` (días, horas, minutos, segundos), acotado con `Math.max(0, target - now)` para nunca mostrar valores negativos tras la largada.
  * Botón CTA principal: `"Quiero Inscribirme"`.
* **Acción de Conversión:** Al tocar `"Quiero Inscribirme"`, se abre un modal accesible (cierre con tecla `Escape`, clic en fondo o botón cerrar) donde el corredor elige su distancia (`"21K"` o `"10K"`, sincronizada por defecto con la pestaña activa del circuito) y presiona el botón que abre `https://wa.me/5491100000000` con el mensaje codificado en URL:
  `"Hola! Quiero inscribirme al Reto al Filo - 2da Edición en la distancia de [21K/10K]"`.

### 2. Circuito y Detalles (Selector de Pestañas 21K vs 10K)
* **Selector de Pestañas (Tabs):** Ubicado arriba del contenedor del circuito con dos opciones interactivas: `"21K Competitivo"` y `"10K Montaña"`.
* **Contenedor Visual de Circuito:** Simula un mapa GPX y su gráfico de altimetría en SVG responsivo que actualiza su curva de elevación y marcadores de hidratación según la pestaña activa:
  * **Pestaña "21K Competitivo":**
    * **Desnivel Positivo:** `+1.150 m` (21K)
    * **Puestos de Hidratación:** `4` (ubicados en `KM 4.5`, `KM 9.5`, `KM 14.0` y `KM 18.0`)
    * **Tiempo de Corte:** `5 hs`
    * **Curva SVG de referencia:** Salida `0K (1.200m)` -> Ascenso `4.5K (1.520m)` -> Filo `9.5K (1.890m)` -> Cumbre `12.5K (2.150m)` -> Descenso `18.0K (1.450m)` -> Meta `21K (1.200m)`.
  * **Pestaña "10K Montaña":**
    * **Desnivel Positivo:** `+480 m` (10K)
    * **Puestos de Hidratación:** `2` (ubicados en `KM 4.0` y `KM 7.5`)
    * **Tiempo de Corte:** `3 hs`
    * **Curva SVG de referencia:** Salida `0K (1.200m)` -> Bosque `4.0K (1.460m)` -> Mirador `5.5K (1.620m)` -> Arroyo `7.5K (1.380m)` -> Meta `10K (1.200m)`.

### 3. Galería "Viví el Reto — Reviví la 1ra Edición"
* **Contexto Temporal:** Encabezado `"Viví el Reto — Reviví la 1ra Edición"` con nota aclaratoria indicando que tras la carrera del 10 de abril de 2027 se habilitarán allí mismo las fotos oficiales de la 2da Edición.
* **Buscador Interactivo y Chips Rápidos:** Input con placeholder `"Buscá tu foto por número de dorsal"` acompañado de píldoras de filtro rápido de 1 toque (`Todos`, `#101`, `#205`, `#302`) y estado vacío explícito cuando un dorsal no arroja coincidencias.
* **Dataset Inicial de Demostración (6 imágenes de Unsplash con badges de dorsal visibles):**
  1. `dorsales: ["101", "205"]` — Sector Cumbre: `https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80`
  2. `dorsales: ["205"]` — Filo Norte: `https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=800&q=80`
  3. `dorsales: ["302"]` — Cruce de Arroyo: `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80`
  4. `dorsales: ["101"]` — Ascenso Bosque: `https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80`
  5. `dorsales: ["205", "302"]` — Bajada Técnica: `https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=800&q=80`
  6. `dorsales: ["302"]` — Llegada Arco: `https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80`

### 4. Info y FAQ
* **Línea de Tiempo Vertical (Cronograma del Día):**
  1. **06:00 hs — Acreditación y entrega de kits:** Control de apto médico, deslinde firmado y entrega de chip/dorsal.
  2. **07:30 hs — Charla Técnica obligatoria:** Estado del sendero, clima en altura, marcación y seguridad.
  3. **08:00 hs — Largada 21K y 10K:** Salida puntual desde el arco principal del predio.
  4. **13:30 hs — Premiación y Tercer Tiempo:** Entrega de premios por categorías y cierre del evento.
* **Acordeón Desplegable de Preguntas Frecuentes (3 ítems):**
  1. **Elementos obligatorios:** Mochila o chaleco de hidratación (mínimo 1 litro), campera rompevientos impermeable, silbato de emergencia, manta térmica, vaso reutilizable (evento eco-friendly) y número de dorsal visible al frente.
  2. **Cómo llegar al predio:** Indicaciones hacia la base del cerro / predio de largada con botón `"Abrir ubicación en Google Maps"` (`https://maps.google.com/?q=-31.9785,-64.5592`).
  3. **Reglamento:** Resumen de tiempos de corte (5 hs para 21K y 3 hs para 10K), prohibición de arrojar residuos en el sendero (descalificación directa) y obligatoriedad de presentar apto médico y deslinde firmado.

## Analysis

Síntesis consolidada de la revisión multi-lente (`egm-design`, `egm-codebase-details`, `egm-zoom-out`, `egm-comprehension`, `egm-implementation-readiness`, `egm-structural`, `egm-inventive-catalyst`):

### 1. Contradicción entre Filtrado por Tecla en Tiempo Real y `array-contains` en Firestore (`egm-design`, `egm-inventive-catalyst`, `egm-codebase-details`)
* **Problema detectado:** En modo demo (6 fotos en memoria), filtrar en cada pulsación de tecla (`"1"` -> `"10"` -> `"101"`) es instantáneo y gratuito. En producción con Firestore, el operador `where("dorsales", "array-contains", inputDorsal)` solo evalúa igualdad exacta de elementos del array (buscar `"10"` no devuelve el dorsal `"101"`). Disparar una consulta a Firestore por cada tecla presionada multiplica por 3 el consumo de lecturas y devuelve falsos vacíos mientras el usuario escribe.Además, si el input está vacío (`""`), una consulta `array-contains` contra Firestore devolvería 0 fotos, dejando la galería vacía al cargar.
* **Resolución propuesta (Patrón de Segmentación + Caché en Memoria):**
  1. Cuando el buscador está vacío, mostrar siempre las 6 fotos destacadas de la 1ra Edición sin consultar Firestore.
  2. En `src/firebase/config.js`, exponer una función unificada `searchPhotosByBib(dorsal, edicion = 1)` que normalice el texto (`dorsal.trim()`), aplique un debounce de `350ms` (o disparo al enviar) antes de consultar Firestore, y guarde los resultados en un `Map` en memoria para no repetir lecturas del mismo dorsal.

### 2. Riesgo de Fuga del Bundle Lazy-Loaded y Re-inicialización de Firebase (`egm-design`, `egm-codebase-details`)
* **Problema detectado:** Si `getFirestoreDb()` importa dinámicamente `firebase/app` y `firebase/firestore`, pero el componente de la galería importa estáticamente `collection`, `query`, `where`, `limit` o `getDocs` desde `'firebase/firestore'`, Vite incluirá igualmente todo el SDK de Firestore (~100 KB gzipped) en el bundle inicial de arranque. Asimismo, llamar a `initializeApp()` en múltiples búsquedas sin memoizar la promesa arroja error de app duplicada.
* **Resolución propuesta:** Encapsular tanto `getFirestoreDb()` (con promesa singleton memoizada y verificación de `import.meta.env.VITE_FIREBASE_API_KEY` y `VITE_FIREBASE_PROJECT_ID`) como la ejecución completa de la consulta dentro de `src/firebase/config.js`. Ningún componente de UI debe importar módulos de `firebase/*`. Si la red de montaña falla al descargar el chunk dinámico o ejecutar la query, `searchPhotosByBib` captura el error y degrada automáticamente al filtro local de demostración informando el estado.

### 3. Colisión de Dorsales entre 1ra Edición (2026) y 2da Edición (2027) (`egm-design`, `egm-implementation-readiness`)
* **Problema detectado:** Los números de dorsal (`"101"`, `"205"`, `"302"`) se reutilizan en todas las ediciones de una carrera. El esquema propuesto `{ cloudinaryUrl, cloudinaryThumb, dorsales, sector, timestamp, visible }` carece de un campo `edicion`. Cuando en abril de 2027 se carguen las fotos de la 2da Edición en la colección `photos`, buscar el dorsal `"101"` mezclará corredores de distintos años.
* **Resolución propuesta:** Incorporar el campo `"edicion": 1` (o `2` en 2027) al esquema del documento en Firestore y al dataset de prueba, documentando el índice compuesto requerido (`visible` ASC, `edicion` ASC, `dorsales` ARRAYS) y la regla de seguridad en servidor (`request.query.limit <= 20`).

### 4. Cuestionamiento YAGNI: Firestore vs. Manifiesto Estático y Redundancia de URLs en Cloudinary (`egm-zoom-out`, `egm-structural`)
* **Objeción minimalista (`egm-zoom-out`):** Una galería post-carrera es de escritura única y lectura masiva; un archivo JSON estático con 2.000 fotos pesa ~15 KB comprimido, menos que el SDK de Firebase. Se mantiene `src/firebase/config.js` porque es un requerimiento explícito del proyecto, pero se simplifica el manejo de Cloudinary mediante un helper `getCloudinaryUrl(urlOrPublicId, { width })` que inyecta automáticamente `/image/upload/f_auto,q_auto,w_${width}/` cuando `cloudinaryThumb` no esté definido manualmente, y se centralizan todos los datos de carrera en un único módulo `src/data/raceConfig.js` para facilitar la transición de 1ra a 2da Edición sin tocar componentes JSX.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * One-Page Mobile First con Vite, React, Tailwind CSS y `lucide-react`.
  * Hero con contador regresivo protegido contra valores negativos y modal accesible de selección de distancia (`21K` / `10K`) conectado a `wa.me/5491100000000`.
  * Pestañas interactivas (`21K Competitivo` y `10K Montaña`) con curvas de altimetría SVG diferenciadas, puestos de hidratación geolocalizados por kilómetro y sincronización de distancia con el modal de inscripción.
  * Galería Masonry de la 1ra Edición con filtro por dorsal, chips rápidos de 1 toque (`#101`, `#205`, `#302`), lightbox de vista previa y capa de datos en `src/firebase/config.js` con lazy loading real (0 bytes de Firebase en el bundle inicial), caché en memoria y fallback ante pérdida de señal.
  * Cronograma de 4 hitos y acordeón FAQ de 3 ítems con datos de trail running en Argentina.
* **Out-of-Scope Non-Goals:**
  * Pasarela de pagos en línea.
  * Panel de administración de carga de fotos o etiquetado OCR.

## Alternatives Weighed

* **Descarga completa de colección vs. `array-contains` con `limit(20)` y caché por dorsal:** Rechazada la descarga completa por costo de lecturas y consumo de datos móviles.
* **Importaciones de `firebase/firestore` en componentes UI vs. Encapsulamiento total en `src/firebase/config.js`:** Rechazado importar primitivas de Firestore en componentes React porque invalida el code-splitting de Vite.
* **Esquema sin partición de año vs. Campo `edicion` en colección `photos`:** Incorporado el campo `edicion` para evitar colisión de dorsales repetidos entre la 1ra y la 2da Edición.

## Key Decisions & Staging for Next Steps

1. Centralizar textos, métricas de 21K/10K, puntos de altimetría SVG y fotos demo en `src/data/raceConfig.js`.
2. Aislar todo el código de Firebase y los helpers de transformación de Cloudinary dentro de `src/firebase/config.js` mediante `import()` dinámico memoizado, debounce de búsqueda y fallback automático al dataset demo.
3. Sincronizar la pestaña activa del circuito (`21K` / `10K`) con la opción preseleccionada en el modal de inscripción por WhatsApp.
