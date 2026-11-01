// What the scientific audit of 1 November 2026 found wrong (AUDIT.md), each held so it cannot come back. Right results
// from the two texts, by page and equation: Prechtl (2010) for continuous time, Doblinger (2015) for discrete time.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as S from "../../src/core/signals.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const lab = id => data.labs.find(l => l.id === id);

test("every equation that cites a text names its equation number or page", () => {
  for (const l of data.labs) for (const e of l.equations) {
    if (e.ref) assert.match(e.ref, /\(\d+\.\d+\)|p\. \d+/, `${l.id}: "${e.eq}" cites ${e.ref} with no equation or page`);
  }
});

// Doblinger (2015) writes the normalised frequency θ: X(e^jθ) in (4.1), p. 60, and throughout chapters 6–8.
test("the discrete-time equations use Doblinger's θ, not Ω", () => {
  for (const l of data.labs) for (const e of l.equations) {
    if (e.ref.startsWith("SS2")) assert.doesNotMatch(e.tex, /\\Omega/, `${l.id}: ${e.eq}`);
  }
  for (const l of data.labs) assert.doesNotMatch(l.lawTex, /\\Omega/, `${l.id}'s law`);
});

// Doblinger (2015), (2.45)–(2.46), p. 20: x[n] = Σ c_k e^(j2πkn/N) with c_k = (1/N) Σ x[n] e^(−j2πkn/N); the 1/N sits
// in c_k, not in the synthesis.
test("the discrete Fourier series is written as Doblinger (2.45) and (2.46)", () => {
  const e = lab("series").equations.find(q => q.ref.startsWith("SS2"));
  assert.match(e.tex, /^x\[n\] = \\sum_\{k=0\}\^\{N-1\} c_k/);
  assert.match(e.tex, /c_k = \\frac\{1\}\{N\}/);
});

// Prechtl (2010), (6.19) and (6.22), p. 125: his Q is the whole reactive power, Q² = Qv² + D², so S² = P² + Q² holds
// with no D; the fundamental's share is Q1, (6.26), p. 127.
test("the harmonics lab writes S² = P² + Q1² + D², not P² + Q² + D²", () => {
  const h = lab("harmonics");
  assert.match(h.lawTex, /S\^2 = P\^2 \+ Q_1\^2 \+ D\^2/);
  for (const e of h.equations) assert.doesNotMatch(e.tex, /(^|[^\\])Q(?!_1|_\\mathrm)/, `bare Q in ${e.eq}`);
});

// Prechtl (2010), (6.28), p. 127: D = U √(I2² + I3² + …) = k_i S, with the harmonic content k_i of (6.13), p. 124,
// taken against the RMS value I, not against I1.
test("the harmonic content is Prechtl's k_i = √(I2² + I3² + …)/I", () => {
  const h = S.harmonics(230, [{ k: 1, I: 10, phi: 0 }, { k: 3, I: 3, phi: 0 }, { k: 5, I: 2, phi: 0 }]);
  assert.ok(Math.abs(h.k - Math.sqrt(13 / 113)) < 1e-12, `k_i is ${h.k}`);
});

// Prechtl (2010), (4.45), p. 105, defines the cross-correlation in section 4.6; section 3.4 has only the energy form.
test("the cross-correlation cites Prechtl section 4.6, (4.45)", () => {
  const e = lab("random").equations.find(q => q.note.startsWith("cross-correlation"));
  assert.match(e.ref, /§4\.6.*\(4\.45\)/);
});

// Doblinger (2015) has no section on random signals; the lab must not cite one.
test("the random-signals lab cites no Doblinger section for its noise laws", () => {
  assert.doesNotMatch(lab("random").lecture, /Doblinger (2015), section/);
});

// Doblinger (2015): y[n] = w[nM] is (8.26), p. 201, in section 8.2; section 2.2 (pp. 15–18) has only shift and reversal.
test("downsampling cites Doblinger (8.26), p. 201", () => {
  for (const id of ["timeaxis", "multirate"]) {
    const e = lab(id).equations.find(q => q.tex === "y[n] = x[Mn]");
    assert.match(e.ref, /\(8\.26\)/, id);
  }
});

// Doblinger (2015), (4.54), p. 77, (6.37), p. 138: the source's own symbols f_g and h_d.
test("the sampling theorem and the window method keep Doblinger's f_g and h_d", () => {
  assert.match(lab("sampling").lawTex, /f_\\mathrm\{s\} > 2 f_\\mathrm\{g\}/);
  assert.ok(lab("filters").equations.some(e => /h_\\mathrm\{d\}\[n\]\\, w\[n\]/.test(e.tex)));
});

// sus2ue (2016), Aufgabe 5.4, p. 22, Lösung p. 85: H(z) = v/(1 + v) · (z + 1)/(z − (1 − v)/(1 + v)), v = tan(π/10),
// so a first-order low-pass at fg = fs/10 by the bilinear transform has its pole at (1 − v)/(1 + v) and its zero at −1.
test("a first-order bilinear low-pass at fs/10 has the pole of sus2ue Lösung 5.4", () => {
  const v = Math.tan(Math.PI / 10), f = S.butterworth(1, 800, 8000);
  assert.ok(Math.abs(f.poles[0][0] - (1 - v) / (1 + v)) < 1e-12 && Math.abs(f.poles[0][1]) < 1e-12, `pole ${f.poles[0]}`);
  assert.deepEqual(f.zeros[0], [-1, 0]);
});
