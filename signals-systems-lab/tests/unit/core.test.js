// The signal core against a second route: a numerical integral against its closed form, the FFT against the DFT,
// a seeded noise estimate against its theory, or a value that holds by definition.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as S from "../../src/core/signals.js";
import { cAbs } from "../../../kit/core/index.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);

test("a 1 s pulse convolved with e^(−2t) matches the closed form (1 − e^(−2t))/2, then its decay", () => {
  near(S.convolve(S.SHAPES.rect, S.SHAPES.decay, 0.5, { n: 4000 }), (1 - Math.exp(-1)) / 2, 1e-3, "rising");
  near(S.convolve(S.SHAPES.rect, S.SHAPES.decay, 2, { n: 4000 }), (1 - Math.exp(-2)) / 2 * Math.exp(-2), 1e-3, "falling");
});

test("the linear, time-invariant systems pass both tests; the others fail the one they break", () => {
  const ts = S.range(0, 3, 31), x1 = S.SHAPES.rect, x2 = S.SHAPES.tri;
  for (const id of ["gain", "delay", "lowpass"]) {
    near(S.linearityError(S.SYSTEMS[id].run, x1, x2, 2, -1, ts), 0, 1e-9, `${id} linear`);
    near(S.shiftError(S.SYSTEMS[id].run, x2, 0.7, ts), 0, 2e-2, `${id} time-invariant`);
  }
  assert.ok(S.linearityError(S.SYSTEMS.square.run, x1, x2, 2, -1, ts) > 0.5, "square-law is not linear");
  assert.ok(S.linearityError(S.SYSTEMS.offset.run, x1, x2, 2, 1, ts) > 0.1, "offset is not linear");
  near(S.shiftError(S.SYSTEMS.square.run, x2, 0.7, ts), 0, 1e-9, "square-law is time-invariant");
  assert.ok(S.shiftError(S.SYSTEMS.ramp.run, x2, 0.7, ts) > 0.3, "t·x is not time-invariant");
});

test("seeded noise repeats, and smoothing white noise leaves the variance σ²(1 − a)/(1 + a)", () => {
  assert.deepEqual(S.noise(5, 1, 7), S.noise(5, 1, 7));
  const x = S.noise(200000, 1, 3), y = S.smooth(x, 0.9);
  const v = y.reduce((s, q) => s + q * q, 0) / y.length;
  near(v, S.smoothVariance(1, 0.9), 0.003, "variance");
  const r = S.correlate(y.slice(0, 20000), y.slice(0, 20000), 3);
  near(r[4] / r[3], 0.9, 0.03, "autocorrelation falls as a^k");
});

test("the numerical Fourier transform of a pulse is A T sinc(fT)", () => {
  const pulse = t => Math.abs(t) < 0.5 ? 2 : 0;
  for (const f of [0, 0.7, 1, 2.3]) near(S.fourier(pulse, f, { n: 8000 })[0], S.pulseSpectrum(2, 1, f), 2e-3, `f = ${f}`);
});

test("Fourier partial sums approach each wave away from its jumps, and the square wave overshoots its jump by about 9 %", () => {
  for (const wave of ["square", "sawtooth", "triangle"]) near(S.partialSum(wave, 401, 0.2), S.WAVES[wave].exact(0.2), 0.01, wave);
  const peak = Math.max(...S.range(0, 0.05, 400).map(t => S.partialSum("square", 101, t)));
  near(peak, 1.17898, 0.003, "Gibbs overshoot, (2/π) Si(π)");
});

// Prechtl (2010), section 6.3, p. 127, sine voltage and a current with harmonics: (6.23) I and S, (6.24) P,
// (6.26) Q1, (6.27) λ, (6.28) D = U √(I2² + I3² + …) = k_i S with k_i from (6.13); S² = P² + Q1² + D² from (6.19),
// (6.22) with Qv = Q1.
test("harmonic powers after Prechtl (2010), (6.23)–(6.28): Q1, k_i and S² = P² + Q1² + D²", () => {
  const phi = Math.PI / 6, h = S.harmonics(230, [{ k: 1, I: 10, phi }, { k: 3, I: 3, phi: 0 }, { k: 5, I: 2, phi: 0 }]);
  near(h.Irms, Math.sqrt(113), 1e-9, "RMS, (6.23)");
  near(h.P, 2300 * Math.cos(phi), 1e-9, "P, (6.24)");
  near(h.Q1, 2300 * Math.sin(phi), 1e-9, "Q1, (6.26)");
  near(h.k, Math.sqrt(13 / 113), 1e-12, "harmonic content k_i, (6.13)");
  near(h.D, 230 * Math.sqrt(13), 1e-6, "distortion power, (6.28)");
  near(h.D, h.k * h.S, 1e-9, "D = k_i S, (6.28)");
  near(h.S ** 2, h.P ** 2 + h.Q1 ** 2 + h.D ** 2, 1e-6, "S² = P² + Q1² + D²");
  near(h.lambda, Math.sqrt(1 - 13 / 113) * Math.cos(phi), 1e-12, "λ = g_i cos φ1, (6.27)");
});

