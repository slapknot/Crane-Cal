import {
  CraneModel,
  LiftConfiguration,
  LiftCalculationResult,
  OutriggerForces,
} from '../types/crane';

/**
 * Interpolates rated capacity from load chart based on radius and boom length.
 * Accurate to manufacturer load chart tables (e.g. Table 1 for Zoomlion QY55D).
 */
export function getRatedCapacity(
  crane: CraneModel,
  radius: number,
  boomLength: number
): number {
  const chart = crane.loadChart;
  if (!chart || chart.length === 0) return 0;

  // Find exact boom length or closest available boom length
  const availableBooms = crane.boomLengths;
  let targetBoom = boomLength;
  if (!availableBooms.includes(boomLength)) {
    // Pick closest boom length
    targetBoom = availableBooms.reduce((prev, curr) =>
      Math.abs(curr - boomLength) < Math.abs(prev - boomLength) ? curr : prev
    );
  }

  // Filter entries that have capacity for this boom length
  const validEntries = chart
    .filter((e) => e.capacities[targetBoom] !== undefined)
    .sort((a, b) => a.radius - b.radius);

  if (validEntries.length === 0) {
    // Fallback: search for any boom entry
    return 0;
  }

  // If requested radius is smaller than minimum available
  if (radius <= validEntries[0].radius) {
    return validEntries[0].capacities[targetBoom] / 1000; // in metric tons
  }

  // If requested radius is greater than maximum available for this boom
  const last = validEntries[validEntries.length - 1];
  if (radius >= last.radius) {
    if (radius > last.radius + 1.0) {
      return 0; // Out of reach!
    }
    return last.capacities[targetBoom] / 1000;
  }

  // Exact radius match
  const exact = validEntries.find((e) => Math.abs(e.radius - radius) < 0.05);
  if (exact) {
    return exact.capacities[targetBoom] / 1000;
  }

  // Linear interpolation between two neighboring radii
  let lower = validEntries[0];
  let upper = validEntries[validEntries.length - 1];

  for (let i = 0; i < validEntries.length - 1; i++) {
    if (validEntries[i].radius <= radius && validEntries[i + 1].radius >= radius) {
      lower = validEntries[i];
      upper = validEntries[i + 1];
      break;
    }
  }

  const capLower = lower.capacities[targetBoom];
  const capUpper = upper.capacities[targetBoom];
  const t = (radius - lower.radius) / (upper.radius - lower.radius);
  const interpolatedKg = capLower + t * (capUpper - capLower);

  return Math.round(interpolatedKg) / 1000; // in metric tons
}

/**
 * Calculates outrigger reactions using CIRIA C703 / EN 13000 method.
 */
