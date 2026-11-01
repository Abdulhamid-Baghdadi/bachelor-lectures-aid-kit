// The numerics every lab shares: polynomials with real coefficients (highest power first), their roots, transfer
// functions G(s) = num(s)/den(s) and their frequency response, small dense matrices, the matrix exponential and a fixed
// step Runge–Kutta integrator. Deterministic: fixed steps, fixed starting points, no randomness.
import { cAdd, cMul, cDiv, cAbs } from "./complex.js";

export const cSub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cArg = a => Math.atan2(a[1], a[0]);

/** p(z) for a complex z by Horner's rule; p = [a_n, …, a_0]. */
export function polyval(p, z) {
  let v = [0, 0];
  for (const a of p) v = cAdd(cMul(v, z), [a, 0]);
  return v;
}
/** p(x) for a real x. */
export const polyvalR = (p, x) => p.reduce((v, a) => v * x + a, 0);

export function polyMul(p, q) {
  const r = new Array(p.length + q.length - 1).fill(0);
  p.forEach((a, i) => q.forEach((b, j) => { r[i + j] += a * b; }));
  return r;
}
export function polyAdd(p, q) {
  const n = Math.max(p.length, q.length);
  const pp = [...new Array(n - p.length).fill(0), ...p], qq = [...new Array(n - q.length).fill(0), ...q];
  return pp.map((a, k) => a + qq[k]);
}
/** The monic polynomial with the given roots (complex roots in conjugate pairs give real coefficients). */
export function polyFromRoots(roots) {
  let p = [[1, 0]];
  for (const r of roots) {
    const z = Array.isArray(r) ? r : [r, 0];
    const next = new Array(p.length + 1).fill(null).map(() => [0, 0]);
    p.forEach((a, k) => { next[k] = cAdd(next[k], a); next[k + 1] = cSub(next[k + 1], cMul(a, z)); });
    p = next;
  }
  return p.map(a => Math.abs(a[0]) < 1e-12 ? 0 : a[0]);
}
/** Strip leading zeros. */
const trim = p => { let k = 0; while (k < p.length - 1 && Math.abs(p[k]) < 1e-300) k++; return p.slice(k); };

/** All roots of p by the Durand–Kerner iteration from fixed starting points; [re, im] pairs, sorted by real part. */
export function roots(p) {
  const q = trim(p);
  const n = q.length - 1;
  if (n < 1) return [];
  const a = q.map(c => c / q[0]);
  let z = Array.from({ length: n }, (_, k) => { const r = 1 + Math.max(...a.slice(1).map(Math.abs)); const t = 2 * Math.PI * k / n + 0.4; return [r * 0.9 * Math.cos(t), r * 0.9 * Math.sin(t)]; });
  for (let it = 0; it < 500; it++) {
    let move = 0;
    z = z.map((zi, i) => {
      let den = [1, 0];
      z.forEach((zj, j) => { if (j !== i) den = cMul(den, cSub(zi, zj)); });
      const step = cDiv(polyval(a, zi), den);
      move = Math.max(move, cAbs(step));
      return cSub(zi, step);
    });
    if (move < 1e-13) break;
  }
  return z.map(([re, im]) => [re, Math.abs(im) < 1e-9 * (1 + Math.abs(re)) ? 0 : im]).sort((u, v) => u[0] - v[0] || u[1] - v[1]);
}

/** G(jω) of a transfer function { num, den }. */
export const freq = (G, w) => cDiv(polyval(G.num, [0, w]), polyval(G.den, [0, w]));
/** G(s) at a complex s. */
export const tfAt = (G, s) => cDiv(polyval(G.num, s), polyval(G.den, s));

/** Bode data on the frequencies ws: magnitude in dB and phase in degrees, unwrapped so it runs continuously. */
export function bode(G, ws, delay = 0) {
  let prev = null, turn = 0;
  return ws.map(w => {
    const g = freq(G, w);
    let ph = cArg(g) * 180 / Math.PI;
    if (prev !== null) { while (ph + turn - prev > 180) turn -= 360; while (ph + turn - prev < -180) turn += 360; }
    const phase = ph + turn - delay * w * 180 / Math.PI;
    prev = ph + turn;
    return { w, db: 20 * Math.log10(cAbs(g)), phase, re: g[0], im: g[1] };
  });
}
/** n frequencies spaced evenly on a log scale from w0 to w1. */
export const logspace = (w0, w1, n) => Array.from({ length: n }, (_, k) => w0 * (w1 / w0) ** (k / (n - 1)));

