// Tides from the Newtonian limit of Einstein (1916), each against a second route: the exact difference of the field
// against its first-order form, the falling ring against that form at small times, and hand-checked numbers.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as F from "../../src/core/index.js";

const near = (a, b, rel = 1e-9, abs = 0) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b) + abs, `${a} is not ${b}`);
const M = 6e24, R = 7e6;

test("K = 6.7 × 10⁻⁸ cgs on p. 818 is 6.7 × 10⁻¹¹ in SI (by definition: cm³/(g s²) = 10⁻³ m³/(kg s²))", () => {
  near(F.K_GRAV, 6.7e-8 * 1e-6 / 1e-3);
});

test("a point mass pulls towards itself with K M/r² (by definition of −grad of −K M/r)", () => {
  const [ax, ay] = F.pointMassAcceleration(M, [R, 0]);
  near(ax, -F.K_GRAV * M / R ** 2);
  assert.equal(ay, -0);
});

test("10 m along the radius at 7000 km from 6 × 10²⁴ kg: 2.344 × 10⁻⁵ m/s² (hand-checked)", () => {
  near(F.tidalAcceleration(M, R, [10, 0])[0], 2.344e-5, 1e-3);
  near(F.tidalAcceleration(M, R, [0, 10])[1], -1.172e-5, 1e-3);
});

// abs 1e-12: the difference of two ~8 m/s² accelerations leaves ~1e-13 of rounding where the true value is 0.
test("the exact difference matches the first-order form 2KM d/R³ and −KM d/R³ for small d (second route)", () => {
  for (const d of [[1, 0], [0, 1], [3, 4]]) {
    const ex = F.tidalAcceleration(M, R, d), lin = F.tidalLinear(M, R, d);
    near(ex[0], lin[0], 1e-5, 1e-12);
    near(ex[1], lin[1], 1e-5, 1e-12);
  }
});

test("the falling ring stretches along the radius and squeezes across it, early on as ½ Δa t² (second route)", () => {
  const d = 1000, t = 60, n = 8, { offsets } = F.fallingRing(M, R, d, n, t, 600);
  const k = F.K_GRAV * M / R ** 3;
  near(offsets[0][0] - d, 0.5 * 2 * k * d * t * t, 0.02);
  near(offsets[2][1] - d, -0.5 * k * d * t * t, 0.02);
  const late = F.fallingRing(M, R, d, n, 600).offsets;
  assert.ok(late[0][0] > d && late[2][1] < d, "stretched along, squeezed across");
});

test("the ring is let go as a circle and the same input gives the same ring (deterministic)", () => {
  const a = F.fallingRing(M, R, 1000, 12, 0), b = F.fallingRing(M, R, 1000, 12, 300), c = F.fallingRing(M, R, 1000, 12, 300);
  for (const [x, y] of a.offsets) near(Math.hypot(x, y), 1000, 1e-9);
  assert.deepEqual(b, c);
});
