// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted. Speeds are given as fractions of c0 (beta) unless named in m/s.
import * as R from "./relativity.js";
import * as G from "./gravity.js";

const LAWS = {
  lorentzFactor: q => R.lorentzFactor(q.beta * R.C0),
  clockTime: q => R.clockTime(q.t, q.beta * R.C0),
  rodLength: q => R.rodLength(q.L, q.beta * R.C0),
  addVelocities: q => R.addVelocities(q.v * R.C0, q.w * R.C0),
  // |E'| seen from a frame moving at v (m/s) across a pure magnetic field B along z.
  boostedE: q => Math.hypot(...R.boostFields({ E: [0, 0, 0], B: [0, 0, q.B] }, q.v).E),
  apexHeight: q => G.apexHeight(q.v, q.g),
  // Seconds a clock h metres up gains over one on the ground while t seconds pass.
  clockGainTime: q => G.clockGain(q.h, q.g) * q.t,
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
