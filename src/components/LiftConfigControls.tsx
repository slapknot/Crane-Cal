import React from 'react';
import {
  CraneModel,
  LiftConfiguration,
  LiftCalculationResult,
  OutriggerExtension,
} from '../types/crane';
import { CRANE_PRESETS, SOIL_BEARING_TYPES } from '../data/cranePresets';
import {
  Scale,
  Wind,
  Gauge,
  Layers,
  HardHat,
  ChevronDown,
  Info,
} from 'lucide-react';

interface LiftConfigControlsProps {
  crane: CraneModel;
  config: LiftConfiguration;
  calculation: LiftCalculationResult;
  onUpdateCrane: (crane: CraneModel) => void;
  onUpdateConfig: (newConfig: Partial<LiftConfiguration>) => void;
}

export const LiftConfigControls: React.FC<LiftConfigControlsProps> = ({
  crane,
  config,
  calculation,
  onUpdateCrane,
  onUpdateConfig,
}) => {
  const mobileCranes = CRANE_PRESETS.filter((p) => p.category === 'mobile');
  const towerCranes = CRANE_PRESETS.filter((p) => p.category === 'tower');

  const minBoom = crane.boomLengths[0] || 5;
  const maxBoom = crane.boomLengths[crane.boomLengths.length - 1] || 60;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-4 shadow-sm text-xs">
      {/* 1. Crane Model Standard Database Selector (Dropdown List) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="crane-model-select"
            className="text-slate-800 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5"
          >
            <HardHat className="w-4 h-4 text-amber-600" />
            เลือกรุ่นเครนมาตรฐาน (Standard Crane Database)
          </label>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
            {CRANE_PRESETS.length} Standard Models
          </span>
        </div>

        {/* Dropdown list for selecting crane model */}
        <div className="relative">
          <select
            id="crane-model-select"
            value={crane.id}
            onChange={(e) => {
              const selected = CRANE_PRESETS.find((p) => p.id === e.target.value);
              if (selected) {
                onUpdateCrane(selected);
              }
            }}
            className="w-full appearance-none bg-slate-50 border-2 border-blue-500/40 hover:border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-3.5 py-2.5 font-extrabold text-slate-800 text-xs shadow-xs cursor-pointer transition pr-10"
          >
            <optgroup label="─── รถเครนล้อยาง (Mobile & All-Terrain Cranes) ───">
              {mobileCranes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} • พิกัด {item.maxRatedCapacityTon}T [{item.manufacturer}]
                </option>
              ))}
            </optgroup>
            <optgroup label="─── ทาวเวอร์เครน (Tower Cranes) ───">
              {towerCranes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} • พิกัด {item.maxRatedCapacityTon}T [{item.manufacturer}]
                </option>
              ))}
            </optgroup>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-600">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {/* Selected Crane Standard Technical Card */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-xs">{crane.modelCode}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                พิกัดสูงสุด {crane.maxRatedCapacityTon} ตัน
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {crane.manufacturer}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px] font-mono-num border-t border-slate-200 text-slate-600">
            <div>
              <span className="text-slate-400 block text-[9px] font-sans">ช่วงบูมมาตรฐาน</span>
              <strong className="text-slate-800">{minBoom}m – {maxBoom}m</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] font-sans">รัศมีทำงาน</span>
              <strong className="text-slate-800">{crane.minRadius}m – {crane.maxRadius}m</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] font-sans">น้ำหนักตัวรถ / ตุ้มถ่วง</span>
              <strong className="text-slate-800">{crane.craneTareWeightTon}t / {crane.counterweightTon}t</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] font-sans">ระยะกางขาช้าง</span>
              <strong className="text-slate-800">{crane.outriggerSpreadLength}m × {crane.outriggerSpreadWidth}m</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 2. Primary Lift Geometry Inputs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-slate-700 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-blue-600" />
            Lift Geometry & Radius Controls
          </label>
        </div>

        {/* Working Radius Slider + Input */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-slate-800 font-semibold block">Working Radius (m):</span>
              <span className="text-[10px] text-slate-500">รัศมีการยก (วัดจากกึ่งกลางเครนถึงวัตถุ)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min={crane.minRadius}
                max={crane.maxRadius}
                value={config.workingRadius}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateConfig({ workingRadius: isNaN(val) ? 0 : val });
                }}
                className="w-20 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-right font-extrabold text-blue-700 font-mono-num text-sm shadow-xs"
                placeholder="0.0"
              />
              <span className="text-slate-600 font-bold">m</span>
            </div>
          </div>
          <input
            type="range"
            min={crane.minRadius}
            max={crane.maxRadius}
            step="0.1"
            value={config.workingRadius}
            onChange={(e) => onUpdateConfig({ workingRadius: parseFloat(e.target.value) || crane.minRadius })}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono-num">
            <span>ระยะต่ำสุด: {crane.minRadius}m</span>
            <span>ระยะสูงสุด: {crane.maxRadius}m</span>
          </div>
        </div>

        {/* Main Boom Length Input (Direct Input - No Shortcut Buttons) */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-slate-800 font-semibold block">
                {crane.category === 'mobile' ? 'Main Boom Length (m):' : 'Tower Jib Length (m):'}
              </span>
              <span className="text-[10px] text-slate-500">
                ความยาวแขนบูม (กรอกตัวเลขโดยตรงได้)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min={minBoom}
                max={maxBoom}
                value={config.boomLength}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateConfig({ boomLength: isNaN(val) ? minBoom : val });
                }}
                className="w-24 bg-white border-2 border-amber-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-500 rounded-lg px-2.5 py-1 text-right font-extrabold text-amber-800 font-mono-num text-base shadow-xs"
                placeholder="0.0"
              />
              <span className="text-slate-700 font-bold">m</span>
            </div>
          </div>

          <input
            type="range"
            min={minBoom}
            max={maxBoom}
            step="0.1"
            value={config.boomLength}
            onChange={(e) => onUpdateConfig({ boomLength: parseFloat(e.target.value) || minBoom })}
            className="w-full accent-amber-600 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono-num pt-0.5">
            <span>ต่ำสุด: {minBoom}m</span>
            <span className="text-amber-800 font-medium font-sans flex items-center gap-1">
              <Info className="w-3 h-3 text-amber-600" />
              บูมมาตรฐานของรุ่นนี้: {crane.boomLengths.join(', ')}m
            </span>
            <span>สูงสุด: {maxBoom}m</span>
          </div>
        </div>

        {/* Tower Crane Specific Mast Height */}
        {crane.category === 'tower' && (
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-semibold text-[11px]">
                ความสูงเสาทาวเวอร์เครน (Mast Height Under Hook - HUH):
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="1"
                  min="20"
                  max="120"
                  value={config.towerMastHeight || crane.towerHeightUnderHook || 45}
                  onChange={(e) =>
                    onUpdateConfig({ towerMastHeight: parseFloat(e.target.value) || 45 })
                  }
                  className="w-16 bg-white border border-slate-300 rounded px-2 py-0.5 text-right font-extrabold text-blue-700 font-mono-num text-xs"
                />
                <span className="text-slate-500">m</span>
              </div>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="1"
              value={config.towerMastHeight || crane.towerHeightUnderHook || 45}
              onChange={(e) => onUpdateConfig({ towerMastHeight: parseFloat(e.target.value) || 45 })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        )}

        {/* Target Lift Height & Slew Angle in 2 cols */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-600 text-[10px] font-medium">Target Lift Height (ระยะยกวัตถุ)</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.5"
                min="1"
                max={crane.maxTipHeight}
                value={config.targetLiftHeight}
                onChange={(e) =>
                  onUpdateConfig({ targetLiftHeight: parseFloat(e.target.value) || 5 })
                }
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-emerald-700 font-bold font-mono-num"
              />
              <span className="text-slate-500">m</span>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-600 text-[10px] font-medium">Slew Angle Rotation (มุมสวิง)</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="5"
                min="0"
                max="360"
                value={config.slewAngleDeg}
                onChange={(e) =>
                  onUpdateConfig({ slewAngleDeg: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-purple-700 font-bold font-mono-num"
              />
              <span className="text-slate-500">deg</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 3. Weight & Rigging Deductions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-slate-700 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            Load & Rigging Breakdown (น้ำหนักยก)
          </label>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
          {/* Net Load Weight */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-slate-800 font-semibold block">Net Equipment Weight:</span>
              <span className="text-[10px] text-slate-500">น้ำหนักชิ้นงานสุทธิ (กรอกตัวเลข)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.05"
                min="0"
                value={config.netLoadWeightTon}
                onChange={(e) =>
                  onUpdateConfig({ netLoadWeightTon: parseFloat(e.target.value) || 0 })
                }
                className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-right font-extrabold text-slate-900 font-mono-num text-sm"
              />
              <span className="text-slate-600 font-bold">ตัน</span>
            </div>
          </div>

          {/* Rigging tackle weight */}
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-[11px]">Rigging Gear (สลิง/สเก็น/คานยก):</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.05"
                min="0"
                value={config.riggingTackleWeightTon}
                onChange={(e) =>
                  onUpdateConfig({ riggingTackleWeightTon: parseFloat(e.target.value) || 0 })
                }
                className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-right text-slate-700 font-mono-num"
              />
              <span className="text-slate-500">ตัน</span>
            </div>
          </div>

          {/* Hook block weight */}
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-[11px]">Crane Hook Block (รอกตะขอ):</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.05"
                min="0"
                value={config.hookBlockWeightTon}
                onChange={(e) =>
                  onUpdateConfig({ hookBlockWeightTon: parseFloat(e.target.value) || 0 })
                }
                className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-right text-slate-700 font-mono-num"
              />
              <span className="text-slate-500">ตัน</span>
            </div>
          </div>

          {/* Summary Gross Lift Weight */}
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-emerald-800 font-bold">Total Gross Lift Weight (น้ำหนักรวม):</span>
            <span className="text-sm font-extrabold text-emerald-700 font-mono-num">
              {calculation.grossLiftWeightTon.toFixed(3)} ตัน
            </span>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 4. Soil & Outrigger Pad Sizing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-slate-700 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            Outriggers & Ground Bearing Pressure (GBP)
          </label>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
          {crane.category === 'mobile' && (
            <div className="flex justify-between items-center">
              <span className="text-slate-800 font-semibold">Outrigger Extension:</span>
              <div className="flex gap-1">
                {(['100%', '50%'] as OutriggerExtension[]).map((cond) => (
                  <button
                    key={cond}
                    onClick={() => onUpdateConfig({ outriggerCondition: cond })}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      config.outriggerCondition === cond
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {cond === '100%' ? 'Fully Extended (100%)' : 'Mid (50%)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-slate-800 font-semibold">Outrigger Mat Sizing:</span>
            <select
              value={config.outriggerPadSizeM}
              onChange={(e) =>
                onUpdateConfig({ outriggerPadSizeM: parseFloat(e.target.value) })
              }
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-mono-num"
            >
              <option value={1.0}>1.0 m × 1.0 m (1.00 m²)</option>
              <option value={1.2}>1.2 m × 1.2 m (1.44 m² - Standard)</option>
              <option value={1.5}>1.5 m × 1.5 m (2.25 m² - Heavy)</option>
              <option value={2.0}>2.0 m × 2.0 m (4.00 m² - Steel Mat)</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-slate-600 text-[10px] font-medium">Soil Type & Bearing Capacity:</span>
            <select
              value={config.soilBearingCapacityKPa}
              onChange={(e) =>
                onUpdateConfig({ soilBearingCapacityKPa: parseFloat(e.target.value) })
              }
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
            >
              {SOIL_BEARING_TYPES.map((st) => (
                <option key={st.name} value={st.capacityKPa}>
                  {st.name} ({st.capacityKPa} kPa / {st.capacityTpm2} t/m²)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 5. Wind */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-800 font-semibold flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-cyan-600" />
            Site Wind Speed:
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.5"
              min="0"
              max="25"
              value={config.windSpeedMs}
              onChange={(e) =>
                onUpdateConfig({ windSpeedMs: parseFloat(e.target.value) || 0 })
              }
              className="w-16 bg-white border border-slate-300 rounded px-2 py-0.5 text-right font-bold text-cyan-700 font-mono-num"
            />
            <span className="text-slate-500">m/s</span>
            <span className="text-[10px] text-slate-500 font-mono-num">
              ({(config.windSpeedMs * 3.6).toFixed(0)} km/h)
            </span>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          step="0.5"
          value={config.windSpeedMs}
          onChange={(e) => onUpdateConfig({ windSpeedMs: parseFloat(e.target.value) })}
          className="w-full accent-cyan-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Calm (0 m/s)</span>
          <span>Max Safe: {config.maxPermissibleWindMs} m/s</span>
          <span>Factor: {calculation.windDeratingFactor}x</span>
        </div>
      </div>
    </div>
  );
};
