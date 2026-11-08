// Gravitation in the Newtonian limit, after Einstein (1916), Die Grundlage der allgemeinen Relativitätstheorie,
// Annalen der Physik 49, 769–822; pages are the journal's printed ones. A uniform field g pointing down, height x in m,
// time t in s. Einstein measures time so that c = 1; here c0 is written out.
import { C0 } from "./relativity.js";

/** Height in the ground frame of a point at height xFall in a frame falling freely from rest at t = 0:
 *  x = xFall − g t²/2. The falling frame feels no field: an accelerated frame and a field are interchangeable
 *  (pp. 772–773). The shift is derived, not printed. */
export const groundHeight = (xFall, t, g) => xFall - g * t * t / 2;

/** A ball thrown up at v from x = 0: a straight line x = v t in the falling frame, so x = v t − g t²/2 on the ground. */
export const thrownHeight = (v, t, g) => groundHeight(v * t, t, g);

/** Highest point v²/(2g) and time back on the ground 2v/g of that throw (derived). */
export const apexHeight = (v, g) => v * v / (2 * g);
export const flightTime = (v, g) => 2 * v / g;

/** g44 of a uniform field, 1 + 2 g x/c0²: equation (67), p. 817, makes g44/2 the Newtonian potential in units of c²,
 *  and a uniform field's potential is g x (derived). */
export const g44 = (x, g) => 1 + g44Excess(x, g);
/** g44 − 1, kept apart because it is ~10⁻¹⁶ per metre and would vanish in rounding next to the 1. */
const g44Excess = (x, g) => 2 * g * x / (C0 * C0);

/** The acceleration of equation (67), d²x/dt² = −½ c0² ∂g44/∂x, by a central difference over ±h (m). Lets a test
 *  check that the metric alone gives the falling motion. */
export const g44Acceleration = (x, g, h = 1) => -0.5 * C0 * C0 * (g44Excess(x + h, g) - g44Excess(x - h, g)) / (2 * h);

/** How much more a clock at height h shows than one on the ground, as a fraction: √(g44(h)/g44(0)) − 1, from
 *  equation (72), p. 820, dx4 = 1/√g44 per tick ("Die Uhr läuft also langsamer, wenn sie in der Nähe ponderabler
 *  Massen aufgestellt ist"). About g h/c0²; worked without cancellation for heights of metres. */
export const clockGain = (h, g) => Math.expm1(0.5 * Math.log1p(2 * g * h / (C0 * C0)));