test("reindexing, aliasing and ideal reconstruction by definition", () => {
  assert.deepEqual(S.reindex([1, 2, 3], 0, { M: 1, n0: -1 }, [0, 1, 2, 3]), [0, 1, 2, 3]);
  assert.deepEqual(S.reindex([1, 2, 3], 0, { reverse: true }, [-2, -1, 0]), [3, 2, 1]);
  near(S.alias(7000, 10000), 3000, 1e-9, "7 kHz at 10 kHz");
  near(S.alias(12000, 10000), 2000, 1e-9, "12 kHz at 10 kHz");
  const x = [0.3, -1, 2, 0.5];
  x.forEach((v, n) => near(S.reconstruct(x, 0.1, n * 0.1), v, 1e-12, `sample ${n}`));
});

test("a windowed FIR low-pass passes DC with gain about 1 and stops well above its cut-off", () => {
  const h = S.firLowpass(51, 0.1, "hamming");
  near(cAbs(S.response(h, [1], 0)), 1, 0.01, "DC");
  assert.ok(S.dB(S.response(h, [1], 0.25)) < -50, "stop band");
});

test("a Butterworth filter by the bilinear transform is 3 dB down at its cut-off, with poles inside the unit circle", () => {
  const f = S.butterworth(4, 1000, 8000);
  near(cAbs(f.at(1000 / 8000)), Math.SQRT1_2, 1e-9, "cut-off");
  near(cAbs(f.at(0)), 1, 1e-9, "DC");
  for (const p of f.poles) assert.ok(cAbs(p) < 1);
});

test("the FFT's last stage is the DFT", () => {
  const x = [1, 2, 0, -1, 3, 0.5, -2, 1];
  const fft = S.fftStages(x).at(-1), ref = S.dft(x);
  fft.forEach((v, k) => { near(v[0], ref[k][0], 1e-9, `re ${k}`); near(v[1], ref[k][1], 1e-9, `im ${k}`); });
  assert.throws(() => S.fftStages([1, 2, 3]), /power of two/);
});

test("the convolution sum by hand, and the discrete systems' tests", () => {
  assert.deepEqual(S.convolveSum([1, 2], [1, 1, 1]), [1, 3, 3, 2]);
  const seq = a => n => n >= 0 && n < a.length ? a[n] : 0, ns = Array.from({ length: 20 }, (_, n) => n);
  const lin = run => linearityErrorSeq(run, seq(S.SEQUENCES.rect), seq(S.SEQUENCES.tri), ns);
  function linearityErrorSeq(run, x1, x2, ns) { return S.linearityError(run, x1, x2, 2, 1, ns); }
  for (const id of ["gain", "delay", "average"]) {
    near(lin(S.DSYSTEMS[id].run), 0, 1e-12, `${id} linear`);
    near(S.shiftError(S.DSYSTEMS[id].run, seq(S.SEQUENCES.tri), 3, ns), 0, 1e-12, `${id} shift`);
  }
  assert.ok(lin(S.DSYSTEMS.square.run) > 0.5);
  assert.ok(S.shiftError(S.DSYSTEMS.ramp.run, seq(S.SEQUENCES.tri), 3, ns) > 1);
});

test("the DTFT of a centred pulse of 2M + 1 ones is the Dirichlet kernel, periodic in F", () => {
  const x = Array(7).fill(1);
  for (const F of [0, 0.1, 0.33, 0.5]) {
    near(S.dtft(x, F, -3)[0], S.pulseDtft(3, F), 1e-9, `F = ${F}`);
    near(S.dtft(x, F + 1, -3)[0], S.dtft(x, F, -3)[0], 1e-9, `period at ${F}`);
  }
});

test("down- and upsampling by definition", () => {
  assert.deepEqual(S.downsample([0, 1, 2, 3, 4, 5], 2), [0, 2, 4]);
  assert.deepEqual(S.upsample([1, 2], 3), [1, 0, 0, 2, 0, 0]);
  assert.deepEqual(S.fir([1, 0, 0], [0.5, 0.5]), [0.5, 0.5, 0]);
});
