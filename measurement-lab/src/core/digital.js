// Digital measurement (Schrüfer et al. 2012, chapters 5 and 6): counting edges in a gate for frequency and time, three
// ways of turning a voltage into a number, and the noise that rounding leaves.

// --- Counting: frequency and period (sections 5.5–5.6) ---

/** Rising edges at the instants k/f (k integer) that fall in the gate (t0, t0 + T]. */
export const edgesInGate = (f, t0, T) => Math.floor((t0 + T) * f + 1e-9) - Math.floor(t0 * f + 1e-9);

/** Frequency measurement: the signal's edges counted for the gate time T, fx = Nx/T (eq. 5.9). The gate opens at
 *  phase t0 of the signal; the count is uncertain by one, so the result by 1/T. */
export function countFrequency(fx, T, t0 = 0) {
  const N = edgesInGate(fx, t0, T);
  return { N, f: N / T, resolution: 1 / T };
}

/** Period measurement: the clock f0 counted during one period of the signal, Nx = f0·Tx (eq. 5.7), so fx = f0/Nx;
 *  the clock may start anywhere in its own period (phase t0), uncertain by one count (p. 295). */
export function countPeriod(fx, f0, t0 = 0) {
  const N = edgesInGate(f0, t0, 1 / fx);
  return { N, f: f0 / N, T: N / f0, resolution: fx * fx / f0 };
}

/** Where the two quantisation errors are equal, 1/T = fx²/f0: fx = √(f0/T) (derived here from eqs. 5.7 and 5.9).
 *  Below it period measurement resolves better, above it frequency measurement. */
export const crossoverFrequency = (f0, T) => Math.sqrt(f0 / T);

/** A counter with a given number of digits in overflow: only the lowest digits are shown (Table 5.8). */
export const display = (N, digits) => String(N % 10 ** digits).padStart(digits, "0");

// --- A/D converters (sections 6.2–6.3) ---

/** A flash converter of n bits on the range U0: 2ⁿ − 1 comparators with thresholds at odd multiples of U0/2ⁿ⁺¹, so
 *  each output k·U0/2ⁿ is the middle of its interval (Table 6.1 for n = 3). Returns the thermometer code and k. */
export function flash(ux, U0, n) {
  const M = 2 ** n, thresholds = Array.from({ length: M - 1 }, (_, i) => (2 * i + 1) * U0 / (2 * M));
  const thermometer = thresholds.map(u => (ux >= u ? 1 : 0)), k = thermometer.reduce((s, b) => s + b, 0);
  return { thresholds, thermometer, k, value: k * U0 / M };
}

/** Successive approximation (section 6.2.5): try each weight from the largest, keep it when ux is still above the
 *  reference. Weights U0/2, U0/4, … give a binary result; 8, 4, 2, 1, 0.8, … V a BCD one (Bild 6.6 c). */
export function sar(ux, weights) {
  let ref = 0;
  const steps = weights.map(w => {
    const trial = ref + w, keep = ux >= trial;
    if (keep) ref = trial;
    return { weight: w, trial, keep, ref };
  });
  return { steps, bits: steps.map(s => (s.keep ? 1 : 0)), value: ref };
}

/** Binary weights U0/2 … U0/2ⁿ. */
export const binaryWeights = (U0, n) => Array.from({ length: n }, (_, i) => U0 / 2 ** (i + 1));

/** The dual-slope converter (section 6.3.1): ux is integrated for Na clock periods, then −U0 until the integrator is
 *  back at zero; the count of the second phase is Nx = Na·ux/U0 (eqs. 6.13–6.16), whatever R, C and the clock.
 *  Counted, it is rounded down. Returns the counts and the integrator's output in volts at the phase ends. */
export function dualSlope(ux, U0, Na, f, RC) {
  const t1 = Na / f, peak = -ux * t1 / RC; // eq. 6.11
  const tx = ux / U0 * t1; // eq. 6.13: the run-up time
  return { Nx: Math.floor(Na * ux / U0 + 1e-9), exact: Na * ux / U0, t1, tx, peak };
}

/** The integrator's output at time t (eqs. 6.9–6.12), for the chart. */
export function dualSlopeTrace(ux, U0, Na, f, RC, t) {
  const t1 = Na / f, tx = ux / U0 * t1;
  if (t <= t1) return -ux * t / RC;
  if (t <= t1 + tx) return -ux * t1 / RC + U0 * (t - t1) / RC;
  return 0;
}

// --- Quantisation (section 6.4.4) ---

/** Rounding to the nearest step of height lsb. */
export const quantise = (x, lsb) => lsb * Math.round(x / lsb);

/** The RMS value of a quantisation error spread evenly over ±Δu/2: Δu/√12 (eq. 6.37). */
export const quantisationNoise = lsb => lsb / Math.sqrt(12);

/** The SNR of an ideal n-bit converter: a full-scale DC value 6.02n + 10.79 dB (eq. 6.42), a full-scale sine
 *  6.02n + 1.76 dB (eq. 6.44), both written exactly here. */
export const snrDC = n => 20 * n * Math.log10(2) + 20 * Math.log10(Math.sqrt(12));
export const snrSine = n => 20 * n * Math.log10(2) + 10 * Math.log10(1.5);

/** The effective number of bits from a measured SNR (eq. 6.45). */
export const enob = snr => (snr - 1.76) / 6.02;

/** The second route: a full-scale sine quantised to n bits over the range ±2ⁿ⁻¹·lsb, its SNR measured as signal power
 *  over error power. The frequency is incommensurate with the sampling, so the error spreads over the steps. */
export function snrMeasured(n, samples = 50000) {
  const lsb = 2 / 2 ** n;
  let ps = 0, pe = 0;
  for (let k = 0; k < samples; k++) {
    const x = (1 - lsb / 2) * Math.sin(2 * Math.PI * k * 0.1234567), e = quantise(x, lsb) - x;
    ps += x * x; pe += e * e;
  }
  return 10 * Math.log10(ps / pe);
}
