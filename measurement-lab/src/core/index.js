// The core's front door: the laws, the units and the practice checker. Pure: no page, no clock, no randomness beyond the
// seeded generators.
export { uniform, gaussian, mean, std, dB } from "./maths.js";
export { STUDENT, LEVELS, studentT, repeated, readings, partials, systematic, relativePowerLaw, gauss, worstCase,
  monteCarlo, spreadAxes, MODELS } from "./uncertainty.js";
export { parallel, voltmeterReading, ammeterReading, loadingError, shunt, seriesResistor, currentCorrect, voltageCorrect,
  crossover, WAVES, distorted, averages, FORM_SINE, meterReadings, probeStep, probeRatio, compensatingCT,
  probeStepNumeric } from "./meters.js";
export { diagonal, balance, ARRANGEMENTS, arms, deflection, loaded, loadedByNodes, strainFromForce } from "./bridge.js";
export { powers, meanProduct, instantaneous, wattmeter } from "./power.js";
export { edgesInGate, countFrequency, countPeriod, crossoverFrequency, display, flash, sar, binaryWeights, dualSlope,
  dualSlopeTrace, quantise, quantisationNoise, snrDC, snrSine, enob, snrMeasured } from "./digital.js";
export { natural, damping, gain, phase, gainBySimulation, motion } from "./seismic.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";
