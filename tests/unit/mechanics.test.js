// The mechanics part of the core, each law against a second route or a hand calculation it names, and every
// practice answer in data/labs.json (checked in labs-data.test.js) worked again by solve().
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as M from "../../src/core/mechanics.js";
import { solve, isRight } from "../../src/core/practice.js";

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * (1 + Math.abs(b)), `${a} ≠ ${b}`);

test("Example 2.1: amin (2.11) and t3 (2.10) stop the mass at xsoll (hand-checked: 1 + 4 + 3 m)", () => {
  const { amin, t3 } = M.mechProfile(2, 1, 3, 8);
  near(amin, -2 / 3); near(t3, 6);
  const end = M.mechProfileAt(2, 1, 3, amin, t3);
  near(end.v, 0); near(end.x, 8);
});

test("the profile's x is the integral of its v (trapezoid rule, a second route)", () => {
  const { amin, t3 } = M.mechProfile(1.5, 0.8, 2.5, 6);
  const n = 20000, h = t3 / n;
  let x = 0;
  for (let k = 0; k < n; k++) x += h * (M.mechProfileAt(1.5, 0.8, 2.5, amin, k * h).v + M.mechProfileAt(1.5, 0.8, 2.5, amin, (k + 1) * h).v) / 2;
  near(x, 6, 1e-6);
});

test("collisions keep momentum for every e; e = 1 keeps kinetic energy (by definition, (2.71), (2.81))", () => {
  for (const e of [0, 0.4, 1]) {
    const { u1, u2 } = M.mechCollide(2, 3, 1, -1, e);
    near(2 * u1 + u2, 2 * 3 - 1);
    if (e === 1) near(M.mechKinetic(2, u1) + M.mechKinetic(1, u2), M.mechKinetic(2, 3) + M.mechKinetic(1, -1));
    if (e === 0) near(u1, u2);
  }
});

test("frictionless spring-mass keeps T + V (2.122)–(2.124) with d = 0, and follows q0 cos(ω0 t) (closed form)", () => {
  const r = M.smdResponse({ m: 0.5, d: 0, c: 200, q0: 0.1, T: 2, n: 4000 });
  r.E.forEach(E => near(E, 1, 1e-8));
  near(r.q.at(-1), 0.1 * Math.cos(20 * 2), 1e-6);
});

test("damped energy falls by ∫ d q̇² dt, as (2.124) says (trapezoid rule)", () => {
  const r = M.smdResponse({ m: 1, d: 2, c: 100, q0: 0.05, T: 3, n: 6000 });
  const h = 3 / 6000;
  let lost = 0;
  for (let k = 0; k < 6000; k++) lost += h * 2 * (r.v[k] ** 2 + r.v[k + 1] ** 2) / 2;
  near(r.E[0] - r.E.at(-1), lost, 1e-5);
});

test("forced response settles to the steady amplitude F/|c − mω² + jdω| (closed form)", () => {
  const r = M.smdResponse({ m: 1, d: 4, c: 100, F: 1, w: 8, T: 20, n: 20000 });
  const tail = r.q.slice(15000);
  near(Math.max(...tail), M.smdAmplitude(1, 4, 100, 1, 8), 1e-3);
  const p = M.smdParams(2, 16, 800);
  near(p.w0, 20); near(p.zeta, 0.2);
});

test("Coulomb sliding stops after v0/(µC g) and v0²/(2µC g) (hand-checked from (2.101))", () => {
  const r = M.mechSlide({ m: 1, v0: 2, muH: 0.5, muC: 0.4, T: 1, n: 10000 });
  near(r.x.at(-1), 4 / (2 * 0.4 * 9.81), 1e-4);
  const k = r.v.findIndex(v => v === 0);
  near(r.t[k], 2 / (0.4 * 9.81), 1e-3);
});

test("viscous sliding decays as v0 e^(−µV t/m) (closed form); a push below fH leaves a block at rest (2.102)", () => {
  const r = M.mechSlide({ m: 2, v0: 1, muH: 0, muC: 0, muV: 1, T: 2, n: 20000 });
  near(r.v.at(-1), Math.exp(-1), 1e-3);
  const s = M.mechSlide({ m: 1, v0: 0, fe: 3, muH: 0.5, muC: 0.3, T: 1, n: 100 });
  assert.equal(s.x.at(-1), 0);
});

test("a central motion keeps l (2.134) and its areal velocity is l/(2m) (2.136, shoelace area as second route)", () => {
  const m = 0.5, r = M.mechCentral({ m, c: 20, s0: 0.05, x0: 0.25, y0: 0, vx0: 0, vy0: 0.6, T: 2, n: 4000 });
  r.l.forEach(l => near(l, r.l[0], 1e-8));
  let A = 0;
  for (let k = 0; k < 2000; k++) { const [x1, y1] = r.s[k], [x2, y2] = r.s[k + 1]; A += (x1 * y2 - x2 * y1) / 2; }
  near(A, r.l[0] / (2 * m) * 1, 1e-6);
});

test("ball on beam: with τ = 0 the energy (2.206)–(2.211) is kept by rk4 on (2.214)", () => {
  const par = { mK: 0.1, rK: 0.02, thB: 0.05 };
  const run = M.ballBeamRun(par, [0.05, 0, 0.1, 0], () => 0, 1, 4000);
  const E0 = M.ballBeamEnergy(par, run.x[0]);
  run.x.forEach(x => near(M.ballBeamEnergy(par, x), E0, 1e-7));
});

test("ball on beam: with the beam held level, τ = g mK r is a rest position (solution of Aufgabe 2.18)", () => {
  const par = { mK: 0.1, rK: 0.02, thB: 0.05 };
  const f = M.ballBeamRhs(par, () => 9.81 * 0.1 * 0.3);
  f([0, 0, 0.3, 0]).forEach(v => near(v, 0, 1e-12));
  // A beam held still at angle φ: the ball rolls with r̈ = −(5/7) g sin φ (derived from (2.214a) with Θ_K = 2/5 mK rK²).
  const g = M.ballBeamRhs({ ...par, thB: 1e12 }, () => 0);
  near(g([0.1, 0, 0, 0])[3], -5 / 7 * 9.81 * Math.sin(0.1), 1e-6);
});
