// The Wheatstone bridge (Schrüfer et al. 2012, section 3.3): two dividers on one supply U0, R1 over R2 on the left,
// R3 over R4 on the right; the diagonal voltage is U3 − U1, null when the bridge is balanced.

/** The diagonal voltage of the voltage-fed bridge, unloaded (eq. 3.12). */
export const diagonal = (U0, [R1, R2, R3, R4]) => U0 * (R2 * R3 - R1 * R4) / ((R1 + R2) * (R3 + R4));

/** The unknown R2 at balance, R2·R3 = R1·R4 (eqs. 3.13–3.14). */
export const balance = (R1, R3, R4) => R1 * R4 / R3;

/** Which arms change by +ΔR or −ΔR in the arrangements of Bild 3.9: a quarter bridge (a), the half bridge with
 *  opposite changes in one divider (f), and the full bridge (h). */
export const ARRANGEMENTS = {
  quarter: { name: "Quarter bridge, one active arm", signs: [0, 1, 0, 0], approx: 1 / 4 },
  half: { name: "Half bridge, two opposite arms", signs: [-1, 1, 0, 0], approx: 1 / 2 },
  full: { name: "Full bridge, four active arms", signs: [-1, 1, 1, -1], approx: 1 },
};

/** The arms of an arrangement for a relative change x = ΔR/R0. */
export const arms = (key, R0, x) => ARRANGEMENTS[key].signs.map(s => R0 * (1 + s * x));

/** The diagonal voltage of an arrangement, exact by eq. 3.12, and its straight-line approximation k·U0·ΔR/R0
 *  (eq. 3.19 for the quarter bridge, Bild 3.9 f and h for the others). */
export function deflection(key, U0, R0, x) {
  return { exact: diagonal(U0, arms(key, R0, x)), linear: ARRANGEMENTS[key].approx * U0 * x };
}

/** The bridge seen from its diagonal as a source: open-circuit voltage Ud and internal resistance
 *  Ri = R1 ‖ R2 + R3 ‖ R4 (eq. 3.22); a meter RM draws IM = Ud/(Ri + RM) (eq. 3.23). */
export function loaded(U0, R, RM) {
  const [R1, R2, R3, R4] = R, Ud = diagonal(U0, R);
  const Ri = R1 * R2 / (R1 + R2) + R3 * R4 / (R3 + R4), IM = Ud / (Ri + RM);
  return { Ud, Ri, IM, UM: IM * RM };
}

/** The second route: the loaded bridge solved by nodal analysis. U1 lies across R1 (eq. 3.10), so R1 and R3 are the
 *  lower arms: node a joins R1 (to ground) and R2 (to U0), node b joins R3 and R4; the meter RM runs from b to a.
 *  Returns the meter voltage Ub − Ua. */
export function loadedByNodes(U0, [R1, R2, R3, R4], RM) {
  // KCL at a: (Ua)/R1 + (Ua − U0)/R2 + (Ua − Ub)/RM = 0; at b: Ub/R3 + (Ub − U0)/R4 + (Ub − Ua)/RM = 0.
  const g = 1 / RM, a11 = 1 / R1 + 1 / R2 + g, a22 = 1 / R3 + 1 / R4 + g, b1 = U0 / R2, b2 = U0 / R4;
  const det = a11 * a22 - g * g, Ua = (b1 * a22 + g * b2) / det, Ub = (a11 * b2 + g * b1) / det;
  return Ub - Ua;
}

/** A strain gauge: ΔR/R0 = K·ε, and the normal stress σ = F/A = E·ε (eqs. 3.75–3.76). */
export const strainFromForce = (F, A, E) => F / A / E;
