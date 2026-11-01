// Machines after Schrödl (2012): the space vector of a three-phase winding (M.8–M.9), the separately excited DC
// machine (G.30–G.49, G.80–G.83) and the permanent-magnet synchronous machine in rotor coordinates (P.1–P.8); the
// synchronous speed and the slip after Gawlik (2015), section 4.3. Quantities of the PMSM are per unit as in Schrödl.
import { C, cAdd, cMul, cExp } from "../../../kit/core/index.js";
import { A, A2, conj, scale } from "./threephase.js";

/** The space vector of three phase quantities, x = 2/3 (x_u + x_v e^(j2π/3) + x_w e^(j4π/3)) (M.9). */
export const spaceVector = (xu, xv, xw) => scale(cAdd(cAdd(C(xu), scale(A, xv)), scale(A2, xw)), 2 / 3);
/** The phase quantities a space vector stands for (no zero-sequence part): x_k = Re{x e^(−j k 2π/3)}. */
export const phaseValues = x => [0, 1, 2].map(k => cMul(x, cExp([0, -k * 2 * Math.PI / 3]))[0]);

/** The three phase currents at ωt, each of its own amplitude; swap = true exchanges phases v and w. */
export const phaseCurrents = (wt, [au, av, aw], swap = false) => {
  const s = swap ? -1 : 1;
  return [au * Math.cos(wt), av * Math.cos(wt - s * 2 * Math.PI / 3), aw * Math.cos(wt - s * 4 * Math.PI / 3)];
};
/** The magnetic potential the three windings set up around the gap at angle γ, each a standing cos wave along its
 *  axis: Σ i_k cos(γ − k 2π/3). For a balanced set it is 3/2 Î cos(γ − ωt), a travelling wave (M.7). */
export const gapField = (gamma, [iu, iv, iw]) => iu * Math.cos(gamma) + iv * Math.cos(gamma - 2 * Math.PI / 3) + iw * Math.cos(gamma - 4 * Math.PI / 3);

/** The synchronous speed n = 60 f/p [1/min] (4-94) and the slip s = (n_s − n)/n_s (4-95). */
export const syncSpeed = (f, p) => 60 * f / p;
export const slip = (ns, n) => (ns - n) / ns;

// --- Separately excited DC machine. k = z p / a and Φ the flux per pole: U_i = k Φ n with n in 1/s (G.30),
// M_i = k Φ J / 2π (G.34). Here kPhi = k Φ at rated field [V·s] and phi the share of rated field.

/** Speed in 1/min at armature voltage UA and internal torque M: n = (U_A − J R_A)/(kΦ) (G.49), J = 2π M/(kΦ). */
export const dcSpeed = (UA, RA, kPhi, phi, M) => { const k = kPhi * phi; return (UA - RA * 2 * Math.PI * M / k) / k * 60; };
export const dcCurrent = (kPhi, phi, M) => 2 * Math.PI * M / (kPhi * phi);
export const dcTorque = (kPhi, phi, J) => kPhi * phi * J / (2 * Math.PI);
/** The speed drop per newton metre, R_A (2π)·60/(kΦ)² [1/min per N·m]: four times as steep at half field (G.80–G.81). */
export const dcSlope = (RA, kPhi, phi) => RA * 2 * Math.PI * 60 / (kPhi * phi) ** 2;

// --- PMSM in rotor (d, q) coordinates, per unit, steady state at electrical speed w.

/** The steady state for a stator current i_s = i_d + j i_q: ψ_s = l_s i_s + ψ_M (P.2), u_s = r_s i_s + jω ψ_s (P.1 with
 *  dψ/dτ = 0 in rotor coordinates), and the torque two ways, −Im(i_s* ψ_s) (P.4) and i_q |ψ_M| (P.8). */
export function pmsm({ id, iq, w, rs, ls, psiM = 1 }) {
  const is = C(id, iq), psiS = cAdd(scale(is, ls), C(psiM)), us = cAdd(scale(is, rs), cMul(C(0, w), psiS));
  return { is, psiS, us, torqueP4: -cMul(conj(is), psiS)[1], torqueP8: iq * psiM };
}
/** A rotor-coordinate vector seen from the stator, turned by the rotor angle γ_m. */
export const toStator = (x, gammaDeg) => cMul(x, cExp([0, gammaDeg * Math.PI / 180]));
/** The size of the current vector that gives torque m with i_d chosen: |i_s| = √(i_d² + (m/ψ_M)²). */
export const currentFor = (m, id, psiM = 1) => Math.hypot(id, m / psiM);
