// The worked example: Gawlik's 30 kV feeder (2015, pp. 215–216), loaded and short-circuited. The fault against the
// notes' own numbers; the load flow against a second route.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as P from "../../src/core/index.js";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} is not ${b} ± ${tol}`);

test("a fault at the line's end: Rk = 4.95 Ω, Xk = 17.68 Ω, Zk = 18.36 Ω, I″k3 = 1.038 kA, κ ≈ 1.4 (p. 216)", () => {
  const F = P.feederFault(40);
  near(F.R, 4.95, 0.005); near(F.X, 17.68, 0.005); near(F.Z, 18.36, 0.005);
  near(F.Ik, 1038, 1); near(F.kappa, 1.4, 0.02);
  near(F.ip, F.kappa * Math.SQRT2 * F.Ik, 1e-9);
});

test("cmin = 1.0 gives 1/1.1 of the largest current (table 6-2), and the current grows towards the transformer", () => {
  near(P.feederFault(40, 1).Ik, P.feederFault(40).Ik / 1.1, 1e-9);
  assert.ok(P.feederFault(0).Ik > P.feederFault(20).Ik && P.feederFault(20).Ik > P.feederFault(40).Ik);
  // At 0 km only the network and the transformer are left, by definition.
  near(P.feederFault(0).X, 0.197 + 3.48, 0.005);
});

test("the load flow at the line's end agrees with the phasor iteration (section 6.2)", () => {
  const Pl = 5e6, Ql = Pl * Math.tan(Math.acos(0.9)), L = P.feederLoad(Pl, Ql), ZB = 30e3 ** 2 / 31e6;
  near(L.u, P.receivingVoltageIterated(1, L.R / ZB, L.X / ZB, Pl / 31e6, Ql / 31e6), 1e-9);
  near(L.u, 0.9135, 0.0005);
  // Past the nose there is no operating point.
  assert.ok(Number.isNaN(P.feederLoad(15e6, 15e6 * Math.tan(Math.acos(0.9))).u));
});
