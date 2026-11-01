// The models of Kugi (2015), chapters 1–3: the series resonant circuit, the DC motor, the two-tank system and its
// linearisation, the solution behaviour of ẋ = Ax, and the control engineering transfer elements. Pure: no page, no
// clock, no randomness. Numerics (matrices, e^A, Runge–Kutta, frequency response) come from lti.js.
import { expm, matScale, matVec, simulate, freq, bode, roots } from "./lti.js";

const deg = r => r * 180 / Math.PI;

// ---- 1.2 Series resonant circuit ------------------------------------------------------------------------------------

/** State model (1.8), (1.9) with x = [uC, iL]: ẋ = Ax + bu, y = cᵀx. */
export const rlcModel = (R, L, C) => ({ A: [[0, 1 / C], [-1 / L, -R / L]], b: [0, 1 / L], c: [0, R] });

/** δ = R/(2L) and ω = √(1/(CL) − δ²) of (1.11); ω is NaN when (1.12) fails (no oscillation). */
export const rlcRates = (R, L, C) => ({ delta: R / (2 * L), omega: Math.sqrt(1 / (C * L) - (R / (2 * L)) ** 2) });

/** The free response (1.10) for u = 0 from uC,0 and iL,0, valid while (1.12) holds. */
export function rlcFree(R, L, C, uC0, iL0, t) {
  const { delta: d, omega: w } = rlcRates(R, L, C), e = Math.exp(-d * t);
  return {
    uC: e * ((d * uC0 + iL0 / C) / w * Math.sin(w * t) + uC0 * Math.cos(w * t)),
    iL: -e * ((d * iL0 + uC0 / L) / w * Math.sin(w * t) - iL0 * Math.cos(w * t)),
  };
}

/** The states after a step u(t) = U from rest, on n + 1 times from 0 to T. */
export function rlcStep(R, L, C, U, T, n = 400) {
  const { A, b } = rlcModel(R, L, C);
  return simulate((t, x) => matVec(A, x).map((v, i) => v + b[i] * U), [0, 0], T, n);
}

// ---- 1.4 DC motor with constant excitation --------------------------------------------------------------------------

/** (1.25a) and (1.25d) with the excitation held constant, kΨF = K: x = [iA, ω], inputs uA and the load torque
 *  ML = m g r; J = θG + θT + m r². */
export const dcMotorRhs = ({ RA, LA, K, J }, uA, ML) => (t, [iA, w]) => [(uA - RA * iA - K * w) / LA, (K * iA - ML) / J];

/** The rest state for constant uA and ML: K iA = ML and uA = RA iA + K ω. */
export const dcMotorRest = ({ RA, K }, uA, ML) => ({ iA: ML / K, w: (uA - RA * ML / K) / K });

// ---- 1.5 Two-tank system and 2.5 linearisation ----------------------------------------------------------------------

const G0 = 9.81;
/** (1.29): A ḣ1 = q − a√(2g h1), A ḣ2 = a√(2g h1) − a√(2g h2), levels kept ≥ 0. */
export const tankRhs = ({ A, a, g = G0 }, q) => (t, [h1, h2]) => {
  const q1 = a * Math.sqrt(2 * g * Math.max(h1, 0)), q2 = a * Math.sqrt(2 * g * Math.max(h2, 0));
  return [(q - q1) / A, (q1 - q2) / A];
};
/** The rest level for a steady inflow qR (Aufgabe 2.18): h1,R = h2,R = qR²/(2g a²). */
export const tankRest = ({ a, g = G0 }, qR) => qR ** 2 / (2 * g * a ** 2);
/** The linearisation (2.53), (2.54) about that rest state, as Aufgabe 2.18 gives it: A, b and the output row c of q2. */
export function tankLinear({ A, a, g = G0 }, qR) {
  const k = a ** 2 * g / (A * qR);
  return { A: [[-k, 0], [k, -k]], b: [1 / A, 0], c: [0, a ** 2 * g / qR] };
}

// ---- 3.3 Solution behaviour of ẋ = Ax for 2 × 2 A -------------------------------------------------------------------

