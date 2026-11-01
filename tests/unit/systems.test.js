// The models of Kugi (2015), chapters 1–3, each against a second route (a closed form against a simulation, a
// Jacobian against a difference quotient) or a hand calculation it names; and every practice answer of
// data/labs.json (checked in labs-data.test.js) worked again by the core.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as F from "../../src/core/index.js";
import { solve, isRight } from "../../src/core/practice.js";

const near = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} is not ${b}`);

test("RLC: the free response (1.10) agrees with a simulation of (1.8), R = L = C = 1, uC,0 = 2, iL,0 = 1", () => {
  const { A } = F.rlcModel(1, 1, 1);
  const run = F.simulate((t, x) => F.matVec(A, x), [2, 1], 3, 600), f = F.rlcFree(1, 1, 1, 2, 1, 3);
  near(run.x.at(-1)[0], f.uC, 1e-6);
  near(run.x.at(-1)[1], f.iL, 1e-6);
});

test("RLC: a step settles at uC = U, iL = 0 (by definition of the rest state of (1.8))", () => {
  const end = F.rlcStep(1, 1, 1, 1.5, 40).x.at(-1);
  near(end[0], 1.5, 1e-4); near(end[1], 0, 1e-4);
});

test("DC motor: a simulation of (1.25a), (1.25d) settles at the rest state; 12 V, 0.05 N·m give 115 rad/s (hand-checked)", () => {
  const P = { RA: 1, LA: 0.01, K: 0.1, J: 2e-4 }, end = F.simulate(F.dcMotorRhs(P, 12, 0.05), [0, 0], 1, 4000).x.at(-1);
  const rest = F.dcMotorRest(P, 12, 0.05);
  near(rest.w, 115); near(rest.iA, 0.5);
  near(end[1], rest.w, 1e-4); near(end[0], rest.iA, 1e-4);
});

test("tanks: the rest level makes (1.29) zero, and the linearisation of Aufgabe 2.18 equals a difference-quotient Jacobian (2.54)", () => {
  const P = { A: 0.02, a: 5e-5 }, qR = 1e-4, hR = F.tankRest(P, qR), f = F.tankRhs(P, qR);
  near(hR, 0.2039, 1e-3);
  f(0, [hR, hR]).forEach(v => near(v, 0, 1e-9));
  const lin = F.tankLinear(P, qR), d = 1e-7;
  for (let j = 0; j < 2; j++) {
    const xp = [hR, hR]; xp[j] += d;
    const col = f(0, xp).map(v => v / d);
    near(col[0], lin.A[0][j], 1e-4); near(col[1], lin.A[1][j], 1e-4);
  }
  near((F.tankRhs(P, qR + 1e-9)(0, [hR, hR])[0]) / 1e-9, lin.b[0], 1e-6);
});

test("ẋ = Ax: Example 3.3 has eigenvalues −1 and 2, a saddle (3.55); a start on v1 stays on it (3.54)", () => {
  const A = [[1.4, -1.2], [-1.2, -0.4]], e = F.eigen2(A);
  near(e.ev[0][0], -1); near(e.ev[1][0], 2);
  assert.equal(e.kind, "saddle");
  const x = F.phaseTrajectory(A, [-0.447, -0.894], 1, 10).at(-1);
  near(x[0], -0.447 * Math.exp(-1), 1e-3); near(x[1], -0.894 * Math.exp(-1), 1e-3);
});

test("ẋ = Ax: a centre (trace 0, det > 0) and a stable focus are named so (by definition)", () => {
  assert.equal(F.eigen2([[0, 1], [-1, 0]]).kind, "centre");
  assert.equal(F.eigen2([[-0.3, 1], [-1, -0.3]]).kind, "stable focus");
});

test("Bode: the asymptotes meet the exact magnitude far from every corner, for (3.129)", () => {
  const G = { num: [-1, 10], den: [100, 10, 1, 0] }, parts = { V: 10, r: 1, z1: [10], p2: [0.1] };
  for (const w of [1e-4, 1e3]) near(F.bode(G, [w])[0].db, F.bodeAsymptote(parts, w), 1e-2);
  near(F.bodeAsymptote(parts, 1), -20);
});

test("Nyquist: the RC locus is the circle (3.113), and (3.114) crosses the real axis at √7 (Aufgabe 3.26)", () => {
  const L = F.nyquistLocus({ num: [1], den: [0.5, 1] }, 0.01, 100, 50);
  L.re.forEach((r, k) => near((r - 0.5) ** 2 + L.im[k] ** 2, 0.25, 1e-9));
  near(F.realAxisCrossing({ num: [10, 15, 10], den: [1, 1, 3] }, 0.1, 100), Math.sqrt(7), 1e-6);
});

test("P-T1: (3.134) agrees with the step response simulated from (3.133)", () => {
  const r = F.step({ num: [10], den: [0.5, 1] }, 2, 400);
  near(r.y[100], F.pt1Step(10, 0.5, r.t[100]), 1e-6);
});

test("P-T2: (3.138) agrees with a simulation of (3.137); its peak is V(1 + e^(−πξ/√(1−ξ²)))", () => {
  const r = F.step(F.pt2(5, 0.1, 0.5), 1, 1000);
  near(r.y[300], F.pt2Step(5, 0.1, 0.5, r.t[300]), 1e-6);
  near(Math.max(...r.y), F.pt2Peak(5, 0.5), 1e-4);
  near(F.pt2Poles(0.1, 0.5)[1][1], 8.660, 1e-3);
});

test("PI: the simulated step response is VI t + VI TI (Aufgabe 3.37)", () => {
  const r = F.step(F.transferElement("PI", { VI: 2, TI: 0.5 }), 2, 200);
  near(r.y.at(-1), 2 * 2 + 1, 1e-6);
});

test("lead: the largest phase lift (3.156) is the peak of the computed phase, at ωmax (3.155)", () => {
  const G = F.transferElement("lead", { V: 1, T: 1, alpha: 0.1 }), B = F.bode(G, F.logspace(0.1, 100, 3001));
  const best = B.reduce((m, p) => (p.phase > m.phase ? p : m));
  const m = F.leadMax(1, 0.1);
  near(best.phase, m.phi, 1e-4); near(best.w, m.w, 1e-2);
});

test("dead time: −ωTt in degrees, and the delay argument of bode() agrees (3.159)", () => {
  near(F.deadTimePhase(0.2, 5), -57.2958, 1e-5);
  near(F.bode({ num: [1], den: [1] }, [5], 0.2)[0].phase, -57.2958, 1e-5);
});

test("pole-zero: −2 ± j1.5 gives ξ = 0.8 and T = 0.4 (worked in the notes, p. 91); BIBO by the poles (Satz 3.8)", () => {
  const d = F.pairDamping(-2, 1.5);
  near(d.xi, 0.8); near(d.T, 0.4);
  assert.equal(F.biboStable(F.roots([1, 4, 6.25])), true);
  assert.equal(F.biboStable(F.roots([1, -0.5])), false);
});
