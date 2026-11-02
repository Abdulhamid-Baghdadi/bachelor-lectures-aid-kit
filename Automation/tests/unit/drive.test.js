// The drive of Abbildung 4.2 (Kugi 2015), the worked example from model to digital controller, against the notes' own
// numbers: (4.6a) on p. 97, the design of section 5.3 on pp. 131–133 and Abbildung 5.8.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as F from "../../src/core/index.js";

const near = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} is not ${b}`);

test("the model (4.3) with the parameters (4.5) gives the normalised transfer function (4.6a), p. 97", () => {
  const d = F.driveFactors(F.driveTransfer());
  near(d.V, 222.22, 1e-4);
  near(d.corners[0], 11.17, 1e-3);
  near(d.corners[1], 1321.66, 1e-4);
  near(d.w0, 1.82, 2e-3);
  near(d.xi, 0.138, 2e-3);
});

test("the compensating controller (5.38): arg L1(IωC) by hand, VR as the notes give it (5.41), p. 131", () => {
  const c = F.driveCompensator(F.driveTransfer(), 3, 65);
  // (5.39) at ωC = 3 by hand: −90° − arctan(3/11.17) − arctan(3/1321.66) = −105.16°. The notes print −104.5° and so
  // lower the phase by 10.5°, which gives their TR = 0.0306 (5.40); the hand value gives 9.84° and TR = 0.0287.
  near(c.argL1, -105.16, 1e-3);
  near(c.TR, Math.tan(9.84 / 2 * Math.PI / 180) / 3, 2e-3);
  near(Math.tan(10.5 / 2 * Math.PI / 180) / 3, 0.0306, 2e-3);
  near(c.VR, 0.0141, 5e-3);
  assert.ok(c.possible);
});

test("the designed loop is stable, settles at the reference and crosses over at ωC = 3 with Φ = 65°", () => {
  const G = F.driveTransfer(), c = F.driveCompensator(G, 3, 65);
  assert.ok(F.driveLoopPoles(c.R, G).every(([re]) => re < 0));
  const m = F.loopMargins(F.series(c.R, G), 1e-2, 1e4, 6000);
  near(m.wc, 3, 5e-3);
  near(m.phaseMargin, 65, 5e-3);
  near(F.driveRun({ R: c.R, T: 4, n: 4000 }).w.at(-1), 1, 1e-3);
});

test("the duty cycle for r = 100σ(t) breaks |uT,n| ≤ 1 without the prefilter (5.44) and keeps it with, Abbildung 5.8", () => {
  const { R } = F.driveCompensator(F.driveTransfer(), 3, 65);
  const peak = F => Math.max(...F.u.map(Math.abs));
  assert.ok(peak(F.driveRun({ R, r: 100, T: 3, n: 3000 })) > 5);
  assert.ok(peak(F.driveRun({ R, F: F.DRIVE_PREFILTER, r: 100, T: 3, n: 3000 })) < 1);
});

test("the limit clips the duty cycle to ±1 (Abbildung 4.11), and the integrator rejects a load step, though only as fast as the cancelled pair decays (e^{−0.25t}, p. 133)", () => {
  const { R } = F.driveCompensator(F.driveTransfer(), 3, 65);
  const run = F.driveRun({ R, r: 100, limit: true, T: 3, n: 3000 });
  assert.ok(Math.max(...run.u.map(Math.abs)) <= 1 + 1e-12);
  const load = t => F.driveRun({ R, r: 1, ML: 0.05, tML: 2, T: t, n: t * 1000 }).w.at(-1);
  assert.ok(Math.abs(load(12) - 1) > 0.02, "ten seconds after the load the pair still rings");
  near(load(40), 1, 2e-3);
});

test("the controller as R(z) by Tustin (6.90): a short Ta follows the continuous loop, a long one strays", () => {
  const { R } = F.driveCompensator(F.driveTransfer(), 3, 65);
  const cont = F.driveRun({ R, T: 3, n: 3000 }), fine = F.driveRun({ R, Ta: 0.005, T: 3, n: 3000 }), coarse = F.driveRun({ R, Ta: 0.2, T: 3, n: 3000 });
  const gap = run => Math.max(...run.w.map((w, k) => Math.abs(w - cont.w[k])));
  assert.ok(gap(fine) < 0.03, `Ta = 5 ms strays ${gap(fine)}`);
  assert.ok(gap(coarse) > 3 * gap(fine));
});
