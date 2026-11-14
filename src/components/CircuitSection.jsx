import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { RACE_CONFIG } from '../data/raceConfig';
import { GPX_TRACKS, interpolatePointAtKm } from '../data/gpxTracks';

function buildElevationSvg(points, totalKm, minAltRaw, maxAltRaw) {
  const width = 800;
  const height = 260;
  const padLeft = 48;
  const padRight = 24;
  const padTop = 34;
  const padBottom = 34;

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
  const height = 320;
  const pad = 34;

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
      sub: currentCircuit.stats?.[2]?.sub || 'Control de paso obligatorio',
    },
  ];

  return (
    <section
      id="circuito"
      className="py-16 sm:py-24 bg-stone-950 border-t border-stone-900 relative"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.25)] px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Compass className="w-3.5 h-3.5" />
            <span>Circuito GPX Oficial y Altimetría Real</span>
          </div>

          <h2 className="mt-3 text-balance font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
            Dominá el Desnivel
          </h2>
          <p className="mt-2.5 max-w-2xl mx-auto text-balance text-sm sm:text-base text-stone-300">
            Trazado GPS real registrado en las sierras de Tornquist. Alterná entre las dos
            distancias para explorar el mapa, la altimetría punto a punto y los puestos de
            abastecimiento.
          </p>
        </div>

        {/* Selector de Pestañas (27K Competitivo vs 13K Montaña) */}
        <div
          role="tablist"
          aria-label="Seleccionar distancia del circuito"
          className="mt-8 flex justify-center"
        >
          <div className="inline-grid grid-cols-2 p-1.5 rounded-2xl bg-stone-900 border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.25)] w-full max-w-md">
            {Object.values(circuits).map((circuit) => {
              const isSelected = circuit.id === activeDistance;
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
                  className={`py-3 px-4 rounded-xl font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  {circuit.tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenedor principal del Circuito GPX + Altimetría */}
        <div className="mt-8 rounded-3xl bg-stone-900/90 border border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.22)] overflow-hidden">
          {/* Barra superior */}
          <div className="px-4 sm:px-6 py-4 bg-stone-950/75 border-b border-orange-500/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <MapIcon className="w-4 h-4" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-white uppercase">
                    Track GPX Real · {currentCircuit.tabLabel}
                  </h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {currentCircuit.summaryBadge}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">{currentCircuit.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {track.gpxDownloadUrl && (
                <a
                  href={track.gpxDownloadUrl}
                  download={`reto-al-filo-${activeDistance.toLowerCase()}.gpx`}
                  className="inline-flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-100 border border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.25)] hover:border-orange-400 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  Descargar .GPX
                </a>
              )}
              <span className="inline-flex items-center gap-1.5 text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1.5 rounded-xl">
                <Droplets className="w-3.5 h-3.5" />
                {stations.length} Puestos PA
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-xl">
                <Navigation className="w-3.5 h-3.5" />
                {currentCircuit.elevationGain} D+
              </span>
            </div>
          </div>

          {/* Grilla 2 columnas: Mapa GPS 2D + Altimetría Real */}
          <div className="p-4 sm:p-6 bg-gradient-to-b from-stone-950/50 to-stone-900">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Columna Izquierda: Recorrido GPS Vectorial */}
              <div className="lg:col-span-5 rounded-2xl bg-stone-950/90 border border-orange-500/80 shadow-[0_0_14px_rgba(249,115,22,0.18)] p-3 sm:p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-display font-bold uppercase tracking-wider text-stone-200 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    Trazado GPS ({String(track.totalKm).replace('.', ',')} km)
                  </span>
                  <span className="font-mono text-[10px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-orange-500/50">
                    N ↑
                  </span>
                </div>

                <svg
                  viewBox={`0 0 ${mapSvg.width} ${mapSvg.height}`}
                  className="w-full h-56 sm:h-64 rounded-xl bg-[radial-gradient(#292524_1px,transparent_1px)] [background-size:16px_16px] bg-stone-950"
                  role="img"
                  aria-label={`Mapa del recorrido GPS para ${currentCircuit.tabLabel}`}
                >
                  {/* Halo de ruta */}
                  <path
                    d={mapSvg.path}
                    fill="none"
                    stroke="#f59e0b"
                    strokeOpacity="0.2"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Trazado GPS principal */}
                  <path
                    d={mapSvg.path}
                    fill="none"
                    stroke="#f59e0b"
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
                          fill="#f59e0b"
                          stroke="#0c0a09"
                          strokeWidth="2"
                        />
                        <text
                          x={peakPos.x}
                          y={peakPos.y - 11}
                          textAnchor="middle"
                          className="fill-amber-300 text-[10px] font-bold"
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

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Largada / Meta
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    Cumbre ({track.maxAlt}m)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                    Hidratación
                  </span>
                </div>
              </div>

              {/* Columna Derecha: Perfil de Altimetría Real SVG */}
              <div className="lg:col-span-7 rounded-2xl bg-stone-950/90 border border-orange-500/80 shadow-[0_0_14px_rgba(249,115,22,0.18)] p-3 sm:p-4 flex flex-col justify-between">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
                  <span className="font-display font-bold uppercase tracking-wider text-stone-200 flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-amber-400" />
                    Perfil de Altimetría Real ({track.minAlt}m – {track.maxAlt}m)
                  </span>
                  <span className="font-mono text-[11px] text-amber-300 bg-stone-900 px-2.5 py-0.5 rounded border border-orange-500/50">
                    {hoverPoint
                      ? `KM ${hoverPoint.km.toFixed(1)} · ${hoverPoint.alt} msnm`
                      : `Pasá el dedo o mouse para ver altitud`}
                  </span>
                </div>

                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${elevationSvg.width} ${elevationSvg.height}`}
                    className="w-full h-56 sm:h-64 select-none touch-pan-y cursor-crosshair"
                    role="img"
                    aria-label={`Gráfico de altimetría real para ${currentCircuit.tabLabel}`}
                    onPointerMove={handleSvgPointerMove}
                    onPointerLeave={() => setHoverPoint(null)}
                  >
                    <defs>
                      <linearGradient id="elevationFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
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
                            stroke="#292524"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                          <text
                            x={elevationSvg.padLeft - 6}
                            y={y + 4}
                            textAnchor="end"
                            className="fill-stone-500 text-[10px] font-mono"
                          >
                            {alt}m
                          </text>
                        </g>
                      );
                    })}

                    {/* Área bajo la curva */}
                    <path d={elevationSvg.areaPath} fill="url(#elevationFill)" />

                    {/* Línea de perfil */}
                    <path
                      d={elevationSvg.linePath}
                      fill="none"
                      stroke="#f59e0b"
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
                          className="fill-stone-400 text-[10px] font-mono"
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
                            stroke="#f59e0b"
                            strokeDasharray="2 3"
                            strokeWidth="1.2"
                            opacity="0.7"
                          />
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r="6"
                            fill="#f59e0b"
                            stroke="#0c0a09"
                            strokeWidth="2"
                          />
                          <text
                            x={pos.x}
                            y={pos.y - 10}
                            textAnchor="middle"
                            className="fill-amber-300 text-[10px] font-bold"
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
                            strokeDasharray="2 3"
                            strokeWidth="1.2"
                            opacity="0.7"
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
                              stroke="#f59e0b"
                              strokeWidth="2.5"
                            />
                          </g>
                        );
                      })()}
                  </svg>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Mín: {track.minAlt} msnm</span>
                  <span>Desnivel positivo acumulado: {currentCircuit.elevationGain}</span>
                  <span>Máx: {track.maxAlt} msnm</span>
                </div>
              </div>
            </div>

            {/* Lista de Puestos de Hidratación + CTA */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-orange-500/30">
              <div className="flex flex-wrap gap-2">
                {stations.map((st) => (
                  <span
                    key={st.id || st.shortCode}
                    className="inline-flex items-center gap-1.5 text-xs bg-stone-950 border border-orange-500/70 text-stone-200 px-3 py-1.5 rounded-xl"
                  >
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    {st.label} (KM {st.km}) · {st.alt}m
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onOpenModalWithDistance(activeDistance)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.3)] font-display font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-all cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                Inscribirme en {activeDistance}
              </button>
            </div>
          </div>
        </div>

        {/* 3 Tarjetas de Estadísticas Minimalistas */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {dynamicStats.map((stat, idx) => {
            const IconComponent = cardIcons[idx] || TrendingUp;
            return (
              <div
                key={stat.label}
                className="rounded-2xl bg-stone-900/75 border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.22)] p-5 sm:p-6 flex items-start gap-4 hover:border-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    {stat.label}
                  </span>
                  <div className="mt-1 font-display text-2xl sm:text-3xl font-black text-white">
                    {stat.value}
                  </div>
                  <p className="mt-1 text-xs text-stone-400">{stat.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
