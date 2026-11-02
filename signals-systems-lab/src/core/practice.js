// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted.
import * as S from "./signals.js";

const LAWS = {
  // Pulse of height A and length T into h(t) = e^(−t/τ): y(T) = A τ (1 − e^(−T/τ)).
  pulseDecay: q => S.convolve(t => t >= 0 && t < q.T ? q.A : 0, t => t >= 0 ? Math.exp(-t / q.tau) : 0, q.t, { from: 0, to: q.T, n: 4000 }),
  // Linearity and time invariance: a pulse is a step minus a delayed step, so y(t) = s(t) − s(t − T).
  stepPulse: q => { const s = t => t >= 0 ? 1 - Math.exp(-t / q.tau) : 0; return s(q.t) - s(q.t - q.T); },
  smoothVariance: q => S.smoothVariance(q.sigma2, q.a),
  pulseZero: q => 1 / q.T,
  pulseArea: q => S.pulseSpectrum(q.A, q.T, 0),
  echoDistance: q => q.c * q.delay / 2,
  seriesCoefficient: q => S.WAVES[q.wave].coeff(q.k),
  harmonicIrms: q => S.harmonics(q.U, q.parts).Irms,
  distortionPower: q => S.harmonics(q.U, q.parts).D,
  reindexCount: q => S.reindex(Array(q.len).fill(1), 0, q.map, Array.from({ length: 41 }, (_, k) => k - 20)).filter(v => v).length,
  alias: q => S.alias(q.f, q.fs),
  sincMidpoint: q => S.reconstruct([1], 1, q.t),
  idealTap: q => 2 * q.fc * S.sinc(2 * q.fc * q.offset),
  // The pole of a Butterworth low-pass of order N by the bilinear transform, its real part.
  bilinearPole: q => S.butterworth(q.N, q.fc, q.fs).poles[0][0],
  prewarp: q => 2 * q.fs * Math.tan(Math.PI * q.fc / q.fs) / (2 * Math.PI),
  binSpacing: q => q.fs / q.N,
  antiAlias: q => q.fs / (2 * q.M),
  // The worked example: the moving average (3.45) and its first notch fs/N (5.37).
  maMagnitude: q => S.maMagnitude(q.N, 2 * Math.PI * q.f / q.fs),
  maFirstNotch: q => S.maNotches(q.N, q.fs)[0],
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}

