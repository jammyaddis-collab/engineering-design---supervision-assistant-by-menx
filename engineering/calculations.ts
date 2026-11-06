// engineering/calculations.ts

export interface OhmsLawInputs {
  voltage?: number;
  current?: number;
  resistance?: number;
}

export interface OhmsLawResult {
  voltage: number;
  current: number;
  resistance: number;
  calculated: 'voltage' | 'current' | 'resistance';
}

/**
 * Calculates the missing value in Ohm's Law (V = IR).
 * Requires exactly two of the three parameters.
 * @param {OhmsLawInputs} inputs - The input values.
 * @returns {OhmsLawResult} The result of the calculation.
 */
export function calculateOhmsLaw(inputs: OhmsLawInputs): OhmsLawResult {
  const { voltage, current, resistance } = inputs;

  const providedParams = Object.values(inputs).filter(v => v !== undefined).length;
  if (providedParams !== 2) {
    throw new Error("Please provide exactly two of the following: voltage, current, resistance.");
  }

  if (voltage === undefined) {
    const v = current! * resistance!;
    return { voltage: v, current: current!, resistance: resistance!, calculated: 'voltage' };
  }
  if (current === undefined) {
    const i = voltage! / resistance!;
    return { voltage: voltage!, current: i, resistance: resistance!, calculated: 'current' };
  }
  if (resistance === undefined) {
    const r = voltage! / current!;
    return { voltage: voltage!, current: current!, resistance: r, calculated: 'resistance' };
  }
  
  // This should not be reached due to the initial check
  throw new Error("Invalid combination of parameters for Ohm's Law.");
}


export interface BeamDeflectionInputs {
    uniformlyDistributedLoad: number; // w (e.g., in N/m)
    beamLength: number; // L (e.g., in meters)
    modulusOfElasticity: number; // E (e.g., in GPa)
    momentOfInertia: number; // I (e.g., in m^4)
}

export interface BeamDeflectionResult {
    maxDeflection: number; // (e.g., in mm)
}

/**
 * Calculates the maximum deflection of a simply supported beam under a uniform load.
 * Formula: δ_max = (5 * w * L^4) / (384 * E * I)
 * @param {BeamDeflectionInputs} inputs - The input parameters for the calculation.
 * @returns {BeamDeflectionResult} The calculated maximum deflection.
 */
export function calculateBeamDeflection(inputs: BeamDeflectionInputs): BeamDeflectionResult {
    const { uniformlyDistributedLoad, beamLength, modulusOfElasticity, momentOfInertia } = inputs;
    
    // Convert GPa to Pa for consistency in units (1 GPa = 1e9 Pa)
    const E_in_Pa = modulusOfElasticity * 1e9;
    
    const maxDeflectionInMeters = (5 * uniformlyDistributedLoad * Math.pow(beamLength, 4)) / (384 * E_in_Pa * momentOfInertia);

    // Convert result from meters to millimeters for more practical representation
    const maxDeflectionInMm = maxDeflectionInMeters * 1000;

    return { maxDeflection: maxDeflectionInMm };
}
