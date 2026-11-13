import React from 'react';
import {
  Compass,
  Droplets,
  Clock,
  TrendingUp,
  Map,
  Flame,
  Navigation,
} from 'lucide-react';
import { RACE_CONFIG } from '../data/raceConfig';

function buildElevationSvgPaths(waypoints, maxKm, minAlt = 1100, maxAlt = 2250) {
  const width = 800;
  const height = 250;
  const padLeft = 42;
  const padRight = 24;
  const padTop = 28;
  const padBottom = 34;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const points = waypoints.map((wp) => {
    const x = padLeft + (wp.km / maxKm) * plotW;
    const y = padTop + plotH - ((wp.alt - minAlt) / (maxAlt - minAlt)) * plotH;
    return { ...wp, x, y };
  });

  const linePath = points
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const first = points[0];
  const last = points[points.length - 1];
  const baselineY = padTop + plotH;
  const areaPath = `${linePath} L ${last.x.toFixed(1)} ${baselineY} L ${first.x.toFixed(1)} ${baselineY} Z`;

  return { points, linePath, areaPath, width, height, baselineY, padLeft, padRight };
}

export default function CircuitSection({
  activeDistance,
  onSelectDistance,
  onOpenModalWithDistance,
}) {
  const currentCircuit = RACE_CONFIG.circuits[activeDistance] || RACE_CONFIG.circuits['21K'];
  const maxKm = activeDistance === '21K' ? 21 : 10;
  const svgData = buildElevationSvgPaths(currentCircuit.waypoints, maxKm);

  const cardIcons = [TrendingUp, Droplets, Clock];

  return (
    <section
      id="circuito"
      className="py-16 sm:py-24 bg-stone-950 border-t border-stone-900 relative"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Encabezado de sección */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Compass className="w-3.5 h-3.5" />
            <span>Circuito y Detalles Técnicos</span>
          </div>

          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Dominá el Desnivel
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-stone-300">
            Alterná entre las dos distancias oficiales para explorar el trazado GPX simulado, la
            curva de altimetría y la ubicación exacta de los puestos de hidratación.
          </p>
        </div>

        {/* Selector de Pestañas (Tabs: 21K Competitivo vs 10K Montaña) */}
        <div
          role="tablist"
          aria-label="Seleccionar distancia del circuito"
          className="mt-8 flex justify-center"
        >
          <div className="inline-grid grid-cols-2 p-1.5 rounded-2xl bg-stone-900 border border-stone-800 w-full max-w-md">
            {Object.values(RACE_CONFIG.circuits).map((circuit) => {
              const isSelected = circuit.id === activeDistance;
              return (
                <button
                  key={circuit.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectDistance(circuit.id)}
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

        {/* Contenedor visual del Mapa GPX interactivo + Altimetría */}
        <div className="mt-8 rounded-3xl bg-stone-900/90 border border-stone-800 overflow-hidden shadow-2xl">
          {/* Barra superior del visor GPX */}
          <div className="px-4 sm:px-6 py-4 bg-stone-950/70 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <Map className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-white uppercase">
                    Track GPX & Altimetría · {currentCircuit.tabLabel}
                  </h3>
                  <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {currentCircuit.summaryBadge}
                  </span>
                </div>
                <p className="text-xs text-stone-400">{currentCircuit.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-lg">
                <Droplets className="w-3.5 h-3.5" />
                {currentCircuit.hydrationCount} Puestos PA
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                <Navigation className="w-3.5 h-3.5" />
                {currentCircuit.elevationGain} D+
              </span>
            </div>
          </div>

          {/* Cuerpo del visor: Simulación Topográfica GPX + Perfil de Elevación SVG */}
          <div className="p-4 sm:p-6 bg-gradient-to-b from-stone-950/50 to-stone-900">
            {/* Leyenda de marcadores */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-stone-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  Curva de Altitud (msnm)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                  Puesto de Hidratación (PA)
                </span>
              </div>
              <span className="font-mono text-[11px] text-stone-400">
                Cota máx: {activeDistance === '21K' ? '2.150 msnm' : '1.620 msnm'}
              </span>
            </div>

            {/* Gráfico SVG responsivo de Altimetría y Ruta */}
            <div className="w-full overflow-x-auto rounded-2xl bg-stone-950/90 border border-stone-800/90 p-2 sm:p-4">
              <svg
                viewBox={`0 0 ${svgData.width} ${svgData.height}`}
                className="w-full h-48 sm:h-64 select-none"
                role="img"
                aria-label={`Gráfico de altimetría para ${currentCircuit.tabLabel}`}
              >
                <defs>
                  <linearGradient id="elevationFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Líneas guía horizontales de altitud */}
                {[1200, 1500, 1800, 2100].map((alt) => {
                  const y =
                    28 + (250 - 62) - ((alt - 1100) / (2250 - 1100)) * (250 - 62);
                  return (
                    <g key={alt}>
                      <line
                        x1={svgData.padLeft}
                        y1={y}
                        x2={svgData.width - svgData.padRight}
                        y2={y}
                        stroke="#292524"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={svgData.padLeft - 6}
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
                <path d={svgData.areaPath} fill="url(#elevationFill)" />

                {/* Línea de perfil de elevación */}
                <path
                  d={svgData.linePath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Nodos de hidratación, cumbre y largada/meta */}
                {svgData.points.map((pt) => {
                  const isHydration = Boolean(pt.hydration);
                  const isPeak = Boolean(pt.peak);

                  return (
                    <g key={`${pt.km}-${pt.alt}`}>
                      {/* Línea vertical punteada hacia la base para puestos y cumbre */}
                      {(isHydration || isPeak) && (
                        <line
                          x1={pt.x}
                          y1={pt.y}
                          x2={pt.x}
                          y2={svgData.baselineY}
                          stroke={isPeak ? '#f59e0b' : '#38bdf8'}
                          strokeDasharray="2 3"
                          strokeWidth="1.2"
                          opacity="0.65"
                        />
                      )}

                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isPeak ? 6 : isHydration ? 5.5 : 3.5}
                        fill={isPeak ? '#f59e0b' : isHydration ? '#38bdf8' : '#e7e5e4'}
                        stroke="#0c0a09"
                        strokeWidth="2"
                      />

                      {pt.label && (
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor={
                            pt.km === 0
                              ? 'start'
                              : pt.km === maxKm
                              ? 'end'
                              : 'middle'
                          }
                          className={`text-[10px] font-bold ${
                            isPeak
                              ? 'fill-amber-400'
                              : isHydration
                              ? 'fill-sky-300'
                              : 'fill-stone-300'
                          }`}
                        >
                          {pt.label}
                        </text>
                      )}

                      <text
                        x={pt.x}
                        y={svgData.baselineY + 18}
                        textAnchor="middle"
                        className="fill-stone-400 text-[10px] font-mono"
                      >
                        {pt.km}K
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Puestos de hidratación detallados */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-2">
                {currentCircuit.waypoints
                  .filter((wp) => wp.hydration)
                  .map((wp) => (
                    <span
                      key={wp.label}
                      className="inline-flex items-center gap-1.5 text-xs bg-stone-950 border border-stone-800 text-stone-200 px-3 py-1.5 rounded-xl"
                    >
                      <Droplets className="w-3.5 h-3.5 text-sky-400" />
                      {wp.label} · {wp.alt}m
                    </span>
                  ))}
              </div>

              <button
                type="button"
                onClick={() => onOpenModalWithDistance(activeDistance)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/40 font-display font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-all cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                Inscribirme en {activeDistance}
              </button>
            </div>
          </div>
        </div>

        {/* 3 Tarjetas de Estadísticas Minimalistas */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {currentCircuit.stats.map((stat, idx) => {
            const IconComponent = cardIcons[idx] || TrendingUp;
            return (
              <div
                key={stat.label}
                className="rounded-2xl bg-stone-900/75 border border-stone-800/90 p-5 sm:p-6 flex items-start gap-4 hover:border-amber-500/40 transition-colors"
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
