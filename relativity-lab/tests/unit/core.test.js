// The laws of Einstein (1905) against a second route each: the invariant interval, the inverse boost, two boosts
// composed, the Galilean limit, the low-speed field transformation of Prechtl (2010) (2.43), or Gauss's law.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as F from "../../src/core/index.js";

const near = (a, b, rel = 1e-9, abs = 0) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b) + abs, `${a} is not ${b}`);
const c = F.C0;

test("γ at 0.6 c is 1.25 and at 0.8 c is 5/3 (hand-checked); at or past c is an error that says what to do", () => {
  near(F.lorentzFactor(0.6 * c), 1.25);
  near(F.lorentzFactor(0.8 * c), 5 / 3);
  assert.throws(() => F.lorentzFactor(c), /below the speed of light/);
});

test("boost: (c t)² − x² is the same in both frames (p. 901, the light sphere, for any event)", () => {
  for (const e of [{ t: 2, x: 1e8 }, { t: -1, x: 5e8 }, { t: 0.3, x: -2e8 }]) {
    near(F.interval(F.boost(e, 0.7 * c)), F.interval(e), 1e-9, 1e3);
  }
  // A flash of light stays on the light cone: x = c t gives ξ = c τ.
  const l = F.boost({ t: 1, x: c }, 0.5 * c);
  near(l.x, c * l.t);
});

test("boost with v, then with −v, gives the event back: φ(v) φ(−v) = 1 (p. 902)", () => {
  const e = { t: 3, x: 4e8 }, back = F.boost(F.boost(e, 0.9 * c), -0.9 * c);
  near(back.t, e.t); near(back.x, e.x);
});

test("boost: at 1 m/s it is Galilean, ξ = x − v t and τ = t (the limit v → 0)", () => {
  const e = F.boost({ t: 2, x: 10 }, 1);
  near(e.x, 8, 1e-12); near(e.t, 2, 1e-12);
});

test("time dilation: the clock moving along x = v t reads τ = t/γ, from the boost itself (p. 904)", () => {
  const v = 0.8 * c, t = 10;
  near(F.boost({ t, x: v * t }, v).t, F.clockTime(t, v));
  near(F.clockTime(t, v), 6);
  // Einstein's small-speed form: behind by ½ (v/c)² seconds per second (p. 904).
  const slow = 3e4;
  near(1 - F.clockTime(1, slow), 0.5 * (slow / c) ** 2, 1e-6);
});

test("length contraction: the rod's ends, at rest in k at ξ = 0 and ξ = L, lie L/γ apart in K at t = 0 (p. 903)", () => {
  const v = 0.6 * c, L = 1;
  // An end at rest in k at ξ crosses t = 0 of K where ξ = γ x, so x = ξ/γ; checked by boosting that event.
  const end = { t: 0, x: L / F.lorentzFactor(v) };
  near(F.boost(end, v).x, L);
  near(F.rodLength(L, v), 0.8);
});

test("velocity addition equals two boosts in a row (p. 906), never passes c, and is v + w when slow", () => {
  const v = 0.5 * c, w = 0.7 * c, e = { t: 1.5, x: 2e8 };
  const twice = F.boost(F.boost(e, v), w), once = F.boost(e, F.addVelocities(v, w));
  near(twice.t, once.t); near(twice.x, once.x);
  near(F.addVelocities(0.5 * c, 0.5 * c), 0.8 * c);
  near(F.addVelocities(c, 0.3 * c), c);
  near(F.addVelocities(10, 20), 30, 1e-12);
});

test("fields: at low speed the boost is Prechtl's E' = E + v × B, B' = B (2.43)", () => {
  const E = [100, -50, 30], B = [1e-3, 2e-3, -4e-3], v = 1e3, f = F.boostFields({ E, B }, v);
  // v along x: v × B = (0, −v Bz, v By).
  const vxB = [0, -v * B[2], v * B[1]];
  for (let i = 0; i < 3; i++) { near(f.E[i], E[i] + vxB[i], 1e-9, 1e-9); near(f.B[i], B[i], 1e-9, 1e-15); }
});

test("fields: boosting back with −v restores E and B (p. 909, the inverse transformation)", () => {
  const E = [1e5, 2e5, -3e5], B = [1e-3, -2e-3, 5e-4], v = 0.75 * c;
  const back = F.boostFields(F.boostFields({ E, B }, v), -v);
  for (let i = 0; i < 3; i++) { near(back.E[i], E[i], 1e-9, 1e-6); near(back.B[i], B[i], 1e-9, 1e-15); }
});

test("moving charge: its field still meets Gauss's law, flux = Q/ε0 through a sphere (Prechtl (2010), Tab. 2.1, row 4)", () => {
  // Midpoint rule over θ on a sphere of radius 1 m; the field is symmetric about the x axis.
  const q = 1e-9, v = 0.9 * c, n = 4000;
  let flux = 0;
  for (let k = 0; k < n; k++) {
    const th = (k + 0.5) * Math.PI / n, x = Math.cos(th), y = Math.sin(th), E = F.movingCharge(q, v, x, y).E;
    flux += (E[0] * x + E[1] * y) * 2 * Math.PI * y * Math.PI / n;
  }
  near(flux, q / F.EPS0, 1e-5);
});

test("moving charge: γ times stronger across the motion, γ² weaker along it, and B = v E_y / c² (derived)", () => {
  const q = 1e-9, v = 0.8 * c, g = 5 / 3, rest = q / (4 * Math.PI * F.EPS0);
  const side = F.movingCharge(q, v, 0, 1), ahead = F.movingCharge(q, v, 1, 0);
  near(side.E[1], g * rest); near(ahead.E[0], rest / g ** 2);
  near(side.B[2], v * side.E[1] / c ** 2);
  near(F.movingCharge(q, 1, 0, 1).E[1], rest, 1e-9);
});
