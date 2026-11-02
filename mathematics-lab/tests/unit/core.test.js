// The mathematics of the core against the script's own worked values (Taschner, printed pages) and, where it gives
// none, against values worked by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as M from "../../src/core/index.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);

test("Babylonian root: 19/6, then 721/228 for a = 10 from x = 3 (p. 2)", () => {
  const xs = M.babylonian(10, 3, 2);
  near(xs[1], 19 / 6, 1e-15, "step 1"); near(xs[2], 721 / 228, 1e-15, "step 2");
});

test("Newton's formula: 4/3, then 91/72 for x³ − 2 from x = 1 (p. 308); for x² − a it is the Babylonian step", () => {
  const xs = M.newton(x => x ** 3 - 2, x => 3 * x * x, 1, 2);
  near(xs[1], 4 / 3, 1e-15, "step 1"); near(xs[2], 91 / 72, 1e-15, "step 2");
  near(M.newton(x => x * x - 10, x => 2 * x, 3, 2)[2], M.babylonian(10, 3, 2)[2], 1e-15, "Babylonian");
});

test("bumps: heights 0.828…, 2.605… and 9.424… at t = 0 (p. 286), integral 1, zero outside |t| < 1/n", () => {
  near(M.bump(1, 0), 0.828, 0.001, "φ1"); near(M.bump(2, 0), 2.605, 0.001, "φ2"); near(M.bump(4, 0), 9.424, 0.001, "φ4");
  for (const n of [1, 3, 7]) {
    let s = 0; for (let k = 0; k < 20000; k++) { const t = -1 + (k + 0.5) / 10000; s += M.bump(n, t) / 10000; }
    near(s, 1, 1e-3, `∫ φ${n}`);
  }
  assert.equal(M.bump(4, 0.25), 0); assert.equal(M.bump(4, 0.3), 0);
});

test("complex numbers: moduli multiply and arguments add (p. 93); de Moivre (p. 94)", () => {
  const z = M.polar(1.2, 0.5), w = M.polar(0.7, 1.1), p = M.cMul(z, w);
  near(M.cAbs(p), 0.84, 1e-12, "|zζ|"); near(M.cArg(p), 1.6, 1e-12, "arg zζ");
  const z8 = M.cPow(M.polar(1, 50 * Math.PI / 180), 8);
  near(M.cArg(z8) * 180 / Math.PI, 40, 1e-9, "arg z⁸ = 400° − 360°");
});

test("geometric series: 1/(1 − q) for |q| < 1, none for q = 2 (p. 126)", () => {
  near(M.geometricSum(0.6), 2.5, 1e-15, "q = 0.6"); near(M.geometricPartial(0.6, 60).at(-1), 2.5, 1e-12, "partial sums");
  assert.ok(Number.isNaN(M.geometricSum(2)));
  assert.deepEqual(M.geometricPartial(1, 3), [1, 2, 3]);
});

test("lower and upper sums of x² on [0, 1] with 10 parts: 0.285 and 0.385, either side of 1/3 (by hand, § 28)", () => {
  const { lower, upper } = M.riemannSums(x => x * x, 0, 1, 10);
  near(lower, 0.285, 1e-12, "lower"); near(upper, 0.385, 1e-12, "upper");
  const fine = M.riemannSums(x => x * x, 0, 1, 1000);
  assert.ok(fine.lower < 1 / 3 && 1 / 3 < fine.upper && fine.upper - fine.lower < 2e-3);
});

test("Cramer's rule (p. 400): 2x + y = 5, x + 3y = 10 gives (1, 3); a zero determinant gives none", () => {
  assert.deepEqual(M.cramer2(2, 1, 1, 3, 5, 10), [1, 3]);
  assert.equal(M.cramer2(1, 2, 2, 4, 1, 1), null);
});

test("eigenvectors (p. 410): [[2, 1], [1, 2]] has 3 along 45° and 1 across; A u = λ u", () => {
  const { phi0, lambda, mu } = M.symmetricEigen(2, 1, 2);
  near(phi0, Math.PI / 4, 1e-12, "φ0"); near(lambda, 3, 1e-12, "λ"); near(mu, 1, 1e-12, "μ");
  const [a, b, c] = [1.2, 0.5, 0.6], e = M.symmetricEigen(a, b, c), u = [Math.cos(e.phi0), Math.sin(e.phi0)];
  near(a * u[0] + b * u[1], e.lambda * u[0], 1e-12, "A u, x"); near(b * u[0] + c * u[1], e.lambda * u[1], 1e-12, "A u, y");
});

test("Cauchy (p. 493): z² and e^z give 0 round any circle; 1/z gives 2πj round 0, 0 beside it (by hand)", () => {
  for (const k of ["square", "exp"]) { const [re, im] = M.contourIntegral(M.COMPLEX_FUNCTIONS[k].f, [0.3, -0.2], 0.9); near(Math.hypot(re, im), 0, 1e-9, k); }
  const [re, im] = M.contourIntegral(M.COMPLEX_FUNCTIONS.inverse.f, [0, 0], 1);
  near(re, 0, 1e-9, "Re"); near(im, 2 * Math.PI, 1e-9, "Im");
  near(M.cAbs(M.contourIntegral(M.COMPLEX_FUNCTIONS.inverse.f, [1.5, 0], 1)), 0, 1e-9, "beside the pole");
});
