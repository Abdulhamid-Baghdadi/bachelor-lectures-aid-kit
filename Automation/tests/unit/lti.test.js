// The shared numerics, each against a closed form worked by hand or a second route.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "../../src/core/lti.js";

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * (1 + Math.abs(b)), `${a} ≠ ${b}`);

test("roots of (s+1)(s+2)(s+3) = s³+6s²+11s+6 and of s²+1 (by definition)", () => {
  const r = L.roots([1, 6, 11, 6]);
  [-3, -2, -1].forEach((v, k) => { near(r[k][0], v); near(r[k][1], 0); });
  const c = L.roots([1, 0, 1]);
  near(c[0][1] * c[1][1], -1);
});

test("polyFromRoots inverts roots", () => {
  assert.deepEqual(L.polyFromRoots([[-1, 2], [-1, -2]]).map(v => Number(v.toFixed(9))), [1, 2, 5]);
});

test("PT1 step reaches 1 − e^(−1) at t = T (hand-checked)", () => {
  const s = L.step({ num: [1], den: [2, 1] }, 10, 1000);
  near(s.y[200], 1 - Math.exp(-1), 1e-7);
});

test("PT2 with ζ = 0.3 overshoots by e^(−πζ/√(1−ζ²)) = 37.2 % (closed form)", () => {
  const s = L.step({ num: [1], den: [1, 0.6, 1] }, 40, 8000);
  near(L.stepInfo(s.t, s.y).overshoot, 100 * Math.exp(-Math.PI * 0.3 / Math.sqrt(1 - 0.09)), 1e-3);
});

test("Bode of 1/(1+s) at ω = 1: −3.01 dB and −45° (hand-checked)", () => {
  const [p] = L.bode({ num: [1], den: [1, 1] }, [1]);
  near(p.db, -10 * Math.log10(2));
  near(p.phase, -45);
});

test("Bode phase unwraps past −180° for 1/(s+1)³", () => {
  const b = L.bode({ num: [1], den: [1, 3, 3, 1] }, L.logspace(0.01, 100, 200));
  near(b.at(-1).phase, -270, 1e-2);
});

test("e^(At) for eigenvalues −1, −2 matches the modal closed form", () => {
  const E = L.expm([[0, 1], [-2, -3]]);
  near(E[0][0], 2 * Math.exp(-1) - Math.exp(-2));
  near(E[0][1], Math.exp(-1) - Math.exp(-2));
});

test("charpoly, det and inv agree", () => {
  const A = [[2, 1, 0], [1, 3, 1], [0, 1, 4]];
  const p = L.charpoly(A);
  near(-p[3], L.det(A));
  const I = L.matMul(A, L.inv(A));
  I.forEach((r, i) => r.forEach((v, j) => near(v, i === j ? 1 : 0)));
});

test("Routh: s³+2s²+3s+10 has first column 1, 2, −2, 10 and two right-half-plane roots", () => {
  const r = L.routh([1, 2, 3, 10]);
  assert.deepEqual(r.first, [1, 2, -2, 10]);
  assert.equal(r.changes, 2);
  assert.equal(L.roots([1, 2, 3, 10]).filter(z => z[0] > 0).length, 2);
});

test("ZOH of ẋ = −x + u: Φ = e^(−Ta), Γ = 1 − e^(−Ta) (closed form)", () => {
  const { Phi, Gamma } = L.zoh([[-1]], [1], 0.5);
  near(Phi[0][0], Math.exp(-0.5));
  near(Gamma[0], 1 - Math.exp(-0.5));
});

test("Ackermann places the poles where asked (eigenvalues of A − bkᵀ)", () => {
  const A = [[0, 1], [-2, -3]];
  const k = L.ackermann(A, [0, 1], [-5, -6]);
  const Acl = L.matAdd(A, [[0, 0], k], -1);
  const r = L.roots(L.charpoly(Acl));
  near(r[0][0], -6); near(r[1][0], -5);
});

test("realise keeps a biproper transfer function's direct feed-through", () => {
  const { d } = L.realise({ num: [2, 1], den: [1, 3] });
  near(d, 2);
  near(L.step({ num: [2, 1], den: [1, 3] }, 20, 2000).y.at(-1), 1 / 3, 1e-6);
});