/** The eigenvalues of a 2 × 2 matrix, as [re, im] pairs, and the kind of rest point they make. */
export function eigen2(M) {
  const tr = M[0][0] + M[1][1], dt = M[0][0] * M[1][1] - M[0][1] * M[1][0], disc = tr * tr / 4 - dt;
  const ev = disc >= 0 ? [[tr / 2 - Math.sqrt(disc), 0], [tr / 2 + Math.sqrt(disc), 0]]
                       : [[tr / 2, -Math.sqrt(-disc)], [tr / 2, Math.sqrt(-disc)]];
  const tiny = 1e-9;
  let kind;
  if (Math.abs(dt) < tiny) kind = "singular (a line of rest points)";
  else if (dt < 0) kind = "saddle";
  else if (disc < 0) kind = Math.abs(tr) < tiny ? "centre" : tr < 0 ? "stable focus" : "unstable focus";
  else kind = tr < 0 ? "stable node" : "unstable node";
  return { ev, kind, stable: ev.every(([re]) => re < 0) };
}

/** x(t) = Φ(t) x0 with the transition matrix Φ(t) = exp(At) (2.22), on n + 1 times from 0 to T. */
export function phaseTrajectory(M, x0, T, n = 120) {
  const Phi = expm(matScale(M, T / n)), xs = [x0];
  for (let k = 0; k < n; k++) xs.push(matVec(Phi, xs[k]));
  return xs;
}

// ---- 3.7 Frequency response ------------------------------------------------------------------------------------------

/** The asymptotic magnitude of the normalised form (3.119) in dB at ω: gain V, r integrators, first-order corners
 *  (numerator in z1, denominator in p1) and second-order corners (z2, p2), each straight lines by (3.122)–(3.125). */
export function bodeAsymptote({ V, r = 0, z1 = [], p1 = [], z2 = [], p2 = [] }, w) {
  const up = wk => Math.max(0, 20 * Math.log10(w / Math.abs(wk)));
  return 20 * Math.log10(Math.abs(V)) - 20 * r * Math.log10(w)
    + z1.reduce((s, k) => s + up(k), 0) - p1.reduce((s, k) => s + up(k), 0)
    + z2.reduce((s, k) => s + 2 * up(k), 0) - p2.reduce((s, k) => s + 2 * up(k), 0);
}

/** The Nyquist locus (Ortskurve) G(jω) for ω from w0 to w1, both branches: { re, im } for ω > 0 and its mirror. */
export function nyquistLocus(G, w0, w1, n = 400) {
  const pts = bode(G, Array.from({ length: n }, (_, k) => w0 * (w1 / w0) ** (k / (n - 1))));
  return { re: pts.map(p => p.re), im: pts.map(p => p.im) };
}

/** The first ω in [w0, w1] where G(jω) crosses the real axis (Im G = 0), by bisection on a log grid. */
export function realAxisCrossing(G, w0, w1) {
  const im = w => freq(G, w)[1];
  const ws = Array.from({ length: 400 }, (_, k) => w0 * (w1 / w0) ** (k / 399));
  for (let k = 0; k < ws.length - 1; k++) {
    let a = ws[k], b = ws[k + 1];
    if (Math.sign(im(a)) === Math.sign(im(b))) continue;
    for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (Math.sign(im(m)) === Math.sign(im(a))) a = m; else b = m; }
    return (a + b) / 2;
  }
  return NaN;
}

// ---- 3.8 Transfer elements -------------------------------------------------------------------------------------------

/** P-T1 (3.133): step response (3.134). */
export const pt1Step = (V, T, t) => V * (1 - Math.exp(-t / T));
/** P-T2 (3.137): G = V/(1 + 2ξ(sT) + (sT)²) as { num, den }. */
export const pt2 = (V, T, xi) => ({ num: [V], den: [T * T, 2 * xi * T, 1] });
/** The step response (3.138) for 0 < ξ < 1. */
export function pt2Step(V, T, xi, t) {
  const r = Math.sqrt(1 - xi * xi), w = r * t / T;
  return V * (1 - (xi / r * Math.sin(w) + Math.cos(w)) * Math.exp(-xi * t / T));
}
/** The poles of (3.137): s = (−ξ ± j√(1 − ξ²))/T for ξ < 1. */
export const pt2Poles = (T, xi) => roots(pt2(1, T, xi).den);
/** The peak of (3.138): its first maximum, at ωd t = π, is V(1 + e^(−πξ/√(1 − ξ²))) (derived from (3.138)). */
export const pt2Peak = (V, xi) => V * (1 + Math.exp(-Math.PI * xi / Math.sqrt(1 - xi * xi)));

