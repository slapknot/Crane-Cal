import React, { useState, useMemo } from 'react';
import {
  CraneModel,
  LiftConfiguration,
} from './types/crane';
import { CRANE_PRESETS } from './data/cranePresets';
import { calculateLiftPlan } from './utils/craneCalculations';
import { Crane3DViewer } from './components/Crane3DViewer';
import { Crane2DDiagram } from './components/Crane2DDiagram';
import { LoadChartVisualizer } from './components/LoadChartVisualizer';
import { LiftConfigControls } from './components/LiftConfigControls';
import { SafetyAlertBanner } from './components/SafetyAlertBanner';
import { SafetyChecklist } from './components/SafetyChecklist';
import { LiftPlanningStepGuide } from './components/LiftPlanningStepGuide';
import { LoadChartUploaderModal } from './components/LoadChartUploaderModal';
import { generateLiftPlanPDF } from './utils/pdfGenerator';
import {
  HardHat,
  FileDown,
  RotateCcw,
  Box,
  Compass,
  LineChart,
  HelpCircle,
  Presentation,
} from 'lucide-react';

export default function App() {
  // 1. Selected Crane Model State (Default: First model from standard crane database)
  const [selectedCrane, setSelectedCrane] = useState<CraneModel>(CRANE_PRESETS[0]);

  // 2. Lift Configuration State
  const [liftConfig, setLiftConfig] = useState<LiftConfiguration>({
    craneModelId: CRANE_PRESETS[0].id,
    craneCategory: 'mobile',
    projectName: 'Heavy Equipment Installation Project',
    location: 'Bangkok, Thailand',
    liftDate: new Date().toISOString().slice(0, 10),
    plannerName: 'Chief Rigging Engineer',
    boomLength: 25.2,
    workingRadius: 14.0,
    targetLiftHeight: 20.0,
    slewAngleDeg: 45,
    netLoadWeightTon: 4.17,
    riggingTackleWeightTon: 0.25,
    hookBlockWeightTon: 0.38,
    contingencyAllowancePercent: 0,
    outriggerCondition: '100%',
    outriggerPadSizeM: 1.2,
    soilBearingCapacityKPa: 250, // Firm sand & gravel
    loadOrientation: 'Over sides and rear',
    windSpeedMs: 5.5,
    maxPermissibleWindMs: 12.0,
    partsOfLine: 6,
  });

  // 3. Visualizer Tab & Workflow State (3D, 2D, Load Chart)
  const [activeTab, setActiveTab] = useState<'3D' | '2D' | 'CHART'>('3D');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState<boolean>(false);
  const [showStandardsModal, setShowStandardsModal] = useState<boolean>(false);

  // 4. Calculation Result (Reactive to all inputs)
  const calculation = useMemo(() => {
    return calculateLiftPlan(selectedCrane, liftConfig);
  }, [selectedCrane, liftConfig]);

  // Handlers
  const handleUpdateCrane = (newCrane: CraneModel) => {
    setSelectedCrane(newCrane);
    setLiftConfig((prev) => {
      // Pick middle boom length as default or keep within range
      const minB = newCrane.boomLengths[0];
      const maxB = newCrane.boomLengths[newCrane.boomLengths.length - 1];
      const newBoom = newCrane.boomLengths.includes(prev.boomLength)
        ? prev.boomLength
        : Math.min(Math.max(prev.boomLength, minB), maxB);

      return {
        ...prev,
        craneModelId: newCrane.id,
        craneCategory: newCrane.category,
        boomLength: newBoom,
        workingRadius: Math.min(Math.max(prev.workingRadius, newCrane.minRadius), newCrane.maxRadius),
        outriggerPadSizeM: newCrane.defaultPadSizeM,
      };
    });
  };

  const handleUpdateConfig = (updates: Partial<LiftConfiguration>) => {
    setLiftConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleSelectStep = (stepNum: number) => {
    setCurrentStep(stepNum);
    // Automatically switch tabs to the most relevant view for that step
    if (stepNum === 1 || stepNum === 2) {
      setActiveTab('3D');
    } else if (stepNum === 3) {
      setActiveTab('CHART');
    } else if (stepNum === 4 || stepNum === 5) {
      setActiveTab('3D');
    } else if (stepNum === 6) {
      setActiveTab('2D');
    } else if (stepNum === 7) {
      handleExportPDF();
    }
  };

  const handleResetToStandard = () => {
    const defaultCrane = CRANE_PRESETS[0];
    setSelectedCrane(defaultCrane);
    setLiftConfig({
      craneModelId: defaultCrane.id,
      craneCategory: 'mobile',
      projectName: 'Heavy Equipment Installation Project',
      location: 'Bangkok, Thailand',
      liftDate: new Date().toISOString().slice(0, 10),
      plannerName: 'Chief Rigging Engineer',
      boomLength: 25.2,
      workingRadius: 14.0,
      targetLiftHeight: 20.0,
      slewAngleDeg: 45,
      netLoadWeightTon: 4.17,
      riggingTackleWeightTon: 0.25,
      hookBlockWeightTon: 0.38,
      contingencyAllowancePercent: 0,
      outriggerCondition: '100%',
      outriggerPadSizeM: 1.2,
      soilBearingCapacityKPa: 250,
      loadOrientation: 'Over sides and rear',
      windSpeedMs: 5.5,
      maxPermissibleWindMs: 12.0,
      partsOfLine: 6,
    });
    setCurrentStep(1);
  };

  const handleExportPDF = () => {
    generateLiftPlanPDF(selectedCrane, liftConfig, calculation);
  };

  const handleApplyCustomChart = (customCrane: CraneModel) => {
    handleUpdateCrane(customCrane);
    setActiveTab('CHART');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP HEADER & WORKBENCH TOOLBAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & App Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-blue-600 p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <HardHat className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900">
                  CraneLift <span className="text-blue-600">Pro</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  ASME B30.5 / EN 13000
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono-num">
                  Standard Crane Database
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                Professional Heavy Equipment Lift Planning & Real-Time Engineering Simulation
              </p>
            </div>
          </div>

          {/* Current Lift Quick Telemetry Strip */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono-num">
            <div>
              <span className="text-slate-500 text-[10px] block font-bold">RATED CAPACITY</span>
              <span className="font-extrabold text-amber-700">
                {(calculation.ratedCapacityTon * 1000).toLocaleString()} kg ({calculation.ratedCapacityTon}t)
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 text-[10px] block font-bold">GROSS LIFT WT</span>
              <span className="font-extrabold text-blue-700">
                {(calculation.grossLiftWeightTon * 1000).toLocaleString()} kg ({calculation.grossLiftWeightTon}t)
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 text-[10px] block font-bold">% UTILIZATION</span>
              <span
                className={`font-black text-sm ${
                  calculation.isOverload
                    ? 'text-rose-600 animate-pulse'
                    : calculation.isCriticalLift
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {calculation.effectiveUtilizationPercent}%
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 text-[10px] block font-bold">BOOM ANGLE</span>
              <span className="font-extrabold text-slate-800">{calculation.boomAngleDeg}°</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPresentationMode(!isPresentationMode)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                isPresentationMode
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Toggle Presentation Mode for Executive Meetings"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isPresentationMode ? 'ปิดโหมด Present' : 'โหมด Present'}
              </span>
            </button>

            <button
              onClick={handleResetToStandard}
              title="Reset to default specification"
              className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowStandardsModal(true)}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition"
              title="View Standard Engineering References"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Lift Plan (PDF)</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto w-full p-4 flex-1 flex flex-col gap-4">
        {/* STEP-BY-STEP WORKFLOW GUIDE */}
        <LiftPlanningStepGuide
          currentStep={currentStep}
          onSelectStep={handleSelectStep}
          calculation={calculation}
          config={liftConfig}
          crane={selectedCrane}
        />

        {/* Real-time Safety Assessment Banner */}
        <SafetyAlertBanner
          crane={selectedCrane}
          config={liftConfig}
          calculation={calculation}
        />

        {/* PRESENTATION MODE VIEW */}
        {isPresentationMode ? (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-purple-700" />
                <span className="font-extrabold text-purple-900 text-sm">
                  โหมดนำเสนอผลการวิเคราะห์ความปลอดภัย (Executive Lift Safety Presentation Mode)
                </span>
              </div>
              <button
                onClick={() => setIsPresentationMode(false)}
                className="px-3 py-1 bg-white hover:bg-purple-100 border border-purple-300 text-purple-800 rounded-lg font-bold text-xs"
              >
                ออกจากโหมดนำเสนอ
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Crane3DViewer
                crane={selectedCrane}
                config={liftConfig}
                calculation={calculation}
              />
              <Crane2DDiagram
                crane={selectedCrane}
                config={liftConfig}
                calculation={calculation}
              />
            </div>

            <div>
              <LoadChartVisualizer
                crane={selectedCrane}
                config={liftConfig}
                calculation={calculation}
                onSelectRadius={(r) => handleUpdateConfig({ workingRadius: r })}
                onSelectBoom={(b) => handleUpdateConfig({ boomLength: b })}
                onOpenUploader={() => setIsUploaderOpen(true)}
              />
            </div>
          </div>
        ) : (
          /* STANDARD WORKSTATION GRID: Left Controls (40%) + Right Visuals (60%) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT COLUMN: Lift Config Controls & Checklist (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <LiftConfigControls
                crane={selectedCrane}
                config={liftConfig}
                calculation={calculation}
                onUpdateCrane={handleUpdateCrane}
                onUpdateConfig={handleUpdateConfig}
              />

              <SafetyChecklist
                crane={selectedCrane}
                config={liftConfig}
                calculation={calculation}
              />
            </div>

            {/* RIGHT COLUMN: Visual Simulation & Load Chart Tabs (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {/* TAB SELECTOR STRIP */}
              <div className="flex items-center justify-between bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('3D')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                      activeTab === '3D'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Box className="w-4 h-4" />
                    3D CAD Simulation
                  </button>

                  <button
                    onClick={() => setActiveTab('2D')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                      activeTab === '2D'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    2D Engineering CAD
                  </button>

                  <button
                    onClick={() => setActiveTab('CHART')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                      activeTab === 'CHART'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LineChart className="w-4 h-4" />
                    Load Chart (Table 1)
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 font-mono-num hidden sm:block px-2 font-medium">
                  R: {liftConfig.workingRadius}m | L: {liftConfig.boomLength}m
                </div>
              </div>

              {/* TAB CONTENTS */}
              {activeTab === '3D' && (
                <div className="flex flex-col gap-3">
                  <Crane3DViewer
                    crane={selectedCrane}
                    config={liftConfig}
                    calculation={calculation}
                  />
                </div>
              )}

              {activeTab === '2D' && (
                <Crane2DDiagram
                  crane={selectedCrane}
                  config={liftConfig}
                  calculation={calculation}
                />
              )}

              {activeTab === 'CHART' && (
                <LoadChartVisualizer
                  crane={selectedCrane}
                  config={liftConfig}
                  calculation={calculation}
                  onSelectRadius={(r) => handleUpdateConfig({ workingRadius: r })}
                  onSelectBoom={(b) => handleUpdateConfig({ boomLength: b })}
                  onOpenUploader={() => setIsUploaderOpen(true)}
                />
              )}

              {/* Additional Engineering Quick Insights */}
              {(activeTab === '3D' || activeTab === '2D') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Outrigger Force Quadrant Summary */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-xs shadow-sm">
                    <div className="text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-2">
                      Reaction Force by Outrigger Pad (Tons)
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center font-mono-num">
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-bold">Front Left (FL)</div>
                        <div className="text-sm font-extrabold text-slate-800">
                          {calculation.outriggerForces.frontLeftTon} t
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-bold">Front Right (FR)</div>
                        <div className="text-sm font-extrabold text-slate-800">
                          {calculation.outriggerForces.frontRightTon} t
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-bold">Rear Left (RL)</div>
                        <div className="text-sm font-extrabold text-slate-800">
                          {calculation.outriggerForces.rearLeftTon} t
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-bold">Rear Right (RR)</div>
                        <div className="text-sm font-extrabold text-slate-800">
                          {calculation.outriggerForces.rearRightTon} t
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Geometry Telemetry */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-xs shadow-sm flex flex-col justify-between">
                    <div className="text-slate-600 font-bold uppercase tracking-wider text-[10px] mb-2">
                      Lift Geometry Telemetry
                    </div>
                    <div className="space-y-1.5 text-slate-700 font-mono-num">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">Boom Tip Height:</span>
                        <strong className="text-slate-900">{calculation.tipHeightM} m</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">Headroom Clearance:</span>
                        <strong className="text-emerald-700">
                          {calculation.headroomClearanceM > 0
                            ? `${calculation.headroomClearanceM.toFixed(1)} m (Safe)`
                            : '⚠️ Negative Clearance!'}
                        </strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">Calculated Boom Angle:</span>
                        <strong className="text-blue-700">{calculation.boomAngleDeg}°</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Max Ground Bearing Pressure:</span>
                        <strong
                          className={
                            calculation.outriggerForces.isSoilSafe
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }
                        >
                          {calculation.outriggerForces.groundBearingPressureKPa} kPa
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 3. LOAD CHART UPLOADER & OCR PARSER MODAL */}
      <LoadChartUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onApplyCustomChart={handleApplyCustomChart}
        currentCrane={selectedCrane}
      />

      {/* 4. STANDARDS & ENGINEERING GUIDE MODAL */}
      {showStandardsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-5 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-600" />
                International Crane Lifting Standards & Regulations
              </h3>
              <button
                onClick={() => setShowStandardsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-slate-700">
              <div>
                <h4 className="font-bold text-blue-700">ASME B30.5 & ASME B30.3 Standards</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Governs mobile and tower cranes. Mandates rated capacity thresholds: lifts exceeding 75% of rated load chart capacity are designated as <strong>Critical Lifts</strong> requiring formal lift plan engineering, rigging review, and dedicated safety personnel.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-700">EN 13000 (European Mobile Crane Standard)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Specifies stability ratings (75% tipping line rating on outriggers) and structural capacity margins. Includes wind speed de-rating calculations when working above 9 m/s.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-emerald-700">Heavy Equipment Lifting Standards & Safety Rules</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ข้อกำหนดและหลักวิศวกรรมความปลอดภัยในการใช้ปั้นจั่น: การตรวจสอบโครงสร้าง, สลิง, โหลดชาร์ตผู้ผลิต, อุปกรณ์นิรภัย, และการทดสอบพิกัดยก (Load Test) พร้อมการประเมินแรงกดดินขาช้าง (Ground Bearing Pressure)
                </p>
              </div>

              <div>
                <h4 className="font-bold text-purple-700">CIRIA C703 Ground Bearing Pressure</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Formula for calculating outrigger reaction force distribution: maximum concentrated load under slewing quadrant must not exceed allowable bearing pressure of soil or timber/steel mat spreading.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowStandardsModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-3 px-4 text-center text-[11px] text-slate-500">
        CraneLift Pro — Professional Crane Lift Simulation & Safety Compliance System • ASME B30.5 • EN 13000 • OSHA 1926.1400
      </footer>
    </div>
  );
}
