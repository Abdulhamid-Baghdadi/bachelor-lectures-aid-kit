// A practice question's answer, worked from its data with the integrals of the core, so the answer in labs.json is
// checked, never trusted.
import * as V from "./vector.js";

const LAWS = {
  // ∫ F • dx along the segment from p to q.
  segmentIntegral: q => V.lineIntegral(V.FIELDS[q.field].f, V.segment(q.p, q.q)),
  // ∮ F • dx once round the circle of radius R about (cx, cy), counter-clockwise.
  circulation: q => V.lineIntegral(V.FIELDS[q.field].f, V.circle(q.cx, q.cy, q.R)),
  // ∫ F • dO out of the sphere of radius R about (cx, cy, 0).
  sphereFlux: q => V.fluxThroughSphere(V.FIELDS[q.field].f, q.cx, q.cy, q.R),
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
