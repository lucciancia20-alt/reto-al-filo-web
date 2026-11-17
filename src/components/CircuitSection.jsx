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
  const width = 600;
  const height = 200;
  const padLeft = 44;
  const padRight = 18;
  const padTop = 30;
  const padBottom = 22;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minAlt = Math.floor((minAltRaw - 30) / 50) * 50;
  const maxAlt = Math.ceil((maxAltRaw + 55) / 50) * 50;
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
  const padX = 50;
  const padY = 34;

  if (!points || points.length === 0) {
    return { width, height, path: '', mappedPoints: [], project: () => ({ x: 0, y: 0 }) };
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

  const availW = width - padX * 2;
  const availH = height - padY * 2;
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

  const mappedPoints = points.map((pt) => project(pt.lat, pt.lon));

  const path = mappedPoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  return { width, height, path, mappedPoints, project };
}

/**
 * Ubica las etiquetas del mapa GPS en la zona libre más despejada alrededor de cada punto,
 * evitando que se pisen con el trazo naranja, con otros puntos o con los bordes del recuadro.
 */
function placeMapLabels(markers, trackPts, width, height) {
  const placed = [];
  const candidates = [
    { dx: 0, dy: -22, anchor: 'middle' },
    { dx: 0, dy: 22, anchor: 'middle' },
    { dx: -16, dy: 0, anchor: 'end' },
    { dx: 16, dy: 0, anchor: 'start' },
    { dx: -14, dy: -18, anchor: 'end' },
    { dx: 14, dy: -18, anchor: 'start' },
    { dx: -14, dy: 18, anchor: 'end' },
    { dx: 14, dy: 18, anchor: 'start' },
    { dx: 0, dy: -34, anchor: 'middle' },
    { dx: 0, dy: 34, anchor: 'middle' },
    { dx: -28, dy: 0, anchor: 'end' },
    { dx: 28, dy: 0, anchor: 'start' },
    { dx: -24, dy: -26, anchor: 'end' },
    { dx: 24, dy: -26, anchor: 'start' },
    { dx: -24, dy: 26, anchor: 'end' },
    { dx: 24, dy: 26, anchor: 'start' },
    { dx: 32, dy: 36, anchor: 'start' },
    { dx: -32, dy: 36, anchor: 'end' },
    { dx: 32, dy: -36, anchor: 'start' },
    { dx: -32, dy: -36, anchor: 'end' },
    { dx: 0, dy: 46, anchor: 'middle' },
    { dx: 0, dy: -46, anchor: 'middle' },
  ];

  for (const m of markers) {
    const boxW = m.text.length * 6.1 + 14;
    const boxH = 18;
    let best = null;
    let bestScore = -Infinity;

    for (const c of candidates) {
      const rawCx =
        c.anchor === 'middle'
          ? m.x + c.dx
          : c.anchor === 'start'
            ? m.x + c.dx + boxW / 2
            : m.x + c.dx - boxW / 2;
      const cx = Math.min(Math.max(boxW / 2 + 6, rawCx), width - boxW / 2 - 6);
      const cy = Math.min(Math.max(boxH / 2 + 6, m.y + c.dy), height - boxH / 2 - 6);
      const left = cx - boxW / 2;
      const right = cx + boxW / 2;
      const top = cy - boxH / 2;
      const bottom = cy + boxH / 2;

      let score = 0;

      // Distancia mínima al trazado GPS naranja
      let minTrackDist = Infinity;
      for (let i = 0; i < trackPts.length; i += 1) {
        const p = trackPts[i];
        const dx = Math.max(left - p.x, 0, p.x - right);
        const dy = Math.max(top - p.y, 0, p.y - bottom);
        const d = Math.hypot(dx, dy);
        if (d < minTrackDist) minTrackDist = d;
      }
      score += Math.min(minTrackDist, 26) * 16;
      if (minTrackDist < 6) score -= (6 - minTrackDist) * 260;

      // Distancia a todos los círculos marcadores
      for (const other of markers) {
        const dx = Math.max(left - other.x, 0, other.x - right);
        const dy = Math.max(top - other.y, 0, other.y - bottom);
        const d = Math.hypot(dx, dy);
        if (d < 10) score -= (10 - d) * 180;
      }

      // Evitar superposición entre etiquetas ya ubicadas
      for (const pl of placed) {
        const overlapX = Math.max(
          0,
          Math.min(right + 6, pl.right + 6) - Math.max(left - 6, pl.left - 6)
        );
        const overlapY = Math.max(
          0,
          Math.min(bottom + 5, pl.bottom + 5) - Math.max(top - 5, pl.top - 5)
        );
        if (overlapX > 0 && overlapY > 0) {
          score -= 20000 + overlapX * overlapY * 50;
        }
      }

      const leaderDist = Math.hypot(cx - m.x, cy - m.y);
      score -= leaderDist * 1.2;

      if (score > bestScore) {
        bestScore = score;
        best = { ...m, cx, cy, left, right, top, bottom, boxW, boxH };
      }
    }
    placed.push(best);
  }
  return placed;
}

