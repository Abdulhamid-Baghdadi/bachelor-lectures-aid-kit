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

/** Newton's gravitational constant as Einstein quotes it on p. 818: K = 6,7 · 10⁻⁸ in cgs, here in SI (m³/(kg s²)). */
export const K_GRAV = 6.7e-11;

/** Acceleration at (x, y) m of a point mass M kg at the origin: −grad of the potential −K M/r, which (67), (68a) and
 *  (69), pp. 817–818, give in the Newtonian limit. Einstein's (70a) is not used: by (68) its α comes out twice his
 *  printed κM/8π, so the potential is taken from (68a) directly. */
export function pointMassAcceleration(M, [x, y]) {
  const r = Math.hypot(x, y), k = -K_GRAV * M / (r * r * r);
  return [k * x, k * y];
}

/** Acceleration of a point at offset d = [radial, across] from a falling reference at distance R from the mass,
 *  relative to that reference: the part no falling frame removes (exact difference). */
export function tidalAcceleration(M, R, [dx, dy]) {
  const a = pointMassAcceleration(M, [R + dx, dy]), a0 = pointMassAcceleration(M, [R, 0]);
  return [a[0] - a0[0], a[1] - a0[1]];
}

/** Its first-order form for small d: stretch 2KM/R³ along the radius, squeeze KM/R³ across (derived). */
export const tidalLinear = (M, R, [dx, dy]) => [2 * K_GRAV * M * dx / R ** 3, -K_GRAV * M * dy / R ** 3];

/** A ring of n points of radius d around a reference at distance R0, all let go from rest, after time t: their
 *  offsets from the reference, which falls with them. Velocity Verlet in steps of t/steps; deterministic. */
export function fallingRing(M, R0, d, n, t, steps = 400) {
  const pts = Array.from({ length: n }, (_, i) => { const a = 2 * Math.PI * i / n; return [R0 + d * Math.cos(a), d * Math.sin(a)]; });
  const bodies = [[R0, 0], ...pts].map(p => ({ p, v: [0, 0], a: pointMassAcceleration(M, p) }));
  const dt = t / steps;
  for (let k = 0; k < steps; k++) for (const b of bodies) {
    b.p = [b.p[0] + b.v[0] * dt + b.a[0] * dt * dt / 2, b.p[1] + b.v[1] * dt + b.a[1] * dt * dt / 2];
    const a = pointMassAcceleration(M, b.p);
    b.v = [b.v[0] + (b.a[0] + a[0]) * dt / 2, b.v[1] + (b.a[1] + a[1]) * dt / 2];
    b.a = a;
  }
  const [ref, ...ring] = bodies;
  return { reference: ref.p, offsets: ring.map(b => [b.p[0] - ref.p[0], b.p[1] - ref.p[1]]) };
}
