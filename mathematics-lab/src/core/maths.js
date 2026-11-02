// The mathematics of Taschner's script for Mathematik 1 and 2 (TU Wien), each next to its section and printed page.
// Pure: numbers in, numbers out, so every lab's readout can be checked against the script's own worked values.

/** The Babylonian square root (pp. 1–3): a rectangle of area a with sides x and a/x is made squarer by taking their
 *  mean as the next side. Returns the sides x0, x1, …, xn. */
export function babylonian(a, x0, n) {
  const xs = [x0];
  for (let k = 0; k < n; k++) { const x = xs.at(-1); xs.push((x + a / x) / 2); }
  return xs;
}

/** Complex numbers as [re, im]: the product multiplies the moduli and adds the arguments (p. 93), de Moivre (p. 94). */
export const cMul = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c];
export const cAbs = ([a, b]) => Math.hypot(a, b);
export const cArg = ([a, b]) => Math.atan2(b, a);
export const polar = (r, phi) => [r * Math.cos(phi), r * Math.sin(phi)];
export function cPow(z, n) { let w = [1, 0]; for (let k = 0; k < n; k++) w = cMul(w, z); return w; }

/** The partial sums s_n = 1 + q + … + q^(n−1) of the geometric series and its sum 1/(1 − q) for |q| < 1 (p. 126). */
export const geometricPartial = (q, n) => Array.from({ length: n }, (_, k) => (1 - q ** (k + 1)) / (1 - q || NaN)).map((s, k) => q === 1 ? k + 1 : s);
export const geometricSum = q => Math.abs(q) < 1 ? 1 / (1 - q) : NaN;

/** Lower and upper sums of f over n equal parts of [a, b] (§ 28, p. 166): on each part the least and the greatest
 *  value, found here on a fine grid inside the part. */
export function riemannSums(f, a, b, n, fine = 40) {
  let lower = 0, upper = 0;
  const bars = [];
  for (let m = 0; m < n; m++) {
    const x0 = a + (b - a) * m / n, x1 = a + (b - a) * (m + 1) / n;
    let p = Infinity, q = -Infinity;
    for (let k = 0; k <= fine; k++) { const v = f(x0 + (x1 - x0) * k / fine); p = Math.min(p, v); q = Math.max(q, v); }
    lower += p * (x1 - x0); upper += q * (x1 - x0); bars.push({ x0, x1, p, q });
  }
  return { lower, upper, bars };
}

/** The secant's slope (f(x + h) − f(x))/h, which turns into the tangent's slope as h shrinks (pp. 204–205). */
export const secantSlope = (f, x, h) => (f(x + h) - f(x)) / h;

/** Newton's formula x* = x − f(x)/f'(x) (§ on Newton's formula, p. 308), applied n times from x0. */
export function newton(f, df, x0, n) {
  const xs = [x0];
  for (let k = 0; k < n; k++) { const x = xs.at(-1); xs.push(x - f(x) / df(x)); }
  return xs;
}

/** Taschner's bump φ_n(t) = c_n e^(−n²/(1 − n²t²)) for |t| < 1/n, zero outside, with c_n chosen so that its integral
 *  is 1 (pp. 285–286): pointwise it tends to 0 for every t ≠ 0, yet every integral stays 1 (p. 287). */
const bumpCache = new Map();
export function bumpConstant(n, steps = 4000) {
  if (bumpCache.has(n)) return bumpCache.get(n);
  let s = 0;
  for (let k = 0; k < steps; k++) { const t = -1 / n + (k + 0.5) * 2 / n / steps; s += Math.exp(-(n * n) / (1 - n * n * t * t)) * 2 / n / steps; }
  bumpCache.set(n, 1 / s);
  return 1 / s;
}
export const bump = (n, t) => Math.abs(t) < 1 / n ? bumpConstant(n) * Math.exp(-(n * n) / (1 - n * n * t * t)) : 0;

/** The 2 × 2 determinant (§ 59, p. 336) and Cramer's rule x_m = vol(…, w, …)/vol(u1, u2) (p. 400) for
 *  a11 x + a12 y = b1, a21 x + a22 y = b2; null when the determinant is zero. */
export const det2 = (a11, a12, a21, a22) => a11 * a22 - a12 * a21;
export function cramer2(a11, a12, a21, a22, b1, b2) {
  const d = det2(a11, a12, a21, a22);
  if (Math.abs(d) < 1e-12) return null;
  return [det2(b1, a12, b2, a22) / d, det2(a11, b1, a21, b2) / d];
}

/** The symmetric matrix [[a, b], [b, c]] of the quadratic form Q = a Δx² + 2b ΔxΔy + c Δy² (p. 410): its eigenvectors
 *  at φ0 and φ0 + 90° with tan 2φ0 = 2b/(a − c), and its eigenvalues λ = Q(φ0), μ = Q(φ0 + 90°). */
export function symmetricEigen(a, b, c) {
  const phi0 = b === 0 && a === c ? 0 : Math.atan2(2 * b, a - c) / 2;
  const Q = phi => a * Math.cos(phi) ** 2 + 2 * b * Math.sin(phi) * Math.cos(phi) + c * Math.sin(phi) ** 2;
  return { phi0, lambda: Q(phi0), mu: Q(phi0 + Math.PI / 2) };
}

/** ∮ f(z) dz once round the circle of radius R about z0, counter-clockwise, by the midpoint rule: zero for f
 *  holomorphic inside (Cauchy's integral theorem, p. 493). Returns [re, im]. */
export function contourIntegral(f, z0, R, n = 2000) {
  let re = 0, im = 0;
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) * 2 * Math.PI / n, z = [z0[0] + R * Math.cos(t), z0[1] + R * Math.sin(t)];
    const dz = [-R * Math.sin(t) * 2 * Math.PI / n, R * Math.cos(t) * 2 * Math.PI / n], w = cMul(f(z), dz);
    re += w[0]; im += w[1];
  }
  return [re, im];
}

/** The complex functions the Cauchy lab offers; 1/z and 1/z² are not holomorphic at 0. */
export const COMPLEX_FUNCTIONS = {
  square: { name: "f(z) = z²", f: z => cMul(z, z) },
  exp: { name: "f(z) = e^z", f: ([x, y]) => [Math.exp(x) * Math.cos(y), Math.exp(x) * Math.sin(y)] },
  inverse: { name: "f(z) = 1/z", f: ([x, y]) => { const r2 = x * x + y * y; return [x / r2, -y / r2]; }, pole: [0, 0] },
  inverseSquare: { name: "f(z) = 1/z²", f: ([x, y]) => { const r2 = x * x + y * y, a = [x / r2, -y / r2]; return cMul(a, a); }, pole: [0, 0] },
};
