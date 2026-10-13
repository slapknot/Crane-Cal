export type CraneCategory = 'mobile' | 'tower';

export type OutriggerExtension = '100%' | '50%' | '0%';

export interface LoadChartEntry {
  radius: number; // in meters
  capacities: {
    [boomLength: number]: number; // capacity in kg (or metric tons)
  };
}

export interface CraneModel {
  id: string;
  name: string;
  modelCode: string;
  category: CraneCategory;
  craneTypeLabel: string; // e.g. 'Rough Terrain Crane', 'All Terrain Crane', 'Truck Crane', 'Tower Crane'
  manufacturer: string;
  maxRatedCapacityTon: number;
  boomLengths: number[]; // Available boom lengths in meters
  minRadius: number;
  maxRadius: number;
  maxTipHeight: number;
  craneTareWeightTon: number; // self weight of crane chassis + superstructure
  counterweightTon: number;
  outriggerSpreadLength: number; // meters (longitudinal)
  outriggerSpreadWidth: number; // meters (lateral)
  defaultPadSizeM: number; // e.g. 1.0 m x 1.0 m
  reevingHookOptions: {
    partsOfLine: number;
    maxLineCapacityTon: number;
    hookWeightTon: number;
  }[];
  loadChart: LoadChartEntry[];
  // For tower crane
  towerHeightUnderHook?: number; // meters
  towerJibLength?: number; // meters
  towerTipCapacityTon?: number;
  towerMaxCapacityRadius?: number;
}

export interface LiftConfiguration {
  craneModelId: string;
  craneCategory: CraneCategory;
  projectName: string;
  location: string;
  liftDate: string;
  plannerName: string;
  
  // Geometry
  boomLength: number; // meters (or jib length for tower crane)
  workingRadius: number; // meters
  targetLiftHeight: number; // meters
  slewAngleDeg: number; // 0 to 360 degrees
  towerMastHeight?: number; // meters (for tower crane)
  
  // Weights
  netLoadWeightTon: number; // Net weight of equipment to lift
  riggingTackleWeightTon: number; // Slings, shackles, spreader beams
  hookBlockWeightTon: number; // Crane hook block
  contingencyAllowancePercent: number; // e.g. 5% dynamic allowance
  
  // Outrigger & Soil Conditions
  outriggerCondition: OutriggerExtension;
  outriggerPadSizeM: number; // Mat dimension (square length, e.g. 1.2m -> 1.44 m2)
  soilBearingCapacityKPa: number; // Soil allowable bearing capacity (e.g. 200 kPa = 20.4 t/m2)
  loadOrientation: 'Over sides and rear' | '360 degree full slew' | 'Over front';
  
  // Environmental & Site
  windSpeedMs: number; // Wind velocity in m/s
  maxPermissibleWindMs: number; // Typically 9-14 m/s
  partsOfLine: number;
  obstacleDistanceM?: number;
  obstacleHeightM?: number;
}

export interface OutriggerForces {
  frontLeftTon: number;
  frontRightTon: number;
  rearLeftTon: number;
  rearRightTon: number;
  maxReactionTon: number;
  groundBearingPressureTpm2: number; // t/m2
  groundBearingPressureKPa: number; // kPa
  allowablePressureKPa: number;
  pressureUtilizationPercent: number;
  isSoilSafe: boolean;
}

export interface LiftCalculationResult {
  grossLiftWeightTon: number; // Net + Rigging + Hook + contingency
  ratedCapacityTon: number; // Capacity from chart at current radius & boom
  netCapacityTon: number; // Rated capacity - hook & rigging
  utilizationPercent: number; // (Gross / Rated) * 100
  boomAngleDeg: number; // Angle from horizontal
  tipHeightM: number; // Height of boom tip / jib head above ground
  hookElevationM: number;
  headroomClearanceM: number; // Clearance between boom head and top of load
  windDeratingFactor: number; // 0.8 to 1.0 based on wind speed
  effectiveRatedCapacityTon: number; // Rated * Wind Factor
  effectiveUtilizationPercent: number;
  
  outriggerForces: OutriggerForces;
  
  safetyLevel: 'SAFE' | 'CAUTION' | 'CRITICAL' | 'OVERLOAD';
  safetyStatusText: string;
  isOverload: boolean;
  isCriticalLift: boolean;
  hasSoilWarning: boolean;
  hasWindWarning: boolean;
  hasRadiusWarning: boolean;
  
  criticalLiftReasons: string[];
  safetyStandardReferences: string[];
}
