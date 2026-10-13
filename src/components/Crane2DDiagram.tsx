import React, { useState } from 'react';
import { CraneModel, LiftConfiguration, LiftCalculationResult } from '../types/crane';

interface Crane2DDiagramProps {
  crane: CraneModel;
  config: LiftConfiguration;
  calculation: LiftCalculationResult;
}

export const Crane2DDiagram: React.FC<Crane2DDiagramProps> = ({
  crane,
  config,
  calculation,
}) => {
  const [viewMode, setViewMode] = useState<'elevation' | 'plan'>('elevation');

  const svgWidth = 640;
  const svgHeight = 440;
  const groundY = 370;
  const originX = 140;
  const scale = 7.0;

  const pivotX = originX;
  const pivotY = groundY - 2.15 * scale;
  const boomLenPx = config.boomLength * scale;
  const angleRad = (calculation.boomAngleDeg * Math.PI) / 180;
  const tipX = pivotX + (crane.category === 'mobile' ? boomLenPx * Math.cos(angleRad) : config.boomLength * scale);
  const tipY = crane.category === 'mobile' ? pivotY - boomLenPx * Math.sin(angleRad) : pivotY - (config.towerMastHeight || 45) * scale * 0.4;
  
  const hookX = originX + config.workingRadius * scale;
  const hookY = groundY - calculation.hookElevationM * scale;
  const loadW = 2.4 * scale;
  const loadH = 1.4 * scale;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 flex flex-col shadow-sm">
      {/* CAD Header & Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            2D CAD Engineering Schematic ({viewMode === 'elevation' ? 'Elevation Profile (รูปด้านข้าง)' : 'Plan View (แปลนมุมบน)'})
          </h3>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setViewMode('elevation')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              viewMode === 'elevation' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Elevation (รูปด้านข้าง)
          </button>
          <button
            onClick={() => setViewMode('plan')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              viewMode === 'plan' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Plan (แปลนมุมบน)
          </button>
        </div>
      </div>

      {/* SVG Canvas with Clean Blueprint Styling */}
      <div className="relative w-full overflow-hidden bg-slate-50/70 rounded-lg border border-slate-200 flex items-center justify-center p-2">
        {viewMode === 'elevation' ? (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto max-h-[380px] font-mono-num text-xs select-none"
          >
            <defs>
              <marker
                id="cad-arrow-blue"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#2563eb" />
              </marker>
              <marker
                id="cad-arrow-amber"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#d97706" />
              </marker>
              <pattern id="soil-hatch-light" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="1.2" />
              </pattern>
            </defs>

            {/* Ground & Soil */}
            <rect x="0" y={groundY} width={svgWidth} height={svgHeight - groundY} fill="url(#soil-hatch-light)" />
            <line x1="0" y1={groundY} x2={svgWidth} y2={groundY} stroke="#475569" strokeWidth="2" />
            <text x="15" y={groundY - 8} fill="#64748b" fontSize="10" fontWeight="bold">GROUND LEVEL (±0.00m)</text>

            {/* Crane Carrier / Tower Base */}
            {crane.category === 'mobile' ? (
              <g>
                <rect x={originX - 35} y={groundY - 14} width="70" height="12" fill="#334155" stroke="#1e293b" />
                <rect x={originX - 42} y={groundY - 4} width="16" height="4" fill="#16a34a" />
                <rect x={originX + 26} y={groundY - 4} width="16" height="4" fill="#16a34a" />
                <rect x={originX - 30} y={groundY - 28} width="60" height="15" rx="3" fill="#475569" />
                <rect x={originX + 12} y={groundY - 40} width="22" height="15" rx="2" fill="#f59e0b" />
                <rect x={originX - 28} y={groundY - 38} width="18" height="16" fill="#1e293b" stroke="#0f172a" />
                <circle cx={pivotX} cy={pivotY} r="4" fill="#d97706" />
              </g>
            ) : (
              <g>
                <rect x={originX - 10} y={tipY} width="20" height={groundY - tipY} fill="#f59e0b" stroke="#d97706" />
                <rect x={originX - 35} y={groundY - 8} width="70" height="8" fill="#334155" />
              </g>
            )}

            {/* Crane Boom Line */}
            <line
              x1={pivotX}
              y1={pivotY}
              x2={tipX}
              y2={tipY}
              stroke="#d97706"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <line
              x1={pivotX}
              y1={pivotY}
              x2={tipX}
              y2={tipY}
              stroke="#fef3c7"
              strokeWidth="2"
              strokeDasharray="4 2"
            />

            {/* Hoist Cable line */}
            <line
              x1={tipX}
              y1={tipY}
              x2={tipX}
              y2={hookY}
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Hook & Load Box */}
            <g transform={`translate(${tipX}, ${hookY})`}>
              <rect x="-6" y="-8" width="12" height="10" fill="#334155" rx="1" />
              <path d="M 0 2 Q 5 10 -2 12 Q -8 10 -4 4" fill="none" stroke="#1e293b" strokeWidth="2" />
              <line x1="0" y1="12" x2={-loadW / 2} y2={28} stroke="#2563eb" strokeWidth="1.5" />
              <line x1="0" y1="12" x2={loadW / 2} y2={28} stroke="#2563eb" strokeWidth="1.5" />
              <rect
                x={-loadW / 2}
                y="28"
                width={loadW}
                height={loadH}
                fill="#2563eb"
                stroke="#1d4ed8"
                strokeWidth="1.5"
                rx="2"
              />
              <text x="0" y={28 + loadH / 1.5} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                {calculation.grossLiftWeightTon} T
              </text>
            </g>

            {/* DIMENSIONS */}
            {/* Working Radius (R) */}
            <line
              x1={originX}
              y1={groundY + 30}
              x2={tipX}
              y2={groundY + 30}
              stroke="#2563eb"
              strokeWidth="1.5"
              markerStart="url(#cad-arrow-blue)"
              markerEnd="url(#cad-arrow-blue)"
            />
            <line x1={originX} y1={groundY} x2={originX} y2={groundY + 36} stroke="#2563eb" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1={tipX} y1={hookY + 40} x2={tipX} y2={groundY + 36} stroke="#2563eb" strokeWidth="0.8" strokeDasharray="3 3" />
            <text x={(originX + tipX) / 2} y={groundY + 24} textAnchor="middle" fill="#1d4ed8" fontWeight="bold" fontSize="11">
              R = {config.workingRadius.toFixed(1)} m
            </text>

            {/* Tip Height (H) */}
            <line
              x1={tipX + 35}
              y1={groundY}
              x2={tipX + 35}
              y2={tipY}
              stroke="#16a34a"
              strokeWidth="1.5"
              markerStart="url(#cad-arrow-blue)"
              markerEnd="url(#cad-arrow-blue)"
            />
            <line x1={tipX} y1={tipY} x2={tipX + 42} y2={tipY} stroke="#16a34a" strokeWidth="0.8" strokeDasharray="3 3" />
            <text x={tipX + 42} y={(groundY + tipY) / 2} fill="#15803d" fontWeight="bold" fontSize="11">
              H = {calculation.tipHeightM.toFixed(1)} m
            </text>

            {/* Boom Angle θ */}
            {crane.category === 'mobile' && (
              <g>
                <text x={(pivotX + tipX) / 2 - 20} y={(pivotY + tipY) / 2 - 12} fill="#b45309" fontWeight="bold" fontSize="11">
                  Boom: {config.boomLength.toFixed(1)} m
                </text>
                <path
                  d={`M ${pivotX + 35} ${pivotY} A 35 35 0 0 0 ${pivotX + 35 * Math.cos(angleRad)} ${pivotY - 35 * Math.sin(angleRad)}`}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="1.8"
                />
                <text x={pivotX + 42} y={pivotY - 14} fill="#b45309" fontWeight="bold" fontSize="11">
                  θ = {calculation.boomAngleDeg.toFixed(1)}°
                </text>
              </g>
            )}

            <line x1={originX} y1={groundY - 50} x2={originX} y2={groundY + 15} stroke="#dc2626" strokeWidth="1" strokeDasharray="6 3 2 3" />
            <text x={originX - 18} y={groundY - 40} fill="#dc2626" fontSize="9" fontWeight="bold">CL SLEW</text>
          </svg>
        ) : (
          /* Plan View */
          <svg
            viewBox="0 0 640 400"
            className="w-full h-auto max-h-[380px] font-mono-num text-xs select-none"
          >
            <g opacity="0.3">
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`gx-${i}`} x1={i * 80} y1="0" x2={i * 80} y2="400" stroke="#cbd5e1" />
              ))}
              {Array.from({ length: 5 }).map((_, i) => (
                <line key={`gy-${i}`} x1="0" y1={i * 80} x2="640" y2={i * 80} stroke="#cbd5e1" />
              ))}
            </g>

            <g transform="translate(320, 200)">
              <circle
                r={config.workingRadius * 6.5}
                fill={calculation.isOverload ? 'rgba(239, 68, 68, 0.08)' : 'rgba(37, 99, 235, 0.06)'}
                stroke={calculation.isOverload ? '#dc2626' : '#2563eb'}
                strokeWidth="1.5"
                strokeDasharray="5 3"
              />

              <rect x="-20" y="-55" width="40" height="110" rx="4" fill="#334155" stroke="#1e293b" />
              <rect x="-18" y="25" width="36" height="25" fill="#475569" />

              {/* 4 Outriggers */}
              <g transform="translate(-45, 45)">
                <rect x="-14" y="-14" width="28" height="28" fill="#16a34a" rx="2" />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                  {calculation.outriggerForces.frontLeftTon}t
                </text>
                <text x="0" y="-18" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">FL</text>
              </g>
              <g transform="translate(45, 45)">
                <rect x="-14" y="-14" width="28" height="28" fill="#16a34a" rx="2" />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                  {calculation.outriggerForces.frontRightTon}t
                </text>
                <text x="0" y="-18" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">FR</text>
              </g>
              <g transform="translate(-45, -45)">
                <rect x="-14" y="-14" width="28" height="28" fill="#16a34a" rx="2" />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                  {calculation.outriggerForces.rearLeftTon}t
                </text>
                <text x="0" y="26" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">RL</text>
              </g>
              <g transform="translate(45, -45)">
                <rect x="-14" y="-14" width="28" height="28" fill="#16a34a" rx="2" />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                  {calculation.outriggerForces.rearRightTon}t
                </text>
                <text x="0" y="26" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">RR</text>
              </g>

              {(() => {
                const rad = (config.slewAngleDeg * Math.PI) / 180;
                const rPx = config.workingRadius * 6.5;
                const lx = rPx * Math.sin(rad);
                const lz = -rPx * Math.cos(rad);
                return (
                  <g>
                    <line x1="0" y1="0" x2={lx} y2={lz} stroke="#d97706" strokeWidth="4" />
                    <circle cx={lx} cy={lz} r="8" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                    <text x={lx + 12} y={lz + 4} fill="#1d4ed8" fontWeight="bold" fontSize="10">
                      LOAD ({calculation.grossLiftWeightTon}t) @ {config.slewAngleDeg}°
                    </text>
                  </g>
                );
              })()}

              <circle cx="0" cy="0" r="4" fill="#d97706" />
            </g>

            <g transform="translate(580, 50)">
              <circle cx="0" cy="0" r="22" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="0" y1="-18" x2="0" y2="18" stroke="#dc2626" strokeWidth="2" />
              <text x="0" y="-22" textAnchor="middle" fill="#dc2626" fontWeight="bold" fontSize="10">N</text>
            </g>
          </svg>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
        <div>
          <span className="text-slate-500">Main Boom Length: </span>
          <span className="font-bold text-slate-800 font-mono-num">{config.boomLength.toFixed(1)} m</span>
        </div>
        <div>
          <span className="text-slate-500">Working Radius: </span>
          <span className="font-bold text-blue-700 font-mono-num">{config.workingRadius.toFixed(1)} m</span>
        </div>
        <div>
          <span className="text-slate-500">Calculated Angle: </span>
          <span className="font-bold text-amber-700 font-mono-num">{calculation.boomAngleDeg.toFixed(1)}°</span>
        </div>
        <div>
          <span className="text-slate-500">Headroom Clearance: </span>
          <span className="font-bold text-emerald-700 font-mono-num">{calculation.headroomClearanceM.toFixed(1)} m</span>
        </div>
      </div>
    </div>
  );
};
