// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted.
import { C, cAbs } from "../../../kit/core/index.js";
import * as T from "./threephase.js";
import * as N from "./network.js";
import * as F from "./faults.js";
import * as M from "./machines.js";

const LAWS = {
  lineFromPhase: q => q.U * Math.sqrt(3),
  starLineCurrent: q => q.UL / Math.sqrt(3) / q.Z,
  deltaLineCurrent: q => Math.sqrt(3) * q.UL / q.Z,
  threePhaseP: q => T.powerFromLine(q.UL, q.IL, q.phi).P,
  threePhaseQ: q => T.powerFromLine(q.UL, q.IL, q.phi).Q,
  ohmsFromPu: q => T.ohmsFromPu(q.z, q.Ur, q.Sr),
  changeBase: q => T.changeBase(q.z, q.Sold, q.Uold, q.Snew, q.Unew),
  exampleIk3: q => F.ik3(q.c, q.Un, cAbs(F.exampleNetwork(q, q.Un).total)),
  exampleRX: q => { const z = F.exampleNetwork(q, q.Un).total; return z[0] / z[1]; },
  transformerZ: q => N.shortCircuitImpedance(q.uk, q.Ur, q.Sr),
  transformerR: q => q.Pk * q.Ur * q.Ur / (q.Sr * q.Sr),
  circulating: q => N.circulatingRatio(q.dk),
  voltageDropPercent: q => 100 * (1 - N.receivingVoltage(1, q.ur, N.uSigma(q.uk, q.ur), q.s * q.cos, q.s * Math.sin(Math.acos(q.cos)))),
  ferrantiPercent: q => 100 * (cAbs(N.lineSolve(q.line, q.l, 1, Infinity).U2) - 1),
  lineEndKV: q => cAbs(N.lineSolve(q.line, q.l, q.U1, q.P ? q.U1 * q.U1 / q.P : Infinity).U2),
  naturalLoadMW: q => N.naturalLoad(q.Un, N.lineConstants(q.line).Zw),
  maxTransferResistive: q => q.U1 * q.U1 / (2 * q.X),
  transferPpu: q => N.transferP(q.U1, q.U2, q.X, q.deltaDeg * Math.PI / 180),
  kappa: q => F.kappa(q.RX),
  peakCurrent: q => F.kappa(q.RX) * Math.SQRT2 * q.Ik,
  criticalAngleDeg: q => F.criticalAngle(q) * 180 / Math.PI,
  initialAngleDeg: q => Math.asin(q.Pm / q.Ppre) * 180 / Math.PI,
  polePairs: q => 60 * q.f / q.n,
  slip: q => M.slip(M.syncSpeed(q.f, q.p), q.n),
  dcArmatureResistance: q => (q.kPhi * q.n0 / 60 - q.kPhi * q.nN / 60) / q.IN,
  dcTorque: q => M.dcTorque(q.kPhi, q.phi, q.J),
  dcNoLoadSpeed: q => M.dcSpeed(q.UA, 0, q.kPhi, q.phi, 0),
  dcVoltageFor: q => q.J * q.RA + q.kPhi * q.n / 60,
  pmsmPhaseCurrent: q => M.phaseValues(M.toStator(C(0, q.m / q.psiM), q.gammaDeg))[q.phase],
  pmsmVoltage: q => cAbs(M.pmsm(q).us),
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
