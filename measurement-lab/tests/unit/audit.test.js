// What the scientific audit of 1 November 2026 found wrong (AUDIT.md), each held so it cannot come back. Right results
// from Schrüfer et al. (2012) by equation number and printed page, and from the lab script of Schitter (2015) by Seite.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ARRANGEMENTS, deflection, gain, phase } from "../../src/core/index.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const lab = id => data.labs.find(l => l.id === id);
const source = name => readFileSync(new URL(`../../src/labs/${name}.js`, import.meta.url), "utf8");

test("every equation that cites the book names its equation number, figure, table or page", () => {
  for (const l of data.labs) for (const e of l.equations) {
    if (e.ref) assert.match(e.ref, /eqs?\. \d+\.\d+|Bild \d|Table \d|p\. \d+|Seite \d+/, `${l.id}: "${e.eq}" cites ${e.ref}`);
  }
});

// Eq. 2.28, p. 90 (UM/UL = 1/(1 + Ri/RM)) and eq. 2.24, p. 89 (IM = UL/(Ri + RM)) are the loading laws; the lab had
// them without a source.
test("the meter-loading laws cite eqs. 2.28 and 2.24", () => {
  const refs = lab("loading").equations.map(e => e.ref);
  assert.match(refs[0], /eq\. 2\.28, p\. 90/);
  assert.match(refs[1], /eq\. 2\.24, p\. 89/);
});

// The K factor is defined by eq. 3.68, p. 235; ΔR/R ≈ ΔR/R0 = K·ε is eq. 3.74, p. 236 (checked 11 Nov 2026 in
// 3-Ohm-Brücken.pdf, PDF p. 42); eqs. 3.75–3.76, p. 238, are σ = F/A and σ = E·ε only.
test("the strain gauge's K factor cites eq. 3.68 and ΔR/R0 = Kε eq. 3.74, p. 236", () => {
  const e = lab("bridge").equations.find(q => q.eq.includes("K ε"));
  assert.match(e.ref, /eqs\. 3\.68, 3\.74, 3\.75–3\.76, pp\. 235–238/);
  const means = Object.fromEntries(e.where.map(w => [w.tex, w.means]));
  assert.match(means["\\frac{\\Delta R}{R_0}"], /eq\. 3\.74, p\. 236\)/);
  assert.match(means.K, /eq\. 3\.68, p\. 235\)/);
});

// Bild 3.9, p. 203: arrangement d (two arms in opposite positions, both +ΔR) is only approximately linear,
// Ud ≈ (U0/2)·ΔR/R0; arrangement f (+ΔR and −ΔR in one divider) is exactly linear. "Two opposite arms" named d.
test("the half bridge is named for opposite changes in one divider, Bild 3.9 f, not for opposite arms", () => {
  assert.doesNotMatch(ARRANGEMENTS.half.name, /opposite arms/);
  assert.match(ARRANGEMENTS.half.name, /opposite changes/);
  assert.doesNotMatch(lab("bridge").idea, /two opposite arms/);
  // The claim itself, by eq. 3.12: f is exact, d is not.
  const x = 0.1, U0 = 1, R0 = 1, d = U0 * ((R0 + x) * (R0 + x) - R0 * R0) / ((2 * R0 + x) * (2 * R0 + x));
  assert.ok(Math.abs(d - U0 * x / 2) > 1e-3, "Bild 3.9 d bends");
  assert.ok(Math.abs(deflection("half", U0, R0, x).exact - U0 * x / 2) < 1e-12, "Bild 3.9 f is straight");
});

// Eqs. 3.78–3.79, p. 239: a passive second gauge cancels temperature and leaves the quarter bridge's U0/4·ΔRS/R0; a
// second gauge glued across the load adds its Poisson change, (1 + μ)·U0/4·ΔRS/R0, about 1.3 times, not twice.
test("the bridge hint does not say a temperature-compensating gauge doubles the signal", () => {
  const s = source("bridge");
  assert.doesNotMatch(s, /double the signal and cancel temperature/);
  assert.match(s, /\(1 \+ μ\)/);
});

// Schitter (2015), task 1.1.1, Seite 5: the voltmeter's resistance is computed from U, the series R1 = 100 kΩ and the
// reading, a divider; the halving rule is the book's (p. 91), not the script's.
test("the loading hint does not ascribe the halving rule to the lab script", () => {
  assert.doesNotMatch(source("loading"), /that is how the lab script finds/);
});

// Eqs. 7.110 and 7.116, pp. 369–370: far above ω0 the mass stays put, xa = −xe; |xa| = |xe| but the phase is −180°.
test("the seismic readout says the mass stands still above resonance, not that xa follows xe", () => {
  assert.doesNotMatch(source("seismic"), /xa follows xe/);
  assert.ok(Math.abs(gain(100, 0.7) - 1) < 1e-3 && phase(100, 0.7) < -0.99 * Math.PI);
});

// Schitter (2015), task 1.2.4, Seite 15, asks for the bit count but names none; the 8-bit example is the lab's own.
test("the quantisation hint marks its 8-bit scope as an example", () => {
  assert.match(source("quantisation"), /for example an 8-bit/);
});
