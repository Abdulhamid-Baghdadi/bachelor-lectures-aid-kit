// The free-fall laws of Einstein (1916) against a second route each: the falling frame's straight line against
// Galileo's parabola, eq. (67) integrated step by step against that parabola, and the clock rate of eq. (72) against
// its first-order form g h/c0².
import { test } from "node:test";
import assert from "node:assert/strict";
import * as F from "../../src/core/index.js";

const near = (a, b, rel = 1e-9, abs = 0) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b) + abs, `${a} is not ${b}`);
const g = 9.81;

test("a straight line in the falling frame is the parabola v t − g t²/2 on the ground (by definition)", () => {
  for (const t of [0, 0.3, 1, 2.04]) near(F.thrownHeight(10, t, g), 10 * t - 4.905 * t * t, 1e-12, 1e-12);
  near(F.thrownHeight(10, F.flightTime(10, g), g), 0, 0, 1e-12);
  near(F.thrownHeight(10, F.flightTime(10, g) / 2, g), F.apexHeight(10, g));
});

test("v = 10 m/s at g = 9.81 m/s² rises 5.097 m (hand-checked: 100/19.62)", () => {
  near(F.apexHeight(10, g), 5.0968, 1e-4);
});

test("eq. (67), p. 817: the metric's g44 alone gives the acceleration −g everywhere", () => {
  for (const x of [0, 5, 1000]) near(F.g44Acceleration(x, g, 100), -g, 1e-3);
});

test("eq. (67) integrated in time retraces the thrown ball (second route to the parabola)", () => {
  let x = 0, v = 10;
  const dt = 1e-4;
  for (let t = 0; t < 1; t += dt) { v += F.g44Acceleration(x, g, 100) * dt / 2; x += v * dt; v += F.g44Acceleration(x, g, 100) * dt / 2; }
  near(x, F.thrownHeight(10, 1, g), 1e-3);
});

test("eq. (72), p. 820: a clock 1000 m up gains g h/c0² = 1.0915 × 10⁻¹³ (hand-checked), higher runs faster", () => {
  near(F.clockGain(1000, g), 9810 / F.C0 ** 2, 1e-9);
  near(F.clockGain(1000, g), 1.0915e-13, 1e-3);
  assert.ok(F.clockGain(-10, g) < 0);
});
