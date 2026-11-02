// The worked example: Gawlik's 30 kV feeder (2015, pp. 215–216), a 110 kV network, a 110/30 kV transformer and 40 km
// of overhead line, first carrying a load and then short-circuited. The same impedances serve both: the load flow of
// section 6.2 and the short-circuit current of section 6.3.4.
import { exampleNetwork, ik3, kappa } from "./faults.js";
import { receivingVoltage } from "./network.js";
import { baseImpedance } from "./threephase.js";

/** The notes' example network, p. 215. */
export const FEEDER = { c: 1.1, SkQ: 5e9, RXQ: 0.1, uk: 0.12, ST: 31e6, Pk: 0.14e6, Rl: 0.12, Xl: 0.35, len: 40, Un: 30e3 };

/** The feeder's impedances [R, X] in ohms at 30 kV with the line cut at x km. */
export const feederTo = (x, q = FEEDER) => exampleNetwork({ ...q, len: x }, q.Un);

/** Normal operation: a load P + jQ [W, var] at the line's end, the 110 kV side held at its nominal voltage. The
 *  feeding network's c = 1.1 only sizes faults, but its impedance is the network's own, so it stays in. Per unit of
 *  S_rT and 30 kV, through receivingVoltage (section 6.2). */
export function feederLoad(P, Q, q = FEEDER) {
  const [R, X] = feederTo(q.len, q).total, ZB = baseImpedance(q.Un, q.ST);
  const u = receivingVoltage(1, R / ZB, X / ZB, P / q.ST, Q / q.ST);
  const I = Math.hypot(P, Q) / (Math.sqrt(3) * u * q.Un);
  return { u, U: u * q.Un, I, loss: 3 * I * I * R, R, X };
}

/** A three-phase fault x km down the line: I″k3 by (6-31) with c = 1.1 (cmax) or 1.0 (cmin, table 6-2), κ by (6-43)
 *  and ip = κ √2 I″k (p. 214). */
export function feederFault(x, cFault = 1.1, q = FEEDER) {
  const [R, X] = feederTo(x, q).total, Z = Math.hypot(R, X), Ik = ik3(cFault, q.Un, Z), k = kappa(R / X);
  return { R, X, Z, Ik, kappa: k, ip: k * Math.SQRT2 * Ik, Sk: Math.sqrt(3) * q.Un * Ik };
}
