// The laws of Kugi (2015), chapters 4–8: the loop with one degree of freedom, stability tests, loop shaping, sampled
// systems, the Tustin transformation, reachability, state feedback and the observer. Pure: built on lti.js, no page.
import { cDiv, cAbs, cExp } from "./complex.js";
import {
  polyval, polyMul, polyAdd, roots, freq, bode, logspace, routh, realise, zoh, ackermann, expm, inv, eye, matMul,
  matVec, matAdd, matScale, transpose, det,
} from "./lti.js";

const rad = d => d * Math.PI / 180;

// --- 4.3.1 and (5.10): the loop's type and steady-state error ---

/** L(s) = V/s^ρ · z(s)/n(s) with z(0) = n(0) = 1 (4.54): the number ρ of poles at s = 0 and the gain V. */
export function loopType(L) {
  let rho = 0;
  while (rho < L.den.length - 1 && L.den[L.den.length - 1 - rho] === 0) rho++;
  return { rho, V: L.num[L.num.length - 1] / L.den[L.den.length - 1 - rho] };
}
/** The steady-state error e∞ of the stable loop to a unit step or unit ramp, table (5.10). */
export function loopSteadyError(L, input = "step") {
  const { rho, V } = loopType(L);
  if (input === "step") return rho === 0 ? 1 / (1 + V) : 0;
  return rho === 0 ? Infinity : rho === 1 ? 1 / V : 0;
}

// --- 4.4.1 Routh–Hurwitz ---

/** Is the polynomial a Hurwitz polynomial? Every entry of the pivot column of (4.31) non-zero with one sign. */
export const loopHurwitz = p => { const r = routh(p); return r.regular && r.changes === 0; };

/** The largest gain K for which den + K·num stays Hurwitz, found from below by bisection (Beispiel 4.4); NaN when no
 *  positive K up to Kmax gives a stable loop, Infinity when every one does. */
