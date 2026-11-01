// The core's front door: the laws, the units and the practice checker. Pure: no page, no clock, no randomness.
export { MU0, C0, EPS0, Z0, pointPotential, chargesField, enclosedCharge, fluxThroughSphere, wireH, induction, dipoleBFlux,
  charging, material, waveSpeed, wirePoynting, lorentzPath, gyroRadius, laplace, dipolePotential, dipoleField,
  relaxationTime, relaxed, loopAxisBNumeric, loopAxisB, skinDepth, skinB, planeWave, radiationResistance, dipolePattern,
  line, losslessLine } from "./fields.js";
export { si, parseSi } from "./units.js";
export { solve, isRight } from "./practice.js";
export { fresnel, brewsterAngle, criticalAngle, polarisation, lossyWave, waveguideModes, te10, microstrip, fresnelRadius,
  detour, link, dB, fromdB, radar, plateRCS, sphereRCS } from "./propagation.js";
