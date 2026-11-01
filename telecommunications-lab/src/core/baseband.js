// Pulse-code modulation, line codes and binary detection in noise, after Goiser (2016), sets 2 (PCM) and 3 (baseband
// transmission), with the formulary's Table 2. Slide numbers are the printed ones.
import { erfc, Q, dftMagnitude } from "./maths.js";

/** The uniform mid-rise quantiser of M levels over ±A_OL = ±MΔ/2 (set 2, slides 35–37): levels at ±Δ/2, ±3Δ/2, …;
 *  inputs beyond the overload amplitude are clipped to the outermost level. */
export function quantise(x, M, A) {
  const step = 2 * A / M, k = Math.min(M - 1, Math.max(0, Math.floor((x + A) / step)));
  return -A + (k + 0.5) * step;
}

/** SNQR of linear PCM with n bits for an input of peak-to-mean factor α (set 2, slide 46): 3·2^(2n)/α, in dB
 *  4.8 + 6n − α_dB. α = 2 for a full-scale sine, 16 for Gaussian noise, 10 for speech (slide 47). */
export const snqr = (n, alpha) => 3 * 4 ** n / alpha;

/** The SNQR measured: a full-scale sine of many periods quantised with n bits, signal power over error power. The
 *  second route to snqr(n, 2). */
export function snqrMeasured(n, samples = 20000) {
  const M = 2 ** n;
  let ps = 0, pe = 0;
  for (let k = 0; k < samples; k++) {
    // An irrational frequency ratio, so the phases fill the period evenly.
    const x = Math.sin(2 * Math.PI * k * 0.1234567891), e = x - quantise(x, M, 1);
    ps += x * x; pe += e * e;
  }
  return ps / pe;
}

/** SNR after decoding, with bit errors of probability Pe (set 2, slide 50): SNQR / (1 + 4 (M² − 1) Pe), the slide's
 *  SNQR = M² − 1 for equally likely levels. For another input, a sine say, pass its own SNQR: the error powers are the
 *  same, only the signal's power differs. */
export const pcmOutput = (n, Pe, s = 4 ** n - 1) => s / (1 + 4 * (4 ** n - 1) * Pe);

/** The same by summing the error powers bit by bit (slide 49): one bit error of weight 2^k Δ per word, each bit equally
 *  likely, mean error power Pe Δ² (4ⁿ − 1)/3, quantisation noise Δ²/12, signal (M² − 1) Δ²/12. Δ = 1. */
export function pcmOutputBySum(n, Pe) {
  let dec = 0;
  for (let k = 0; k < n; k++) dec += Pe * (2 ** k) ** 2;
  return ((4 ** n - 1) / 12) / (1 / 12 + dec);
}

/** The line codes of set 3 (slides 51–62): each bit becomes the levels of its half-symbols (two per bit). */
export const LINE_CODES = {
  "nrz-unipolar": { name: "Unipolar NRZ", levels: (b) => (b ? [1, 1] : [0, 0]) },
  "nrz-polar": { name: "Polar NRZ", levels: (b) => (b ? [1, 1] : [-1, -1]) },
  "rz-unipolar": { name: "Unipolar RZ", levels: (b) => (b ? [1, 0] : [0, 0]) },
  "rz-polar": { name: "Polar RZ", levels: (b) => (b ? [1, 0] : [-1, 0]) },
  ami: { name: "AMI", levels: (b, s) => (b ? (s.mark = -(s.mark || -1), [s.mark, s.mark]) : [0, 0]) },
  manchester: { name: "Manchester", levels: (b) => (b ? [1, -1] : [-1, 1]) },
};

/** The waveform of a bit sequence in a line code, as half-symbol levels. */
export function lineCode(bits, code) {
  const state = {};
  return bits.flatMap(b => LINE_CODES[code].levels(b, state));
}

/** The power spectral density, averaged periodogram: the levels held for `hold` samples each, cut into blocks of
 *  `block` samples. Bin k is at k/block cycles per sample. */
export function psdEstimate(wave, hold, block) {
  const x = wave.flatMap(v => Array(hold).fill(v));
  const blocks = Math.floor(x.length / block), acc = new Array(block / 2 + 1).fill(0);
  for (let b = 0; b < blocks; b++) {
    const m = dftMagnitude(x.slice(b * block, (b + 1) * block));
    m.forEach((v, k) => { acc[k] += v * v * block; });
  }
  return acc.map(v => v / blocks);
}

/** The continuous part of the PSD of independent, equally likely bits (set 3, slide 47: p(1 − p)/T0 |F1 − F0|²), with
 *  T0 = 1, f in units of the bit rate, and the half-symbol pulses of LINE_CODES. AMI's symbols depend on the bits
 *  before, so the formula does not hold for it: null, and the page shows only its estimate. */
