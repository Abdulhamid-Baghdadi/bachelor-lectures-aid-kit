// Short circuits and the stability of a generator after Gawlik (2015), sections 6.3 and 6.4.

import { shortCircuitImpedance } from "./network.js";

const W50 = 2 * Math.PI * 50;

/**
 * The short-circuit current of an R–L circuit switched onto √2 U sin(ωt + α) at t = 0 (6-29), in units of √2 I, the
 * peak of its steady AC part: sin(ωt + α − φ) − sin(α − φ) e^(−t/T), tan φ = ωL/R (6-23), T = L/R (6-30).
 */
export function shortCircuitCurrent(t, alpha, RX, w = W50) {
  const phi = Math.atan2(1, RX), T = 1 / (RX * w);
  return Math.sin(w * t + alpha - phi) - Math.sin(alpha - phi) * Math.exp(-t / T);
}
/** Its AC part alone and its decaying DC part alone. */
export const acPart = (t, alpha, RX, w = W50) => Math.sin(w * t + alpha - Math.atan2(1, RX));
export const dcPart = (t, alpha, RX, w = W50) => -Math.sin(alpha - Math.atan2(1, RX)) * Math.exp(-t * RX * w);

/** The same by integrating L di/dt + R i = √2 U sin(ωt + α) (6-20) with fourth-order Runge–Kutta, in the same units:
 *  the second route. */
export function shortCircuitIntegrated(tEnd, alpha, RX, steps = 20000, w = W50) {
  // Units: L = 1/ω, R = RX, √2 U = |Z| = √(R² + 1), so √2 I = 1.
  const L = 1 / w, R = RX, amp = Math.hypot(RX, 1), h = tEnd / steps;
  const f = (t, i) => (amp * Math.sin(w * t + alpha) - R * i) / L;
  let i = 0, t = 0;
  for (let k = 0; k < steps; k++) {
    const k1 = f(t, i), k2 = f(t + h / 2, i + h * k1 / 2), k3 = f(t + h / 2, i + h * k2 / 2), k4 = f(t + h, i + h * k3);
    i += h * (k1 + 2 * k2 + 2 * k3 + k4) / 6; t += h;
  }
  return i;
}

/** The peak factor κ = 1 + e^(−R t/L) at t = 10 ms (6-43); at 50 Hz R t/L = π R/X. */
export const kappa = (RX, f = 50) => 1 + Math.exp(-RX * 2 * Math.PI * f * 0.01);
/** The true largest peak of (6-29) over every switching angle and the first 40 ms, by search. */
export function peakSearched(RX) {
  let best = 0;
  for (let a = 0; a < 180; a += 1) for (let t = 0; t <= 0.04; t += 0.0001) best = Math.max(best, Math.abs(shortCircuitCurrent(t, a * Math.PI / 180, RX)));
  return best;
}

/** The initial symmetrical short-circuit current of a three-phase fault, I″k3 = c U_n / (√3 |Z_k|) (6-31). */
export const ik3 = (c, Un, Zk) => c * Un / (Math.sqrt(3) * Zk);
/** The impedance of a feeding network from its short-circuit power, Z_Q = c U_n² / S″_kQ (6-32). */
export const networkImpedance = (c, Un, Sk) => c * Un * Un / Sk;

/**
 * The impedances of Gawlik's example network (p. 215–216), each [R, X] in ohms referred to the voltage Uref: a feeding
 * network of short-circuit power SkQ (c, R/X given), a transformer (u_k, S_rT, P_k) and a line (R', X', length).
 */
export function exampleNetwork(q, Uref) {
  const ZQ = networkImpedance(q.c, Uref, q.SkQ), XQ = ZQ / Math.hypot(1, q.RXQ);
  const ZT = shortCircuitImpedance(q.uk, Uref, q.ST), RT = q.Pk * Uref * Uref / (q.ST * q.ST);
  const parts = { feeder: [q.RXQ * XQ, XQ], transformer: [RT, Math.sqrt(ZT * ZT - RT * RT)], line: [q.Rl * q.len, q.Xl * q.len] };
  return { ...parts, total: [0, 1].map(i => parts.feeder[i] + parts.transformer[i] + parts.line[i]) };
}

// --- Equal-area criterion (6.4.4), per unit of the generator's rating; angles in radians.

/** The two areas for a turbine power Pm, the curves' peaks before, during and after the fault, and the clearing angle
 *  δc. A1 accelerates, A2 can brake; stable while A2 ≥ A1. */
export function equalArea({ Pm, Ppre, Pfault, Ppost }, dc) {
  const d0 = Math.asin(Pm / Ppre), dmax = Math.PI - Math.asin(Pm / Ppost);
  const A1 = Pm * (dc - d0) + Pfault * (Math.cos(dc) - Math.cos(d0));
  const A2 = Ppost * (Math.cos(dc) - Math.cos(dmax)) - Pm * (dmax - dc);
  return { d0, dmax, A1, A2, stable: A2 >= A1 };
}
/** The critical clearing angle, where A1 = A2: cos δcr = [Pm (δmax − δ0) + Ppost cos δmax − Pfault cos δ0]/(Ppost − Pfault),
 *  derived here from the two integrals. NaN if the generator falls out of step even without a fault. */
export function criticalAngle({ Pm, Ppre, Pfault, Ppost }) {
  if (Pm >= Ppost || Pm >= Ppre) return NaN;
  const d0 = Math.asin(Pm / Ppre), dmax = Math.PI - Math.asin(Pm / Ppost);
  const c = (Pm * (dmax - d0) + Ppost * Math.cos(dmax) - Pfault * Math.cos(d0)) / (Ppost - Pfault);
  return c < -1 || c > 1 ? NaN : Math.acos(c);
}
/** The areas by Simpson's rule on the curves themselves: the second route. */
export function areasIntegrated({ Pm, Ppre, Pfault, Ppost }, dc, n = 2000) {
  const simpson = (f, a, b) => {
    const h = (b - a) / n; let s = f(a) + f(b);
    for (let k = 1; k < n; k++) s += (k % 2 ? 4 : 2) * f(a + k * h);
    return s * h / 3;
  };
  const d0 = Math.asin(Pm / Ppre), dmax = Math.PI - Math.asin(Pm / Ppost);
  return { A1: simpson(d => Pm - Pfault * Math.sin(d), d0, dc), A2: simpson(d => Ppost * Math.sin(d) - Pm, dc, dmax) };
}
