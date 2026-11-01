// Measurement errors and uncertainty (Schrüfer et al. 2012, section 1.3): known systematic errors carried through a
// model, and the scatter of repeated readings with its mean, its standard uncertainty and Gauss's law.
import { gaussian, mean, std } from "./maths.js";

/** Student's t factor, Table 1.6 (p. 44): rows N, columns the confidence 68.3 %, 95.5 %, 99.7 %. */
export const STUDENT = [
  [2, 1.84, 18.44, 235.8], [3, 1.32, 4.93, 19.21], [4, 1.20, 3.48, 9.22], [5, 1.15, 2.98, 6.62], [6, 1.11, 2.73, 5.51],
  [8, 1.08, 2.50, 4.53], [10, 1.06, 2.37, 4.09], [20, 1.03, 2.18, 3.45], [50, 1.01, 2.08, 3.16], [100, 1.00, 2.04, 3.08],
  [Infinity, 1, 2, 3],
];
export const LEVELS = ["68.3 %", "95.5 %", "99.7 %"];

/** The t factor for N readings at confidence column a (1, 2 or 3 sigma); between table rows the next smaller N is
 *  taken, which errs on the safe side. */
export function studentT(N, a = 1) {
  const row = [...STUDENT].reverse().find(r => r[0] <= N) ?? STUDENT[0];
  return row[a];
}

/** Repeated readings: the mean (eq. 1.46), s of a single value (1.48), the uncertainty of the mean s/√N (1.53) and,
 *  with Student's factor, t·s/√N (1.83). */
export function repeated(xs, a = 1) {
  const N = xs.length, s = std(xs), u = s / Math.sqrt(N);
  return { N, mean: mean(xs), s, u, t: studentT(N, a), expanded: studentT(N, a) * u };
}

/** N seeded readings around a true value with standard deviation s. */
export const readings = (seed, N, truth, s) => gaussian(seed, N).map(g => truth + s * g);

/** The partial derivatives of f at x, by central differences. */
export function partials(f, x) {
  return x.map((xi, i) => {
    const h = 1e-6 * (Math.abs(xi) || 1), up = [...x], down = [...x];
    up[i] += h; down[i] -= h;
    return (f(up) - f(down)) / (2 * h);
  });
}

/** A known systematic error carried through the model, linearised: Δy = Σ ∂f/∂xi · Δxi (eq. 1.37). */
export const systematic = (f, x, dx) => partials(f, x).reduce((s, d, i) => s + d * dx[i], 0);

/** For a product of powers y = Π xi^αi the relative errors add with the exponents: Δy/y = Σ αi Δxi/xi (eq. 1.43). */
export const relativePowerLaw = (alphas, rel) => alphas.reduce((s, a, i) => s + a * rel[i], 0);

/** Gauss's law of propagation for independent quantities: s(y) = √Σ (∂f/∂xi · s(xi))² (eq. 1.74). */
export const gauss = (f, x, s) => Math.sqrt(partials(f, x).reduce((sum, d, i) => sum + (d * s[i]) ** 2, 0));

/** The worst case, every contribution with the same sign: Σ |∂f/∂xi| s(xi), always at least Gauss's sum. */
export const worstCase = (f, x, s) => partials(f, x).reduce((sum, d, i) => sum + Math.abs(d * s[i]), 0);

/** The second route to s(y): draw seeded values of every input, evaluate the model, take the spread. */
export function monteCarlo(f, x, s, seed, n) {
  const g = x.map((_, i) => gaussian(seed + 7919 * i, n));
  const ys = Array.from({ length: n }, (_, k) => f(x.map((xi, i) => xi + s[i] * g[i][k])));
  return { mean: mean(ys), s: std(ys), ys };
}

/** The models the propagation lab offers, each with its inputs and units. */
export const MODELS = {
  power: { name: "P = U · I · cos φ", unit: "W", f: ([U, I, phi]) => U * I * Math.cos(phi),
           inputs: [["U", "V", 5], ["I", "A", 0.2], ["φ", "rad", 0.6]] },
  weight: { name: "g₂ = g₃ − g₁", unit: "g", f: ([g3, g1]) => g3 - g1,
            inputs: [["g₃", "g", 600], ["g₁", "g", 80]] },
  heating: { name: "P = U² / R", unit: "W", f: ([U, R]) => U * U / R,
             inputs: [["U", "V", 10], ["R", "Ω", 50]] },
};