export function psdContinuous(code, f) {
  const sinc = x => (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
  // Spectrum of a half-symbol pulse (width ½) starting at t0, magnitude only matters through the difference below.
  const half = (t0) => { const a = Math.PI * f * (2 * t0 + 0.5); return [0.5 * sinc(f / 2) * Math.cos(a), -0.5 * sinc(f / 2) * Math.sin(a)]; };
  const shape = lv => { const a = half(0), b = half(0.5); return [lv[0] * a[0] + lv[1] * b[0], lv[0] * a[1] + lv[1] * b[1]]; };
  if (code === "ami") return null;
  const c = LINE_CODES[code], F1 = shape(c.levels(1, {})), F0 = shape(c.levels(0, {}));
  return 0.25 * ((F1[0] - F0[0]) ** 2 + (F1[1] - F0[1]) ** 2);
}

/** The mean power of a line code's waveform, equally likely bits. */
export const meanPower = code => { const w = lineCode([0, 1, 0, 1, 1, 0, 1, 0], code); return w.reduce((s, v) => s + v * v, 0) / w.length; };

/** Binary error probability for symbols a distance V apart in Gaussian noise of standard deviation σ (set 3, slide 33;
 *  formulary eq. 6): Q(V/(2σ)). */
export const binaryError = (V, sigma) => Q(V / (2 * sigma));

/** Bit error probability against E/N0 with the matched filter (formulary, Table 2). E is the mean pulse energy. */
export const BER = {
  unipolar: e => erfc(Math.sqrt(e / 2)) / 2,
  polar: e => erfc(Math.sqrt(e)) / 2,
  orthogonal: e => erfc(Math.sqrt(e / 2)) / 2,
};

/** The bit error rate counted: seeded antipodal bits ±1 through Gaussian noise of variance N0/2 per unit energy,
 *  decided at zero. The second route to BER.polar. */
export function berCounted(EbN0, noise) {
  const sigma = Math.sqrt(1 / (2 * EbN0));
  let errors = 0;
  for (let k = 0; k < noise.length; k++) {
    const sent = k % 2 ? 1 : -1;
    if ((sent + sigma * noise[k] > 0 ? 1 : -1) !== sent) errors++;
  }
  return errors / noise.length;
}

/** The raised-cosine spectrum by its definition (set 4, slides 23–26): flat to fN(1 − α), a half cosine down to zero at
 *  fN(1 + α), odd-symmetric about the corner frequency fN = 1/(2T0). T0 = 1, f in units of 1/T0. */
export function raisedCosineSpectrum(f, alpha) {
  const fN = 0.5, a = Math.abs(f);
  if (a <= fN * (1 - alpha)) return 1;
  if (a >= fN * (1 + alpha)) return 0;
  return 0.5 * (1 + Math.cos(Math.PI * (a - fN * (1 - alpha)) / (2 * alpha * fN)));
}

/** Its pulse h(t), t in units of T0, by the inverse Fourier integral of the spectrum, normalised to h(0) = 1. Even
 *  spectrum, so h(t) = 2∫ H(f) cos(2πft) df over 0 … fN(1 + α), by Simpson's rule. */
export function raisedCosinePulse(t, alpha, steps = 400) {
  const top = 0.5 * (1 + alpha), h = top / steps;
  let sum = 0;
  for (let k = 0; k <= steps; k++) {
    const f = k * h, w = k === 0 || k === steps ? 1 : k % 2 ? 4 : 2;
    sum += w * raisedCosineSpectrum(f, alpha) * Math.cos(2 * Math.PI * f * t);
  }
  return 2 * sum * h / 3;
}

/** Bandwidth and bandwidth efficiency of the raised cosine (set 4, slide 26): B = (1 + α)/(2T0), ηs = 2/(1 + α). */
export const rcBandwidth = (Rs, alpha) => Rs * (1 + alpha) / 2;
export const rcEfficiency = alpha => 2 / (1 + alpha);

/** The eye: traces two symbols long of polar symbols shaped by the raised cosine, sampled `per` points per symbol, with
 *  seeded bits and optional Gaussian noise. Each trace starts half a symbol before a decision instant. */
export function eyeTraces(alpha, symbols, noise, sigma, per = 32, span = 8) {
  const pulse = Array.from({ length: (2 * span) * per + 1 }, (_, k) => raisedCosinePulse(k / per - span, alpha, 200));
  const level = symbols.map(b => (b ? 1 : -1)), traces = [];
  for (let n = span; n < level.length - span; n++) {
    const tr = [];
    for (let k = 0; k <= 2 * per; k++) {
      const t = n - 0.5 + k / per;
      let y = 0;
      for (let m = n - span + 1; m < n + span; m++) {
        const idx = Math.round((t - m + span) * per);
        if (idx >= 0 && idx < pulse.length) y += level[m] * pulse[idx];
      }
      tr.push(y + sigma * noise[(n * (2 * per + 1) + k) % noise.length]);
    }
    traces.push(tr);
  }
  return traces;
}

/** The vertical eye opening at the decision instant: the gap between the lowest "1" and the highest "0". */
export function eyeOpening(traces, per = 32) {
  let lo1 = Infinity, hi0 = -Infinity;
  for (const tr of traces) { const v = tr[per / 2]; if (v > 0) lo1 = Math.min(lo1, v); else hi0 = Math.max(hi0, v); }
  return lo1 - hi0;
}

/** SNR at the matched filter's output at the decision instant (set 4, slide 80): 2E/N0, whatever the pulse's shape. */
export const matchedSNR = (E, N0) => 2 * E / N0;

/** The same counted: a sampled pulse of energy E correlated with itself in seeded white noise of two-sided density N0/2,
 *  output mean² over output variance. The second route to matchedSNR. */
export function matchedSNRCounted(pulse, dt, N0, noise, trials) {
  const E = pulse.reduce((s, v) => s + v * v * dt, 0), sigma = Math.sqrt(N0 / 2 / dt);
  let m = 0, m2 = 0;
  for (let k = 0; k < trials; k++) {
    let z = 0;
    for (let n = 0; n < pulse.length; n++) z += (pulse[n] + sigma * noise[(k * pulse.length + n) % noise.length]) * pulse[n] * dt;
    m += z; m2 += z * z;
  }
  m /= trials; const v = m2 / trials - m * m;
  return { snr: E * E / v, E };
}
