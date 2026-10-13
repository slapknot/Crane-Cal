import { jsPDF } from 'jspdf';
import { CraneModel, LiftConfiguration, LiftCalculationResult } from '../types/crane';

export function generateLiftPlanPDF(
  crane: CraneModel,
  config: LiftConfiguration,
  calculation: LiftCalculationResult
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  let y = 14;

  // Header Box
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CRANE LIFT PLAN & SAFETY ASSESSMENT REPORT', margin + 6, y + 8);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('HEAVY EQUIPMENT PLANNING & STRUCTURAL RISK SIMULATION', margin + 6, y + 13);
  doc.text('STANDARD COMPLIANCE: ASME B30.5 / EN 13000 / OSHA 1926.1400', margin + 6, y + 18);

  // Doc Reference on top right
  const dateStr = new Date().toLocaleDateString('en-GB');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text(`DOC REF: CLP-${Date.now().toString().slice(-6)}`, pageWidth - margin - 50, y + 8);
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.text(`DATE: ${dateStr}`, pageWidth - margin - 50, y + 13);
  doc.text(`STATUS: ${calculation.safetyLevel}`, pageWidth - margin - 50, y + 18);

  y += 26;

  // SECTION 1: PROJECT & EQUIPMENT SPECIFICATION
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1. CRANE SPECIFICATION & LIFT CONFIGURATION', margin + 3, y + 4.2);
  y += 8;

  const specRows = [
    ['Crane Model & Manufacturer', `${crane.name} (${crane.manufacturer})`],
    ['Crane Type Classification', `${crane.craneTypeLabel || crane.category.toUpperCase()}`],
    ['Max Rated Capacity', `${crane.maxRatedCapacityTon.toFixed(1)} Metric Tons`],
    ['Main Boom / Jib Length', `${config.boomLength.toFixed(1)} m (Boom Range: ${crane.boomLengths[0]}m - ${crane.boomLengths[crane.boomLengths.length - 1]}m)`],
    ['Working Radius (R)', `${config.workingRadius.toFixed(1)} m`],
    ['Lifting Height (Target Elevation)', `${config.targetLiftHeight.toFixed(1)} m (Boom Tip Height: ${calculation.tipHeightM.toFixed(1)} m)`],
    ['Calculated Boom Angle (Theta)', `${calculation.boomAngleDeg.toFixed(1)} deg`],
    ['Tare Weight / Counterweight', `Chassis: ${crane.craneTareWeightTon}t | Counterweight: ${crane.counterweightTon}t`],
    ['Outrigger Extension Condition', `${config.outriggerCondition} extended (${crane.outriggerSpreadLength}m x ${crane.outriggerSpreadWidth}m)`],
    ['Load Orientation', `${config.loadOrientation}`],
    ['Max Rated Capacity at Radius (Chart)', `${(calculation.ratedCapacityTon * 1000).toLocaleString()} kg (${calculation.ratedCapacityTon.toFixed(2)} Metric Ton)`],
  ];

  doc.setFontSize(8);
  specRows.forEach(([param, val], idx) => {
    const rowY = y + idx * 5.2;
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, rowY, pageWidth - margin * 2, 5.2, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(param, margin + 4, rowY + 3.8);

    doc.setFont('helvetica', param.includes('Rated Capacity') ? 'bold' : 'normal');
    doc.setTextColor(param.includes('Rated Capacity') ? 180 : 30, 41, 59);
    doc.text(val, margin + 75, rowY + 3.8);
  });

  y += specRows.length * 5.2 + 4;

  // SECTION 2: LOAD & RIGGING DEDUCTION SUMMARY
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('2. LOAD & RIGGING WEIGHT BREAKDOWN', margin + 3, y + 4.2);
  y += 8;

  const loadRows = [
    ['Net Equipment / Cargo Weight', `${config.netLoadWeightTon.toFixed(3)} ton`],
    ['Rigging Tackle (Slings, Shackles, Spreader)', `${config.riggingTackleWeightTon.toFixed(3)} ton`],
    ['Crane Hook Block Deduction', `${config.hookBlockWeightTon.toFixed(3)} ton`],
    ['Dynamic Contingency Allowance', `${(config.netLoadWeightTon * (config.contingencyAllowancePercent / 100)).toFixed(3)} ton (${config.contingencyAllowancePercent}%)`],
    ['TOTAL GROSS LIFT WEIGHT', `${calculation.grossLiftWeightTon.toFixed(3)} METRIC TONS`],
  ];

  loadRows.forEach(([item, val], idx) => {
    const rowY = y + idx * 5.0;
    const isTotal = item.includes('TOTAL');
    if (isTotal) {
      doc.setFillColor(224, 242, 254);
      doc.rect(margin, rowY, pageWidth - margin * 2, 5.2, 'F');
    }
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.setTextColor(isTotal ? 3 : 51, isTotal ? 105 : 65, isTotal ? 161 : 85);
    doc.text(item, margin + 4, rowY + 3.8);
    doc.setFont('courier', isTotal ? 'bold' : 'normal');
    doc.text(val, margin + 120, rowY + 3.8);
  });

  y += loadRows.length * 5.0 + 4;

  // SECTION 3: SAFETY CLASSIFICATION & UTILIZATION
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('3. LIFT CAPACITY UTILIZATION & SAFETY CLASSIFICATION', margin + 3, y + 4.2);
  y += 8;

  const isOverload = calculation.isOverload;
  const isCritical = calculation.isCriticalLift;
  const statusColor = isOverload ? [239, 68, 68] : isCritical ? [245, 158, 11] : [16, 185, 129];

  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.rect(margin, y, pageWidth - margin * 2, 14, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`CRANE CAPACITY UTILIZATION: ${calculation.effectiveUtilizationPercent.toFixed(1)}% (${calculation.safetyLevel})`, margin + 6, y + 5.5);
  doc.setFontSize(8);
  doc.text(`FORMULA: % Utilization = (Gross Lift Weight [${calculation.grossLiftWeightTon}t] / Rated Capacity [${calculation.effectiveRatedCapacityTon}t]) x 100`, margin + 6, y + 10.5);

  y += 18;

  // SECTION 4: GROUND BEARING PRESSURE & OUTRIGGER REACTIONS
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('4. GROUND BEARING PRESSURE (GBP) & OUTRIGGER REACTIONS', margin + 3, y + 4.2);
  y += 8;

  const gbpRows = [
    ['Outrigger Pad Dimensions', `${config.outriggerPadSizeM.toFixed(1)}m x ${config.outriggerPadSizeM.toFixed(1)}m (Area: ${(config.outriggerPadSizeM ** 2).toFixed(2)} m2)`],
    ['Max Reaction Force per Pad (Pmax)', `${calculation.outriggerForces.maxReactionTon.toFixed(2)} Metric Tons`],
    ['Calculated Ground Bearing Pressure', `${calculation.outriggerForces.groundBearingPressureKPa} kPa (${calculation.outriggerForces.groundBearingPressureTpm2} t/m2)`],
    ['Allowable Soil Bearing Capacity', `${calculation.outriggerForces.allowablePressureKPa} kPa`],
    ['Soil Verification Status', calculation.outriggerForces.isSoilSafe ? 'PASSED - Soil capacity exceeds maximum pressure' : 'FAILED - Mat enlargement required!'],
  ];

  gbpRows.forEach(([param, val], idx) => {
    const rowY = y + idx * 5.0;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(param, margin + 4, rowY + 3.8);

    doc.setFont('helvetica', param.includes('Status') ? 'bold' : 'normal');
    if (param.includes('Status')) {
      doc.setTextColor(calculation.outriggerForces.isSoilSafe ? 16 : 220, calculation.outriggerForces.isSoilSafe ? 185 : 38, calculation.outriggerForces.isSoilSafe ? 129 : 38);
    } else {
      doc.setTextColor(30, 41, 59);
    }
    doc.text(val, margin + 85, rowY + 3.8);
  });

  y += gbpRows.length * 5.0 + 8;

  // SECTION 5: ENGINEERING APPROVAL & SIGN-OFFS
  const signBoxY = Math.max(y + 2, pageHeight - margin - 35);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, signBoxY, pageWidth - margin * 2, 30, 'S');

  const colW = (pageWidth - margin * 2) / 3;
  ['Prepared by: Lift Planner', 'Reviewed by: Safety Officer', 'Approved by: Rigging Engineer (PE)'].forEach(
    (role, i) => {
      const colX = margin + i * colW;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(role, colX + 4, signBoxY + 5);

      // Signature line
      doc.line(colX + 4, signBoxY + 20, colX + colW - 6, signBoxY + 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Signature & Date Stamp', colX + 4, signBoxY + 25);
    }
  );

  // Download PDF
  const filename = `Crane_Lift_Plan_${crane.modelCode.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.pdf`;
  doc.save(filename);
}
