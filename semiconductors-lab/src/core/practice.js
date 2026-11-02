// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted.
import * as S from "./semiconductors.js";
import * as C from "./circuits.js";

const LAWS = {
  wellLevel: q => S.wellLevel(q.n, q.a, q.m),
  occupation: q => S.fermi(q.dE, 0, q.T),
  minority: q => S.carriers(q.ND, 0, S.intrinsic(q.T)).p,
  fermiAboveIntrinsic: q => S.fermiLevel(S.carriers(q.ND, 0, S.intrinsic(q.T)).n, S.intrinsic(q.T), q.T),
  barResistance: q => S.resistance(S.conductivity(q.n, q.p), q.L, q.w * q.d),
  photoResistance: q => { const dn = q.G * q.tau; return S.resistance(S.conductivity(q.ND + dn, dn), q.L, q.w * q.d); },
  driftTime: q => q.distance / (q.mu * q.E),
  diffusionLength: q => S.diffusionLength(S.diffusivity(q.mu, q.T), q.tau) / 100, // cm → m
  cutoff: q => S.wavelength(q.Eg),
  electronShare: q => S.electronShare(q.hw, q.Eg, q.mn, q.mp),
  depletionWidth: q => S.junction(q.NA, q.ND, q.U).d / 100, // cm → m
  capacitance: q => S.junctionCap(q.NA, q.ND, q.U) * q.area,
  saturationFromPoint: q => q.I / Math.expm1(q.U / (q.n * q.UT)),
  decade: q => q.n * q.UT * Math.log(10),
  collectorResistor: q => (q.U0 - q.Ua0) / q.IC,
  gain: q => -(q.U0 - q.Ua0) / q.UT,
  sourceFollower: q => q.Ue0 - q.Ut - Math.sqrt(2 * q.ID / q.beta),
  edgeOfOhmic: q => { const ID = q.beta / 2 * (0 - q.Ut) ** 2; return (q.U0 - (0 - q.Ut)) / ID; },
  ceGain: q => C.ceGain(q.IC, q.RC, q.RE, q.UT),
  sourceR: q => C.sourceR(q.Ia, q),
  classBAmplitude: q => Math.sqrt(2 * q.PL * q.RL),
  classBLossPerTransistor: q => q.UB * q.UB / (Math.PI * Math.PI * q.RL),
  // The worked example, Rechenbeispiele Beispiel 1: the case and sink temperatures and the largest sink resistance.
  heatSinkCase: q => C.heatSinkChain(q).case,
  heatSinkLimit: q => C.heatSinkChain(q).RthSink,
  abBias: q => C.abBias(q.UB0, q.twoUBE, q.R12),
  crossover: q => C.phaseMargin(q, q.beta).wc,
  phaseMargin: q => C.phaseMargin(q, q.beta).margin,
  powerBandwidth: q => C.powerBandwidth(q.SR, q.ua),
  slewAmplitude: q => q.SR / (2 * Math.PI * q.f),
  shotNoise: q => C.shotNoise(q.I, q.B),
  thermalNoise: q => C.thermalNoise(q.R, q.T, q.B),
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
