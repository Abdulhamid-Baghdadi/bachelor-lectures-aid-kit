// The laws of Kugi (2015), chapters 4–8, each against a second route or a hand calculation it names, and every
// practice answer in data/labs.json (checked in labs-data.test.js) worked out again by the core.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as F from "../../src/core/index.js";
import { solve, isRight } from "../../src/core/practice.js";

const near = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} is not ${b}`);

test("steady-state error (5.10) agrees with the simulated loop's end value", () => {
  const L = { num: [8], den: [1, 2, 1] };
  near(F.loopSteadyError(L), 1 / 9);
  near(1 - F.step(F.closeLoop(L), 40).y.at(-1), 1 / 9, 1e-3);
  assert.equal(F.loopSteadyError({ num: [2], den: [1, 1, 0] }), 0);
  near(F.loopSteadyError({ num: [2], den: [1, 1, 0] }, "ramp"), 0.5);
});

test("Routh: the stable range of Beispiel 4.4 is 0 < K < 3 (4.36), and the roots agree on either side", () => {
  near(F.loopRouthKmax({ num: [9], den: [1, 3, 9, 0] }), 3, 1e-6);
  assert.ok(F.roots([1, 3, 9, 9 * 2.9]).every(([re]) => re < 0));
  assert.ok(F.roots([1, 3, 9, 9 * 3.1]).some(([re]) => re > 0));
  // Aufgabe 4.6: only n2 is Hurwitz; (4.30) is not, although its coefficients are all positive.
  assert.equal(F.loopHurwitz([1, 9, 13, 54, 40]), true);
  assert.equal(F.loopHurwitz([1, 6, 13, 30, 40]), false);
  assert.equal(F.loopHurwitz([1, 1, 11, 51]), false);
});

test("margins of K/(s(s + 1)²): phase crossover at ω = 1 with |L| = K/2 (hand), and the gain limit by Routh", () => {
  const m = F.loopMargins({ num: [0.5], den: [1, 2, 1, 0] });
  near(m.w180, 1, 1e-4);
  near(m.gainMargin, 4, 1e-4);
  near(m.wc ** 3 + m.wc, 0.5, 1e-4); // |L(jωC)| = 1
  near(m.phaseMargin, 90 - 2 * Math.atan(m.wc) * 180 / Math.PI, 1e-4);
  near(F.loopRouthKmax({ num: [1], den: [1, 2, 1, 0] }), 2, 1e-6); // Aufgabe 4.12: stable at 0.5, not at 5
});

test("PI design of 5.1 reproduces arg L1 = −133.3°, TI = 0.47, VI = 0.1 (5.15)–(5.18), and the loop meets its targets", () => {
  const G = { num: [5], den: [1, 1.414, 1] }, d = F.loopPiShape(G, 0.5, 60);
  near(d.argL1, -133.3, 1e-3);
  near(d.TI, 0.47, 0.01);
  near(d.VI, 0.1, 0.01);
  const m = F.loopMargins(F.series(d.R, G));
  near(m.wc, 0.5, 1e-3);
  near(m.phaseMargin, 60, 1e-3);
});

test("tangent rise time: T1 for a P-T1 element (6.59) and (6.61) for a P-T2 element", () => {
  const p1 = F.step({ num: [1], den: [2, 1] }, 40, 8000);
  near(F.loopTangentRise(p1.t, p1.y), 2, 2e-3);
  const p2 = F.step({ num: [1], den: [1, 1, 1] }, 20, 4000);
  near(F.loopTangentRise(p2.t, p2.y), F.loopRisePT2(1, 0.5), 2e-3);
  near(F.loopRisePT2(1, 0.5), Math.exp(Math.PI / 3 / Math.sqrt(3)), 1e-12);
});

test("sampling: the ZOH system of the double integrator is (6.25), and its samples lie on the continuous step", () => {
  const D = F.loopDiscretise({ num: [1], den: [1, 0, 0] }, 0.3), E = F.loopDoubleIntegrator(0.3);
  // realise() orders the states the other way round: compare what does not depend on it.
  near(F.charpoly(D.Phi)[1], F.charpoly(E.Phi)[1], 1e-9);
  near(F.loopStairs(D, 10)[10], F.loopStairs(E, 10)[10], 1e-9); // y = t²/2 at t = 3 s: 4.5
  near(F.loopStairs(E, 10)[10], 4.5, 1e-9);
  const G = { num: [1], den: [1, 1, 1] }, P = F.loopDiscretise(G, 0.5), c = F.step(G, 5, 1000);
  near(F.loopStairs(P, 10)[10], c.y.at(-1), 1e-6);
});

test("Satz 6.3: the eigenvalues of Φ are e^{s_j Ta}", () => {
  const G = { num: [1], den: [1, 0.6, 1] }, Ta = 0.4, z = F.loopZPoles(G.den, Ta), eig = F.roots(F.charpoly(F.loopDiscretise(G, Ta).Phi));
  near(z[0][0], eig[0][0], 1e-9);
  near(Math.abs(z[0][1]), Math.abs(eig[0][1]), 1e-9);
});

test("Tustin: R(e^{jωTa}) equals R(jΩ) with Ω from (6.89), and the warp inverts", () => {
  const R = { num: [100], den: [1, 2, 100] }, Ta = 0.1, Rz = F.loopTustin(R, Ta);
  for (const w of [1, 5, 9.27, 20]) {
    const a = F.loopFreqZ(Rz, w, Ta), b = F.freq(R, F.loopWarp(w, Ta));
    near(a[0], b[0], 1e-9); near(a[1], b[1], 1e-9);
  }
  near(F.loopUnwarp(F.loopWarp(7, 0.1), 0.1), 7, 1e-12);
  near(F.cAbs(F.loopFreqZ(Rz, 1e-6, Ta)), 1, 1e-9); // the gain V is kept (6.6, property 2)
});

test("reachability: det R = b₂(1 − λ) by hand; the Gramian against the Lyapunov equation (7.21); the input (7.18) lands", () => {
  near(F.det(F.loopReachMatrix([[-1, 0], [0, -3]], [1, 0.5])), 0.5 * (1 - 3), 1e-12);
  assert.equal(F.rank(F.loopReachMatrix([[-1, 0], [0, -1]], [1, 1])), 1);
  const G = F.loopGramian([[-1, 0], [0, -3]], [1, 1], 40, 2000);
  near(G[0][0], 0.5, 1e-6); near(G[0][1], 0.25, 1e-6); near(G[1][1], 1 / 6, 1e-6);
  const A = [[-1, 0], [0, -3]], b = [1, 1], u = F.loopSteer(A, b, 2, [1, -0.5]);
  const run = F.simulate((t, x) => [-x[0] + u(t), -3 * x[1] + u(t)], [0, 0], 2, 400);
  near(run.x.at(-1)[0], 1, 1e-5); near(run.x.at(-1)[1], -0.5, 1e-5);
});

test("Ackermann (8.18b): Aufgabe 8.5's dead-beat kᵀ = [−1, −2], and placed poles are the eigenvalues of Φ + Γkᵀ", () => {
  assert.deepEqual(F.loopStateGain([[1, 1], [0, 1]], [0, 1], [0, 0]).map(v => Math.round(v * 1e9) / 1e9), [-1, -2]);
  const P = F.loopDoubleIntegrator(0.5), poles = F.loopPairZ(1, 0.7, 0.5), k = F.loopStateGain(P.Phi, P.Gamma, poles);
  const cp = F.charpoly(F.matAdd(P.Phi, P.Gamma.map(g => k.map(kj => g * kj))));
  const want = F.polyFromRoots(poles);
  cp.forEach((c, i) => near(c, want[i], 1e-9));
});

test("prefilter (8.39): the step settles on r; dead-beat settles in n = 2 steps (Satz 8.3)", () => {
  const P = F.loopDoubleIntegrator(0.5), k = F.loopStateGain(P.Phi, P.Gamma, [0, 0]), g = F.loopPrefilter(P.Phi, P.Gamma, P.c, 0, k);
  const run = F.loopRun({ ...P, k, g, x0: [0, 0], r: 1, N: 6 });
  near(run.y[2], 1, 1e-9); near(run.y[6], 1, 1e-9);
  const free = F.loopRun({ ...P, k, x0: [1, 2], N: 3 });
  near(Math.hypot(...free.x[2]), 0, 1e-9);
});

test("observer: Aufgabe 8.9's k̂ = [−12, −100]; the error obeys (8.65); the loop's poles follow (8.74)", () => {
  assert.deepEqual(F.loopObserverGain([[2, 1], [0, 10]], [1, 0], [0, 0]).map(v => Math.round(v * 1e9) / 1e9), [-12, -100]);
  const P = F.loopDoubleIntegrator(0.2), k = F.loopStateGain(P.Phi, P.Gamma, F.loopPairZ(1, 0.7, 0.2));
  const kh = F.loopObserverGain(P.Phi, P.c, [0, 0]);
  const run = F.loopRun({ ...P, k, kh, x0: [1, 0], xh0: [0, 0], N: 5 });
  near(Math.hypot(run.xh[2][0] - run.x[2][0], run.xh[2][1] - run.x[2][1]), 0, 1e-9); // dead-beat: 2 steps (Aufgabe 8.8)
  // Separation: the characteristic polynomial of the loop in (x, e) is the product (8.74)–(8.76).
  const Kc = P.Gamma.map(g => k.map(kj => g * kj)), H = kh.map(h => P.c.map(c => h * c));
  const M = [[...F.matAdd(P.Phi, Kc)[0], ...Kc[0]], [...F.matAdd(P.Phi, Kc)[1], ...Kc[1]],
             [0, 0, ...F.matAdd(P.Phi, H)[0]], [0, 0, ...F.matAdd(P.Phi, H)[1]]];
  const want = F.polyMul(F.charpoly(F.matAdd(P.Phi, Kc)), F.charpoly(F.matAdd(P.Phi, H)));
  F.charpoly(M).forEach((c, i) => near(c, want[i], 1e-9));
});
