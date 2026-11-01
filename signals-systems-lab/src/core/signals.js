// The laws of signals and systems the labs draw: continuous signals as functions of time, discrete ones as arrays.
// Continuous after Prechtl (2010), Vorlesungen über Signale und Systeme 1; discrete after Doblinger (2015),
// Zeitdiskrete Signale und Systeme. Pure: integrals are sums on a fixed grid, noise comes from a seeded generator.
import { cAdd, cMul, cDiv, cAbs } from "../../../kit/core/index.js";

export const sinc = x => x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
export const range = (a, b, n) => Array.from({ length: n }, (_, k) => a + (b - a) * k / (n - 1));

/** Test signals of unit height that start at t = 0: a pulse of 1 s, a triangle of 2 s, a decay with τ = 0.5 s. */
export const SHAPES = {
  rect: t => t >= 0 && t < 1 ? 1 : 0,
  tri: t => t >= 0 && t < 2 ? 1 - Math.abs(t - 1) : 0,
  decay: t => t >= 0 ? Math.exp(-2 * t) : 0,
  step: t => t >= 0 ? 1 : 0,
};

/** The convolution integral y(t) = ∫ x(τ) h(t − τ) dτ, by the midpoint rule over τ in [from, to]. */
export function convolve(x, h, t, { from = -1, to = 6, n = 700 } = {}) {
  const d = (to - from) / n;
  let y = 0;
  for (let k = 0; k < n; k++) { const tau = from + (k + 0.5) * d; y += x(tau) * h(t - tau); }
  return y * d;
}

// Systems acting on a signal x(t), each a function x → y. Some are linear and time-invariant, some fail one test.
export const SYSTEMS = {
  gain: { name: "Gain y = 2x", run: x => t => 2 * x(t) },
  delay: { name: "Delay y(t) = x(t − 0.5 s)", run: x => t => x(t - 0.5) },
  lowpass: { name: "RC low-pass, τ = 0.5 s", run: x => t => convolve(x, SHAPES.decay, t, { n: 1400 }) * 2 },
  square: { name: "Square-law y = x²", run: x => t => x(t) ** 2 },
  offset: { name: "Offset y = x + 0.5", run: x => t => x(t) + 0.5 },
  ramp: { name: "Time-varying y = t·x", run: x => t => t * x(t) },
};

/** Superposition error max |S{a x1 + b x2} − (a S{x1} + b S{x2})| on the grid ts; zero for a linear system. */
export function linearityError(run, x1, x2, a, b, ts) {
  const left = run(t => a * x1(t) + b * x2(t)), y1 = run(x1), y2 = run(x2);
  return Math.max(...ts.map(t => Math.abs(left(t) - a * y1(t) - b * y2(t))));
}

/** Shift error max |S{x(t − t0)}(t) − S{x}(t − t0)|; zero for a time-invariant system. */
export function shiftError(run, x, t0, ts) {
  const shifted = run(t => x(t - t0)), y = run(x);
  return Math.max(...ts.map(t => Math.abs(shifted(t) - y(t - t0))));
}

/** The convolution sum y[n] = Σ x[k] h[n − k] of two sequences starting at n = 0; length Nx + Nh − 1. */
export function convolveSum(x, h) {
  const y = Array(x.length + h.length - 1).fill(0);
  x.forEach((a, k) => h.forEach((b, m) => { y[k + m] += a * b; }));
  return y;
}

/** Test sequences on n = 0..: a pulse of 5 samples, a triangle of 7, a decay 0.7^n (cut at 16 samples). */
export const SEQUENCES = {
  rect: [1, 1, 1, 1, 1],
  tri: [0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25],
  decay: Array.from({ length: 16 }, (_, n) => 0.7 ** n),
};

