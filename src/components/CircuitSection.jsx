import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  Droplets,
  Clock,
  TrendingUp,
  Map as MapIcon,
  Flame,
  Navigation,
  Download,
  Mountain,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react';
import { RACE_CONFIG, computeClosingTime, getStartTime } from '../data/raceConfig';
import { GPX_TRACKS, interpolatePointAtKm } from '../data/gpxTracks';

function buildElevationSvg(points, totalKm, minAltRaw, maxAltRaw) {
  const width = 800;
  const height = 210;
  const padLeft = 48;
  const padRight = 24;
  const padTop = 26;
  const padBottom = 26;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minAlt = Math.floor((minAltRaw - 30) / 50) * 50;
  const maxAlt = Math.ceil((maxAltRaw + 40) / 50) * 50;
  const altSpan = Math.max(100, maxAlt - minAlt);
  const safeMaxKm = Math.max(1, totalKm || points[points.length - 1]?.km || 1);

  const toCoords = (km, alt) => ({
    x: padLeft + (Math.min(Math.max(0, km), safeMaxKm) / safeMaxKm) * plotW,
    y: padTop + plotH - ((alt - minAlt) / altSpan) * plotH,
  });

  const mapped = points.map((pt) => {
    const { x, y } = toCoords(pt.km, pt.alt);
    return { ...pt, x, y };
  });

  const linePath = mapped
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const first = mapped[0];
  const last = mapped[mapped.length - 1];
  const baselineY = padTop + plotH;
  const areaPath =
    mapped.length > 0
      ? `${linePath} L ${last.x.toFixed(1)} ${baselineY} L ${first.x.toFixed(1)} ${baselineY} Z`
      : '';

  const gridAlts = [0, 0.33, 0.66, 1].map((ratio) =>
    Math.round(minAlt + altSpan * ratio)
  );

  return {
    width,
    height,
    padLeft,
    padRight,
    padTop,
    plotW,
    plotH,
    baselineY,
    minAlt,
    maxAlt,
    safeMaxKm,
    mapped,
    linePath,
    areaPath,
    gridAlts,
    toCoords,
  };
}

