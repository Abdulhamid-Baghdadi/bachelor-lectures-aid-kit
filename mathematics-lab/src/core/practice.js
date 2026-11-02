// A practice question's answer, worked from its data with the core, so the answer in labs.json is checked, never
// trusted.
import * as M from "./maths.js";

const LAWS = {
  babylonian: q => M.babylonian(q.a, q.x0, q.n).at(-1),
  geometricSum: q => M.geometricSum(q.q),
  newtonCubeRoot: q => M.newton(x => x ** 3 - q.a, x => 3 * x * x, q.x0, q.n).at(-1),
  cramerX: q => M.cramer2(...q.A.flat(), ...q.b)[0],
  eigenLarger: q => { const e = M.symmetricEigen(q.a, q.b, q.c); return Math.max(e.lambda, e.mu); },
  powerArgDeg: q => { const w = M.cPow(M.polar(q.r, q.phiDeg * Math.PI / 180), q.n); return ((M.cArg(w) * 180 / Math.PI) + 360) % 360; },
  riemannUpper: q => M.riemannSums(x => x * x, 0, 1, q.n).upper,
  bumpPeak: q => M.bump(q.n, 0),
  secantSlope: q => M.secantSlope(x => x ** 3 - 2 * x, q.x, q.h),
  contourIm: q => M.contourIntegral(M.COMPLEX_FUNCTIONS[q.f].f, q.z0, q.R)[1],
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