// Discrete systems acting on a sequence given as a function of the integer n.
export const DSYSTEMS = {
  gain: { name: "Gain y[n] = 2x[n]", run: x => n => 2 * x(n) },
  delay: { name: "Delay y[n] = x[n − 2]", run: x => n => x(n - 2) },
  average: { name: "Moving average of 3", run: x => n => (x(n) + x(n - 1) + x(n - 2)) / 3 },
  square: { name: "Square-law y = x²", run: x => n => x(n) ** 2 },
  offset: { name: "Offset y = x + 0.5", run: x => n => x(n) + 0.5 },
  ramp: { name: "Time-varying y[n] = n·x[n]", run: x => n => n * x(n) },
};

/** A seeded uniform generator in [0, 1) (mulberry32): the same seed gives the same noise every time. */
export function uniform(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** n samples of white Gaussian noise of variance σ² (Box–Muller on the seeded generator). */
export function noise(n, sigma = 1, seed = 1) {
  const u = uniform(seed);
  return Array.from({ length: n }, () => sigma * Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u()));
}

/** First-order low-pass y[n] = a y[n−1] + (1 − a) x[n]. */
export function smooth(x, a) {
  let y = 0;
  return x.map(v => (y = a * y + (1 - a) * v));
}
/** Its output variance for white input of variance σ²: σ² (1 − a)/(1 + a), and its normalised autocorrelation a^|k|. */
export const smoothVariance = (sigma2, a) => sigma2 * (1 - a) / (1 + a);

/** Mean and the (biased) autocorrelation estimate r[k] = (1/N) Σ x[n] x[n+k] for k = 0..maxLag. */
export const mean = x => x.reduce((s, v) => s + v, 0) / x.length;
export function correlate(x, y, maxLag) {
  const N = x.length, out = [];
  for (let k = -maxLag; k <= maxLag; k++) {
    let s = 0;
    for (let n = 0; n < N; n++) { const m = n + k; if (m >= 0 && m < N) s += x[n] * y[m]; }
    out.push(s / N);
  }
  return out; // index maxLag is lag 0
}

/** The Fourier transform X(f) = ∫ x(t) e^(−j2πft) dt as [re, im], by the midpoint rule over [from, to]. */
export function fourier(x, f, { from = -4, to = 4, n = 1600 } = {}) {
  const d = (to - from) / n;
  let re = 0, im = 0;
  for (let k = 0; k < n; k++) {
    const t = from + (k + 0.5) * d, v = x(t), w = 2 * Math.PI * f * t;
    re += v * Math.cos(w); im -= v * Math.sin(w);
  }
  return [re * d, im * d];
}
/** The DTFT X(e^jΩ) = Σ x[n] e^(−jΩn) of a finite sequence starting at index first, at F = Ω/2π; periodic in F. */
export function dtft(x, F, first = 0) {
  let re = 0, im = 0;
  x.forEach((v, k) => { const w = 2 * Math.PI * F * (k + first); re += v * Math.cos(w); im -= v * Math.sin(w); });
  return [re, im];
}
/** Closed form for a centred pulse of 2M + 1 ones: X = sin(πF(2M+1)) / sin(πF), the Dirichlet kernel. */
export const pulseDtft = (M, F) => Math.abs(Math.sin(Math.PI * F)) < 1e-12 ? (2 * M + 1) * Math.cos(Math.PI * F * (2 * M + 1)) / Math.cos(Math.PI * F)
  : Math.sin(Math.PI * F * (2 * M + 1)) / Math.sin(Math.PI * F);

/** Closed form for a centred pulse of height A and duration T: X(f) = A T sinc(fT). */
export const pulseSpectrum = (A, T, f) => A * T * sinc(f * T);

