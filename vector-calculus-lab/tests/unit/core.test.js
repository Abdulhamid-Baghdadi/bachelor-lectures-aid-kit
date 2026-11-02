// The integrals of the core against a second route each: Fritzsche's worked examples (2003), values worked by hand
// from the theorems, and the two sides of each theorem computed apart.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as V from "../../src/core/index.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);
const F = k => V.FIELDS[k].f;

test("vortex: 2π round the unit circle (Fritzsche p. 21, example 2), 0 round the circle about (2, 0) (p. 22)", () => {
  near(V.lineIntegral(F("vortex"), V.circle(0, 0, 1)), 2 * Math.PI, 1e-5, "round the origin");
  near(V.lineIntegral(F("vortex"), V.circle(2, 0, 1)), 0, 1e-9, "beside the origin");
});

test("gradient field: every path gives f(q) − f(p) (main theorem, p. 22)", () => {
  const p = [-1.2, -0.6], q = [1.2, 0.9], want = 0.63 - 1.08;
  near(V.lineIntegral(F("gradient"), V.segment(p, q)), want, 1e-9, "straight");
  near(V.lineIntegral(F("gradient"), V.arc(0, 0.15, Math.hypot(1.2, 0.75), Math.atan2(-0.75, -1.2), Math.atan2(0.75, 1.2) - 2 * Math.PI)), want, 1e-4, "arc");
});

test("Green (p. 61): circulation round the edge equals the curl over the disc, for every field without a singularity inside", () => {
  for (const k of ["rotation", "source", "gradient", "shear"]) for (const [cx, cy, R] of [[0.6, 0.3, 0.6], [-1, 0.2, 0.3]])
    near(V.lineIntegral(F(k), V.circle(cx, cy, R)), V.curlOverDisc(F(k), cx, cy, R), 1e-4, `${k} at (${cx}, ${cy}), R = ${R}`);
  // The rotation field has curl 2, so the circulation is twice the area: πr² from p. 63 doubled (by hand).
  near(V.lineIntegral(F("rotation"), V.circle(0, 0, 1)), 2 * Math.PI, 1e-5, "rotation, unit circle");
});

test("Gauss (p. 85): flux out of the sphere equals the divergence over the ball", () => {
  for (const k of ["rotation", "source", "gradient", "shear"]) for (const [cx, cy, R] of [[0.4, 0.2, 0.6], [-1, -0.5, 0.3]])
    near(V.fluxThroughSphere(F(k), cx, cy, R), V.divergenceOverBall(F(k), cx, cy, R), 2e-3 * Math.max(1, R ** 3), `${k} at (${cx}, ${cy}), R = ${R}`);
  // div (x, y, 0) = 2, so the flux out of the unit sphere is 2 · 4π/3 (by hand).
  near(V.fluxThroughSphere(F("source"), 0, 0, 1), 8 * Math.PI / 3, 1e-3, "source, unit sphere");
});

test("densities: curl and divergence of the five fields, by definition of their components", () => {
  near(V.curlZ(F("rotation"), 0.3, -0.2), 2, 1e-6, "rotation curl"); near(V.divergence(F("rotation"), 0.3, -0.2), 0, 1e-6, "rotation div");
  near(V.curlZ(F("source"), 0.3, -0.2), 0, 1e-6, "source curl"); near(V.divergence(F("source"), 0.3, -0.2), 2, 1e-6, "source div");
  near(V.curlZ(F("shear"), 0.3, -0.2), -1, 1e-6, "shear curl"); near(V.curlZ(F("vortex"), 0.5, 0.5), 0, 1e-4, "vortex curl off the origin");
});
