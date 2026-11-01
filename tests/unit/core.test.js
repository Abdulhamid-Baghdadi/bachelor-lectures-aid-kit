// The laws against a right answer each, its source named: an equation of Prechtl (2010) checked by a second route
// (a numerical integral against its closed form), a hand calculation, or a value by definition.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as F from "../../src/core/index.js";

const near = (a, b, rel = 1e-3) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} is not ${b}`);

test("ε0 from μ0 ε0 c0² = 1 (2.25) and Z0 = 376.730… Ω (5.50)", () => {
  near(F.EPS0, 8.8541878e-12, 1e-7);
  near(F.Z0, 376.730, 1e-6);
});

test("Gauss: the flux out of a sphere is the charge inside it, wherever the charges sit (Tab. 2.1, row 4)", () => {
  const charges = [{ q: 2e-9, x: 0.1, y: 0 }, { q: -1e-9, x: -0.2, y: 0.1 }, { q: 5e-9, x: 2, y: 0 }];
  near(F.fluxThroughSphere(charges, 0, 0, 0.5), 1e-9, 1e-2);
  assert.equal(F.enclosedCharge(charges, 0, 0, 0.5), 1e-9);
});

test("no magnetic flux leaves a closed surface, dipole inside or out (Tab. 2.1, row 2)", () => {
  assert.ok(Math.abs(F.dipoleBFlux(1, 0.6, 0, 0.5)) < 1e-9);
  // Inside, the point dipole's singular core is excluded, but symmetry still gives zero.
  assert.ok(Math.abs(F.dipoleBFlux(1, 0.05, 0.02, 0.5)) < 1e-6);
});

test("wire: H = I/(2πr); 10 A at 5 cm gives 31.8 A/m (hand-checked)", () => near(F.wireH(10, 0.05), 31.83, 1e-3));

test("induction: U = −dΦ/dt, peak A B̂ ω (Tab. 2.1, row 1, by definition of the derivative)", () => {
  const { U } = F.induction(0.01, 0.1, 50, 0);
  near(U, -0.01 * 0.1 * 2 * Math.PI * 50);
  const dt = 1e-7, a = F.induction(0.01, 0.1, 50, 0.003), b = F.induction(0.01, 0.1, 50, 0.003 + dt);
  near(-(b.Phi - a.Phi) / dt, F.induction(0.01, 0.1, 50, 0.003 + dt / 2).U, 1e-4);
});

test("continuity: the current is the rate the charge grows (Tab. 2.1, row 5)", () => {
  const dt = 1e-9, a = F.charging(5, 1e3, 1e-6, 1e-3), b = F.charging(5, 1e3, 1e-6, 1e-3 + dt);
  near((b.Q - a.Q) / dt, F.charging(5, 1e3, 1e-6, 1e-3 + dt / 2).I, 1e-4);
});

test("materials: εr = 1 + χ and D = ε0 E + P (2.36–2.38)", () => {
  const m = F.material({ E: 1e5, chi: 3 });
  assert.equal(m.epsr, 4);
  near(m.D, F.EPS0 * 1e5 + m.P);
});

test("c = 1/√(με): light in water (εr ≈ 81 at low frequency) goes at c0/9 (5.19, hand-checked)", () => {
  near(F.waveSpeed(1, 1), F.C0, 1e-9);
  near(F.waveSpeed(81), F.C0 / 9, 1e-9);
});

test("Poynting: the inward flux S·2πal of a resistive wire equals U·I (2.107, 2.109)", () => {
  const w = F.wirePoynting(2, 3, 1e-3, 10);
  near(w.P, 6, 1e-12);
});

test("Lorentz: a charge in B alone runs a circle of radius m v/(|q| B), at constant speed", () => {
  const q = 1.602e-19, m = 9.109e-31, v = 1e6, B = 1e-3, r = F.gyroRadius(q, m, v, B);
  const T = 2 * Math.PI * m / (q * B), steps = 2000;
  const path = F.lorentzPath({ q, m, Bz: B, vx: v, vy: 0, dt: T / steps, steps });
  const ys = path.map(p => p[1]);
  near(Math.max(...ys) - Math.min(...ys), 2 * r, 1e-3);
  // After one period it is back where it started.
  assert.ok(Math.hypot(...path.at(-1)) < 1e-3 * r);
});

test("Laplace: between plates at 0 and 10 V the potential is linear (3.9, exact solution)", () => {
  const nx = 12, ny = 22;
  // Plates as the left and right columns; top and bottom continued linearly, so the exact answer is ϕ = 10 x/(nx−1).
  const fixed = Array.from({ length: ny }, (_, i) => Array.from({ length: nx }, (_, j) =>
    j === 0 ? 0 : j === nx - 1 ? 10 : (i === 0 || i === ny - 1) ? 10 * j / (nx - 1) : null));
  const { phi } = F.laplace(fixed, { tol: 1e-9 });
  near(phi[11][6], 10 * 6 / 11, 1e-4);
});

test("dipole: E = −∇ϕ of (5.42), checked by a numerical derivative", () => {
  const p = 1e-12, r = 0.1, th = 0.7, h = 1e-6;
  const Er = -(F.dipolePotential(p, r + h, th) - F.dipolePotential(p, r - h, th)) / (2 * h);
  near(F.dipoleField(p, r, th).Er, Er, 1e-5);
});

test("relaxation: T_R = ε/γ; copper 1.5e-19 s, distilled water about 7 µs (3.105, hand-checked)", () => {
  near(F.relaxationTime(1, 5.8e7), 1.527e-19, 1e-3);
  near(F.relaxationTime(80, 1e-4), 7.08e-6, 1e-3);
  near(F.relaxed(1, 2, 2), Math.exp(-1));
});

test("Biot–Savart summed (3.144) agrees with the loop's closed form on its axis", () => {
  for (const z of [0, 0.03, 0.2]) near(F.loopAxisBNumeric(5, 0.05, z), F.loopAxisB(5, 0.05, z), 1e-4);
});

test("skin depth √(2/(μωγ)): copper at 50 Hz is 9.3 mm (4.31, hand-checked)", () => {
  near(F.skinDepth(50, 5.8e7), 9.35e-3, 2e-3);
  near(F.skinB(1, F.skinDepth(50, 5.8e7), 0, 50, F.skinDepth(50, 5.8e7)), Math.exp(-1) * Math.cos(-1));
});

test("plane wave: 1 V/m in vacuum brings 2.65 mA/m and 2.65 mW/m² (5.70–5.72, hand-checked)", () => {
  const w = F.planeWave(1);
  near(w.H, 2.654e-3, 1e-3);
  near(w.S, 2.654e-3, 1e-3);
});

test("Hertz dipole: R_S = (2π/3)(l/λ)² Z0 ≈ 789 Ω·(l/λ)² (5.53)", () => near(F.radiationResistance(0.1, 1), 7.890, 1e-3));

test("line: matched load has no reflection and |U| decays as e^(−αz) (5.116, 5.122)", () => {
  const L = 250e-9, Cp = 100e-12;
  const ZW = F.losslessLine(L, Cp).ZW;
  near(ZW, 50, 1e-9);
  const ln = F.line({ R: 0.5, L, G: 1e-5, Cp, f: 1e8, l: 3, ZA: [50, 0] });
  // With R′/L′ ≠ G′/C′ Z_W is slightly complex; load it with Z_W itself for the exact match.
  const matched = F.line({ R: 0.5, L, G: 1e-5, Cp, f: 1e8, l: 3, ZA: ln.ZW });
  near(matched.U(2), matched.decay(2), 1e-9);
  assert.ok(Math.hypot(...matched.reflection) < 1e-12);
});

test("line: a short at the end gives |U| = |sin β(l−z)|/|sin βl| on a lossless line (from (5.121))", () => {
  const ln = F.line({ L: 250e-9, Cp: 100e-12, f: 1e8, l: 1.3, ZA: [0, 0] });
  near(ln.U(0.4), Math.abs(Math.sin(ln.beta * 0.9) / Math.sin(ln.beta * 1.3)), 1e-9);
  near(ln.lambda, F.C0 > 0 ? 1 / (1e8 * Math.sqrt(250e-9 * 100e-12)) : 0, 1e-9);
});
