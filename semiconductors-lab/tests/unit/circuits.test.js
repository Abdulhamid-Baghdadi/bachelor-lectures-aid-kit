// The circuit core against a second route: a numerical derivative of the large-signal transfer, a node-by-node
// small-signal solution, a numerical period integral, an RK4 simulation, a seeded noise estimate, or a value printed in
// Zimmermann (2010) or the worked examples of Schneider & Zimmermann (2005).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../../src/core/circuits.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);
const rel = (a, b, tol, what) => near(a / b, 1, tol, what);

test("the common-emitter stage: the slope of the large-signal transfer is −S RC/(1 + S RE) (1.4)", () => {
  const prm = { Is: 1e-15, RC: 5e3, RE: 1e3, U0: 12, UT: 0.025 };
  for (const ue of [0.65, 1.2, 2.0]) {
    const d = 1e-6, slope = (C.ceTransfer(ue + d, prm).ua - C.ceTransfer(ue - d, prm).ua) / (2 * d);
    rel(slope, C.ceGain(C.ceTransfer(ue, prm).IC, 5e3, 1e3, 0.025), 1e-4, `ue = ${ue}`);
  }
});

test("the current source: the closed form against a nodal solution, and the limits of (1.19)", () => {
  for (const RE of [10, 1e3, 1e6]) {
    const prm = { UA: 100, beta: 100, RE, UT: 0.025 };
    rel(C.sourceR(1e-3, prm), C.sourceRNodal(1e-3, prm), 1e-2, `RE = ${RE}`);
  }
  rel(C.sourceR(1e-3, { UA: 100, beta: 100, RE: 1, UT: 0.025 }), 1e5 * (1 + 0.04), 1e-3, "rCE(1 + S RE)");
  rel(C.sourceR(1e-3, { UA: 100, beta: 100, RE: 1e9, UT: 0.025 }), 101 * 1e5, 1e-3, "β rCE");
});

test("class B: the powers (2.17), (2.18) against the period integral; 78.5 % at full drive and PT,max at 0.637 UB", () => {
  for (const u of [3, 10, 15]) {
    const a = C.classBPowers(u, 15, 8), b = C.classBPowersNumeric(u, 15, 8);
    rel(a.PL, b.PL, 1e-6, "PL"); rel(a.PB, b.PB, 1e-6, "PB");
  }
  near(C.classBEfficiency(15, 15), 0.785, 0.001, "η max");
  const us = Array.from({ length: 1501 }, (_, k) => k / 100), PT = us.map(u => C.classBPowers(u, 15, 8).PT);
  near(us[PT.indexOf(Math.max(...PT))] / 15, 0.637, 0.002, "worst amplitude");
  near(Math.max(...PT) / C.classBPowers(15, 15, 8).PB, 0.32, 0.005, "0.32 PB,max");
});

test("the push-pull stage: class B has a dead zone, class AB follows the input closely", () => {
  const prm = { UB: 15, RL: 8 };
  near(C.pushPull(0.3, { ...prm, Ubias: 0 }), 0, 1e-3, "B: small input gives nothing");
  near(C.pushPull(0.3, { ...prm, Ubias: 1.3 }), 0.3, 0.03, "AB: follows");
  near(C.pushPull(-5, { ...prm, Ubias: 0 }), -C.pushPull(5, { ...prm, Ubias: 0 }), 1e-9, "odd symmetry");
});

test("the loop: the closed-form step against RK4; B06 of the worked examples: crossover 10 530 1/s, margin ≈ 6°", () => {
  const prm = { vg0: 1e4, w1: 100, w2: 1111.1 };
  for (const t of [2e-4, 6e-4, 2e-3]) near(C.stepResponse(t, prm, 0.1), C.stepNumeric(t, prm, 0.1, 100000), 1e-4, `t = ${t}`);
  const m = C.phaseMargin(prm, 0.1);
  rel(m.wc, 10530, 0.005, "crossover"); near(m.margin, 6, 1, "margin");
  near(C.stepResponse(1, prm, 0.1), 1e4 / 1001, 1e-6, "final value vg0/(1 + β vg0)");
});

test("slew rate: the script's 741, 0.6 V/µs: fp = 10 kHz at 10 V and 1 V at 100 kHz (p. 86); a fast sine turns triangular", () => {
  near(C.powerBandwidth(0.6e6, 10) / 1e3, 9.55, 0.01, "fp");
  near(0.6e6 / (2 * Math.PI * 1e5), 0.955, 0.001, "amplitude at 100 kHz");
  const r = C.slewFollower({ A: 10, f: 50e3, SR: 0.6e6, fT: 1e6 });
  const slopes = r.ua.slice(1).map((y, k) => (y - r.ua[k]) / (r.t[1] - r.t[0]));
  near(Math.max(...slopes.map(Math.abs)), 0.6e6, 1, "never faster than SR");
  const small = C.slewFollower({ A: 0.1, f: 1e3, SR: 0.6e6, fT: 1e6 });
  near(Math.max(...small.ua.slice(2000)), 0.1, 2e-3, "a small slow sine passes");
});

test("noise: the script's shot-noise example, 1 mA in 1 MHz gives 1.8·10⁻⁸ A (6.12); seeded samples have unit RMS", () => {
  near(C.shotNoise(1e-3, 1e6) * 1e8, 1.8, 0.02, "shot");
  rel(C.thermalNoise(1e3, 290, 1), Math.sqrt(4 * 4e-21 * 1e3), 0.002, "kT0 = 4·10⁻²¹ W/Hz at 290 K (p. 130)");
  assert.deepEqual(C.gaussian(7, 5), C.gaussian(7, 5));
  const g = C.gaussian(3, 100000);
  near(Math.sqrt(g.reduce((s, x) => s + x * x, 0) / g.length), 1, 0.01, "RMS");
});