/**
 * Ubica las etiquetas del perfil de altimetría por encima de la curva en espacios despejados,
 * incluyendo separación lateral amplia cuando un puesto PA coincide con la Cumbre (ej. 13K KM 8).
 */
function placeElevationLabels(markers, curvePts, padLeft, width, padRight) {
  const placed = [];
  const candidates = [
    { dx: 0, dy: -22 },
    { dx: -24, dy: -22 },
    { dx: 24, dy: -22 },
    { dx: 0, dy: -36 },
    { dx: -34, dy: -34 },
    { dx: 34, dy: -34 },
    { dx: -56, dy: -20 },
    { dx: 56, dy: -20 },
    { dx: -78, dy: -16 },
    { dx: 78, dy: -16 },
    { dx: -86, dy: -32 },
    { dx: 86, dy: -32 },
    { dx: -44, dy: -44 },
    { dx: 44, dy: -44 },
    { dx: 0, dy: -48 },
    { dx: -105, dy: -22 },
    { dx: 105, dy: -22 },
  ];

  for (const m of markers) {
    const boxW = m.text.length * 5.9 + 12;
    const boxH = 17;
    let best = null;
    let bestScore = -Infinity;

    for (const c of candidates) {
      const cx = Math.min(
        Math.max(padLeft + boxW / 2 + 2, m.x + c.dx),
        width - padRight - boxW / 2 - 2
      );
      const cy = Math.max(boxH / 2 + 3, m.y + c.dy);
      const left = cx - boxW / 2;
      const right = cx + boxW / 2;
      const top = cy - boxH / 2;
      const bottom = cy + boxH / 2;

      let score = 0;

      // Despeje respecto de la curva de montaña en todo el ancho de la pastilla
      let minCurveClearance = Infinity;
      for (const p of curvePts) {
        if (p.x >= left - 6 && p.x <= right + 6) {
          const clearance = p.y - bottom;
          if (clearance < minCurveClearance) minCurveClearance = clearance;
        }
      }
      if (minCurveClearance < 3) {
        score -= (3 - minCurveClearance) * 320;
      } else {
        score += Math.min(minCurveClearance, 22) * 8;
      }

      // Evitar pisar otros puntos marcadores
      for (const other of markers) {
        const dx = Math.max(left - other.x, 0, other.x - right);
        const dy = Math.max(top - other.y, 0, other.y - bottom);
        const d = Math.hypot(dx, dy);
        if (d < 8) score -= (8 - d) * 150;
      }

      // Evitar superposición entre etiquetas
      for (const pl of placed) {
        const overlapX = Math.max(
          0,
          Math.min(right + 6, pl.right + 6) - Math.max(left - 6, pl.left - 6)
        );
        const overlapY = Math.max(
          0,
          Math.min(bottom + 4, pl.bottom + 4) - Math.max(top - 4, pl.top - 4)
        );
        if (overlapX > 0 && overlapY > 0) {
          score -= 25000 + overlapX * overlapY * 60;
        }
      }

      score -= Math.abs(cx - m.x) * 0.5;
      score -= Math.abs(cy - (m.y - 22)) * 0.4;

      if (score > bestScore) {
        bestScore = score;
        best = { ...m, cx, cy, left, right, top, bottom, boxW, boxH };
      }
    }
    placed.push(best);
  }
  return placed;
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

  const peakPoint = useMemo(() => {
    if (!track.points || track.points.length === 0) {
      return { lat: 0, lon: 0, km: 0, alt: 0 };
    }
    let highest = track.points[0];
    for (const pt of track.points) {
      if (pt.alt > highest.alt) highest = pt;
    }
    const byKm = interpolatePointAtKm(track.points, track.peakKm);
    const chosen = highest.alt >= (byKm?.alt || 0) ? highest : byKm;
    return {
      ...chosen,
      alt: Math.max(chosen.alt, track.maxAlt || 0),
    };
  }, [track.points, track.peakKm, track.maxAlt]);

  const startPoint = track.points[0] || { lat: 0, lon: 0, km: 0, alt: 0 };

  const mapLabels = useMemo(() => {
    const startPos = mapSvg.project(startPoint.lat, startPoint.lon);
    const peakPos = mapSvg.project(peakPoint.lat, peakPoint.lon);
    const rawMarkers = [
      {
        id: 'start',
        text: 'Largada/Meta',
        x: startPos.x,
        y: startPos.y,
        dotFill: '#10b981',
        textClass: 'fill-emerald-300 font-bold',
        pillStroke: 'rgba(16, 185, 129, 0.7)',
        r: 6.5,
      },
      {
        id: 'peak',
        text: `Cumbre ${track.maxAlt}m`,
        x: peakPos.x,
        y: peakPos.y,
        dotFill: '#f97316',
        textClass: 'fill-orange-300 font-bold',
        pillStroke: 'rgba(249, 115, 22, 0.75)',
        r: 7.5,
      },
      ...stations.map((st) => {
        const pos = mapSvg.project(st.lat, st.lon);
        const nearPeak = Math.hypot(pos.x - peakPos.x, pos.y - peakPos.y) < 5;
        return {
          id: st.id || st.shortCode,
          text: st.shortCode,
          x: pos.x,
          y: pos.y,
          dotFill: '#0ea5e9',
          textClass: 'fill-sky-300 font-mono font-bold',
          pillStroke: 'rgba(56, 189, 248, 0.75)',
          r: nearPeak ? 4.2 : 6,
        };
      }),
    ];
    return placeMapLabels(rawMarkers, mapSvg.mappedPoints || [], mapSvg.width, mapSvg.height);
  }, [mapSvg, startPoint, peakPoint, track.maxAlt, stations]);

  const elevationLabels = useMemo(() => {
    const peakPos = elevationSvg.toCoords(peakPoint.km, peakPoint.alt);
    const rawMarkers = [
      {
        id: 'peak',
        text: `Cumbre ${peakPoint.alt}m`,
        x: peakPos.x,
        y: peakPos.y,
        dotFill: '#f97316',
        lineStroke: '#f97316',
        textClass: 'fill-orange-300 font-bold',
        pillStroke: 'rgba(249, 115, 22, 0.75)',
        r: 7,
      },
      ...stations.map((st) => {
        const pos = elevationSvg.toCoords(st.km, st.alt);
        const nearPeak = Math.hypot(pos.x - peakPos.x, pos.y - peakPos.y) < 5;
        return {
          id: st.id || st.shortCode,
          text: `${st.shortCode} (${st.km}K)`,
          x: pos.x,
          y: pos.y,
          dotFill: '#38bdf8',
          lineStroke: '#38bdf8',
          textClass: 'fill-sky-300 font-mono font-bold',
          pillStroke: 'rgba(56, 189, 248, 0.75)',
          r: nearPeak ? 4 : 5.5,
        };
      }),
    ];
    return placeElevationLabels(
      rawMarkers,
      elevationSvg.mapped || [],
      elevationSvg.padLeft,
      elevationSvg.width,
      elevationSvg.padRight
    );
  }, [elevationSvg, peakPoint, stations]);

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
      className="scroll-mt-16 pt-6 sm:pt-8 pb-8 sm:pb-10 bg-stone-950 border-t-2 border-orange-500/50 relative"
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
                  ? 'bg-zinc-950 text-red-500 border-2 border-red-500/40 opacity-80 hover:opacity-100 hover:border-red-500'
                  : 'bg-zinc-950 text-cyan-400 border-2 border-cyan-500/40 opacity-80 hover:opacity-100 hover:border-cyan-400';
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
          <div className="px-3.5 sm:px-5 py-2.5 bg-stone-950/75 border-b border-orange-500/40 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
            <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-zinc-950 border border-orange-500/60 text-orange-400 flex items-center justify-center shrink-0">
                <MapIcon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-white uppercase">
                    Track GPX Real · {currentCircuit.tabLabel}
                  </h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-950 border border-orange-500/70 text-orange-400">
                    {currentCircuit.summaryBadge}
                  </span>
                </div>
                <div className="grid mt-0.5">
                  {Object.values(circuits).map((c) => {
                    const isActive = c.id === currentCircuit.id;
                    return (
                      <p
                        key={`desc-${c.id}`}
                        aria-hidden={!isActive}
                        className={`[grid-area:1/1] text-xs leading-relaxed text-stone-400 ${
                          isActive ? '' : 'invisible pointer-events-none select-none'
                        }`}
                      >
                        {c.description}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold shrink-0">
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
                <div className="flex items-center justify-between gap-2 min-h-[26px] text-xs mb-1.5">
                  <span className="font-display font-bold uppercase tracking-wider text-stone-200 flex items-center gap-1.5 truncate">
                    <Compass className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate">
                      Trazado GPS ({String(track.totalKm).replace('.', ',')} km)
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-white font-bold bg-zinc-950/90 px-2 py-0.5 rounded border border-zinc-500/80 shrink-0">
                    N ↑
                  </span>
                </div>

                <div className="flex-1 flex items-center">
                  <svg
                    viewBox={`0 0 ${mapSvg.width} ${mapSvg.height}`}
                    className="w-full h-44 sm:h-48 rounded-xl bg-[radial-gradient(rgba(255,255,255,0.24)_1px,transparent_1px)] [background-size:16px_16px] bg-stone-950"
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

                  {/* Puntos marcadores y etiquetas auto-ubicadas en zonas despejadas */}
                  {mapLabels.map((m) => (
                    <g key={`line-${m.id}`}>
                      <line
                        x1={m.x}
                        y1={m.y}
                        x2={m.cx}
                        y2={m.cy}
                        stroke={m.pillStroke}
                        strokeWidth="1.2"
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx={m.x}
                        cy={m.y}
                        r={m.r}
                        fill={m.dotFill}
                        stroke="#0c0a09"
                        strokeWidth="2"
                      />
                    </g>
                  ))}
                  {mapLabels.map((m) => (
                    <g key={`pill-${m.id}`}>
                      <rect
                        x={m.left}
                        y={m.top}
                        width={m.boxW}
                        height={m.boxH}
                        rx="5"
                        fill="#09090b"
                        fillOpacity="0.92"
                        stroke={m.pillStroke}
                        strokeWidth="1"
                      />
                      <text
                        x={m.cx}
                        y={m.cy + 3.5}
                        textAnchor="middle"
                        className={`text-[10px] ${m.textClass}`}
                      >
                        {m.text}
                      </text>
                    </g>
                  ))}
                  </svg>
                </div>

                <div className="mt-1.5 min-h-[20px] flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] text-stone-400">
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
                <div className="flex items-center justify-between gap-2 min-h-[26px] mb-1.5 text-xs">
                  <span className="font-display font-bold uppercase tracking-wider text-stone-200 flex items-center gap-1.5 truncate">
                    <Mountain className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate">
                      Perfil de Altimetría Real ({track.minAlt}m – {track.maxAlt}m)
                    </span>
                  </span>
                  <span className="font-mono text-[10px] sm:text-[11px] text-orange-400 bg-zinc-950 px-2.5 py-0.5 rounded border border-orange-500/60 whitespace-nowrap shrink-0">
                    {hoverPoint
                      ? `KM ${hoverPoint.km.toFixed(1)} · ${hoverPoint.alt} msnm`
                      : `Pasá el dedo o mouse para ver altitud`}
                  </span>
                </div>

                <div className="w-full flex-1 flex items-center overflow-x-auto">
                  <svg
                    ref={elevationSvgRef}
                    viewBox={`0 0 ${elevationSvg.width} ${elevationSvg.height}`}
                    className="w-full h-44 sm:h-48 rounded-xl bg-stone-950 select-none touch-pan-y cursor-crosshair"
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

                    {/* Cumbre y Puestos de Hidratación con etiquetas auto-ubicadas */}
                    {elevationLabels.map((m) => (
                      <g key={`elev-pt-${m.id}`}>
                        <line
                          x1={m.x}
                          y1={m.y}
                          x2={m.x}
                          y2={elevationSvg.baselineY}
                          stroke={m.lineStroke}
                          strokeDasharray="3 3"
                          strokeWidth="1.4"
                          opacity="0.9"
                        />
                        <line
                          x1={m.x}
                          y1={m.y}
                          x2={m.cx}
                          y2={m.cy}
                          stroke={m.pillStroke}
                          strokeWidth="1.1"
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx={m.x}
                          cy={m.y}
                          r={m.r}
                          fill={m.dotFill}
                          stroke="#0c0a09"
                          strokeWidth="2"
                        />
                      </g>
                    ))}
                    {elevationLabels.map((m) => (
                      <g key={`elev-pill-${m.id}`}>
                        <rect
                          x={m.left}
                          y={m.top}
                          width={m.boxW}
                          height={m.boxH}
                          rx="5"
                          fill="#09090b"
                          fillOpacity="0.92"
                          stroke={m.pillStroke}
                          strokeWidth="1"
                        />
                        <text
                          x={m.cx}
                          y={m.cy + 3.5}
                          textAnchor="middle"
                          className={`text-[10px] ${m.textClass}`}
                        >
                          {m.text}
                        </text>
                      </g>
                    ))}

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

                <div className="mt-1.5 min-h-[20px] flex items-center justify-between text-[10px] sm:text-[11px] text-stone-400">
                  <span>Mín: {track.minAlt} msnm</span>
                  <span>Desnivel positivo acumulado: {currentCircuit.elevationGain}</span>
                  <span>Máx: {track.maxAlt} msnm</span>
                </div>
              </div>
            </div>

            {/* Lista de Puestos de Hidratación */}
            <div className="mt-2.5 min-h-[34px] flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-orange-500/30">
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
