// The corrections of the scientific audit of 1 Nov 2026 (AUDIT.md), each with its right result and that result's
// source. Each failed before its fix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as F from "../../src/core/index.js";
import { lightNote } from "../../src/labs/velocity.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const lab = id => data.labs.find(l => l.id === id);
const c = F.C0;

test("velocity: 'light stays at c0' only when the body is light, |w| = c0 (Einstein (1905), p. 906)", () => {
  // 0.99 c0 ⊕ 0.99 c0 = 0.99995 c0: below c0, and no light involved (p. 906: two speeds below V give one below V).
  assert.equal(lightNote(0.99), "");
  assert.match(lightNote(1), /light/);
  assert.match(lightNote(-1), /light/);
});

test("moving charge at rest: the field is −grad of Prechtl's point-charge potential (3.13), p. 61 (by definition)", () => {
  const q = 1e-9, phi = (x, y) => q / (4 * Math.PI * F.EPS0 * Math.hypot(x, y)), d = 1e-7;
  for (const [x, y] of [[0.03, 0.04], [-0.02, 0.01]]) {
    const E = F.movingCharge(q, 0, x, y).E;
    assert.ok(Math.abs(E[0] + (phi(x + d, y) - phi(x - d, y)) / (2 * d)) < 1e-6 * Math.abs(E[0]));
    assert.ok(Math.abs(E[1] + (phi(x, y + d) - phi(x, y - d)) / (2 * d)) < 1e-6 * Math.abs(E[1]));
  }
  assert.doesNotMatch(data.about, /Coulomb's field with its eq\. \(3\.13\)/);
});

test("practice: at 10⁶ m/s, γ v B and Prechtl's v × B differ by 5.6 parts per million: same to 5 digits, not 6", () => {
  const v = 1e6, exact = F.solve({ law: "boostedE", v, B: 1 }), low = v * 1;
  const rel = exact / low - 1;
  assert.ok(rel > 5.5e-6 && rel < 5.7e-6, `relative difference ${rel}`);
  // To 6 significant digits they read 1.00001 and 1.00000 × 10⁶ V/m.
  assert.notEqual((exact / 1e6).toPrecision(6), (low / 1e6).toPrecision(6));
  const q = lab("movingcharge").practice[0];
  assert.doesNotMatch(q.solution, /6 digits/);
});

test("equations: modern notation throughout, Einstein's V for c0 named only as a mapping (task: modern notation)", () => {
  for (const l of data.labs) for (const e of l.equations) {
    assert.doesNotMatch(e.eq, /V²|\/V\b|\bV t|V \+|= V$/, `${l.id}: ${e.eq} still writes Einstein's V`);
    assert.ok(e.ref, `${l.id}: ${e.eq} names its page, or says it is derived`);
  }
});
