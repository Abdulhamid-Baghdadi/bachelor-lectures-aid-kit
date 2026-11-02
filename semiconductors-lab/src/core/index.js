// The core's front door: the laws, the units and the practice checker. Pure: no page, no clock, no randomness beyond the
// seeded generator.
export { Q, K, H, HBAR, M0, EPS0, SI, epsSi, thermal, kpLhs, kpTransferHalfTrace, kpBands, kpEnergy, kpDispersion,
  coupledLevels, wellLevel, fermi, boltzmann, intrinsic, carriers, carriersByNeutrality, fermiLevel, intrinsicOffset,
  conductivity, resistance, diffusivity, diffusionLength, haynes, transient, injected, wavelength, absorption,
  electronShare, builtIn, junction, junctionCap, breakdown, saturation, diodeCurrent, diodeVoltage, collector, drain,
  threshold } from "./semiconductors.js";
export { ceGain, ceTransfer, sourceR, sourceRNodal, classBEfficiency, classBPowers, pushPull,
  classBLossOne, classBSupply, heatSinkChain, junctionTemp, abBias, abBiasWarm, emitterLoss, openLoop, phaseMargin,
  stepResponse, powerBandwidth, slewFollower, thermalNoise, shotNoise, gaussian } from "./circuits.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";
