export interface GearParams {
  teeth: number;
  module: number;
  pressureAngle: number; // in degrees
  faceWidth: number;
  rpm: number;
  torque: number; // Nm
  diameter: number; // Pitch diameter
}

export interface DesignRequirements {
  targetOutputTorque: number; // Nm
  targetOutputRPM: number;
  nominalInputRPM: number;
  materialYieldStrength: number; // MPa
  inputVariability: 'constant' | 'sine' | 'noise';
}

export interface SimulationPoint {
  time: number;
  inputTorque: number;
  outputTorque: number;
  inputRPM: number;
  outputRPM: number;
  stress: number; // MPa
}

export interface DesignResult {
  pinion: GearParams;
  gear: GearParams;
  ratio: number;
  centerDistance: number;
  safetyFactor: number;
}
