// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted.
import * as F from "./fields.js";

const LAWS = {
  pointField: q => q.Q / (4 * Math.PI * F.EPS0 * q.r ** 2),
  flux: q => q.Q.reduce((a, b) => a + b, 0),
  wireH: q => F.wireH(q.I, q.r),
  inductionPeak: q => q.N * q.A * q.B * 2 * Math.PI * q.f,
  monopole: () => 0,
  chargeTime: q => q.Q / q.I,
  permittivity: q => F.material({ E: q.E, chi: q.chi }).D,
  speed: q => F.waveSpeed(q.epsr, q.mur ?? 1),
  poynting: q => F.wirePoynting(q.U, q.I, q.a, q.l).S,
  gyro: q => F.gyroRadius(q.q, q.m, q.v, q.B),
  laplaceMid: q => (q.U1 + q.U2) / 2,
  dipole: q => F.dipolePotential(q.p, q.r, q.theta),
  relaxation: q => F.relaxationTime(q.epsr, q.gamma),
  loopCentre: q => F.loopAxisB(q.I, q.a, 0),
  skin: q => F.skinDepth(q.f, q.gamma, q.mur ?? 1),
  waveH: q => F.planeWave(q.E).H,
  radiation: q => F.radiationResistance(q.l, q.lambda),
  lineZ: q => F.losslessLine(q.L, q.Cp).ZW,
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}

/** Is an answer right? Within a relative tolerance (2 % by default, for answers rounded by hand). */
export const isRight = (given, answer, tolerance = 0.02) =>
  tolerance === 0 ? given === answer : Math.abs(given - answer) <= tolerance * Math.abs(answer);
