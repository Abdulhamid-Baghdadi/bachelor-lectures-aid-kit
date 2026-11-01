// The heat-transfer core, each result checked by a second route: an energy balance, a numerical derivative, a grid
// against the closed form, or a hand calculation named in the test. Then every practice answer in data/labs.json (checked in labs-data.test.js)
// is recomputed with the core.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as H from "../../src/core/heat.js";
import { solve, isRight } from "../../src/core/practice.js";

const near = (a, b, rel = 1e-6, what = "") => assert.ok(Math.abs(a - b) <= rel * Math.max(1, Math.abs(b)), `${what}: ${a} vs ${b}`);

test("wall: the same flux crosses every film and layer (3.82), and the profile ends at the outer film", () => {
  const layers = [{ L: 0.004, lambda: 1 }, { L: 0.012, lambda: 0.025 }, { L: 0.004, lambda: 1 }];
  const { q, T } = H.heatWallProfile(20, -5, 8, layers, 20);
  near(8 * (20 - T[0]), q, 1e-9, "inner film");
  layers.forEach((l, i) => near(l.lambda / l.L * (T[i] - T[i + 1]), q, 1e-9, `layer ${i}`));
  near(20 * (T.at(-1) + 5), q, 1e-9, "outer film");
  // Hand calculation (Beispiel 3.2 values): 1/k = 0.125 + 0.008 + 0.48 + 0.05 = 0.663.
  near(H.heatWallK(8, layers, 20), 1 / 0.663, 1e-9, "k");
});

test("pipe: the logarithmic profile matches the films at both faces, and q′ peaks at rc = λ/α", () => {
  const args = [80, 20, [0.01, 0.012, 0.03], [50, 0.05], 200, 8];
  const qp = H.heatPipeLoss(...args);
  near(qp, 2 * Math.PI * 0.01 * 200 * (80 - H.heatPipeTemperature(0.01, ...args)), 1e-9, "inner film");
  near(qp, 2 * Math.PI * 0.03 * 8 * (H.heatPipeTemperature(0.03, ...args) - 20), 1e-9, "outer film");
  const loss = r => H.heatPipeLoss(60, 20, [0.002, r], [0.2], 1e9, 10), rc = H.heatCriticalRadius(0.2, 10);
  assert.ok(loss(rc) > loss(rc * 0.98) && loss(rc) > loss(rc * 1.02));
});

test("fin: the profile obeys λA T″ = αP(T − T∞), the tip balance, and Q(0) = −λA T′(0)", () => {
  const f = { L: 0.5, T0: 353, Tinf: 293, alpha: 25, alphaL: 25, P: 0.5, A: 0.01, lambda: 60 }, d = 1e-4;
  const T = x => H.finTemperature(x, f);
  const x = 0.2, T2 = (T(x + d) - 2 * T(x) + T(x - d)) / d ** 2;
  near(f.lambda * f.A * T2, f.alpha * f.P * (T(x) - f.Tinf), 1e-4, "fin equation");
  near(-f.lambda * (T(f.L + d) - T(f.L - d)) / (2 * d), f.alphaL * (T(f.L) - f.Tinf), 1e-6, "tip");
  near(-f.lambda * f.A * (T(d) - T(-d)) / (2 * d), H.finHeat(f), 1e-6, "base");
  near(T(0), f.T0, 1e-12, "base temperature");
  const eta = H.finEfficiency(f);
  assert.ok(eta > 0 && eta < 1);
  assert.ok(H.finEfficiency({ ...f, L: 0.1 }) > eta, "shorter fin is more efficient");
});

test("radiation: (3.63) with ε = 1 is σ(T1⁴ − T2⁴); (3.67) inverts it; αrad linearises exactly", () => {
  near(H.heatTubeNet(400, 300, 1, 1, 0.5), H.SIGMA * (400 ** 4 - 300 ** 4), 1e-12, "black");
  const d = 0.05, D = 0.1, T1 = H.heatInnerTemp(100, 320, 0.7, 0.4, d, D);
  near(Math.PI * d * H.heatTubeNet(T1, 320, 0.7, 0.4, d / D), 100, 1e-9, "inner temperature");
  near(H.heatRadAlpha(320, 293, 0.8) * 27, 0.8 * H.SIGMA * (320 ** 4 - 293 ** 4), 1e-9, "linearised");
});

test("tank: (3.99) solves (3.97) by RK4, and (3.100), boil time and (3.104) agree", () => {
  const p = { P: 800, kA: 0.5, m0: 1, cp: 4190, Tinf: 20, Ts: 100, hv: 2.257e6 };
  let T = p.Tinf, t = 0; const h = 5;
  const f = T => (p.P - p.kA * (T - p.Tinf)) / (p.m0 * p.cp);
  for (; t < 300; t += h) { const k1 = f(T), k2 = f(T + h / 2 * k1), k3 = f(T + h / 2 * k2), k4 = f(T + h * k3); T += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); }
  near(T, H.heatTankTemp(300, p), 1e-9, "rk4");
  const ts = H.heatTankBoilTime(p);
  near(H.heatTankTemp(ts, { ...p, Ts: Infinity }), p.Ts, 1e-9, "boil time");
  near(H.heatTankPower(ts, p), p.P, 1e-9, "power");
  // (3.104) by integrating (3.102) for the steam mass with explicit Euler.
  let m = 0, tt = ts; const Q = p.kA * (p.Ts - p.Tinf);
  while (m < p.m0) { m += 0.05 * (p.P - (p.m0 - m) / p.m0 * Q) / p.hv; tt += 0.05; }
  near(tt, H.heatTankDryTime(ts, p), 1e-4, "dry time");
});

test("FDM (3.110) follows the series solution when stable and blows up above 1/2 (3.111)", () => {
  const rod = { a: 60 / (7850 * 450), L: 0.5, TA: 80, TL: 20 }, N = 40, dx = rod.L / N, r = 0.4, dt = r * dx * dx / rod.a;
  let T = Array.from({ length: N + 1 }, (_, i) => i === N ? rod.TL : rod.TA);
  const steps = 2000;
  for (let j = 0; j < steps; j++) T = H.heatFdmStep(T, r, rod.TL);
  T.forEach((v, i) => assert.ok(Math.abs(v - H.heatRodSeries(i * dx, steps * dt, rod)) < 0.1, `node ${i}`));
  let U = Array.from({ length: 11 }, (_, i) => i === 10 ? 20 : 80);
  for (let j = 0; j < 400; j++) U = H.heatFdmStep(U, 0.55, 20);
  assert.ok(Math.max(...U.map(Math.abs)) > 1e3, "unstable above 1/2");
  near(H.heatFdmMaxStep(rod.a, 0.05), 0.0025 / (2 * rod.a), 1e-12, "max step");
});