// Fourier series of three periodic waves of period 1 and height ±1: the k-th harmonic's coefficient of
// sin(2πkt) (odd waves) or cos(2πkt) (even ones).
export const WAVES = {
  square: { exact: t => (t - Math.floor(t)) < 0.5 ? 1 : -1, term: "sin",
            coeff: k => k % 2 ? 4 / (Math.PI * k) : 0 },
  sawtooth: { exact: t => { const u = t - Math.floor(t + 0.5); return 2 * u; }, term: "sin",
              coeff: k => 2 * (-1) ** (k + 1) / (Math.PI * k) },
  triangle: { exact: t => { const u = Math.abs(t - Math.round(t)); return 1 - 4 * u; }, term: "cos",
              coeff: k => k % 2 ? 8 / (Math.PI * k) ** 2 : 0 },
};
export function partialSum(wave, K, t) {
  const w = WAVES[wave];
  let y = 0;
  for (let k = 1; k <= K; k++) y += w.coeff(k) * (w.term === "sin" ? Math.sin(2 * Math.PI * k * t) : Math.cos(2 * Math.PI * k * t));
  return y;
}

/** A sine voltage of RMS U and a current of harmonics [{ k, I (RMS), phi (rad, against the voltage) }], after
 *  Prechtl (2010), section 6.3, (6.23)–(6.28): the RMS current, its harmonic content k_i = √(I2² + I3² + …)/I (6.13),
 *  active power P, the fundamental's reactive power Q1 (Prechtl's Q is the whole reactive power, Q² = Q1² + D²),
 *  apparent power S, distortion power D and power factor λ. */
export function harmonics(U, parts) {
  const Irms = Math.sqrt(parts.reduce((s, p) => s + p.I ** 2, 0));
  const one = parts.find(p => p.k === 1) ?? { I: 0, phi: 0 };
  const rest = Math.sqrt(parts.filter(p => p.k !== 1).reduce((s, p) => s + p.I ** 2, 0));
  const P = U * one.I * Math.cos(one.phi), Q1 = U * one.I * Math.sin(one.phi), S = U * Irms;
  return { Irms, k: Irms ? rest / Irms : 0, P, Q1, S, D: Math.sqrt(Math.max(0, S * S - P * P - Q1 * Q1)),
           lambda: S ? P / S : 0 };
}

/** y[n] = x[d·M·n + n0] for a sequence x given on indices first..first+len−1 (zero elsewhere). */
export function reindex(x, first, { M = 1, n0 = 0, reverse = false } = {}, ns) {
  const at = k => k >= first && k < first + x.length ? x[k - first] : 0;
  return ns.map(n => at((reverse ? -1 : 1) * M * n + n0));
}

/** The frequency a sine of f shows after sampling at fs: folded into [0, fs/2]. */
export const alias = (f, fs) => Math.abs(f - fs * Math.round(f / fs));

/** Ideal reconstruction from samples x[n] taken every T: x(t) = Σ x[n] sinc((t − nT)/T). */
export const reconstruct = (samples, T, t) => samples.reduce((s, v, n) => s + v * sinc((t - n * T) / T), 0);

/** Window functions of length N, as Doblinger (2015) gives them in section 6.2.1: (6.39), p. 139, with the
 *  coefficients of Tabelle 6.1, p. 140. */
export const WINDOWS = {
  rectangular: (n, N) => 1,
  hann: (n, N) => 0.5 - 0.5 * Math.cos(2 * Math.PI * n / (N - 1)),
  hamming: (n, N) => 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (N - 1)),
  blackman: (n, N) => 0.42 - 0.5 * Math.cos(2 * Math.PI * n / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * n / (N - 1)),
};
export const windowOf = (name, N) => Array.from({ length: N }, (_, n) => WINDOWS[name](n, N));

/** A linear-phase FIR low-pass by the window method: the ideal h[n] = 2fc sinc(2fc (n − (N−1)/2)) times the window;
 *  fc in cycles per sample (0..0.5). */
export function firLowpass(N, fc, name = "hamming") {
  const w = windowOf(name, N), m = (N - 1) / 2;
  return w.map((v, n) => 2 * fc * sinc(2 * fc * (n - m)) * v);
}

