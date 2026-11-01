// The core's front door: the laws, the units and the practice checker. Pure: no page, no clock, no randomness.
export { MU0, C0, EPS0, Z0, pointPotential, chargesField, enclosedCharge, fluxThroughSphere, wireH, induction, dipoleBFlux,
  charging, material, waveSpeed, wirePoynting, lorentzPath, gyroRadius, laplace, dipolePotential, dipoleField,
  relaxationTime, relaxed, loopAxisBNumeric, loopAxisB, skinDepth, skinB, planeWave, radiationResistance, dipolePattern,
  line, losslessLine } from "./fields.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";
export { fresnel, brewsterAngle, criticalAngle, polarisation, lossyWave, waveguideModes, te10, microstrip, fresnelRadius,
  detour, link, dB, fromdB, radar, plateRCS, sphereRCS, twoPath, fadeDepth, doppler, fadeSpacing, twoWaveField } from "./propagation.js";
export { lorentzFactor, boost, interval, clockTime, rodLength, addVelocities, boostFields, movingCharge } from "./relativity.js";
