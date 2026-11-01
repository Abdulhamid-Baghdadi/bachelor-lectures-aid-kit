// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted.
import * as F from "./fields.js";
import * as P from "./propagation.js";

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
  // The course's exercise collection: the same laws, in the forms its worked solutions use.
  skinLoss: q => (q.N * q.I) ** 2 / (q.gamma * F.skinDepth(q.f, q.gamma)),
  // E = (U/r) sin θ: ⟨S⟩ = U² sin²θ /(2 Z0 r²), over a sphere P = 4π U² /(3 Z0).
  antennaPower: q => 4 * Math.PI * q.U ** 2 / (3 * F.Z0),
  // ⟨S⟩ = Ê²/(2 Z0) for linear polarisation, Ê²/Z0 for circular; H = E/Z0.
  waveAmplitude: q => Math.sqrt((q.polarisation === "linear" ? 2 : 1) * F.Z0 * q.S) / (q.find === "H" ? F.Z0 : 1),
  isotropic: q => Math.sqrt(q.P * F.Z0 / (4 * Math.PI * q.r ** 2)),
  coax: q => F.Z0 * Math.log(q.ratio) / (2 * Math.PI),
  twoWire: q => F.Z0 * Math.log(2 * q.ratio) / Math.PI,
  strip: q => F.Z0 * q.ratio,
  // Wave propagation, Lasser (2012).
  brewster: q => P.brewsterAngle(q.n1, q.n2) * 180 / Math.PI,
  ellipticity: q => P.polarisation(q.E1, q.E2, q.psi * Math.PI / 180).dB,
  lossyDepth: q => P.lossyWave(q.f, q.epsr, q.sigma).depth,
  te10Cutoff: q => P.te10(q.a, 1e12).cutoff,
  effPermittivity: q => P.microstrip(q.epsr, q.q, 1, 1e9).eff,
  fresnelDiameter: q => 2 * P.fresnelRadius(q.lambda, q.d / 2, q.d / 2),
  pathLoss: q => P.link(1, 1, 1, q.f, q.d).Liso,
  sphere: q => P.sphereRCS(q.r),
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
