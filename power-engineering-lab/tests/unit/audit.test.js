// The corrections of the scientific audit of 1 Nov 2026 (AUDIT.md), each with its right result and the page it was
// read on. Each failed before its fix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as P from "../../src/core/index.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const lab = id => data.labs.find(w => w.id === id);

test("equal areas are the stability limit, not stable: Gawlik (2015) p. 237 asks A2 greater than A1", () => {
  // Turbine at the pull-out power before and after: δ0 = δmax = 90°, both areas exactly 0. The notes call the point at
  // 90° the limit and everything beyond it unstable (p. 236), so a criterion met with equality is not stability.
  const r = P.equalArea({ Pm: 1, Ppre: 1, Pfault: 0, Ppost: 1 }, Math.PI / 2);
  assert.equal(r.A1, 0); assert.equal(r.A2, 0);
  assert.equal(r.stable, false);
  assert.match(lab("stability").law, /A2 > A1/);
});

test("the permanent-magnet DC exercise is on printed page 123 of Schrödl (2012), PDF page 72", () => {
  const q = lab("dcmachine").practice.find(p => p.compute.law === "dcVoltageFor");
  assert.match(q.source, /p\. 123/);
});

test("equation references point at the page that prints the equation", () => {
  // Read in the notes on 1 Nov 2026: (4-19) is printed on p. 77 (p. 91 only uses it); p(t) = U I [...] is (3-26) on
  // p. 38, (3-15) prints it with amplitudes; the DC machine's steady state is (G.46), p. 123.
  const line = lab("line").equations.find(e => e.eq.startsWith("U₁ = U₂ cosh"));
  assert.match(line.ref, /p\. 77/);
  assert.match(lab("power").equations[0].ref, /\(3-26\)/);
  const dc = lab("dcmachine").equations.find(e => e.eq.startsWith("n = Ω_m"));
  assert.match(dc.ref, /\(G\.46\)/);
});

test("per unit: I_B = S_B/(√3 U_B) for line voltages, so c/|z| · I_B is I″k3 on every base", () => {
  // By definition (6-31), (6-33) with three-phase S_B = √3 U_B I_B; the notes' S_B = U_B I_B is the per-phase form.
  const net = P.exampleNetwork({ c: 1.1, SkQ: 5e9, RXQ: 0.1, uk: 0.12, ST: 31e6, Pk: 0.14e6, Rl: 0.12, Xl: 0.35, len: 40 }, 30e3);
  const Z = Math.hypot(...net.total), I = P.ik3(1.1, 30e3, Z);
  for (const SB of [10e6, 100e6, 1e9]) {
    const ZB = 30e3 ** 2 / SB, IB = SB / (Math.sqrt(3) * 30e3);
    assert.ok(Math.abs(1.1 / (Z / ZB) * IB - I) < 1e-9 * I);
  }
  assert.match(lab("perunit").equations[0].note, /√3 U_B I_B/);
});

test("every law and equation has its LaTeX (kit/MATH.md)", () => {
  for (const w of data.labs) {
    assert.ok(w.lawTex, `${w.id} has no lawTex`);
    for (const e of w.equations) assert.ok(e.tex, `${w.id}: no tex for ${e.eq}`);
  }
});
