import React, { useState } from 'react';
import { CraneModel, LiftConfiguration, LiftCalculationResult } from '../types/crane';
import { CheckSquare, Square, ShieldCheck, AlertCircle, Award, FileText } from 'lucide-react';

interface SafetyChecklistProps {
  crane: CraneModel;
  config: LiftConfiguration;
  calculation: LiftCalculationResult;
}

export const SafetyChecklist: React.FC<SafetyChecklistProps> = ({
  crane,
  config,
  calculation,
}) => {
  const [checklist, setChecklist] = useState<{ [id: string]: boolean }>({
    'check-1': true,
    'check-2': true,
    'check-3': true,
    'check-4': true,
    'check-5': true,
    'check-6': true,
    'check-7': true,
    'check-8': !calculation.isCriticalLift,
  });

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checklistItems = [
    {
      id: 'check-1',
      title: 'Crane Operator & Equipment Pre-Operational Inspection',
      desc: `Verified model: ${crane.modelCode} (${crane.manufacturer}). Daily mechanical inspection completed, crane logbook verified, and certified operator on duty.`,
    },
    {
      id: 'check-2',
      title: 'Outrigger Ground Bearing & Mat Foundation',
      desc: `Mats deployed (${config.outriggerPadSizeM}m × ${config.outriggerPadSizeM}m). Ground bearing ${calculation.outriggerForces.groundBearingPressureKPa} kPa ≤ Allowable ${calculation.outriggerForces.allowablePressureKPa} kPa.`,
    },
    {
      id: 'check-3',
      title: 'Rigging Hardware & Sling Inspection (ASME B30.9)',
      desc: 'Slings, shackles, hooks, and spreader bars inspected for wear, deformation, and marked with SWL.',
    },
    {
      id: 'check-4',
      title: 'Lifting Zone & Radius Barricades (Swing Radius Clearance)',
      desc: 'Exclusion zone established around swing radius. Unauthorized personnel cleared from the lift path.',
    },
    {
      id: 'check-5',
      title: 'Meteorological & Wind Speed Verification',
      desc: `Current site wind ${config.windSpeedMs} m/s (Permissible max: ${config.maxPermissibleWindMs} m/s). Lightning alert clear.`,
    },
    {
      id: 'check-6',
      title: 'Overhead Power Line & Obstacle Clearance (OSHA 1926.1408)',
      desc: 'Minimum 20 ft (6m) clearance maintained from high-voltage lines. Boom swing free of physical obstructions.',
    },
    {
      id: 'check-7',
      title: 'Designated Signal Person & Dedicated Radio Channel',
      desc: 'Qualified signal person assigned. Standard ASME hand signals and dedicated 2-way radio channels confirmed.',
    },
    {
      id: 'check-8',
      title: 'Critical Lift Permit & Professional Engineer (PE) Endorsement',
      desc: calculation.isCriticalLift
        ? 'MANDATORY: Lift utilization exceeds 75%. Critical Lift Plan submitted and signed by Rigging Engineer.'
        : 'Standard lift (<75% utilization). Standard lift plan approved by site safety officer.',
    },
  ];

  const total = checklistItems.length;
  const completed = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 flex flex-col shadow-sm text-xs">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            ASME B30 / EN 13000 Pre-Lift Safety Verification Checklist
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-mono-num font-semibold">
            Completed: {completed}/{total}
          </span>
          <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full ${completed === total ? 'bg-emerald-600' : 'bg-blue-600'}`}
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {checklistItems.map((item) => {
          const isChecked = !!checklist[item.id];
          return (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start gap-2.5 ${
                isChecked
                  ? 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                  : 'bg-rose-50/50 border-rose-200 hover:bg-rose-50'
              }`}
            >
              <button className="mt-0.5 text-blue-600 shrink-0">
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <div className="flex-1">
                <div className={`font-bold ${isChecked ? 'text-slate-800' : 'text-rose-800'}`}>
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