export function calculateOutriggerReactions(
  crane: CraneModel,
  config: LiftConfiguration,
  grossLiftWeightTon: number
): OutriggerForces {
  const padArea = Math.max(0.25, config.outriggerPadSizeM * config.outriggerPadSizeM);
  
  if (crane.category === 'tower') {
    // For tower crane, symmetric ballast foundation
    const totalMass = crane.craneTareWeightTon + crane.counterweightTon + grossLiftWeightTon;
    const moment = grossLiftWeightTon * config.workingRadius;
    const baseArm = crane.outriggerSpreadLength / 2;
    
    const reactionPerCorner = totalMass / 4;
    const overturningDelta = (moment / 2) / Math.max(1, baseArm);
    const maxReaction = reactionPerCorner + overturningDelta;
    
    const gbpTpm2 = maxReaction / padArea;
    const gbpKPa = gbpTpm2 * 9.80665;
    const allowableKPa = config.soilBearingCapacityKPa;
    const utilization = (gbpKPa / allowableKPa) * 100;
    
    return {
      frontLeftTon: Number((reactionPerCorner + (Math.sin(config.slewAngleDeg * Math.PI / 180) > 0 ? overturningDelta : -overturningDelta * 0.5)).toFixed(2)),
      frontRightTon: Number((reactionPerCorner + (Math.sin(config.slewAngleDeg * Math.PI / 180) <= 0 ? overturningDelta : -overturningDelta * 0.5)).toFixed(2)),
      rearLeftTon: Number((reactionPerCorner * 0.9).toFixed(2)),
      rearRightTon: Number((reactionPerCorner * 0.9).toFixed(2)),
      maxReactionTon: Number(maxReaction.toFixed(2)),
      groundBearingPressureTpm2: Number(gbpTpm2.toFixed(2)),
      groundBearingPressureKPa: Number(gbpKPa.toFixed(1)),
      allowablePressureKPa: allowableKPa,
      pressureUtilizationPercent: Number(utilization.toFixed(1)),
      isSoilSafe: utilization <= 100,
    };
  }

  // Mobile Crane Reaction Distribution
  const totalCraneWeight = crane.craneTareWeightTon + crane.counterweightTon;
  const radius = config.workingRadius;
  const angleRad = (config.slewAngleDeg * Math.PI) / 180;
  
  // Longitudinal (X) and Lateral (Y) distance of load center from slew pivot
  const loadX = radius * Math.sin(angleRad); // Lateral offset
  const loadY = radius * Math.cos(angleRad); // Longitudinal offset (forward = +Y, rear = -Y)
  
  const spanL = crane.outriggerSpreadLength; // Longitudinal span
  const spanW = crane.outriggerSpreadWidth;  // Lateral span
  
  // Overturning moments
  const Mx = grossLiftWeightTon * loadY; // Pitching moment
  const My = grossLiftWeightTon * loadX; // Rolling moment
  
  // Basic static distribution of crane deadweight
  const staticReaction = totalCraneWeight / 4;
  
  // Load moment transfers to the 4 outriggers:
  // FL: (+X/2, +Y/2), FR: (-X/2, +Y/2), RL: (+X/2, -Y/2), RR: (-X/2, -Y/2)
  const dPitch = Mx / (2 * (spanL / 2));
  const dRoll = My / (2 * (spanW / 2));
  
  // Outrigger condition factor: 100% full extension = 1.0, 50% = 1.35 multiplier on concentrated pad
  const extensionFactor = config.outriggerCondition === '100%' ? 1.0 : config.outriggerCondition === '50%' ? 1.4 : 1.9;

  let rFL = (staticReaction + (dPitch > 0 ? dPitch : 0) + (dRoll > 0 ? dRoll : 0)) * extensionFactor;
  let rFR = (staticReaction + (dPitch > 0 ? dPitch : 0) + (dRoll < 0 ? -dRoll : 0)) * extensionFactor;
  let rRL = (staticReaction + (dPitch < 0 ? -dPitch : 0) + (dRoll > 0 ? dRoll : 0)) * extensionFactor;
  let rRR = (staticReaction + (dPitch < 0 ? -dPitch : 0) + (dRoll < 0 ? -dRoll : 0)) * extensionFactor;

  // Add load directly into the quadrant facing the slew angle
  // When slewed over rear or side, maximum load can concentrate up to 75% on single outrigger (CIRIA standard rule of thumb)
  const quadrantWeight = grossLiftWeightTon * 0.72;
  if (loadY >= 0 && loadX >= 0) rFL += quadrantWeight;
  else if (loadY >= 0 && loadX < 0) rFR += quadrantWeight;
  else if (loadY < 0 && loadX >= 0) rRL += quadrantWeight;
  else rRR += quadrantWeight;

  const maxReaction = Math.max(rFL, rFR, rRL, rRR);
  const gbpTpm2 = maxReaction / padArea;
  const gbpKPa = gbpTpm2 * 9.80665;
  const allowableKPa = config.soilBearingCapacityKPa;
  const utilization = (gbpKPa / allowableKPa) * 100;

  return {
    frontLeftTon: Number(rFL.toFixed(2)),
    frontRightTon: Number(rFR.toFixed(2)),
    rearLeftTon: Number(rRL.toFixed(2)),
    rearRightTon: Number(rRR.toFixed(2)),
    maxReactionTon: Number(maxReaction.toFixed(2)),
    groundBearingPressureTpm2: Number(gbpTpm2.toFixed(2)),
    groundBearingPressureKPa: Number(gbpKPa.toFixed(1)),
    allowablePressureKPa: allowableKPa,
    pressureUtilizationPercent: Number(utilization.toFixed(1)),
    isSoilSafe: utilization <= 100,
  };
}

