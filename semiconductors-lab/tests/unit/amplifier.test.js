// The worked example: a 25 W class-B amplifier, Schneider & Zimmermann (2005), Beispiel 1, with Zimmermann (2010),
// section 2.2. Each step against the example's own numbers, and the loss formula against a second route.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../../src/core/index.js";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} is not ${b} ± ${tol}`);
const Q = { P: 6, Tj: 150, RthJC: 1.92, RthMount: 0.5, Tamb: 50 };

test("25 W into 8 Ω need Ûa = 20 V, so UB = 22 V with 2 V to spare (B1/1)", () => {
  near(C.classBSupply(25, 8, 0), 20, 1e-12);
  near(C.classBSupply(25, 8, 2), 22, 1e-12);
});

test("one transistor's loss is half of PB − PL (2.21) and peaks at UB²/(π²RL) = 6.13 W for 22 V at Ûa = 2UB/π (2.24), B1/3–B1/4", () => {
  for (const ua of [3, 10, 14, 20]) near(C.classBLossOne(ua, 22, 8), C.classBPowers(ua, 22, 8).PT / 2, 1e-12);
  near(C.classBLossOne(44 / Math.PI, 22, 8), 22 * 22 / (Math.PI ** 2 * 8), 1e-12);
  near(22 * 22 / (Math.PI ** 2 * 8), 6.13, 0.005);
  assert.ok(C.classBLossOne(44 / Math.PI, 22, 8) > C.classBLossOne(20, 22, 8));
});

test("the thermal chain gives ϑG = 138.48 °C, ϑKB = 135.5 °C and Rth,KB-U ≤ 7.125 K/W (B1/4–B1/5)", () => {
  const ch = C.heatSinkChain(Q);
  near(ch.case, 138.48, 1e-9);
  near(ch.sink, 135.48, 1e-9);
  // The notes round ϑG to 138.5 °C before going on, which gives their 7.125 K/W.
  near(C.heatSinkChain({ ...Q, Tj: 150.02 }).RthSink, 7.125, 1e-9);
  near(ch.RthSink, 7.1233, 1e-4);
  // With exactly that sink the junction sits at Tj,max, by definition.
  near(C.junctionTemp(Q, ch.RthSink), 150, 1e-9);
});

test("the AB bias through two diodes: 50 mA cold, 200 mA hot, with R1 + R2 = 1 Ω (p. 30)", () => {
  near(C.abBias(1.4, 1.35, 1), 0.05, 1e-12);
  near(C.abBias(1.2, 1.0, 1), 0.2, 1e-12);
  near(C.emitterLoss(8, 0), 1, 0);
});

test("with −2 mV/K per junction (Strasser 2015, p. 166) the warm case of p. 30 is the diodes 50 K and the transistors 87.5 K warmer", () => {
  const b = C.abBiasWarm(50, 87.5);
  near(b.UB0, 1.2, 1e-12); near(b.twoUBE, 1.0, 1e-12); near(b.IC0, 0.2, 1e-12);
  // Warmed alike the bias does not move, by definition.
  near(C.abBiasWarm(60, 60).IC0, 0.05, 1e-12);
});