/** H(e^jΩ) = Σ b_k e^(−jΩk) / Σ a_k e^(−jΩk) at the normalised frequency F = Ω/2π. */
export function response(b, a, F) {
  const at = c => c.reduce((s, v, k) => cAdd(s, [v * Math.cos(2 * Math.PI * F * k), -v * Math.sin(2 * Math.PI * F * k)]), [0, 0]);
  return cDiv(at(b), at(a));
}
export const dB = H => 20 * Math.log10(Math.max(1e-12, cAbs(H)));

/** A Butterworth low-pass of order N by the bilinear transform: the analog cut-off pre-warped to
 *  ωa = 2fs tan(π fc/fs), its poles on a circle, each mapped by z = (1 + p/2fs)/(1 − p/2fs); N zeros at z = −1;
 *  the gain makes H(1) = 1. */
export function butterworth(N, fc, fs) {
  const wa = 2 * fs * Math.tan(Math.PI * fc / fs);
  const analog = Array.from({ length: N }, (_, k) => { const a = Math.PI * (2 * k + N + 1) / (2 * N); return [wa * Math.cos(a), wa * Math.sin(a)]; });
  const poles = analog.map(p => cDiv([1 + p[0] / (2 * fs), p[1] / (2 * fs)], [1 - p[0] / (2 * fs), -p[1] / (2 * fs)]));
  const zeros = poles.map(() => [-1, 0]);
  const raw = z => cDiv(zeros.reduce((s, q) => cMul(s, [z[0] - q[0], z[1] - q[1]]), [1, 0]),
                        poles.reduce((s, p) => cMul(s, [z[0] - p[0], z[1] - p[1]]), [1, 0]));
  const g = 1 / cAbs(raw([1, 0]));
  return { wa, analog, poles, zeros, at: F => { const H = raw([Math.cos(2 * Math.PI * F), Math.sin(2 * Math.PI * F)]); return [g * H[0], g * H[1]]; } };
}

/** The DFT X[k] = Σ x[n] e^(−j2πkn/N) of a real sequence, as [re, im] pairs. */
export function dft(x) {
  const N = x.length;
  return Array.from({ length: N }, (_, k) => {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) { const w = 2 * Math.PI * k * n / N; re += x[n] * Math.cos(w); im -= x[n] * Math.sin(w); }
    return [re, im];
  });
}

/** The radix-2 decimation-in-time FFT, keeping the sequence after the bit-reversal and after each butterfly stage,
 *  so a lab can show the stages; the last one is the DFT. N must be a power of two. */
export function fftStages(x) {
  const N = x.length, bits = Math.log2(N);
  if (!Number.isInteger(bits)) throw new Error(`The FFT needs a length that is a power of two; ${N} is not.`);
  const rev = n => { let r = 0; for (let b = 0; b < bits; b++) r |= ((n >> b) & 1) << (bits - 1 - b); return r; };
  let a = Array.from({ length: N }, (_, n) => [x[rev(n)], 0]);
  const stages = [a.map(v => [...v])];
  for (let size = 2; size <= N; size *= 2) {
    a = a.map(v => [...v]);
    for (let start = 0; start < N; start += size) for (let j = 0; j < size / 2; j++) {
      const w = [Math.cos(-2 * Math.PI * j / size), Math.sin(-2 * Math.PI * j / size)];
      const top = a[start + j], bottom = cMul(w, a[start + j + size / 2]);
      a[start + j] = cAdd(top, bottom);
      a[start + j + size / 2] = [top[0] - bottom[0], top[1] - bottom[1]];
    }
    stages.push(a.map(v => [...v]));
  }
  return stages;
}

/** Keep every M-th sample, or put L − 1 zeros between samples. */
export const downsample = (x, M) => x.filter((_, n) => n % M === 0);
export const upsample = (x, L) => x.flatMap(v => [v, ...Array(L - 1).fill(0)]);
/** Filter x with the FIR h (zero initial state). */
export const fir = (x, h) => x.map((_, n) => h.reduce((s, c, k) => s + (n - k >= 0 ? c * x[n - k] : 0), 0));