function buildGpsMapSvg(points) {
  const width = 460;
  const height = 240;
  const pad = 26;

  if (!points || points.length === 0) {
    return { width, height, path: '', project: () => ({ x: 0, y: 0 }) };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const pt of points) {
    if (pt.lat < minLat) minLat = pt.lat;
    if (pt.lat > maxLat) maxLat = pt.lat;
    if (pt.lon < minLon) minLon = pt.lon;
    if (pt.lon > maxLon) maxLon = pt.lon;
  }

  const midLatRad = (((minLat + maxLat) / 2) * Math.PI) / 180;
  const lonScale = Math.cos(midLatRad);

  const dLat = Math.max(0.0005, maxLat - minLat);
  const dLonScaled = Math.max(0.0005, (maxLon - minLon) * lonScale);

  const availW = width - pad * 2;
  const availH = height - pad * 2;
  const scale = Math.min(availW / dLonScaled, availH / dLat);

  const contentW = dLonScaled * scale;
  const contentH = dLat * scale;
  const offsetX = (width - contentW) / 2;
  const offsetY = (height - contentH) / 2;

  const project = (lat, lon) => {
    const x = offsetX + (lon - minLon) * lonScale * scale;
    const y = offsetY + (maxLat - lat) * scale;
    return { x, y };
  };

  const path = points
    .map((pt, idx) => {
      const { x, y } = project(pt.lat, pt.lon);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return { width, height, path, project };
}

export default function CircuitSection({
  raceConfig = RACE_CONFIG,
  activeDistance,
  onSelectDistance,
  onOpenModalWithDistance,
}) {
  const [hoverPoint, setHoverPoint] = useState(null);
  const elevationSvgRef = useRef(null);

  useEffect(() => {
    setHoverPoint(null);
  }, [activeDistance]);

  useEffect(() => {
    if (!hoverPoint) return undefined;
    const handleOutsidePointerDown = (event) => {
      if (elevationSvgRef.current && !elevationSvgRef.current.contains(event.target)) {
        setHoverPoint(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [hoverPoint]);

  const circuits = raceConfig?.circuits || RACE_CONFIG.circuits;
  const currentCircuit = circuits[activeDistance] || circuits['27K'];
  const track = currentCircuit.customGpx || GPX_TRACKS[activeDistance] || GPX_TRACKS['27K'];

  const stations = useMemo(() => {
    const list = Array.isArray(currentCircuit.hydrationStations)
      ? currentCircuit.hydrationStations
      : [];
    return list.map((st, index) => {
      const interp = interpolatePointAtKm(track.points, st.km);
      return {
        ...st,
        shortCode: `PA${index + 1}`,
        km: interp.km,
        alt: interp.alt,
        lat: interp.lat,
        lon: interp.lon,
      };
    });
  }, [currentCircuit.hydrationStations, track.points]);

  const elevationSvg = useMemo(
    () => buildElevationSvg(track.points, track.totalKm, track.minAlt, track.maxAlt),
    [track.points, track.totalKm, track.minAlt, track.maxAlt]
  );

  const mapSvg = useMemo(() => buildGpsMapSvg(track.points), [track.points]);

  const peakPoint = useMemo(
    () => interpolatePointAtKm(track.points, track.peakKm),
    [track.points, track.peakKm]
  );

  const startPoint = track.points[0] || { lat: 0, lon: 0, km: 0, alt: 0 };

  const handleSvgPointerMove = (e) => {
    const svgEl = e.currentTarget;
    const rect = svgEl.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * elevationSvg.width;
    const clampedKm =
      ((relX - elevationSvg.padLeft) / elevationSvg.plotW) * elevationSvg.safeMaxKm;

    if (clampedKm < 0 || clampedKm > elevationSvg.safeMaxKm) {
      setHoverPoint(null);
      return;
    }

    let nearest = track.points[0];
    let bestDiff = Infinity;
    for (const pt of track.points) {
      const diff = Math.abs(pt.km - clampedKm);
      if (diff < bestDiff) {
        bestDiff = diff;
        nearest = pt;
      }
    }
    setHoverPoint(nearest);
  };

  const cardIcons = [TrendingUp, Droplets, Clock];

  const startTime = getStartTime(raceConfig?.schedule, raceConfig?.targetDateIso);
  const closingTime = computeClosingTime(startTime, currentCircuit.cutoffTime);

  const dynamicStats = [
    {
      label: 'Distancia y Desnivel',
      value: `${currentCircuit.distanceLabel} · ${currentCircuit.elevationGain}`,
      sub: `${String(track.totalKm).replace('.', ',')} km reales · Alt. máx ${track.maxAlt} msnm`,
    },
    {
      label: 'Puestos de Hidratación',
      value: `${stations.length} ${stations.length === 1 ? 'Puesto' : 'Puestos'}`,
      sub:
        stations.length > 0
          ? stations.map((s) => `KM ${s.km}`).join(' · ')
          : 'Sin puestos asignados',
    },
    {
      label: 'Tiempo de Corte',
      value: currentCircuit.cutoffTime,
      sub: closingTime
        ? `Cierre general a las ${closingTime}`
        : currentCircuit.stats?.[2]?.sub || 'Control de paso obligatorio',
    },
  ];

  return (
    <section
      id="circuito"
      className="scroll-mt-16 min-h-[calc(100dvh-4rem)] pt-6 sm:pt-8 pb-8 sm:pb-10 bg-stone-950 border-t-2 border-orange-500/50 relative flex flex-col justify-center"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-950 border border-orange-500/70 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-orange-400">
            <Compass className="w-3.5 h-3.5" />
            <span>Circuito GPX Oficial y Altimetría Real</span>
          </div>

          <h2 className="mt-1.5 text-balance font-display text-3xl md:text-4xl font-black text-white uppercase tracking-tight section-title-stroke">
            Dominá el Desnivel
          </h2>
          <p className="mt-1 max-w-2xl mx-auto text-balance text-xs sm:text-sm text-stone-300">
            Trazado GPS real registrado en las sierras de Tornquist. Alterná entre las dos
            distancias para explorar el mapa, la altimetría punto a punto y los puestos de
            abastecimiento.
          </p>
        </div>

        {/* Selector de Pestañas (27K Competitivo vs 13K Competitivo) */}
        <div
          role="tablist"
          aria-label="Seleccionar distancia del circuito"
          className="mt-3 flex justify-center"
        >
          <div className="inline-grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-zinc-950 border border-orange-500 w-full max-w-md">
            {Object.values(circuits).map((circuit) => {
              const isSelected = circuit.id === activeDistance;
              const is13K = circuit.id === '13K';
              const tabColorClass = isSelected
                ? is13K
                  ? 'bg-zinc-950 text-red-500 border-2 border-red-500'
                  : 'bg-zinc-950 text-cyan-400 border-2 border-cyan-400'
                : is13K
                  ? 'bg-zinc-950 text-red-500 border border-red-500/50 opacity-80 hover:opacity-100 hover:border-red-500'
                  : 'bg-zinc-950 text-cyan-400 border border-cyan-500/50 opacity-80 hover:opacity-100 hover:border-cyan-400';
              return (
                <button
                  key={circuit.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setHoverPoint(null);
                    onSelectDistance(circuit.id);
                  }}
                  className={`py-1.5 px-3.5 rounded-xl font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer ${tabColorClass}`}
                >
                  {circuit.tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenedor principal del Circuito GPX + Altimetría */}
        <div className="mt-3 rounded-3xl bg-zinc-950 border border-orange-500 overflow-hidden">
          {/* Barra superior */}
          <div className="px-3.5 sm:px-5 py-2 bg-stone-950/75 border-b border-orange-500/40 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-zinc-950 border border-orange-500/60 text-orange-400 flex items-center justify-center shrink-0">
                <MapIcon className="w-4 h-4" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-white uppercase">
                    Track GPX Real · {currentCircuit.tabLabel}
                  </h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-950 border border-orange-500/70 text-orange-400">
                    {currentCircuit.summaryBadge}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-stone-400 mt-0.5 min-h-[60px]">
                  {currentCircuit.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {track.gpxDownloadUrl && (
                <a
                  href={track.gpxDownloadUrl}
                  download={`reto-al-filo-${activeDistance.toLowerCase()}.gpx`}
                  className="inline-flex items-center gap-1.5 bg-zinc-950 hover:bg-stone-900 text-orange-400 border border-orange-500/70 hover:border-orange-400 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-orange-400" />
                  Descargar .GPX
                </a>
              )}
              <span
                className={`inline-flex items-center gap-1.5 bg-zinc-950 border px-2.5 py-1.5 rounded-xl ${
                  activeDistance === '13K'
                    ? 'border-red-500/60 text-red-500'
                    : 'border-cyan-500/60 text-cyan-400'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
                {stations.length} Puestos PA
              </span>
              <span className="inline-flex items-center gap-1.5 bg-zinc-950 border border-orange-500/60 text-orange-400 px-2.5 py-1.5 rounded-xl">
                <Navigation className="w-3.5 h-3.5" />
                {currentCircuit.elevationGain} D+
              </span>
            </div>
          </div>

          {/* Grilla 2 columnas: Mapa GPS 2D + Altimetría Real */}
          <div className="p-2.5 sm:p-3.5 bg-gradient-to-b from-stone-950/50 to-stone-900">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
              {/* Columna Izquierda: Recorrido GPS Vectorial */}
              <div className="lg:col-span-5 rounded-2xl bg-stone-950/90 border border-orange-500/80 p-2.5 sm:p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-display font-bold uppercase tracking-wider text-stone-200 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-orange-400" />
                    Trazado GPS ({String(track.totalKm).replace('.', ',')} km)
                  </span>
                  <span className="font-mono text-[10px] text-white font-bold bg-zinc-950/90 px-2 py-0.5 rounded border border-zinc-500/80">
                    N ↑
                  </span>
                </div>

                <svg
                  viewBox={`0 0 ${mapSvg.width} ${mapSvg.height}`}
                  className="w-full h-36 sm:h-44 max-h-44 rounded-xl bg-[radial-gradient(rgba(255,255,255,0.24)_1px,transparent_1px)] [background-size:16px_16px] bg-stone-950"
                  role="img"
                  aria-label={`Mapa del recorrido GPS para ${currentCircuit.tabLabel}`}
                >
                  {/* Halo de ruta */}
                  <path
                    d={mapSvg.path}
                    fill="none"
                    stroke="#f97316"
                    strokeOpacity="0.2"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Trazado GPS principal */}
                  <path
                    d={mapSvg.path}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Marcadores de puestos de hidratación sobre coordenadas GPS reales */}
                  {stations.map((st) => {
                    const pos = mapSvg.project(st.lat, st.lon);
                    return (
                      <g key={st.id || st.shortCode}>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="7"
                          fill="#0ea5e9"
                          stroke="#0c0a09"
                          strokeWidth="2"
                        />
                        <text
                          x={pos.x}
                          y={pos.y - 11}
                          textAnchor="middle"
                          className="fill-sky-300 text-[10px] font-mono font-bold"
                        >
                          {st.shortCode}
                        </text>
                      </g>
                    );
                  })}

                  {/* Marcador de Cumbre */}
                  {(() => {
                    const peakPos = mapSvg.project(peakPoint.lat, peakPoint.lon);
                    return (
                      <g>
                        <circle
                          cx={peakPos.x}
                          cy={peakPos.y}
                          r="7"
                          fill="#f97316"
                          stroke="#0c0a09"
                          strokeWidth="2"
                        />
                        <text
                          x={peakPos.x}
                          y={peakPos.y - 11}
                          textAnchor="middle"
                          className="fill-orange-400 text-[10px] font-bold"
                        >
                          Cumbre {track.maxAlt}m
                        </text>
                      </g>
                    );
                  })()}

                  {/* Largada / Meta */}
                  {(() => {
                    const startPos = mapSvg.project(startPoint.lat, startPoint.lon);
                    return (
                      <g>
                        <circle
                          cx={startPos.x}
                          cy={startPos.y}
                          r="7"
                          fill="#10b981"
                          stroke="#0c0a09"
                          strokeWidth="2"
                        />
                        <text
                          x={startPos.x}
                          y={startPos.y + 18}
                          textAnchor="middle"
                          className="fill-emerald-400 text-[10px] font-bold"
                        >
                          Largada/Meta
                        </text>
                      </g>
                    );
                  })()}
                </svg>

                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] text-stone-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Largada / Meta
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-orange-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                    Cumbre ({track.maxAlt}m)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                    Hidratación
                  </span>
                </div>
              </div>

              {/* Columna Derecha: Perfil de Altimetría Real SVG */}
              <div className="lg:col-span-7 rounded-2xl bg-stone-950/90 border border-orange-500/80 p-2.5 sm:p-3 flex flex-col justify-between">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-xs">
                  <span className="font-display font-bold uppercase tracking-wider text-stone-200 flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-orange-400" />
                    Perfil de Altimetría Real ({track.minAlt}m – {track.maxAlt}m)
                  </span>
                  <span className="font-mono text-[11px] text-orange-400 bg-zinc-950 px-2.5 py-0.5 rounded border border-orange-500/60">
                    {hoverPoint
                      ? `KM ${hoverPoint.km.toFixed(1)} · ${hoverPoint.alt} msnm`
                      : `Pasá el dedo o mouse para ver altitud`}
                  </span>
                </div>

                <div className="w-full overflow-x-auto">
                  <svg
                    ref={elevationSvgRef}
                    viewBox={`0 0 ${elevationSvg.width} ${elevationSvg.height}`}
                    className="w-full h-36 sm:h-44 max-h-44 select-none touch-pan-y cursor-crosshair"
                    role="img"
                    aria-label={`Gráfico de altimetría real para ${currentCircuit.tabLabel}`}
                    onPointerDown={handleSvgPointerMove}
                    onPointerMove={handleSvgPointerMove}
                    onPointerLeave={(e) => {
                      if (e.pointerType === 'mouse') {
                        setHoverPoint(null);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="elevationFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    {/* Líneas guía horizontales */}
                    {elevationSvg.gridAlts.map((alt) => {
                      const { y } = elevationSvg.toCoords(0, alt);
                      return (
                        <g key={alt}>
                          <line
                            x1={elevationSvg.padLeft}
                            y1={y}
                            x2={elevationSvg.width - elevationSvg.padRight}
                            y2={y}
                            stroke="#a1a1aa"
                            strokeOpacity="0.42"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                          <text
                            x={elevationSvg.padLeft - 6}
                            y={y + 4}
                            textAnchor="end"
                            className="fill-zinc-100 text-[11px] font-mono font-semibold [paint-order:stroke] stroke-stone-950 stroke-[3px]"
                          >
                            {alt}m
                          </text>
                        </g>
                      );
                    })}

                    {/* Líneas guía verticales de kilometraje */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const kmTick = Number((elevationSvg.safeMaxKm * ratio).toFixed(1));
                      const { x } = elevationSvg.toCoords(kmTick, elevationSvg.minAlt);
                      return (
                        <line
                          key={`vgrid-${ratio}`}
                          x1={x}
                          y1={elevationSvg.padTop}
                          x2={x}
                          y2={elevationSvg.baselineY}
                          stroke="#a1a1aa"
                          strokeOpacity="0.32"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Área bajo la curva */}
                    <path d={elevationSvg.areaPath} fill="url(#elevationFill)" />

                    {/* Línea de perfil */}
                    <path
                      d={elevationSvg.linePath}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Etiquetas del eje X */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const kmTick = Number((elevationSvg.safeMaxKm * ratio).toFixed(1));
                      const { x } = elevationSvg.toCoords(kmTick, elevationSvg.minAlt);
                      return (
                        <text
                          key={ratio}
                          x={x}
                          y={elevationSvg.baselineY + 18}
                          textAnchor="middle"
                          className="fill-zinc-100 text-[11px] font-mono font-semibold [paint-order:stroke] stroke-stone-950 stroke-[3px]"
                        >
                          {kmTick}K
                        </text>
                      );
                    })}

                    {/* Cumbre */}
                    {(() => {
                      const pos = elevationSvg.toCoords(peakPoint.km, peakPoint.alt);
                      return (
                        <g>
                          <line
                            x1={pos.x}
                            y1={pos.y}
                            x2={pos.x}
                            y2={elevationSvg.baselineY}
                            stroke="#f97316"
                            strokeDasharray="3 3"
                            strokeWidth="1.4"
                            opacity="0.9"
                          />
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r="6"
                            fill="#f97316"
                            stroke="#0c0a09"
                            strokeWidth="2"
                          />
                          <text
                            x={pos.x}
                            y={pos.y - 10}
                            textAnchor="middle"
                            className="fill-orange-400 text-[10px] font-bold"
                          >
                            Cumbre {peakPoint.alt}m
                          </text>
                        </g>
                      );
                    })()}

                    {/* Puestos de Hidratación posicionados automáticamente por KM */}
                    {stations.map((st) => {
                      const pos = elevationSvg.toCoords(st.km, st.alt);
                      return (
                        <g key={st.id || st.shortCode}>
                          <line
                            x1={pos.x}
                            y1={pos.y}
                            x2={pos.x}
                            y2={elevationSvg.baselineY}
                            stroke="#38bdf8"
                            strokeDasharray="3 3"
                            strokeWidth="1.4"
                            opacity="0.9"
                          />
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r="5.5"
                            fill="#38bdf8"
                            stroke="#0c0a09"
                            strokeWidth="2"
                          />
                          <text
                            x={pos.x}
                            y={pos.y - 10}
                            textAnchor="middle"
                            className="fill-sky-300 text-[10px] font-mono font-bold"
                          >
                            {st.shortCode} ({st.km}K)
                          </text>
                        </g>
                      );
                    })}

                    {/* Cursor interactivo */}
                    {hoverPoint &&
                      (() => {
                        const hp = elevationSvg.toCoords(hoverPoint.km, hoverPoint.alt);
                        return (
                          <g>
                            <line
                              x1={hp.x}
                              y1={elevationSvg.padTop}
                              x2={hp.x}
                              y2={elevationSvg.baselineY}
                              stroke="#ffffff"
                              strokeOpacity="0.4"
                              strokeWidth="1"
                            />
                            <circle
                              cx={hp.x}
                              cy={hp.y}
                              r="5"
                              fill="#ffffff"
                              stroke="#f97316"
                              strokeWidth="2.5"
                            />
                          </g>
                        );
                      })()}
                  </svg>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px] text-stone-400">
                  <span>Mín: {track.minAlt} msnm</span>
                  <span>Desnivel positivo acumulado: {currentCircuit.elevationGain}</span>
                  <span>Máx: {track.maxAlt} msnm</span>
                </div>
              </div>
            </div>

            {/* Lista de Puestos de Hidratación */}
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-orange-500/30">
              <div className="flex flex-wrap gap-1.5">
                {stations.map((st) => (
                  <span
                    key={st.id || st.shortCode}
                    className="inline-flex items-center gap-1.5 text-[11px] bg-stone-950 border border-orange-500/70 text-stone-200 px-2.5 py-1 rounded-xl"
                  >
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    {st.label} (KM {st.km}) · {st.alt}m
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Tarjetas de Estadísticas Minimalistas */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {dynamicStats.map((stat, idx) => {
            const IconComponent = cardIcons[idx] || TrendingUp;
            return (
              <div
                key={stat.label}
                className="rounded-2xl bg-zinc-950 border border-orange-500 px-3.5 py-2.5 flex items-center gap-3 hover:border-orange-400 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-orange-500/60 text-orange-400 flex items-center justify-center shrink-0">
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    {stat.label}
                  </span>
                  <div className="mt-0.5 font-display text-lg sm:text-xl font-black leading-tight text-white">
                    {stat.value}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-stone-400">{stat.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ¿Qué incluye tu inscripción? (Kit del Corredor + Cobertura) */}
        {(() => {
          const kitItems = (
            Array.isArray(raceConfig?.kitIncludes)
              ? raceConfig.kitIncludes
              : RACE_CONFIG.kitIncludes
          ).filter((item) => String(item || '').trim());

          if (kitItems.length === 0) return null;

          return (
            <div className="mt-4 rounded-2xl bg-zinc-950 border border-orange-500/80 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-orange-500/25">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-zinc-950 border border-orange-500/60 text-orange-400 flex items-center justify-center shrink-0">
                    <PackageCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-400">
                      Kit del Corredor y Cobertura Oficial
                    </span>
                    <h3 className="font-display text-base sm:text-lg font-black text-white uppercase leading-tight">
                      ¿Qué incluye tu inscripción?
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenModalWithDistance(activeDistance)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-950 border border-orange-500/90 ring-1 ring-orange-500/70 ring-offset-2 ring-offset-zinc-950 active:scale-[0.99] text-orange-400 font-display font-semibold text-xs uppercase tracking-wider px-4 py-2 transition-all cursor-pointer shrink-0"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>
                    Inscribirme · {activeDistance} ({currentCircuit.price})
                  </span>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {kitItems.map((item, idx) => (
                  <div
                    key={`kit-item-${idx}`}
                    className="flex items-start gap-2 rounded-xl bg-zinc-950 border border-orange-500/70 px-3 py-2 text-xs text-white leading-snug"
                  >
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
