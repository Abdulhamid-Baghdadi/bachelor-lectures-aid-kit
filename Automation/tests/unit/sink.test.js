// The heat sink of Beispiel 3.5 (Kugi et al. 2015, pp. 113–115), the worked example of Modellbildung chapter 3,
// against the notes' own answers and against a second route through the same network.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as F from "../../src/core/index.js";

const near = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} is not ${b}`);

test("the paste is RP = H/(λA) = 30 µm/(0.8 W/(m K) · 150 mm²) = 0.25 K/W (3.127), by hand", () => {
  near(F.sinkPaste(), 0.25, 1e-9);
});

test("the highest input voltage at steady state is 7.462 V without and 18.061 V with the heat sink, p. 115", () => {
  near(F.sinkUeMax(F.SINK, false), 7.462, 1e-4);
  near(F.sinkUeMax(F.SINK, true), 18.061, 1e-4);
  // At Ue,max the junction sits exactly at TS,max.
  near(F.sinkSteady(F.sinkPower(F.sinkUeMax()), F.SINK, true).TS, 403, 1e-9);
});

test("G(0) is the total resistance RSB + RP + RK (3.134 against 3.131), by definition", () => {
  near(F.freq(F.sinkTransfer(), 0)[0], 12.25, 1e-9);
});

test("the warm-up of the RC network ends at the steady temperatures", () => {
  const P = F.sinkPower(15);
  near(F.sinkWarmUp(P, 3000, 6000).TS.at(-1), F.sinkSteady(P).TS, 1e-5);
  near(F.sinkWarmUp(P, 1000, 4000, F.SINK, false).TS.at(-1), F.sinkSteady(P, F.SINK, false).TS, 1e-5);
});

test("the input swinging 6 V to 20 V needs at least fmin = 1.429·10⁻³ Hz = 5.146 per hour (3.135), p. 115", () => {
  const f = F.sinkMinFrequency(13, 7);
  near(f, 1.429e-3, 1e-3);
  near(f * 3600, 5.146, 1e-3);
});

test("the simulated network under the fluctuating power swings as |G(I2πf)| predicts", () => {
  const f = 4e-3, Pt = t => (13 + 7 * Math.cos(2 * Math.PI * f * t) - 5) * 0.5;
  const run = F.sinkWarmUp(Pt, 6000, 24000), tail = run.TS.slice(-Math.round(24000 / (6000 * f)));
  const r = F.sinkRipple(f, 13, 7);
  near(Math.max(...tail), r.mean + r.amp, 2e-3);
});

test("the warm-up stays accurate on a coarse output grid: it integrates in steps below the base plate's RP·CB = 0.19 s", () => {
  const P = F.sinkPower(15), run = F.sinkWarmUp(P, 3000, 300);
  assert.ok(run.TS.every(Number.isFinite));
  near(run.TS.at(-1), F.sinkSteady(P).TS, 1e-5);
});
