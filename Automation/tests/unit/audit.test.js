// The corrections of AUDIT.md, each against the page of the notes it was read from. Right results: the printed
// equation numbers and symbols of Kugi (2015) and Kugi et al. (2015), and for the fin the value recomputed from the
// lab's own formula. Every law and equation also carries its LaTeX (kit/MATH.md); whether each typesets is
// kit/tests/math.test.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { finHeat } from "../../src/core/heat.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const lab = id => data.labs.find(w => w.id === id);
const eqs = id => lab(id).equations.map(e => e.eq).join(" | ");

test("every law and equation has its LaTeX", () => {
  for (const w of data.labs) {
    assert.ok(w.lawTex, `${w.id} has no lawTex`);
    for (const e of w.equations) assert.ok(e.tex, `${w.id}: no tex for ${e.eq}`);
  }
});

test("the stopping time t3 is (2.9), Modellbildung Seite 9; (2.10) is x3(t3)", () => {
  const e = lab("kinematics").equations.find(q => q.eq.startsWith("t3"));
  assert.equal(e.ref, "(2.9)");
});

test("the fin solution shows the ratio 0.983 that its own formula gives (Aufgabe 3.14 parameters)", () => {
  const f = { L: 0.5, A: 0.01, P: 0.5, lambda: 60, alpha: 25, alphaL: 25, T0: 353, Tinf: 293 };
  const m = Math.sqrt(f.alpha * f.P / (f.lambda * f.A)), ratio = finHeat(f) / (f.lambda * f.A * m * (f.T0 - f.Tinf));
  assert.equal(ratio.toFixed(3), "0.983");
  assert.match(lab("fin").practice[0].solution, /× 0\.983 W/);
});

test("the notes' own symbols: τ (1.11), ψF and Θ (1.25), α ± Iβ (3.46), γ0 (3.54), θ1/2 (Aufgabe 3.34)", () => {
  assert.match(eqs("rlc"), /τ = R\/\(2L\)/);
  assert.doesNotMatch(eqs("dcmotor"), /Ψ|θG/);
  assert.match(eqs("phase"), /e\^\(αt\) cos\(βt\)/);
  assert.match(eqs("phase"), /γ0 exp/);
  assert.match(eqs("pt2"), /θ1\/2\(t\)/);
});

test("the notes' own symbols: η in the lead element (3.151), α ± Iβ in the pole-zero diagram (3.165)", () => {
  assert.match(eqs("pid"), /1 \+ sηT/);
  assert.match(eqs("polezero"), /\(s − α − Iβ\)/);
  assert.match(lab("polezero").law, /ξ = −α\/√\(α² \+ β²\)/);
});

test("the imaginary unit is I, as the Automatisierung notes write it (e.g. (3.112), (4.45), (6.87))", () => {
  for (const id of ["nyquistplot", "bode", "deadtime", "nyquist", "fkl", "tustin", "routh", "pt2"])
    assert.doesNotMatch(eqs(id), /\bj(ω|√|\d)|jω|e\^\{jω/, id);
});

test("the ball on the beam uses θK,zz, θB,zz and τe(0) as on Modellbildung Seite 63–64", () => {
  assert.doesNotMatch(eqs("lagrange"), /Θ/);
  assert.match(eqs("lagrange"), /= τe\(0\)/);
});

test("the double glazing writes the pane thickness δ, as (3.86) and (3.87) on Seite 98", () => {
  assert.match(eqs("wall"), /2δ\/λG/);
  assert.match(lab("wall").practice[0].solution, /2δ\/λG/);
});

test("equation numbers the notes give: Satz 3.8 is (3.101); friction switches by (2.102), (2.103)", () => {
  assert.equal(lab("polezero").equations.find(e => e.eq.startsWith("Re(si)")).ref, "(3.101)");
  assert.equal(lab("friction").equations[3].ref, "(2.102), (2.103)");
});

test("the page ranges hold the cited equations: (3.103) p. 69, (5.10) p. 122, (2.81) p. 29, (2.196) p. 60", () => {
  assert.match(lab("nyquistplot").lecture, /pp\. 69–73/);
  assert.match(lab("loop1dof").lecture, /p\. 122/);
  assert.match(lab("collision").lecture, /p\. 29/);
  assert.match(lab("lagrange").lecture, /p\. 60/);
});

// Kugi (2015), Seite 161: the Tustin map (6.90) is written q = (2/Ta)(z − 1)/(z + 1), checked 11 Nov 2026.
test("the drive lab writes the Tustin map (6.90) with Kugi's q", () => {
  const e = lab("drive").equations.find(q => q.ref === "(6.90)");
  assert.match(e.eq, /^q = \(2\/Ta\)/);
  assert.ok(e.where.some(w => w.tex === "q"));
  assert.ok(!e.where.some(w => w.tex === "s"));
});
