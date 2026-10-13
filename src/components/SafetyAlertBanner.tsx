import React from 'react';
import { CraneModel, LiftConfiguration, LiftCalculationResult } from '../types/crane';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Wind,
  Layers,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';

interface SafetyAlertBannerProps {
  crane: CraneModel;
  config: LiftConfiguration;
  calculation: LiftCalculationResult;
}

export const SafetyAlertBanner: React.FC<SafetyAlertBannerProps> = ({
  crane,
  config,
  calculation,
}) => {
  const util = calculation.effectiveUtilizationPercent;
  const isOverload = calculation.isOverload;
  const isCritical = calculation.isCriticalLift;
  const isCaution = calculation.safetyLevel === 'CAUTION';

  // Crisp executive presentation colors
  const bannerBg = isOverload
    ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/40 text-rose-950'
    : isCritical
    ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400/50 text-amber-950'
    : isCaution
    ? 'bg-yellow-50 border-yellow-300 text-yellow-950'
    : 'bg-emerald-50 border-emerald-300 text-emerald-950';

  const badgeBg = isOverload
    ? 'bg-rose-600 text-white'
    : isCritical
    ? 'bg-amber-500 text-slate-900 font-extrabold'
    : isCaution
    ? 'bg-yellow-500 text-slate-900 font-bold'
    : 'bg-emerald-600 text-white font-bold';

  return (
    <div className={`w-full rounded-xl border p-4 shadow-sm transition-all ${bannerBg}`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Status Icon & Title */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-sm shrink-0">
            {isOverload ? (
              <ShieldAlert className="w-7 h-7 text-rose-600 animate-bounce" />
            ) : isCritical ? (
              <AlertTriangle className="w-7 h-7 text-amber-600 animate-pulse" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-xs tracking-wider uppercase font-mono-num ${badgeBg}`}>
                {calculation.safetyLevel}
              </span>
              <h2 className="text-base font-extrabold text-slate-900">
                {calculation.safetyStatusText}
              </h2>
            </div>

            <p className="text-xs text-slate-700 mt-1">
              Lift Capacity: <span className="font-bold text-slate-900 font-mono-num">{calculation.grossLiftWeightTon.toFixed(2)}t</span> of rated{' '}
              <span className="font-bold text-slate-900 font-mono-num">{calculation.effectiveRatedCapacityTon.toFixed(2)}t</span> @ Radius {config.workingRadius}m
              {calculation.windDeratingFactor < 1.0 && (
                <span className="text-amber-800 font-semibold ml-1.5 font-mono-num">
                  (Wind Derating: {(calculation.windDeratingFactor * 100).toFixed(0)}%)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Key Safety Metrics Gauges */}
        <div className="flex flex-wrap items-center gap-4 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
          {/* Crane Capacity Utilization Gauge */}
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center min-w-[130px] shadow-sm">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Crane Capacity %
            </div>
            <div
              className={`text-2xl font-black font-mono-num ${
                isOverload ? 'text-rose-600' : isCritical ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {util.toFixed(1)}%
            </div>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
              <div
                className={`h-full ${
                  isOverload ? 'bg-rose-500' : isCritical ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, util)}%` }}
              />
            </div>
          </div>

          {/* Ground Bearing Pressure Gauge */}
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center min-w-[130px] shadow-sm">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Ground Pressure (GBP)
            </div>
            <div
              className={`text-xl font-bold font-mono-num ${
                calculation.outriggerForces.isSoilSafe ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {calculation.outriggerForces.groundBearingPressureKPa} <span className="text-xs">kPa</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Soil: {calculation.outriggerForces.allowablePressureKPa} kPa (
              <span className={calculation.outriggerForces.isSoilSafe ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                {calculation.outriggerForces.isSoilSafe ? 'PASSED' : 'OVERLOAD'}
              </span>
              )
            </div>
          </div>

          {/* Wind Velocity Gauge */}
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center min-w-[110px] shadow-sm">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Wind Speed
            </div>
            <div
              className={`text-xl font-bold font-mono-num ${
                calculation.hasWindWarning ? 'text-rose-600' : 'text-cyan-700'
              }`}
            >
              {config.windSpeedMs.toFixed(1)} <span className="text-xs">m/s</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Max: {config.maxPermissibleWindMs} m/s
            </div>
          </div>
        </div>
      </div>

      {/* Critical Lift & Warning reasons if any */}
      {calculation.criticalLiftReasons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs">
          <div className="text-slate-800 font-bold mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Safety Risk Factors & Compliance Notes:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {calculation.criticalLiftReasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                <span className="text-amber-600 font-bold">•</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
