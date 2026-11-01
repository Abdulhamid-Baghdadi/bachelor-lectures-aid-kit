// The special functions and the one seeded generator the telecommunication laws need. Pure: the same seed always
// gives the same noise, so a constellation or an eye looks the same at every visit.

/** A uniform generator on [0, 1), mulberry32: small, fast and seeded. */
export function uniform(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** n standard normal samples from a seed, by Box–Muller. */
export function gaussian(seed, n) {
  const u = uniform(seed), out = new Array(n);
  for (let k = 0; k < n; k += 2) {
    const r = Math.sqrt(-2 * Math.log(1 - u())), a = 2 * Math.PI * u();
    out[k] = r * Math.cos(a);
    if (k + 1 < n) out[k + 1] = r * Math.sin(a);
  }
  return out;
}

/** n random bits from a seed. */
export const bits = (seed, n) => { const u = uniform(seed); return Array.from({ length: n }, () => (u() < 0.5 ? 0 : 1)); };

/** erfc(x) to a relative error below 1e-14: the series for small x, the continued fraction (Lentz) for large x. */
export function erfc(x) {
  if (x < 0) return 2 - erfc(-x);
  if (x < 2.5) {
    // erf(x) = 2/√π Σ (−1)^n x^(2n+1) / (n! (2n+1))
    let sum = 0, term = x;
    for (let n = 0; n < 200; n++) {
      const add = term / (2 * n + 1);
      sum += add;
      if (Math.abs(add) < 1e-17 * Math.abs(sum)) break;
      term *= -x * x / (n + 1);
    }
    return 1 - 2 / Math.sqrt(Math.PI) * sum;
  }
  // erfc(x) = e^(−x²)/√π · 1/(x + (1/2)/(x + 1/(x + (3/2)/(x + 2/(x + …)))))
  const tiny = 1e-300;
  let f = x, C = x, D = 0;
  for (let n = 1; n < 500; n++) {
    const a = n / 2;
    D = x + a * D; D = Math.abs(D) < tiny ? tiny : D; D = 1 / D;
    C = x + a / C; C = Math.abs(C) < tiny ? tiny : C;
    const delta = C * D;
    f *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  return Math.exp(-x * x) / Math.sqrt(Math.PI) / f;
}

/** The Gaussian tail Q(x) = ½ erfc(x/√2) (formulary, eq. 5). */
export const Q = x => erfc(x / Math.SQRT2) / 2;

/** The magnitude of a real signal's DFT, bin k = 0 … N/2: |X[k]| / N. */
export function dftMagnitude(x) {
  const N = x.length, out = [];
  for (let k = 0; k <= N / 2; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) { const a = -2 * Math.PI * k * n / N; re += x[n] * Math.cos(a); im += x[n] * Math.sin(a); }
    out.push(Math.hypot(re, im) / N);
  }
  return out;
}

export const dB = x => 10 * Math.log10(x);
export const fromDB = d => 10 ** (d / 10);
export const log2 = x => Math.log(x) / Math.LN2;

const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };

/** A probability as the slides write it, "7.2·10⁻³"; zero is "0". */
export function sci(p, digits = 2) {
  if (p === 0) return "0";
  const [m, e] = p.toExponential(digits - 1).split("e");
  return Number(e) === 0 ? m : `${m}·10${[...String(Number(e))].map(c => SUP[c]).join("")}`;
}
