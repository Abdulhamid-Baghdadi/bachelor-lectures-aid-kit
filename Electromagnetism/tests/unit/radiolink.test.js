// The worked example of the wave propagation notes, planning a radio link (Lasser 2012): the level plan against the
// notes' own answer, the screen's diffraction and the Fresnel zone against the values the notes state, and the fade
// margin against the two-path channel it comes from.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as P from "../../src/core/index.js";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} is not ${b} ± ${tol}`);
const WLAN = { f: 2.4e9, d: 5000, Gs: 15, Ge: 14, Lvs: 2, Lve: 2, F: 7, B: 2e6, SNR: 20 };

test("the WLAN link at 2.4 GHz over 5 km needs Ps = 5 dBm, with L_ISO = 114 dB and Pn = −104 dBm, Lasser (2012) p. 141", () => {
  const p = P.levelPlan(WLAN);
  near(p.Liso, 114, 0.05);
  near(p.Pn, -104, 0.05);
  near(p.PeMin, -84, 0.05);
  near(p.L, 89, 0.05);
  near(p.Ps, 5, 0.05);
  // Doubling the distance costs 20 log 2 = 6.02 dB (12.10), by definition.
  near(P.levelPlan({ ...WLAN, d: 10000 }).Ps - p.Ps, 20 * Math.log10(2), 1e-9);
});

test("kB·290 K is −173.98 dBm/Hz, which (12.14) rounds to −174, by definition from (12.13)", () => {
  near(P.noiseDbm(1, 0), -173.98, 0.005);
  near(P.levelPlan({ ...WLAN, exact: true }).Pn, -103.97, 0.01);
});

test("the Fresnel integrals (10.3): C(0) = S(0) = 0, both tend to 1/2, and their slopes are cos and sin of πv²/2, by definition", () => {
  assert.deepEqual(P.fresnelCS(0), { C: 0, S: 0 });
  const far = P.fresnelCS(60);
  near(far.C, 0.5, 0.006); near(far.S, 0.5, 0.006);
  for (const v of [0.3, 1, 2.5]) {
    const e = 1e-4, a = P.fresnelCS(v - e), b = P.fresnelCS(v + e);
    near((b.C - a.C) / (2 * e), Math.cos(Math.PI * v * v / 2), 1e-6);
    near((b.S - a.S) / (2 * e), Math.sin(Math.PI * v * v / 2), 1e-6);
  }
});

test("the screen (10.2): E = E0/2 on the line of sight, 6 dB down (p. 108); E → E0 wide open and → 0 deep in the shadow", () => {
  const at = v => Math.hypot(...P.knifeEdge(v));
  near(at(0), 0.5, 1e-12);
  near(P.obstacleLoss(0, 0.125, 2500, 2500), 6.02, 0.005);
  near(at(-60), 1, 0.01);
  near(at(60), 0, 0.01);
});

test("with the whole first Fresnel zone clear the loss is about zero, a little gain even (Abb. 10.4)", () => {
  const lambda = P.C0 / 2.4e9, r = P.fresnelRadius(lambda, 2500, 2500), L = P.obstacleLoss(r, lambda, 2500, 2500);
  assert.ok(L < 0 && L > -2, `${L} dB`);
});

test("the first Fresnel zone of a 50 km link at λ = 5 cm is D = 50 m across at mid-path (10.5), Lasser (2012) p. 107", () => {
  near(2 * P.fresnelRadius(0.05, 25000, 25000), 50, 1e-9);
});

test("the fade margin 20 log(1/(1 − ρ)) is the depth of the two-path notch (13.4) below the direct path, by definition", () => {
  for (const rho of [0.1, 0.5, 0.9]) near(P.fadeMargin(rho), -20 * Math.log10(P.twoPath(1, rho, 0.5, 1)), 1e-9);
  near(P.fadeMargin(0.5), 6.02, 0.005);
});