/** The elements of 3.8.3–3.8.9 as { num, den }; the ideal D and PD elements are improper (not realisable). */
export function transferElement(kind, { VP = 1, VI = 1, VD = 1, TI = 1, TD = 1, TR = 0.1, V = 1, T = 1, alpha = 0.1 } = {}) {
  switch (kind) {
    case "P": return { num: [VP], den: [1] };                                     // (3.141)
    case "I": return { num: [VI], den: [1, 0] };                                  // (3.143)
    case "PI": return { num: [VI * TI, VI], den: [1, 0] };                        // (3.145)
    case "D": return { num: [VD, 0], den: [1] };                                  // (3.147)
    case "DT1": return { num: [VD, 0], den: [TR, 1] };                            // (3.148)
    case "PD": return { num: [VP * TD, VP], den: [1] };                           // (3.150)
    case "lead": return { num: [V * T, V], den: [alpha * T, 1] };                 // (3.151)
    case "PID": return { num: [VP * TI * TD, VP * (TI + TD), VP], den: [TR, 1, 0] }; // (3.157)
    default: throw new Error(`No element "${kind}"; there are P, I, PI, D, DT1, PD, lead and PID.`);
  }
}
/** The lead element's largest phase lift (3.155), (3.156): at ωmax = 1/(T√α), φmax = arctan(1/√α) − arctan(√α). */
export const leadMax = (T, alpha) => ({ w: 1 / (T * Math.sqrt(alpha)), phi: deg(Math.atan(1 / Math.sqrt(alpha)) - Math.atan(Math.sqrt(alpha))) });

/** The dead-time element (3.159), G(jω) = e^(−jωTt): magnitude 1, phase −ωTt in degrees. */
export const deadTimePhase = (Tt, w) => -deg(w * Tt);

// ---- 3.10 Pole-zero diagram ------------------------------------------------------------------------------------------

/** Damping ξ and time constant T of a pole pair σ ± jω, by (3.166) and (3.167). */
export const pairDamping = (sigma, omega) => ({ xi: -sigma / Math.hypot(sigma, omega), T: 1 / Math.hypot(sigma, omega) });
/** BIBO stable (Satz 3.8) when every pole has a negative real part. */
export const biboStable = poles => poles.every(([re]) => re < 0);

// ---- The laws behind the practice questions --------------------------------------------------------------------------
export const LAWS = {
  sysRlcOmega: ({ R, L, C }) => rlcRates(R, L, C).omega,
  sysDcSpeed: ({ RA, K, uA, ML }) => dcMotorRest({ RA, K }, uA, ML).w,
  sysTankRest: ({ a, qR, g }) => tankRest({ a, g }, qR),
  sysEigenMax: ({ A }) => Math.max(...eigen2(A).ev.map(([re]) => re)),
  sysBodeAsym: c => bodeAsymptote(c, c.w),
  sysNyquistCross: ({ num, den, w0, w1 }) => realAxisCrossing({ num, den }, w0, w1),
  sysPt1Step: ({ V, T, t }) => pt1Step(V, T, t),
  sysPt1Slope: ({ V, T }) => V / T,
  sysPt2Imag: ({ T, xi }) => Math.sqrt(1 - xi * xi) / T,
  sysPt2Peak: ({ V, xi }) => pt2Peak(V, xi),
  sysLeadMaxPhase: ({ T, alpha }) => leadMax(T, alpha).phi,
  sysPiStep: ({ VI, TI, t }) => VI * t + VI * TI,
  sysDeadTimePhase: ({ Tt, w }) => deadTimePhase(Tt, w),
  sysPoleDamping: ({ sigma, omega }) => pairDamping(sigma, omega).xi,
  sysPoleTime: ({ sigma, omega }) => pairDamping(sigma, omega).T,
};
