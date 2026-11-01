// The corrections of the scientific audit (AUDIT.md, 1 Nov 2026), each against its right result and that result's
// source. Each failed before its fix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as T from "../../src/core/index.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const lab = id => data.labs.find(l => l.id === id);
const source = file => readFileSync(new URL(`../../src/labs/${file}`, import.meta.url), "utf8");

/** The Es/N0 in dB at which a scheme's symbol error probability falls to p, by bisection. */
function needed(kind, M, p) {
  let lo = 0, hi = 60;
  for (let k = 0; k < 100; k++) { const m = (lo + hi) / 2; if (T.symbolError(kind, M, T.fromDB(m)) > p) lo = m; else hi = m; }
  return lo;
}

test("the constellation hint's gap between 64-QAM and QPSK is the one the slides' formulas give", () => {
  // Right result: worked by hand from Goiser (2016), set 8, slide 18 (QPSK) and slide 37 (M-QAM), at Pe = 10⁻⁵:
  // 12.9 dB and 26.4 dB, 13.5 dB apart. The hint said "about 12 dB", which no slide says.
  const gap = needed("qam", 64, 1e-5) - needed("psk", 4, 1e-5);
  const stated = Number(source("constellation.js").match(/about ([\d.]+) dB more than QPSK/)[1]);
  assert.ok(Math.abs(stated - gap) <= 0.2, `the hint says ${stated} dB, the formulas give ${gap.toFixed(2)} dB`);
});

test("M-PSK: the slide prints Q(·) without the factor 2; the seeded count backs 2 Q(·), and the note says so", () => {
  // Right result: Goiser (2016), set 8, slide 24, read in the rendered slide: Pe ≈ Q([sin²(π/M) · 2Es/N0]^½), while its
  // own assumption (s1 is confused with its two neighbours s2 and s8) gives twice that. A seeded count of 8-PSK at
  // 14 dB decides: it is within 10 % of 2 Q(·) and about twice the printed form.
  const EsN0 = T.fromDB(14), noise = T.gaussian(81, 400000);
  const counted = T.receive(T.constellation("psk", 8), EsN0, T.uniform(8), noise, 200000).ser;
  const printed = T.Q(Math.sqrt(2 * EsN0) * Math.sin(Math.PI / 8));
  assert.ok(Math.abs(counted / (2 * printed) - 1) < 0.1, `count ${counted} against 2Q = ${2 * printed}`);
  assert.ok(Math.abs(counted / printed - 2) < 0.2, `count ${counted} against the printed Q = ${printed}`);
  const note = lab("constellation").equations.find(e => e.ref === "set 8, slides 23–24").note;
  assert.match(note, /without the factor 2/);
});

test("the eye note says what set 3, slides 66–68 say: noise and ISI shrink A_V, jitter moves the zero crossings", () => {
  // Right result: Goiser (2016), set 3, slide 66: AWGN lowers A_V; ISI is the spread of the amplitudes at the decision
  // instant; jitter moves the zero crossings. The note had ISI closing the eye from the sides.
  const note = lab("nyquist").equations.find(e => e.ref === "set 3, slides 66–68").note;
  assert.doesNotMatch(note, /ISI and jitter from the sides/);
  assert.match(note, /jitter/);
});

test("slide references point at the slide that has the formula or the number", () => {
  // Right results: Goiser (2016), set 6, slide 60 has P(m) = B[m,n] Pb^m (1 − Pb)^(n − m) (slide 59 only names it);
  // set 5, slide 56 has H = 2.55, L = 2.61, η = 97.7 % (slide 41 only poses the problem).
  assert.ok(lab("repetition").equations.some(e => e.ref === "set 6, slides 40, 60"));
  assert.match(source("huffman.js"), /slides 41 and 56\) gives H = 2\.55/);
});
