// Four controllers on the drive of Abbildung 4.2 (Kugi 2015): each design against its own definition, the load error of
// the state controller against (8.50), and the comparison's verdict.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as F from "../../src/core/index.js";

const near = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} is not ${b}`);
const D = F.compareDesigns(), outer = (u, v) => u.map(ui => v.map(vj => ui * vj));
const eigAbs = M => F.roots(F.charpoly(M)).map(F.cAbs).sort((x, y) => x - y);

test("below the resonance the PI design (5.14)–(5.17) is a pure integrator with |L(IωC)| = 1 and more phase than Φ, by definition", () => {
  assert.equal(D.pi.kind, "I");
  const m = F.loopMargins(F.series(D.pi.R, D.G), 1e-3, 1e4, 8000);
  near(m.wc, 0.2, 1e-3);
  assert.ok(m.phaseMargin > 65);
  // At the compensator's ωC = 3 rad/s no PI zero can lift the phase: (5.16) asks for more than 90°.
  assert.equal(F.loopPiShape(D.G, 3, 65).possible, false);
});

test("the state controller and the observer put Φ + Γkᵀ and Φ + k̂cᵀ where asked (8.18b), (8.66b), by definition", () => {
  const S = D.state, z = s => Math.exp(s * 0.02);
  const want = [Math.exp(-0.7 * 3 * 0.02), Math.exp(-0.7 * 3 * 0.02), z(-9), z(-1321.66)].sort((x, y) => x - y);
  eigAbs(F.matAdd(S.Phi, outer(S.Gamma, S.k))).forEach((v, i) => near(v, want[i], 1e-4));
  const wantObs = [Math.exp(-0.7 * 15 * 0.02), Math.exp(-0.7 * 15 * 0.02), z(-45), z(-1321.66)].sort((x, y) => x - y);
  eigAbs(F.matAdd(S.Phi, outer(S.obs, S.c))).forEach((v, i) => near(v, wantObs[i], 1e-4));
});

test("kP = 1/(cᵀ(E − Φ)⁻¹Γ) (8.58) is one over the static gain V = 222.22 of (4.6a), by definition", () => {
  near(D.pistate.kP, 1 / 222.22, 1e-4);
});

test("under a load the state controller on the true state leaves the error of (8.50); the PI state controller leaves none", () => {
  const S = D.state, P = F.driveModel(), Gv = F.zoh(P.A, P.e, 0.02).Gamma, ML = 0.05, r = 100;
  const M = F.matAdd(F.matAdd(F.eye(4), S.Phi, -1), outer(S.Gamma, S.k), -1);
  const err = -S.c.reduce((s, ci, i) => s + ci * F.matVec(F.inv(M), Gv)[i], 0) * ML;
  const opts = { r, ML, tML: 10, T: 40, n: 40000 };
  near(r - F.compareStateRun({ D: S, ...opts, measured: true }).w.at(-1), err, 1e-3);
  assert.ok(Math.abs(err) > 0.5);
  // Through the observer, which knows nothing of the load, an error remains too, of a different size.
  assert.ok(Math.abs(r - F.compareStateRun({ D: S, ...opts }).w.at(-1)) > 0.5);
  for (const measured of [true, false]) near(r - F.compareStateRun({ D: D.pistate, ...opts, measured }).w.at(-1), 0, 1e-4);
});

test("the verdict: only the PI state controller meets every target with the actuator limited", () => {
  const runs = F.compareRuns(D, { r: 100, ML: 0.05, tML: 20, limit: true, T: 40, n: 40000 });
  const M = Object.fromEntries(Object.entries(runs).map(([k, run]) => [k, F.compareMetrics(run, 100, 20)]));
  const ok = m => m.overshoot <= 5 && m.settle <= 2.5 && m.peakU <= 1 + 1e-9 && Math.abs(m.endError) < 0.1;
  assert.deepEqual(Object.keys(M).filter(k => ok(M[k])), ["pistate"]);
  assert.ok(M.pi.settle > 15);                // slow: crossover below the resonance
  assert.ok(M.comp.overshoot > 30);           // fast but wound up against the limit
  assert.ok(Math.abs(M.state.endError) > 0.5); // the load error of (8.50)
  // Without the limit the compensator is fast and asks for far more than the actuator gives.
  const free = F.compareMetrics(F.compareRuns(D, { r: 100, T: 5, n: 5000 }).comp, 100);
  assert.ok(free.settle < 1.5 && free.peakU > 5);
});
