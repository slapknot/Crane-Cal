import React, { useState } from 'react';
import { CraneModel, LiftConfiguration, LiftCalculationResult } from '../types/crane';
import { Table, LineChart, Target, Info, UploadCloud, Sparkles } from 'lucide-react';

interface LoadChartVisualizerProps {
  crane: CraneModel;
  config: LiftConfiguration;
  calculation: LiftCalculationResult;
  onSelectRadius?: (r: number) => void;
  onSelectBoom?: (b: number) => void;
  onOpenUploader?: () => void;
}

export const LoadChartVisualizer: React.FC<LoadChartVisualizerProps> = ({
  crane,
  config,
  calculation,
  onSelectRadius,
  onSelectBoom,
  onOpenUploader,
}) => {
  const [displayMode, setDisplayMode] = useState<'graph' | 'table'>('graph');

  const width = 640;
  const height = 360;
  const padLeft = 60;
  const padBottom = 45;
  const padTop = 30;
  const padRight = 30;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxR = Math.max(34, crane.maxRadius + 2);
  const maxCap = Math.max(60, crane.maxRatedCapacityTon * 1.05);

  const getX = (r: number) => padLeft + (r / maxR) * chartW;
  const getY = (capTon: number) => padTop + chartH - (capTon / maxCap) * chartH;

  const boomColors: { [b: number]: string } = {
    9.35: '#2563eb',
    10.2: '#0891b2',
    11.4: '#2563eb',
    15.3: '#0891b2',
    16.4: '#059669',
    19.3: '#059669',
    23.45: '#d97706',
    25.2: '#d97706',
    30.5: '#dc2626',
    31.1: '#db2777',
    37.0: '#7c3aed',
    43.0: '#dc2626',
  };
  const PALETTE = ['#2563eb', '#0891b2', '#059669', '#d97706', '#db2777', '#7c3aed', '#dc2626', '#4f46e5', '#0d9488'];
  const getBoomColor = (b: number, idx: number) => boomColors[b] || PALETTE[idx % PALETTE.length];

  const yStep = maxCap > 120 ? 30 : maxCap > 60 ? 15 : 10;
  const capSteps: number[] = [];
  for (let c = 0; c <= maxCap; c += yStep) {
    capSteps.push(c);
  }

  const rStep = maxR > 50 ? 10 : 5;
  const rSteps: number[] = [];
  for (let r = 0; r <= maxR; r += rStep) {
    rSteps.push(r);
  }

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Manufacturer Rated Load Chart (Table 1 Capacity Curves)
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono-num font-bold border border-slate-200">
            {crane.modelCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* UPLOAD LOAD CHART BUTTON */}
          <button
            onClick={onOpenUploader}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm transition"
            title="Upload load chart image or PDF and convert into data"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>อัพโหลดภาพ/PDF Load Chart</span>
          </button>

          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setDisplayMode('graph')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition ${
                displayMode === 'graph'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              Curves (กราฟ)
            </button>
            <button
              onClick={() => setDisplayMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition ${
                displayMode === 'table'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table 1 (ตาราง)
            </button>
          </div>
        </div>
      </div>

      {displayMode === 'graph' ? (
        <div className="relative w-full overflow-hidden bg-slate-50/80 rounded-lg border border-slate-200 p-2 flex flex-col items-center">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[360px] font-mono-num text-xs select-none"
          >
            {capSteps.map((cap) => {
              const y = getY(cap);
              return (
                <g key={`y-${cap}`}>
                  <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">
                    {cap}t
                  </text>
                </g>
              );
            })}

            {rSteps.map((r) => {
              const x = getX(r);
              return (
                <g key={`x-${r}`}>
                  <line x1={x} y1={padTop} x2={x} y2={padTop + chartH} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <text x={x} y={padTop + chartH + 18} textAnchor="middle" fill="#64748b" fontSize="10">
                    {r}m
                  </text>
                </g>
              );
            })}

            <line x1={padLeft} y1={padTop + chartH} x2={width - padRight} y2={padTop + chartH} stroke="#64748b" strokeWidth="1.5" />
            <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} stroke="#64748b" strokeWidth="1.5" />

            <text x={padLeft + chartW / 2} y={height - 8} textAnchor="middle" fill="#475569" fontSize="11" fontWeight="bold">
              Working Radius (m)
            </text>
            <text
              transform={`rotate(-90) translate(-${padTop + chartH / 2}, 16)`}
              textAnchor="middle"
              fill="#475569"
              fontSize="11"
              fontWeight="bold"
            >
              Rated Capacity (Metric Tons)
            </text>

            {crane.boomLengths.map((boom, idx) => {
              const isSelected = boom === config.boomLength;
              const color = getBoomColor(boom, idx);

              const validPoints = crane.loadChart
                .filter((e) => e.capacities[boom] !== undefined)
                .map((e) => ({
                  x: getX(e.radius),
                  y: getY(e.capacities[boom] / 1000),
                }));

              if (validPoints.length === 0) return null;

              const pathD = validPoints.reduce((acc, pt, idx) => {
                return `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
              }, '');

              return (
                <g key={`boom-curve-${boom}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth={isSelected ? '3.5' : '1.8'}
                    strokeOpacity={isSelected ? '1.0' : '0.45'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {validPoints.length > 0 && (
                    <text
                      x={validPoints[validPoints.length - 1].x + 4}
                      y={validPoints[validPoints.length - 1].y + 3}
                      fill={color}
                      fontSize={isSelected ? '10' : '8.5'}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {boom}m
                    </text>
                  )}
                </g>
              );
            })}

            {/* OPERATING POINT CROSSHAIR */}
            {(() => {
              const opX = getX(config.workingRadius);
              const opY = getY(calculation.grossLiftWeightTon);
              const ratedY = getY(calculation.ratedCapacityTon);

              return (
                <g>
                  <line
                    x1={opX}
                    y1={padTop}
                    x2={opX}
                    y2={padTop + chartH}
                    stroke="#2563eb"
                    strokeWidth="1.2"
                    strokeDasharray="4 2"
                  />

                  <circle cx={opX} cy={ratedY} r="5" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
                  <text
                    x={opX + 8}
                    y={ratedY - 6}
                    fill="#b45309"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    Rated: {calculation.ratedCapacityTon}t
                  </text>

                  <circle
                    cx={opX}
                    cy={opY}
                    r="6"
                    fill={calculation.isOverload ? '#dc2626' : calculation.isCriticalLift ? '#d97706' : '#16a34a'}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <circle
                    cx={opX}
                    cy={opY}
                    r="12"
                    fill="none"
                    stroke={calculation.isOverload ? '#dc2626' : calculation.isCriticalLift ? '#d97706' : '#16a34a'}
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />

                  <text
                    x={opX + 8}
                    y={opY + 14}
                    fill={calculation.isOverload ? '#dc2626' : calculation.isCriticalLift ? '#d97706' : '#15803d'}
                    fontSize="10"
                    fontWeight="bold"
                  >
                    Lift: {calculation.grossLiftWeightTon}t ({calculation.utilizationPercent}%)
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Boom legend pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-200 text-[11px]">
            <span className="text-slate-600 font-semibold">Boom Lengths:</span>
            {crane.boomLengths.map((b) => (
              <button
                key={`legend-${b}`}
                onClick={() => onSelectBoom?.(b)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full transition font-mono-num ${
                  b === config.boomLength
                    ? 'bg-amber-100 border border-amber-400 text-amber-800 font-bold'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: boomColors[b] || '#64748b' }}
                />
                {b}m
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* TABLE 1 LOAD CHART MATRIX (Matches Image 1) */
        <div className="w-full overflow-x-auto max-h-[380px] rounded-lg border border-slate-200 bg-white font-mono-num text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-[11px] text-slate-700">
              <tr>
                <th className="p-2 border-r border-slate-200 text-center bg-slate-200/80 font-bold">
                  Radius (m)
                </th>
                {crane.boomLengths.map((b) => (
                  <th
                    key={`th-${b}`}
                    className={`p-2 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-200/50 ${
                      b === config.boomLength ? 'bg-amber-100 text-amber-900 font-bold' : ''
                    }`}
                    onClick={() => onSelectBoom?.(b)}
                  >
                    {b.toFixed(1)} m
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crane.loadChart.map((entry) => {
                const isCurrentRadius = Math.abs(entry.radius - config.workingRadius) < 0.2;
                return (
                  <tr
                    key={`tr-${entry.radius}`}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition ${
                      isCurrentRadius ? 'bg-blue-50/70' : ''
                    }`}
                  >
                    <td
                      className={`p-2 text-center font-bold border-r border-slate-200 cursor-pointer hover:text-blue-600 ${
                        isCurrentRadius ? 'text-blue-700 bg-blue-100/60' : 'text-slate-700'
                      }`}
                      onClick={() => onSelectRadius?.(entry.radius)}
                    >
                      {entry.radius.toFixed(1)}
                    </td>
                    {crane.boomLengths.map((b) => {
                      const cap = entry.capacities[b];
                      const isHighlightedCell =
                        isCurrentRadius && b === config.boomLength;

                      return (
                        <td
                          key={`td-${entry.radius}-${b}`}
                          className={`p-2 text-center border-r border-slate-100 ${
                            isHighlightedCell
                              ? 'bg-rose-100 text-rose-800 font-extrabold border-2 border-rose-500'
                              : cap !== undefined
                              ? b === config.boomLength
                                ? 'text-amber-800 font-semibold'
                                : 'text-slate-800'
                              : 'text-slate-300'
                          }`}
                        >
                          {cap !== undefined ? cap.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>
          Unit: Metric kg. Conditions: Outriggers and telescoping cylinder fully extended (100%), over sides and rear lifting quadrant.
        </span>
      </div>
    </div>
  );
};