export function loopRouthKmax({ num, den, Kmax = 1e4 }) {
  const ok = K => loopHurwitz(polyAdd(den, num.map(a => a * K)));
  const Ks = logspace(1e-6, Kmax, 400);
  const first = Ks.findIndex(ok);
  if (first < 0) return NaN;
  const bad = Ks.findIndex((K, i) => i > first && !ok(K));
  if (bad < 0) return Infinity;
  let lo = Ks[bad - 1], hi = Ks[bad];
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

// --- 4.4.3 margins read off the open loop ---

/** The crossover frequency ωC (|L| = 1), the phase margin Φ = arg L(jωC) + π (4.55), the phase crossover ω180 and the
 *  gain margin 1/|L(jω180)|, from the unwrapped Bode data. NaN where the curve does not cross. */
export function loopMargins(L, w0 = 1e-3, w1 = 1e3, n = 3000) {
  const B = bode(L, logspace(w0, w1, n));
  const cross = (f, level) => {
    for (let k = 1; k < B.length; k++) {
      const a = f(B[k - 1]) - level, b = f(B[k]) - level;
      if (a === 0) return k - 1;
      if (a * b < 0) return k - 1 + a / (a - b);
    }
    return NaN;
  };
  const at = (pos, key) => { const k = Math.floor(pos), f = pos - k; return k + 1 < B.length ? B[k][key] * (1 - f) + B[k + 1][key] * f : B[k][key]; };
  const lw = pos => Math.exp(Math.log(B[Math.floor(pos)].w) * (1 - pos % 1) + Math.log(B[Math.min(B.length - 1, Math.floor(pos) + 1)].w) * (pos % 1));
  const c = cross(p => p.db, 0), p = cross(q => q.phase, -180);
  const wc = Number.isNaN(c) ? NaN : lw(c), w180 = Number.isNaN(p) ? NaN : lw(p);
  return {
    wc, phaseMargin: Number.isNaN(c) ? NaN : at(c, "phase") + 180,
    w180, gainMargin: Number.isNaN(p) ? NaN : 1 / cAbs(freq(L, w180)),
  };
}

// --- 5.1 PI design by loop shaping ---

/** The PI controller R(s) = VI(1 + sTI)/s (5.14) for a crossover ωC and phase margin Φ in degrees: the zero lifts the
 *  phase of L1 = G/s (5.15) by the missing angle (5.16), then VI puts |L(jωC)| = 1 (5.17). */
export function loopPiShape(G, wc, phi) {
  const L1 = { num: G.num, den: polyMul(G.den, [1, 0]) };
  const argL1 = bode(L1, [...logspace(wc * 1e-3, wc, 400)]).at(-1).phase;
  const lift = phi - 180 - argL1;
  const TI = Math.tan(rad(lift)) / wc;
  const VI = 1 / (cAbs(freq(L1, wc)) * Math.hypot(1, wc * TI));
  return { argL1, lift, TI, VI, possible: lift > 0 && lift < 90, R: { num: [VI * TI, VI], den: [1, 0] } };
}
/** The rise time as the notes define it (Abb. 5.2, Aufgabe 5.3): the final value over the steepest slope, i.e. the
 *  length the tangent at the inflection point needs to climb from 0 to the final value. */
export function loopTangentRise(t, y) {
  let m = 0;
  for (let k = 1; k < y.length; k++) m = Math.max(m, (y[k] - y[k - 1]) / (t[k] - t[k - 1]));
  return y.at(-1) / m;
}

// --- 6.2, 6.4 sampled systems ---

/** The sampled system x_{k+1} = Φx_k + Γu_k, y_k = cᵀx_k + du_k of G(s) behind a zero-order hold (6.19). */
export function loopDiscretise(G, Ta) {
  const { A, b, c, d } = realise(G);
  return { ...zoh(A, b, Ta), c, d };
}
/** The double integrator's sampled system (6.25): Φ = [[1, Ta], [0, 1]], Γ = [Ta²/2, Ta]. */
export const loopDoubleIntegrator = Ta => ({ Phi: [[1, Ta], [0, 1]], Gamma: [Ta * Ta / 2, Ta], c: [1, 0], d: 0 });
/** The output sequence y_0 … y_N of a sampled system from rest for a unit step sequence (6.33). */
export function loopStairs({ Phi, Gamma, c, d }, N) {
  let x = Phi.map(() => 0);
  const y = [];
  for (let k = 0; k <= N; k++) { y.push(x.reduce((s, v, i) => s + c[i] * v, 0) + d); x = matVec(Phi, x).map((v, i) => v + Gamma[i]); }
  return y;
}
/** The poles of the z-transfer function: z = e^{s_j Ta} for every pole s_j of G(s) (Satz 6.3). */
export const loopZPoles = (den, Ta) => roots(den).map(([re, im]) => cExp([re * Ta, im * Ta]));
/** The rise time of a P-T2 element V/(1 + 2ξ(sT2) + (sT2)²), 0 < ξ < 1 (6.61). */
export const loopRisePT2 = (T2, xi) => T2 * Math.exp(Math.acos(xi) / Math.tan(Math.acos(xi)));

// --- 6.6 Tustin transformation ---

/** The transformed frequency Ω = (2/Ta)·tan(ωTa/2) (6.89), and back. */
export const loopWarp = (w, Ta) => 2 / Ta * Math.tan(w * Ta / 2);
export const loopUnwarp = (W, Ta) => 2 / Ta * Math.atan(W * Ta / 2);
/** R(z): R(s) with s replaced by q = (2/Ta)(z − 1)/(z + 1) (6.90); numerator and denominator in z, highest power
 *  first. */
export function loopTustin(G, Ta) {
  const N = Math.max(G.num.length, G.den.length) - 1;
  const pow = (p, k) => { let r = [1]; for (let i = 0; i < k; i++) r = polyMul(r, p); return r; };
  const map = p => p.reduce((acc, a, idx) => {
    const k = p.length - 1 - idx;
    return polyAdd(acc, polyMul(pow([1, -1], k), pow([1, 1], N - k)).map(v => v * a * (2 / Ta) ** k));
  }, [0]);
  return { num: map(G.num), den: map(G.den) };
}
/** The discrete frequency response G(e^{jωTa}). */
export const loopFreqZ = (Gz, w, Ta) => { const z = [Math.cos(w * Ta), Math.sin(w * Ta)]; return cDiv(polyval(Gz.num, z), polyval(Gz.den, z)); };

// --- 7.1 reachability ---

/** The reachability matrix R(A, b) = [b, Ab, …, A^{n−1}b] (7.11). */
export function loopReachMatrix(A, b) {
  const cols = [b];
  for (let k = 1; k < A.length; k++) cols.push(matVec(A, cols[k - 1]));
  return transpose(cols);
}
/** The Gramian G = ∫₀ᵀ e^{Aτ} b bᵀ e^{Aᵀτ} dτ (7.15), by Simpson's rule on n (even) steps. */
export function loopGramian(A, b, T, n = 400) {
  const h = T / n, Eh = expm(matScale(A, h));
  let E = eye(A.length), G = A.map(r => r.map(() => 0));
  for (let k = 0; k <= n; k++) {
    const v = matVec(E, b), w = k === 0 || k === n ? 1 : k % 2 ? 4 : 2;
    G = matAdd(G, v.map(a => v.map(c => a * c)), w * h / 3);
    E = matMul(Eh, E);
  }
  return G;
}
/** The input u(t) = bᵀe^{Aᵀ(T−t)}G⁻¹x(T) that steers x from 0 to x(T) in the time T (7.18). */
export function loopSteer(A, b, T, xT) {
  const w = matVec(inv(loopGramian(A, b, T)), xT);
  return t => matVec(expm(matScale(A, T - t)), b).reduce((s, v, i) => s + v * w[i], 0);
}

// --- 8.1, 8.3, 8.4 state feedback and observer (discrete time, the notes' signs: u_k = kᵀx_k + g r_k) ---

/** kᵀ with eig(Φ + Γkᵀ) at the given poles, Ackermann's formula (8.18b); poles as numbers or [re, im] pairs. */
export const loopStateGain = (Phi, Gamma, poles) => ackermann(Phi, Gamma, poles).map(v => -v);
/** k̂ with eig(Φ + k̂cᵀ) at the given poles (8.66b), by duality (8.68): Φ → Φᵀ, Γ → c. */
export const loopObserverGain = (Phi, c, poles) => loopStateGain(transpose(Phi), c, poles);
/** The prefilter g that gives y_k → r_0 for a step sequence (8.39). */
export function loopPrefilter(Phi, Gamma, c, d, k) {
  const n = Phi.length;
  const M = inv(matAdd(eye(n), matAdd(Phi, Gamma.map(gi => k.map(kj => gi * kj))), -1));
  const v = matVec(M, Gamma);
  return 1 / (c.reduce((s, ci, i) => s + (ci + d * k[i]) * v[i], 0) + d);
}
/** The loop of Abb. 8.3 run for N steps: the plant (8.71), the observer (8.72) when k̂ is given, and the controller
 *  (8.73) fed by the estimate (or by the true state when there is no observer). */
export function loopRun({ Phi, Gamma, c, k, g = 0, kh = null, x0, xh0 = x0, r = 0, N }) {
  let x = [...x0], xh = [...xh0];
  const out = { x: [], xh: [], u: [], y: [] };
  for (let i = 0; i <= N; i++) {
    const used = kh ? xh : x;
    const u = k.reduce((s, kj, j) => s + kj * used[j], 0) + g * r;
    const y = c.reduce((s, cj, j) => s + cj * x[j], 0), yh = c.reduce((s, cj, j) => s + cj * xh[j], 0);
    out.x.push(x); out.xh.push(xh); out.u.push(u); out.y.push(y);
    const xn = matVec(Phi, x).map((v, j) => v + Gamma[j] * u);
    if (kh) xh = matVec(Phi, xh).map((v, j) => v + Gamma[j] * u + kh[j] * (yh - y));
    x = xn;
  }
  return out;
}
/** z-poles of a pair s = −ξω0 ± jω0√(1 − ξ²) sampled with Ta (Satz 6.3). */
export function loopPairZ(w0, xi, Ta) {
  const re = -xi * w0, im = w0 * Math.sqrt(Math.max(0, 1 - xi * xi));
  return [cExp([re * Ta, im * Ta]), cExp([re * Ta, -im * Ta])];
}

const pick = (v, i = 0) => v[i];
export const LAWS = {
  loopStepError: ({ num, den }) => loopSteadyError({ num, den }, "step"),
  loopRampError: ({ num, den }) => loopSteadyError({ num, den }, "ramp"),
  loopRouthKmax: q => loopRouthKmax(q),
  loopPhaseMargin: ({ num, den }) => loopMargins({ num, den }).phaseMargin,
  loopGainMargin: ({ num, den }) => loopMargins({ num, den }).gainMargin,
  loopPiTI: ({ num, den, wc, phi }) => loopPiShape({ num, den }, wc, phi).TI,
  loopPiVI: ({ num, den, wc, phi }) => loopPiShape({ num, den }, wc, phi).VI,
  loopRisePT2: ({ T2, xi }) => loopRisePT2(T2, xi),
  loopZPole: ({ s, Ta }) => Math.exp(s * Ta),
  loopWarp: ({ w, Ta }) => loopWarp(w, Ta),
  loopUnwarp: ({ W, Ta }) => loopUnwarp(W, Ta),
  loopReachDet: ({ A, b }) => det(loopReachMatrix(A, b)),
  loopGramian: ({ A, b, T, i, j }) => loopGramian(A, b, T)[i][j],
  loopStateGain: ({ Phi, Gamma, poles, i }) => pick(loopStateGain(Phi, Gamma, poles), i),
  loopPrefilter: ({ Phi, Gamma, c, d = 0, poles }) => loopPrefilter(Phi, Gamma, c, d, loopStateGain(Phi, Gamma, poles)),
  loopObserverGain: ({ Phi, c, poles, i }) => pick(loopObserverGain(Phi, c, poles), i),
};
