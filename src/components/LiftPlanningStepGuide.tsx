import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  HardHat,
  Compass,
  Table,
  Scale,
  ShieldAlert,
  Layers,
  FileCheck,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { LiftCalculationResult, LiftConfiguration, CraneModel } from '../types/crane';

interface LiftPlanningStepGuideProps {
  currentStep: number;
  onSelectStep: (stepNumber: number) => void;
  calculation: LiftCalculationResult;
  config: LiftConfiguration;
  crane: CraneModel;
}

export const LiftPlanningStepGuide: React.FC<LiftPlanningStepGuideProps> = ({
  currentStep,
  onSelectStep,
  calculation,
  config,
  crane,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const steps = [
    {
      num: 1,
      title: 'เลือกรุ่นเครนมาตรฐาน',
      enTitle: 'Select Crane Model',
      icon: HardHat,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      activeColor: 'bg-amber-600 text-white',
      whatToDo: 'เลือกรุ่นเครนจากฐานข้อมูลมาตรฐาน (Mobile หรือ Tower) ตรวจสอบพิกัดยกสูงสุด',
      whatToLook: `รุ่นปัจจุบัน: ${crane.modelCode} (พิกัดสูงสุด ${crane.maxRatedCapacityTon}T) | ผู้ผลิต: ${crane.manufacturer} | บูม: ${crane.boomLengths[0]}-${crane.boomLengths[crane.boomLengths.length - 1]}m`,
      statusText: `${crane.name}`,
      isDone: true,
    },
    {
      num: 2,
      title: 'กำหนดระยะยก & มุมบูม',
      enTitle: 'Radius & Geometry',
      icon: Compass,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      activeColor: 'bg-sky-600 text-white',
      whatToDo: 'วัดระยะห่างศูนย์กลางเครนถึงวัตถุ (Working Radius) และความสูงเป้าหมาย',
      whatToLook: `รัศมี R = ${config.workingRadius}m | บูม L = ${config.boomLength}m | มุมบูม θ = ${calculation.boomAngleDeg}° | ปลายบูมสูง ${calculation.tipHeightM}m`,
      statusText: `R: ${config.workingRadius}m | θ: ${calculation.boomAngleDeg}°`,
      isDone: true,
    },
    {
      num: 3,
      title: 'เปิด Load Chart ดูพิกัดยก',
      enTitle: 'Load Chart Check',
      icon: Table,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      activeColor: 'bg-indigo-600 text-white',
      whatToDo: 'หาจุดตัดระหว่างความยาวบูมกับรัศมีใน Table 1 ของผู้ผลิต',
      whatToLook: `พิกัดยกสูงสุดที่ตำแหน่งนี้ = ${(calculation.ratedCapacityTon * 1000).toLocaleString()} kg (${calculation.ratedCapacityTon.toFixed(2)} ตัน)`,
      statusText: `Rated: ${calculation.ratedCapacityTon}t`,
      isDone: calculation.ratedCapacityTon > 0,
    },
    {
      num: 4,
      title: 'รวมน้ำหนักยกสุทธิ & อุปกรณ์ช่วยยก',
      enTitle: 'Gross Weight Deduction',
      icon: Scale,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      activeColor: 'bg-emerald-600 text-white',
      whatToDo: 'รวมน้ำหนักชิ้นงาน + สลิง/สเก็น + น้ำหนักรอกตะขอ (Hook Block)',
      whatToLook: `น้ำหนักงาน ${config.netLoadWeightTon}t + สลิง ${config.riggingTackleWeightTon}t + ตะขอ ${config.hookBlockWeightTon}t = รวม ${calculation.grossLiftWeightTon.toFixed(3)} ตัน`,
      statusText: `Gross: ${calculation.grossLiftWeightTon}t`,
      isDone: true,
    },
    {
      num: 5,
      title: 'ประเมินความปลอดภัย & % Utilization',
      enTitle: 'Safety & % Utilization',
      icon: ShieldAlert,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      activeColor: 'bg-purple-600 text-white',
      whatToDo: 'คำนวณ % การใช้งาน = (น้ำหนักรวม / พิกัดยก) × 100 ดูระดับความเสี่ยง',
      whatToLook: `การใช้งาน: ${calculation.effectiveUtilizationPercent}% (${calculation.safetyLevel}) | เกณฑ์: ปลอดภัย <75% | เฝ้าระวัง 75-85% | เสี่ยงสูง >85%`,
      statusText: `${calculation.effectiveUtilizationPercent}% (${calculation.safetyLevel})`,
      isDone: true,
    },
    {
      num: 6,
      title: 'ตรวจแรงกดดิน & แผ่นรองขาช้าง',
      enTitle: 'Ground Bearing & Mats',
      icon: Layers,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      activeColor: 'bg-amber-700 text-white',
      whatToDo: 'คำนวณแรงกดลงขาช้างสูงสุด เทียบกับความสามารถรับแรงของชั้นดิน',
      whatToLook: `แรงกดดิน ${calculation.outriggerForces.groundBearingPressureKPa} kPa vs ความจุชั้นดิน ${calculation.outriggerForces.allowablePressureKPa} kPa (${calculation.outriggerForces.isSoilSafe ? 'ผ่านเกณฑ์' : 'เตือน: ดินทรุดตัว'})`,
      statusText: calculation.outriggerForces.isSoilSafe ? 'GBP ผ่านเกณฑ์' : 'เตือน: ดินทรุด',
      isDone: calculation.outriggerForces.isSoilSafe,
    },
    {
      num: 7,
      title: 'ออกรายงานสรุป & ลงนามอนุมัติ',
      enTitle: 'Export PDF & Sign-off',
      icon: FileCheck,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      activeColor: 'bg-blue-600 text-white',
      whatToDo: 'ส่งออกรายงาน Lift Plan ทางวิศวกรรมในรูปแบบ PDF ให้วิศวกรผู้ควบคุมลงนาม',
      whatToLook: 'พิมพ์เอกสารเพื่อแนบใบขออนุญาตทำงานยก (Lifting Permit / PTW / Safety Checklist)',
      statusText: 'พร้อมส่งออก PDF',
      isDone: true,
    },
  ];

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-xs transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
            ขั้นตอนการวางแผนและตรวจสอบความปลอดภัยการยกเครน (7 Steps Lift Engineering Workflow)
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
            ดูอะไรก่อน-หลัง
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-500 hover:text-slate-800 p-1 flex items-center gap-1 text-[11px] font-semibold"
        >
          {isExpanded ? (
            <>
              <span>ย่อขั้นตอน</span>
              <ChevronDown className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>ดูขั้นตอนทั้งหมด</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Horizontal Step Indicator Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-3">
        {steps.map((st) => {
          const isCurrent = currentStep === st.num;
          const IconComp = st.icon;

          return (
            <button
              key={st.num}
              onClick={() => onSelectStep(st.num)}
              className={`p-2 rounded-lg border text-left transition flex flex-col justify-between min-h-[72px] ${
                isCurrent
                  ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    isCurrent ? st.activeColor : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {st.num}
                </span>
                <IconComp className={`w-3.5 h-3.5 ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`} />
              </div>

              <div>
                <div
                  className={`font-bold text-[11px] line-clamp-1 ${
                    isCurrent ? 'text-blue-900' : 'text-slate-700'
                  }`}
                >
                  {st.title}
                </div>
                <div className="text-[10px] text-slate-500 font-mono-num font-medium line-clamp-1">
                  {st.statusText}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Current Step Guide Callout Card (When Expanded) */}
      {isExpanded && (
        <div className="mt-3 bg-slate-50 rounded-lg border border-slate-200 p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[10px]">
                STEP {currentStep}
              </span>
              <span className="font-bold text-slate-800 text-xs">
                {steps[currentStep - 1].title} ({steps[currentStep - 1].enTitle})
              </span>
            </div>
            <div className="text-slate-600 text-[11px]">
              <strong className="text-slate-800">สิ่งที่ต้องทำ: </strong>
              {steps[currentStep - 1].whatToDo}
            </div>
            <div className="text-slate-700 text-[11px] bg-white p-2 rounded border border-slate-200 font-mono-num flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                <strong className="text-blue-700 font-sans">สิ่งที่ต้องดู ณ จุดนี้: </strong>
                {steps[currentStep - 1].whatToLook}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentStep > 1 && (
              <button
                onClick={() => onSelectStep(currentStep - 1)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs"
              >
                ย้อนกลับ
              </button>
            )}
            {currentStep < 7 ? (
              <button
                onClick={() => onSelectStep(currentStep + 1)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
              >
                <span>ขั้นตอนถัดไป</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ครบ 7 ขั้นตอน</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
