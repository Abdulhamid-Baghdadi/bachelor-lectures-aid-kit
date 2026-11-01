// What the scientific audit of 1 November 2026 found wrong (AUDIT.md), each held so it cannot come back. Right results
// from the scripts, by page and equation: Strasser (2015) for the physics, Zimmermann (2010) for the circuits.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as S from "../../src/core/semiconductors.js";
import * as C from "../../src/core/circuits.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const lab = id => data.labs.find(l => l.id === id);
const source = file => readFileSync(new URL(`../../src/labs/${file}`, import.meta.url), "utf8");

test("every equation that cites a text names its equation number or page", () => {
  for (const l of data.labs) for (const e of l.equations) {
    if (e.ref) assert.match(e.ref, /\(\d+\.\d+(\.\d+)?\)|p\. \d+|pp\. \d+/, `${l.id}: "${e.eq}" cites ${e.ref} with no equation or page`);
  }
});

// A thin barrier V0 b δ(x) in −ħ²/(2m) ψ″ + V ψ = E ψ makes the first derivative jump: ψ′(+) − ψ′(−) = (2m V0 b/ħ²) ψ
// = (2P/a) ψ with P = m a V0 b/ħ² of Strasser (2015), p. 57. By derivation; the core's transfer matrix does the same.
test("the bands lab says the slope ψ′ jumps at a barrier, not ψ″", () => {
  const e = lab("bands").equations.find(q => /jumps/.test(q.eq));
  assert.match(e.eq, /ψ′ jumps/);
  assert.doesNotMatch(e.eq, /ψ″/);
  for (const x of [0.5, 2, 5]) assert.ok(Math.abs(S.kpTransferHalfTrace(3, x) - S.kpLhs(3, x)) < 1e-12);
});

// Zimmermann (2010), p. 7: (1.18) is rBE = β/S; the transconductance S = Ia/UT is written on the line below (1.19),
// with no number of its own.
test("the transconductance S = IC/UT does not cite (1.18), which is rBE = β/S", () => {
  const e = lab("cestage").equations.find(q => q.eq.startsWith("S = IC/UT"));
  assert.doesNotMatch(e.ref, /\(1\.18\)/);
  assert.match(e.ref, /p\. 7/);
});

// Zimmermann (2010), (2.18)–(2.20), pp. 23–24, writes the supplied power PB; (2.24), p. 24, gives PT ≈ 0.1 UB²/RL for
// one transistor.
test("the push-pull lab writes the script's PB for the supplied power, not PS", () => {
  const p = lab("poweramp");
  for (const s of [p.law, p.lawTex, ...p.equations.flatMap(e => [e.eq, e.tex])]) assert.doesNotMatch(s, /P_?\\?(mathrm\{)?S/, s);
  assert.ok(p.equations.some(e => /\(2\.24\)/.test(e.ref)), "the per-transistor loss cites (2.24)");
  assert.ok("PB" in C.classBPowers(15, 10, 8));
});

// Strasser (2015), (5.3.17), p. 139: at fixed forward voltage, (1/J) dJ/dT = (UG − U)/(UT T), "0.05 K⁻¹" for Si at
// 0.7 V, so 10 K raise the current by e^0.5 = 1.65 or more (the lab also counts the T³ of ni²); not "by about half".
test("warming the diode 10 K at 0.7 V nearly doubles its current", () => {
  const prm = { NA: 1e18, ND: 1e16, tau: 1e-6, area: 1e-4 };
  const I = T => S.diodeCurrent(0.7, { Is: S.saturation({ ...prm, T }), T });
  const r = I(310) / I(300);
  assert.ok(r > Math.exp(0.5) && r < 2.1, `ratio ${r}`);
  assert.doesNotMatch(source("diode.js"), /rises by about half/);
  assert.ok(lab("diode").equations.some(e => /\(5\.3\.17\)/.test(e.ref)));
});

// Strasser (2015), p. 114, prints E2 = EC − (mr/mn*)(ħω − EG), a misprint: with E1 = EV − (mr/mp*)(ħω − EG) only the plus
// sign gives E2 − E1 = ħω of its own (4.2.2).
test("the electron lands above EC: E2 = EC + (mr/mn*)(ħω − EG)", () => {
  const e = lab("absorption").equations.find(q => q.eq.startsWith("E1 = EV"));
  assert.match(e.eq, /E2 = EC \+/);
  assert.match(e.tex, /E_2 = E_\\mathrm\{C\} \+/);
  const hw = 1.52, Eg = 1.42, mn = 0.067, mp = 0.5;
  const hole = (1 / (1 / mn + 1 / mp)) / mp * (hw - Eg);
  assert.ok(Math.abs(S.electronShare(hw, Eg, mn, mp) + hole - (hw - Eg)) < 1e-12);
});

// Strasser (2015), (3.4.43), p. 107, prints both exponents without their minus signs, a misprint: its text says the area
// decays as exp(−t/τL). The lab's pulse keeps both signs; its area falls as e^(−t/τ).
test("the Shockley–Haynes pulse is a decaying Gaussian, as (3.4.42) needs", () => {
  const e = lab("drift").equations.find(q => /3\.4\.43/.test(q.ref));
  assert.equal((e.tex.match(/\\exp\\!\\Big\(-/g) || []).length, 2);
  const prm = { N: 1, mu: 450, E: 10, D: 11.6, tau: 50e-6 };
  const area = t => { let s = 0; for (let x = -1; x <= 3; x += 1e-4) s += S.haynes(x, t, prm) * 1e-4; return s; };
  assert.ok(Math.abs(area(40e-6) / area(10e-6) - Math.exp(-30 / 50)) < 1e-6);
});
