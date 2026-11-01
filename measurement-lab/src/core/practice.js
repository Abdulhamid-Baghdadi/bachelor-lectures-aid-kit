// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted.
import * as U from "./uncertainty.js";
import * as M from "./meters.js";
import * as B from "./bridge.js";
import * as P from "./power.js";
import * as D from "./digital.js";
import * as S from "./seismic.js";

const LAWS = {
  meanUncertainty: q => U.repeated(q.xs).u,
  studentU: q => U.studentT(q.N, q.a) * q.s / Math.sqrt(q.N),
  gauss: q => U.gauss(U.MODELS[q.model].f, q.x, q.s),
  powerLaw: q => U.relativePowerLaw(q.alphas, q.rel),
  shunt: q => M.shunt(q.RM, q.IM, q.I),
  seriesResistor: q => M.seriesResistor(q.U, q.I, q.Rpar),
  voltmeter: q => M.voltmeterReading(q.Uq, q.Ri, q.RV),
  currentCorrectRaw: q => M.currentCorrect(q.Rx, q.RA, q.RV).raw,
  voltageCorrectRaw: q => M.voltageCorrect(q.Rx, q.RA, q.RV).raw,
  crossover: q => M.crossover(q.RA, q.RV),
  formFactor: q => M.averages(M.WAVES[q.wave].f).form,
  rectifierReading: q => q.peak * M.meterReadings(M.WAVES[q.wave].f).rectifier,
  rectifierError: q => M.meterReadings(M.WAVES[q.wave].f).rectifierError,
  compensatingCT: q => M.compensatingCT(q),
  probeEdge: q => M.probeStep(q, 0),
  balance: q => B.balance(q.R1, q.R3, q.R4),
  gaugeBridge: q => B.deflection("quarter", q.U0, 1, q.K * B.strainFromForce(q.F, q.A, q.E)).linear,
  fullBridge: q => B.deflection("full", q.U0, 1, q.x).exact,
  activePower: q => P.powers(q.U, q.I, q.phiDeg * Math.PI / 180).P,
  voltagePathLoss: q => q.U * q.U / q.RU,
  gateResult: q => D.countFrequency(q.fx, q.T).f,
  periodResolution: q => D.countPeriod(q.fx, q.f0).resolution,
  counterCrossover: q => D.crossoverFrequency(q.f0, q.T),
  sarCode: q => D.sar(q.ux, D.binaryWeights(q.U0, q.n)).bits.reduce((s, b) => 2 * s + b, 0),
  dualSlope: q => D.dualSlope(q.ux, q.U0, q.Na, 1, 1).Nx,
  flashComparators: q => 2 ** q.n - 1,
  snrSine: q => D.snrSine(q.n),
  enob: q => D.enob(q.snr),
  quantisationNoise: q => D.quantisationNoise(q.range / 2 ** q.n),
  naturalHz: q => S.natural(q.c, q.m) / (2 * Math.PI),
  seismicGain: q => S.gain(q.W, q.D),
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