export const series = (G, H) => ({ num: polyMul(G.num, H.num), den: polyMul(G.den, H.den) });
/** The closed loop T = L/(1 + L) of an open loop L = num/den. */
export const closeLoop = L => ({ num: L.num, den: polyAdd(L.den, L.num) });
/** The sensitivity S = 1/(1 + L). */
export const sensitivity = L => ({ num: L.den, den: polyAdd(L.den, L.num) });

// Matrices as arrays of rows.
export const zeros = (n, m = n) => Array.from({ length: n }, () => new Array(m).fill(0));
export const eye = n => zeros(n).map((r, i) => r.map((_, j) => i === j ? 1 : 0));
export const matMul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
export const matVec = (A, x) => A.map(r => r.reduce((s, a, k) => s + a * x[k], 0));
export const matAdd = (A, B, b = 1) => A.map((r, i) => r.map((a, j) => a + b * B[i][j]));
export const matScale = (A, c) => A.map(r => r.map(a => a * c));
export const transpose = A => A[0].map((_, j) => A.map(r => r[j]));
const norm1 = A => Math.max(...A[0].map((_, j) => A.reduce((s, r) => s + Math.abs(r[j]), 0)));

/** e^A by scaling and squaring with a Taylor series of 20 terms: accurate to round-off for the small, well scaled
 *  matrices of these labs. */
export function expm(A) {
  const n = A.length;
  const k = Math.max(0, Math.ceil(Math.log2(norm1(A) + 1e-300)) + 1);
  const As = matScale(A, 2 ** -k);
  let term = eye(n), sum = eye(n);
  for (let i = 1; i <= 20; i++) { term = matScale(matMul(term, As), 1 / i); sum = matAdd(sum, term); }
  for (let i = 0; i < k; i++) sum = matMul(sum, sum);
  return sum;
}

