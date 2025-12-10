import { DesignRequirements, DesignResult, GearParams, SimulationPoint } from '../types';

export const PI = Math.PI;

/**
 * Calculates the Lewis Form Factor (Y) for a given number of teeth.
 * Approximation based on standard involute profiles (20 degree pressure angle).
 */
export const calculateLewisFactor = (numTeeth: number): number => {
  return 0.484 - (2.87 / numTeeth);
};

/**
 * Generates the SVG path data for a simplified involute gear.
 */
export const generateGearPath = (teeth: number, modulus: number, pressureAngleDeg: number = 20): string => {
  const pitchDiameter = teeth * modulus;
  const outerDiameter = pitchDiameter + 2 * modulus;
  const rootDiameter = pitchDiameter - 2.5 * modulus;
  const baseDiameter = pitchDiameter * Math.cos((pressureAngleDeg * PI) / 180);

  const cx = 0;
  const cy = 0;
  const points: string[] = [];
  
  const stepsPerTooth = 4;
  const totalSteps = teeth * stepsPerTooth;
  const angleStep = (2 * PI) / totalSteps;

  // Simple trapezoidal approximation for visualization robustness
  // (True involute generation is computationally expensive for real-time SVG DOM updates)
  for (let i = 0; i < teeth; i++) {
    const angle0 = i * (2 * PI) / teeth;
    const angle1 = angle0 + (PI / teeth) * 0.5; // Tooth start
    const angle2 = angle0 + (PI / teeth) * 0.5; // Tip start
    const angle3 = angle0 + (PI / teeth) * 0.8; // Tip end
    const angle4 = angle0 + (PI / teeth) * 0.8; // Tooth end
    const angle5 = (i + 1) * (2 * PI) / teeth;

    const rRoot = rootDiameter / 2;
    const rOuter = outerDiameter / 2;

    // Root
    points.push(`L ${cx + rRoot * Math.cos(angle0)} ${cy + rRoot * Math.sin(angle0)}`);
    // Flank up
    points.push(`L ${cx + rOuter * Math.cos(angle2)} ${cy + rOuter * Math.sin(angle2)}`);
    // Top Land
    points.push(`L ${cx + rOuter * Math.cos(angle3)} ${cy + rOuter * Math.sin(angle3)}`);
    // Flank down
    points.push(`L ${cx + rRoot * Math.cos(angle5)} ${cy + rRoot * Math.sin(angle5)}`);
  }

  // Close path
  if (points.length > 0) {
    const startPoint = points[0].replace('L', 'M');
    return `${startPoint} ${points.slice(1).join(' ')} Z`;
  }
  return '';
};

/**
 * Inverse Design Logic: Solves for Module and Teeth to meet Torque/RPM requirements.
 */
export const calculateGearDesign = (req: DesignRequirements): DesignResult => {
  const ratio = req.nominalInputRPM / req.targetOutputRPM;
  
  // Design decision: Fix Pinion teeth to minimize undercutting (e.g., 18 for 20 deg PA)
  const pinionTeeth = 18;
  const gearTeeth = Math.round(pinionTeeth * ratio);
  
  // Recalculate exact ratio
  const actualRatio = gearTeeth / pinionTeeth;
  
  // Calculate Module based on Lewis Bending Strength Formula
  // Torque = Force * Radius
  // Force_tangential = Torque / (Radius_pitch)
  // Stress = F_t / (b * m * Y)
  // Assume Face Width (b) = 10 * module (Standard practice)
  // Yield Strength / SafetyFactor = Stress
  // ... Algebra ...
  // m = CubeRoot( (2 * Torque) / (10 * Y * Stress_allowable * Teeth_pinion) )
  
  const safetyFactor = 2.0;
  const allowableStress = (req.materialYieldStrength * 1000000) / safetyFactor; // Pa
  const Y = calculateLewisFactor(pinionTeeth);
  
  // Target Torque in Nm
  // We design based on Output torque on the Gear (usually higher load)
  // However, contact stress is same. Let's size pinion for bending as it is weaker usually.
  const pinionTorque = req.targetOutputTorque / actualRatio;

  // Solving for module (in meters)
  // m^3 = (2 * T) / (k * z * Y * sigma) where k = b/m ratio = 10
  const k = 10;
  const mCubed = (2 * pinionTorque) / (k * pinionTeeth * Y * allowableStress);
  let moduleMeters = Math.pow(mCubed, 1/3);
  
  // Convert to mm and round up to standard module steps
  let moduleMm = moduleMeters * 1000;
  const standardModules = [0.5, 0.8, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20];
  const selectedModule = standardModules.find(m => m >= moduleMm) || Math.ceil(moduleMm);

  // Final Dimensions
  const pinionParams: GearParams = {
    teeth: pinionTeeth,
    module: selectedModule,
    pressureAngle: 20,
    faceWidth: selectedModule * 10,
    rpm: req.nominalInputRPM,
    torque: pinionTorque,
    diameter: pinionTeeth * selectedModule
  };

  const gearParams: GearParams = {
    teeth: gearTeeth,
    module: selectedModule,
    pressureAngle: 20,
    faceWidth: selectedModule * 10,
    rpm: req.nominalInputRPM / actualRatio,
    torque: req.targetOutputTorque,
    diameter: gearTeeth * selectedModule
  };

  return {
    pinion: pinionParams,
    gear: gearParams,
    ratio: actualRatio,
    centerDistance: (pinionParams.diameter + gearParams.diameter) / 2,
    safetyFactor: safetyFactor // Simplified reporting
  };
};

/**
 * Simulates one time step of the gear train logic.
 */
export const simulateStep = (
  time: number, 
  design: DesignResult, 
  req: DesignRequirements
): SimulationPoint => {
  // Input variation logic
  let inputFactor = 1.0;
  if (req.inputVariability === 'sine') {
    inputFactor = 1 + 0.3 * Math.sin(time * 2); // +/- 30% ripple
  } else if (req.inputVariability === 'noise') {
    inputFactor = 1 + (Math.random() - 0.5) * 0.4;
  }

  const currentInputRPM = design.pinion.rpm * inputFactor;
  const currentOutputRPM = currentInputRPM / design.ratio;
  
  // Assume load is constant torque, so required input torque fluctuates? 
  // Or source is constant power?
  // Let's assume the SOURCE provides variable Torque capability, 
  // but the LOAD is constant Torque (e.g., lifting a weight).
  // This means if input RPM drops, power drops.
  
  const currentOutputTorque = design.gear.torque; // Constant load
  const currentInputTorque = currentOutputTorque / design.ratio;

  // Simple stress calculation (Lewis)
  const Y = calculateLewisFactor(design.pinion.teeth);
  const pitchRadiusMeters = (design.pinion.diameter / 2) / 1000;
  const faceWidthMeters = design.pinion.faceWidth / 1000;
  const moduleMeters = design.pinion.module / 1000;
  
  const tangentialForce = currentInputTorque / pitchRadiusMeters;
  const stressPa = tangentialForce / (faceWidthMeters * moduleMeters * Y);

  return {
    time,
    inputTorque: currentInputTorque,
    outputTorque: currentOutputTorque,
    inputRPM: currentInputRPM,
    outputRPM: currentOutputRPM,
    stress: stressPa / 1e6 // Convert to MPa
  };
};