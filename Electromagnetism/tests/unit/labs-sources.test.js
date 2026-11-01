// The equation numbers the audit of 1 Nov 2026 corrected against the notes (AUDIT.md): each row names the equation, the
// number the source prints beside it and the printed page it was read on. Right result: the source's own numbering.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const eq = (lab, starts) => data.labs.find(l => l.id === lab).equations.find(e => e.eq.startsWith(starts));

const CORRECTED = [
  // Prechtl (2010), p. 111: δ = √(2/(μωγ)) is the third part of (4.27); (4.31) is the loss P″ that uses it.
  ["skin", "δ = √", "(4.27)"],
  // Prechtl (2010), p. 29: the local continuity equation and its jump condition are (2.15), repeated in Tab. 2.1.
  ["continuity", "∇·J = −∂tϱ", "(2.15)"],
  // Lasser (2012), p. 64: the cutoff frequency is printed as (6.9), the guide wavelength as (6.8); not derived.
  ["waveguide", "f_G,m,n", "(6.9)"],
  ["waveguide", "λ_H", "(6.8)"],
  // Lasser (2012), p. 39: γ·γ = −ω²μδ is (3.27), the step from (3.26) to γ = jω√(μδ).
  ["lossy", "γ = jω√(μδ)", "(3.27)"],
];

for (const [lab, starts, number] of CORRECTED) {
  test(`${lab}: "${starts}…" cites ${number} of the notes`, () => {
    const e = eq(lab, starts);
    assert.ok(e, `${lab} has an equation starting "${starts}"`);
    assert.ok(e.ref.includes(number), `${lab}: ${e.eq} cites "${e.ref}", the notes number it ${number}`);
  });
}

test("relaxation: the electric Reynolds number is written R_e, as in Prechtl (2010), (3.105), p. 86", () => {
  const e = eq("relaxation", "T_R = ε/γ");
  assert.match(e.eq, /R_e = εv0\/\(γL\)/);
});
