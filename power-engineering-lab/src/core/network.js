// Lines and transformers after Gawlik (2015), chapter 4, and the power a reactance can carry, section 6.2.
import { C, cAdd, cMul, cDiv, cAbs, cSqrt, cCosh, cSinh } from "../../../kit/core/index.js";
import { conj, sub, scale } from "./threephase.js";

const W50 = 2 * Math.PI * 50;

// --- Transformer: the per-unit values of the short-circuit and open-circuit tests (4-75 … 4-85).

/** The inductive part of the short-circuit voltage, u_σ = √(u_k² − u_r²) (4-82). */
export const uSigma = (uk, ur) => Math.sqrt(uk * uk - ur * ur);
/** u_r = P_k/S_rT (4-80). */
export const urFromPk = (Pk, Sr) => Pk / Sr;
/** The short-circuit impedance in ohms on one side, Z_k = u_k U_r²/S_r (4-81 with Z_rT = U_r²/S_r). */
export const shortCircuitImpedance = (uk, Ur, Sr) => uk * Ur * Ur / Sr;

/**
 * The secondary voltage of a transformer (per unit, the primary held at U1) through its series impedance r + jx
 * (shunt branch neglected) for a load P + jQ taken at the secondary. U1² = |U2 + (r + jx) I|² with I = (P − jQ)/U2
 * gives a quadratic in U2²; the upper root is the operating point. Also the load-flow solution of section 6.2 when
 * r = 0, there with the line's reactance.
 */
export function receivingVoltage(U1, r, x, P, Q) {
  const b = U1 * U1 - 2 * (r * P + x * Q), c = (r * r + x * x) * (P * P + Q * Q);
  // Beyond the nose of the curve there is no operating point; at the nose rounding may leave −1e-17.
  const disc = b * b / 4 - c;
  if (disc < -1e-12) return NaN;
  return Math.sqrt(b / 2 + Math.sqrt(Math.max(0, disc)));
}
/** The lower root: the unstable second solution, the lower half of the PV curve. */
export function receivingVoltageLow(U1, r, x, P, Q) {
  const b = U1 * U1 - 2 * (r * P + x * Q), c = (r * r + x * x) * (P * P + Q * Q);
  const disc = b * b / 4 - c;
  if (disc < -1e-12) return NaN;
  const low = b / 2 - Math.sqrt(Math.max(0, disc));
  return low < 0 ? NaN : Math.sqrt(low);
}
/** The same by fixed-point iteration on the phasors, U2 = U1 − z (S/U2)*, as a second route. */
export function receivingVoltageIterated(U1, r, x, P, Q, steps = 200) {
  let U2 = C(U1), z = C(r, x);
  for (let k = 0; k < steps; k++) {
    const I = conj(cDiv(C(P, Q), U2));
    U2 = sub(C(U1), cMul(z, I));
  }
  return cAbs(U2);
}

/** Losses of a transformer at a load of s = S/S_r: iron p_v (4-84) always, copper u_r s² (4-80); per unit of S_r. */
export const transformerLosses = (pv, ur, s) => pv + ur * s * s;

/** The circulating current between two paralleled transformers of equal |ü| and u_k whose vector groups differ by
 *  Δk·30°, relative to the short-circuit current of one: |1 − e^(−jΔk·30°)| / 2 (p. 111). */
export const circulatingRatio = dk => cAbs(sub(C(1), [Math.cos(-dk * Math.PI / 6), Math.sin(-dk * Math.PI / 6)])) / 2;

// --- Line: the homogeneous line (4-9, 4-13, 4-19), per kilometre values at 50 Hz.

/** γ = √((R' + jωL')(G' + jωC')) per km, and Z_w = √((R' + jωL')/(G' + jωC')). */
export function lineConstants({ R, L, G, Cap }, w = W50) {
  const Zs = C(R, w * L), Yp = C(G, w * Cap);
  return { gamma: cSqrt(cMul(Zs, Yp)), Zw: cSqrt(cDiv(Zs, Yp)) };
}

/**
 * The line of length l [km] fed with U1 (real, line-to-neutral or line-to-line alike) and loaded at its end with Z2
 * (Infinity for an open end; a number is a resistance): U1 = U2 cosh γl + Z_w I2 sinh γl (4-19), so U2 = U1 / (cosh γl + Z_w/Z2 sinh γl).
 * Returns U2, I2, the input current I1 and the voltage profile |U(x)| at nPoints from the sending end.
 */
export function lineSolve(params, l, U1, Z2, nPoints = 0) {
  const { gamma, Zw } = lineConstants(params);
  if (typeof Z2 === "number" && Z2 !== Infinity) Z2 = C(Z2);
  const gl = scale(gamma, l), ch = cCosh(gl), sh = cSinh(gl);
  const ratio = Z2 === Infinity ? C(0) : cDiv(Zw, Z2);
  const U2 = cDiv(C(U1), cAdd(ch, cMul(ratio, sh)));
  const I2 = Z2 === Infinity ? C(0) : cDiv(U2, Z2);
  const I1 = cAdd(cMul(cDiv(U2, Zw), sh), cMul(I2, ch));
  const profile = [];
  for (let k = 0; k <= nPoints && nPoints; k++) {
    const xr = l * (1 - k / nPoints), gx = scale(gamma, xr); // distance to the receiving end
    profile.push({ x: l * k / nPoints, U: cAbs(cAdd(cMul(U2, cCosh(gx)), cMul(cMul(Zw, I2), cSinh(gx)))) });
  }
  return { gamma, Zw, U2, I2, I1, profile };
}

/** The same line as a chain of n short π sections (R, L in series, half of G, C at each end), solved from the
 *  receiving end: the second route to lineSolve. */
export function lineByPiSections({ R, L, G, Cap }, l, U1, Z2, n = 2000, w = W50) {
  if (typeof Z2 === "number" && Z2 !== Infinity) Z2 = C(Z2);
  const d = l / n, Zs = C(R * d, w * L * d), Yh = C(G * d / 2, w * Cap * d / 2);
  // With U2 = 1 at the end, walk to the start, then scale so the start sees U1 (the network is linear).
  let U = C(1), I = Z2 === Infinity ? C(0) : cDiv(C(1), Z2);
  for (let k = 0; k < n; k++) {
    I = cAdd(I, cMul(Yh, U));
    U = cAdd(U, cMul(Zs, I));
    I = cAdd(I, cMul(Yh, U));
  }
  const k = U1 / cAbs(U);
  return { U2: k, I1: scale(I, k), U1phasor: scale(U, k) };
}

/** The natural (surge impedance) load P_nat = U_n²/Z_w (4-25), Z_w taken real. */
export const naturalLoad = (Un, Zw) => Un * Un / cAbs(Zw);

// --- Power over a reactance (6-4, 6-5), per unit: the 3 and the √3s cancel.
export const transferP = (U1, U2, X, delta) => U1 * U2 / X * Math.sin(delta);
export const transferQ = (U1, U2, X, delta) => (U1 * U2 * Math.cos(delta) - U2 * U2) / X;
