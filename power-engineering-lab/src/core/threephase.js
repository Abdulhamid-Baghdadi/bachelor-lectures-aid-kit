// Three-phase systems after Gawlik (2015), chapter 3: the rotation operator, star and delta, the power of three phases,
// and per-unit values (section 6.3.4). Phasors are rms phasors, [re, im] pairs from the kit's complex numbers.
import { C, cAdd, cMul, cDiv, cAbs, cExp } from "../../../kit/core/index.js";

const DEG = Math.PI / 180;
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const conj = a => [a[0], -a[1]];
export const scale = (a, k) => [a[0] * k, a[1] * k];
/** A phasor from its magnitude and angle in degrees. */
export const polar = (r, deg) => [r * Math.cos(deg * DEG), r * Math.sin(deg * DEG)];
/** A phasor's angle in degrees. */
export const arg = z => Math.atan2(z[1], z[0]) / DEG;

/** The rotation operator a = e^(j2π/3) (3-29); a² = e^(j4π/3) (3-31). */
export const A = cExp([0, 2 * Math.PI / 3]);
export const A2 = cMul(A, A);

/** The three line-to-neutral voltages of a symmetric system: U_a, U_b = a²U_a, U_c = a U_a (3-30). */
export const phaseVoltages = (U, deg = 0) => { const u = polar(U, deg); return [u, cMul(A2, u), cMul(A, u)]; };

/** The line-to-line voltages U_ab, U_bc, U_ca of three line-to-neutral voltages. */
export const lineVoltages = ([a, b, c]) => [sub(a, b), sub(b, c), sub(c, a)];

/**
 * A balanced load of impedance Z per branch on a symmetric supply of line voltage UL, in star or in delta. Returns the
 * phasors of every quantity and the complex power taken. In star each branch sees the line-to-neutral voltage UL/√3
 * and carries the line current; in delta each branch sees a line voltage and the line current is the difference of
 * two branch currents, √3 times larger.
 */
export function balancedLoad(UL, Z, connection) {
  const U = phaseVoltages(UL / Math.sqrt(3)), UL3 = lineVoltages(U);
  let branchU, branchI, lineI;
  if (connection === "star") {
    branchU = U; branchI = U.map(u => cDiv(u, Z)); lineI = branchI;
  } else {
    branchU = UL3; branchI = UL3.map(u => cDiv(u, Z));
    lineI = [sub(branchI[0], branchI[2]), sub(branchI[1], branchI[0]), sub(branchI[2], branchI[1])];
  }
  const S = U.reduce((s, u, k) => cAdd(s, cMul(u, conj(lineI[k]))), C(0));
  return { U, UL: UL3, branchU, branchI, lineI, S };
}

/** P, Q and S of a symmetric system from the line voltage, the line current and φ between the line current and its
 *  line-to-neutral voltage (3-45). */
export const powerFromLine = (UL, IL, phiDeg) => ({
  S: Math.sqrt(3) * UL * IL, P: Math.sqrt(3) * UL * IL * Math.cos(phiDeg * DEG), Q: Math.sqrt(3) * UL * IL * Math.sin(phiDeg * DEG),
});

/**
 * The instantaneous power of each phase at ωt (3-37): u_k(t) i_k(t) with u_k = √2 U cos(ωt − k·120°) and
 * i_k = √2 I_k cos(ωt − k·120° − φ). Currents of unequal size make the system unsymmetric.
 */
export function instantaneous(U, I, phiDeg, wt) {
  return I.map((Ik, k) => {
    const t = wt - k * 2 * Math.PI / 3;
    return 2 * U * Ik * Math.cos(t) * Math.cos(t - phiDeg * DEG);
  });
}

// Per-unit values (6-33, 6.34): only two bases are free, the others follow, Z_B = U_B²/S_B.
export const baseImpedance = (UB, SB) => UB * UB / SB;
/** An impedance in ohms from its per-unit value on its own rating (x″d, u_k): X = x · U_r²/S_r (6.34). */
export const ohmsFromPu = (z, Ur, Sr) => z * baseImpedance(Ur, Sr);
/** A per-unit value moved from one base to another: z_new = z_old · (S_new/S_old) · (U_old/U_new)². */
export const changeBase = (z, Sold, Uold, Snew, Unew) => z * (Snew / Sold) * (Uold / Unew) ** 2;
