// The statistics and the one seeded generator the measurement laws need. Pure: the same seed always gives the same
// readings, so a scatter of measured values looks the same at every visit.

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

export const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length;

/** The empirical standard deviation of single values, with N − 1 (Schrüfer et al. 2012, eq. 1.48). */
export function std(xs) {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

export const dB = power => 10 * Math.log10(power);
