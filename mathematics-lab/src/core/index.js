// The core's front door: the mathematics of the script and the practice checker. Pure: no page, no clock, no randomness.
export { babylonian, cMul, cAbs, cArg, polar, cPow, geometricPartial, geometricSum, riemannSums, secantSlope, newton,
  bumpConstant, bump, det2, cramer2, symmetricEigen, contourIntegral, COMPLEX_FUNCTIONS } from "./maths.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";