/** The rank by Gaussian elimination with partial pivoting; tol relative to the largest entry. */
export function rank(M, tol = 1e-9) {
  const A = M.map(r => [...r]);
  const scale = Math.max(1e-300, ...A.flat().map(Math.abs));
  let r = 0;
  for (let c = 0; c < A[0].length && r < A.length; c++) {
    let p = r;
    for (let i = r + 1; i < A.length; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
    if (Math.abs(A[p][c]) <= tol * scale) continue;
    [A[r], A[p]] = [A[p], A[r]];
    for (let i = r + 1; i < A.length; i++) { const f = A[i][c] / A[r][c]; for (let j = c; j < A[0].length; j++) A[i][j] -= f * A[r][j]; }
    r++;
  }
  return r;
}
export function det(M) {
  const A = M.map(r => [...r]), n = A.length;
  let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
    if (A[p][c] === 0) return 0;
    if (p !== c) { [A[c], A[p]] = [A[p], A[c]]; d = -d; }
    d *= A[c][c];
    for (let i = c + 1; i < n; i++) { const f = A[i][c] / A[c][c]; for (let j = c; j < n; j++) A[i][j] -= f * A[c][j]; }
  }
  return d;
}
export function inv(M) {
  const n = M.length, A = M.map((r, i) => [...r, ...eye(n)[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
    if (Math.abs(A[p][c]) < 1e-300) throw new Error("The matrix is singular: it has no inverse.");
    [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c];
    A[c] = A[c].map(a => a / d);
    for (let i = 0; i < n; i++) if (i !== c) { const f = A[i][c]; A[i] = A[i].map((a, j) => a - f * A[c][j]); }
  }
  return A.map(r => r.slice(n));
}
/** The characteristic polynomial det(sI − A) = [1, a_{n−1}, …, a_0] by the Faddeev–LeVerrier recursion. */
export function charpoly(A) {
  const n = A.length;
  const c = [1];
  let M = zeros(n);
  for (let k = 1; k <= n; k++) {
    M = matAdd(matMul(A, M), eye(n), c[k - 1]);
    const AM = matMul(A, M);
    c.push(-AM.reduce((s, r, i) => s + r[i], 0) / k);
  }
  return c;
}

/** One Runge–Kutta step of 4th order for x' = f(t, x). */
export function rk4Step(f, t, x, h) {
  const k1 = f(t, x);
  const k2 = f(t + h / 2, x.map((v, i) => v + h / 2 * k1[i]));
  const k3 = f(t + h / 2, x.map((v, i) => v + h / 2 * k2[i]));
  const k4 = f(t + h, x.map((v, i) => v + h * k3[i]));
  return x.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
/** x(t) on n + 1 evenly spaced times from 0 to T: { t: [], x: [[…], …] }. */
export function simulate(f, x0, T, n) {
  const h = T / n, t = [0], x = [x0];
  for (let k = 0; k < n; k++) { x.push(rk4Step(f, k * h, x[k], h)); t.push((k + 1) * h); }
  return { t, x };
}

/** The controller canonical form of a proper G = num/den: A, b, c, d with G(s) = cᵀ(sI − A)⁻¹b + d. */
export function realise(G) {
  const den = trim(G.den), a0 = den[0], n = den.length - 1;
  const a = den.map(v => v / a0);
  let num = trim(G.num).map(v => v / a0);
  if (num.length > n + 1) throw new Error("The transfer function is not proper: the numerator's degree exceeds the denominator's.");
  num = [...new Array(n + 1 - num.length).fill(0), ...num];
  const d = num[0];
  const A = zeros(n);
  for (let i = 0; i < n - 1; i++) A[i][i + 1] = 1;
  for (let j = 0; j < n; j++) A[n - 1][j] = -a[n - j];
  const b = new Array(n).fill(0); b[n - 1] = 1;
  const c = Array.from({ length: n }, (_, j) => num[n - j] - d * a[n - j]);
  return { A, b, c, d };
}

/** The response y(t) of G to an input u(t) from rest, on n + 1 times from 0 to T. */
export function response(G, u, T, n = 400) {
  const { A, b, c, d } = realise(G);
  if (!A.length) { const t = Array.from({ length: n + 1 }, (_, k) => k * T / n); return { t, y: t.map(tt => d * u(tt)) }; }
  const run = simulate((t, x) => matVec(A, x).map((v, i) => v + b[i] * u(t)), new Array(A.length).fill(0), T, n);
  return { t: run.t, y: run.x.map((x, k) => x.reduce((s, v, i) => s + c[i] * v, 0) + d * u(run.t[k])) };
}
/** The step response h(t). */
export const step = (G, T, n = 400) => response(G, t => (t >= 0 ? 1 : 0), T, n);

/** Rise time, overshoot and settled value of a sampled step response, as the notes read them off: overshoot
 *  ü = (M − 1)·100 % of the final value, rise time from 10 % to 90 %. */
export function stepInfo(t, y) {
  const end = y.at(-1), M = Math.max(...y);
  const at = level => { const k = y.findIndex(v => v >= level * end); return k < 0 ? NaN : t[k]; };
  return { final: end, overshoot: end > 0 ? Math.max(0, (M / end - 1) * 100) : 0, rise: at(0.9) - at(0.1), peak: M };
}

/** The first column of the Routh array of p, and how many times its sign changes (= roots in the right half plane,
 *  when no zero turns up in the column). */
export function routh(p) {
  const q = trim(p), n = q.length;
  const rows = [q.filter((_, k) => k % 2 === 0), q.filter((_, k) => k % 2 === 1)];
  const w = rows[0].length;
  rows[1] = [...rows[1], ...new Array(w - rows[1].length).fill(0)];
  for (let i = 2; i < n; i++) {
    const a = rows[i - 2], b = rows[i - 1], r = new Array(w).fill(0);
    for (let j = 0; j < w - 1; j++) r[j] = b[0] === 0 ? NaN : (b[0] * a[j + 1] - a[0] * b[j + 1]) / b[0];
    rows.push(r);
  }
  const first = rows.map(r => r[0]);
  let changes = 0;
  for (let i = 1; i < first.length; i++) if (Math.sign(first[i]) !== Math.sign(first[i - 1])) changes++;
  return { rows, first, changes, regular: first.every(v => Number.isFinite(v) && v !== 0) };
}

/** Zero-order-hold discretisation: Φ = e^(A·Ta), Γ = ∫₀^Ta e^(Aτ) dτ b, by one exponential of the augmented matrix. */
export function zoh(A, b, Ta) {
  const n = A.length, M = zeros(n + 1);
  A.forEach((r, i) => r.forEach((a, j) => { M[i][j] = a * Ta; }));
  b.forEach((v, i) => { M[i][n] = v * Ta; });
  const E = expm(M);
  return { Phi: E.slice(0, n).map(r => r.slice(0, n)), Gamma: E.slice(0, n).map(r => r[n]) };
}

/** Ackermann's formula for a single input: kᵀ with eig(A − b kᵀ) the given poles. */
export function ackermann(A, b, poles) {
  const n = A.length, p = polyFromRoots(poles);
  const R = zeros(n);
  let col = [...b];
  for (let j = 0; j < n; j++) { R.forEach((r, i) => { r[j] = col[i]; }); col = matVec(A, col); }
  let P = zeros(n), Ak = eye(n);
  for (let k = n; k >= 0; k--) { P = matAdd(P, Ak, p[k]); Ak = matMul(Ak, A); }
  const e = new Array(n).fill(0); e[n - 1] = 1;
  const last = matVec(transpose(inv(R)), e);
  return matVec(transpose(P), last);
}