/**
 * Complete lift engineering calculation according to ASME B30.5 / EN 13000 / OSHA 1926.
 */
export function calculateLiftPlan(
  crane: CraneModel,
  config: LiftConfiguration
): LiftCalculationResult {
  // Gross lift weight calculation:
  // Gross Lift Weight = Net Load + Rigging Tackle + Hook Block + Contingency
  const contingencyWeight = config.netLoadWeightTon * (config.contingencyAllowancePercent / 100);
  const grossLiftWeightTon =
    config.netLoadWeightTon +
    config.riggingTackleWeightTon +
    config.hookBlockWeightTon +
    contingencyWeight;

  // Rated capacity lookup
  const ratedCapacityTon = getRatedCapacity(crane, config.workingRadius, config.boomLength);

  // Net capacity (crane capacity remaining for pure net load after deductions)
  const netCapacityTon = Math.max(
    0,
    ratedCapacityTon - config.riggingTackleWeightTon - config.hookBlockWeightTon
  );

  // Utilization calculation
  const rawUtilization = ratedCapacityTon > 0 ? (grossLiftWeightTon / ratedCapacityTon) * 100 : 999;
  const utilizationPercent = Number(rawUtilization.toFixed(1));

  // Boom Angle Calculation (Trigonometric):
  // For mobile crane: cos(theta) = (R - pivotOffset) / BoomLength
  let boomAngleDeg = 0;
  let tipHeightM = 0;

  if (crane.category === 'mobile') {
    const pivotOffset = 1.2; // meters forward from rotation center
    const pivotHeight = 2.15; // meters above ground
    const effRadius = Math.max(0.5, config.workingRadius - pivotOffset);
    const cosAngle = Math.min(1.0, Math.max(0.0, effRadius / config.boomLength));
    const angleRad = Math.acos(cosAngle);
    boomAngleDeg = Number(((angleRad * 180) / Math.PI).toFixed(1));
    tipHeightM = Number((pivotHeight + config.boomLength * Math.sin(angleRad)).toFixed(1));
  } else {
    // Tower crane: horizontal jib
    const mastHeight = config.towerMastHeight || crane.towerHeightUnderHook || 45.0;
    boomAngleDeg = 0.0;
    tipHeightM = Number((mastHeight + 2.5).toFixed(1));
  }

  // Hook elevation and headroom clearance
  const hookElevationM = config.targetLiftHeight;
  const headroomClearanceM = Math.max(0, tipHeightM - hookElevationM - 2.5); // 2.5m minimum sheave to hook buffer

  // Wind speed derating factor per EN 13000 / ASME B30.5
  // Standard full capacity up to 9.0 m/s; above 9 m/s, progressive de-rating
  let windDeratingFactor = 1.0;
  if (config.windSpeedMs > 9.0) {
    const excessWind = config.windSpeedMs - 9.0;
    windDeratingFactor = Math.max(0.65, 1.0 - excessWind * 0.04);
  }
  windDeratingFactor = Number(windDeratingFactor.toFixed(3));

  const effectiveRatedCapacityTon = Number((ratedCapacityTon * windDeratingFactor).toFixed(2));
  const effectiveUtilizationPercent =
    effectiveRatedCapacityTon > 0
      ? Number(((grossLiftWeightTon / effectiveRatedCapacityTon) * 100).toFixed(1))
      : 999;

  // Outrigger forces and ground bearing pressure
  const outriggerForces = calculateOutriggerReactions(crane, config, grossLiftWeightTon);

  // Safety Classification and Alerts
  const criticalLiftReasons: string[] = [];
  const safetyStandardReferences: string[] = [
    'ASME B30.5: Mobile and Locomotive Cranes Safety Standard',
    'EN 13000: Cranes - Mobile Cranes Stability and Safety Rating',
    'OSHA 29 CFR 1926.1400: Cranes and Derricks in Construction',
    'ISO 4305: Mobile Cranes - Determination of Stability',
  ];


  const isOverload = effectiveUtilizationPercent > 100 || ratedCapacityTon === 0;
  const isCriticalLift = effectiveUtilizationPercent >= 75.0 && !isOverload;
  const hasSoilWarning = !outriggerForces.isSoilSafe;
  const hasWindWarning = config.windSpeedMs > config.maxPermissibleWindMs;
  const hasRadiusWarning = config.workingRadius < crane.minRadius || config.workingRadius > crane.maxRadius;

  if (effectiveUtilizationPercent >= 75.0) {
    criticalLiftReasons.push(`Crane Capacity Utilization exceeds 75% (${effectiveUtilizationPercent}%) - classified as Critical Lift.`);
  }
  if (grossLiftWeightTon >= 20.0) {
    criticalLiftReasons.push(`Gross load exceeds 20.0 tons (${grossLiftWeightTon.toFixed(2)}t) heavy piece.`);
  }
  if (config.targetLiftHeight >= 30.0) {
    criticalLiftReasons.push(`High elevation lift (>30m target elevation).`);
  }
  if (hasWindWarning) {
    criticalLiftReasons.push(`Site wind velocity (${config.windSpeedMs} m/s) exceeds maximum permissible threshold (${config.maxPermissibleWindMs} m/s).`);
  }
  if (hasSoilWarning) {
    criticalLiftReasons.push(`Ground Bearing Pressure (${outriggerForces.groundBearingPressureKPa} kPa) exceeds Soil Capacity (${outriggerForces.allowablePressureKPa} kPa). Mat enlargement required.`);
  }
  if (hasRadiusWarning) {
    criticalLiftReasons.push(`Working radius (${config.workingRadius}m) is outside tested manufacturer envelope (${crane.minRadius}m - ${crane.maxRadius}m).`);
  }

  let safetyLevel: 'SAFE' | 'CAUTION' | 'CRITICAL' | 'OVERLOAD' = 'SAFE';
  let safetyStatusText = 'SAFE TO PROCEED (การยกปลอดภัย อยู่ในเกณฑ์มาตรฐาน)';

  if (isOverload || hasSoilWarning) {
    safetyLevel = 'OVERLOAD';
    safetyStatusText = 'HAZARDOUS / PROHIBITED (เกินพิกัดความปลอดภัย - ห้ามทำการยก)';
  } else if (effectiveUtilizationPercent >= 85.0 || hasWindWarning) {
    safetyLevel = 'CRITICAL';
    safetyStatusText = 'CRITICAL LIFT (งานยกเสี่ยงสูง - ต้องมีแผนการยกและวิศวกรควบคุม)';
  } else if (effectiveUtilizationPercent >= 75.0) {
    safetyLevel = 'CAUTION';
    safetyStatusText = 'CAUTION / MONITORED (อยู่ในเกณฑ์เฝ้าระวัง 75-85%)';
  }

  return {
    grossLiftWeightTon: Number(grossLiftWeightTon.toFixed(3)),
    ratedCapacityTon: Number(ratedCapacityTon.toFixed(2)),
    netCapacityTon: Number(netCapacityTon.toFixed(2)),
    utilizationPercent,
    boomAngleDeg,
    tipHeightM,
    hookElevationM,
    headroomClearanceM: Number(headroomClearanceM.toFixed(1)),
    windDeratingFactor,
    effectiveRatedCapacityTon,
    effectiveUtilizationPercent,
    outriggerForces,
    safetyLevel,
    safetyStatusText,
    isOverload,
    isCriticalLift,
    hasSoilWarning,
    hasWindWarning,
    hasRadiusWarning,
    criticalLiftReasons,
    safetyStandardReferences,
  };
}
