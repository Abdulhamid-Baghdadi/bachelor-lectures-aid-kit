// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted.
import * as M from "./maths.js";
import * as B from "./baseband.js";
import * as C from "./coding.js";
import * as R from "./carrier.js";

const LAWS = {
  snqrSineDB: q => M.dB(B.snqr(q.n, 2)),
  bitsForSnqr: q => Math.ceil((q.dB - 4.77 + M.dB(q.alpha)) / 6.02),
  pcmRate: q => q.fs * q.n * (q.channels ?? 1),
  pcmOutputDB: q => M.dB(B.pcmOutput(q.n, q.Pe)),
  entropy: q => C.entropy(q.p),
  huffmanLength: q => C.meanLength(q.p, C.huffman(q.p)),
  rcBandwidth: q => B.rcBandwidth(q.Rs, q.alpha),
  polarBER: q => B.BER.polar(M.fromDB(q.dB)),
  unipolarBER: q => B.BER.unipolar(M.fromDB(q.dB)),
  matchedSNRdB: q => M.dB(B.matchedSNR(q.E, q.N0)),
  repetition: q => C.repetitionError(q.n, q.p),
  wordError: q => C.wordError(q.n, q.t, q.p),
  hammingPosition: q => C.decodeHamming(q.r).pos,
  pskSER: q => R.symbolError("psk", q.M, M.fromDB(q.dB)),
  qamSER: q => R.symbolError("qam", q.M, M.fromDB(q.dB)),
  bpskPhase: q => R.bpskPhaseError(M.fromDB(q.dB), q.phiDeg * Math.PI / 180),
  timing: q => R.timingError(M.fromDB(q.dB), q.eps),
  friis: q => R.friis(q.stages),
  noiseFigure: q => M.dB(1 + q.Te / R.T0),
  outputNoiseDBm: q => M.dB(R.outputNoise(q.stages, q.Ts, q.B) / 1e-3),
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
