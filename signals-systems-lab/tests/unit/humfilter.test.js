// The worked example: the moving average of Doblinger (2015), Beispiele 3.7, 3.9 and 5.7, against mains hum. Each law
// against its definition in the notes, and the filter against the hum it is meant to remove.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as S from "../../src/core/index.js";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} is not ${b} ± ${tol}`);

test("|H| of (3.48) is the magnitude of the DTFT of h[n] = 1/N (3.45), by definition", () => {
  for (const N of [3, 6, 9]) for (const th of [0.1, 0.7, 1.9, 3]) near(S.maMagnitude(N, th), S.cAbs(S.response(S.movingAverage(N), [1], th / (2 * Math.PI))), 1e-12);
  near(S.maMagnitude(6, 0), 1, 0);
});

test("the notches lie at θk = 2πk/N, the zeros of (5.37): N = 6 at 300 Hz blocks 50, 100 and 150 Hz, Beispiel 5.7, p. 105", () => {
  assert.deepEqual(S.maNotches(6, 300), [50, 100, 150]);
  for (const f of [50, 100, 150]) near(S.maMagnitude(6, 2 * Math.PI * f / 300), 0, 1e-12);
});

test("the step response settles at n = N − 1 and keeps the mean (Beispiel 3.9, p. 55)", () => {
  const y = S.fir(new Array(40).fill(1), S.movingAverage(6));
  y.slice(0, 5).forEach((v, n) => near(v, (n + 1) / 6, 1e-12));
  y.slice(5).forEach(v => near(v, 1, 1e-12));
});

test("sampled at 300 Hz the 250 Hz harmonic folds onto 50 Hz (4.52)", () => {
  near(S.alias(250, 300), 50, 1e-12);
});

test("with N = fs/50 the hum is gone: the output is the sensor signal delayed by (N − 1)/2 samples (3.47)", () => {
  const { x } = S.humSamples(300, 600), y = S.fir(x, S.movingAverage(6));
  const err = Math.max(...y.slice(6).map((v, k) => Math.abs(v - S.sensor((k + 6 - 2.5) / 300))));
  assert.ok(err < 1e-3, `${err}`);
  // N = 5 misses the hum: the notches lie at 60 and 120 Hz.
  const y5 = S.fir(x, S.movingAverage(5));
  assert.ok(Math.max(...y5.slice(5).map((v, k) => Math.abs(v - S.sensor((k + 5 - 2) / 300)))) > 0.05);
});
