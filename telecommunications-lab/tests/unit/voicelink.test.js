// The worked example: one telephone channel through the course, Goiser (2016). Each step against the slides' own
// numbers, the rest by definition or worked by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "../../src/core/index.js";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} is not ${b} ± ${tol}`);

test("8 kHz · 8 bit = 64 kbit/s (set 2, slide 60); the (7,4) code makes 112 kbit/s, QPSK 56 kBd, α = 0.5 needs 42 kHz", () => {
  const L = T.voiceLink({ S: 1e-13 });
  assert.equal(L.Rb, 64000); near(L.Rc, 112000, 1e-9); near(L.Rs, 56000, 1e-9); near(L.B, 42000, 1e-9);
  near(T.voiceLink({ S: 1e-13, code: false }).Rc, 64000, 1e-9);
});

test("the slides' receiver: f = 2.25, F = 3.5 dB (Rauschen, slide 64), Tsys ≈ 462 K (slide 65)", () => {
  const L = T.voiceLink({ S: 1e-13 });
  near(L.f, 2.25, 0.01); near(L.F, 3.5, 0.01); near(L.Tsys, 462, 3);
  // Both routes to the receiver's noise agree.
  near((L.f - 1) * T.T0, T.cascadeTemperature(T.RECEIVER), 1e-9);
});

test("Eb/N0 = S/(k Tsys Rb), and the code spends 4/7 of it per channel bit (by definition)", () => {
  const L = T.voiceLink({ S: 1e-13 });
  near(L.EbN0, 1e-13 / (1.38e-23 * L.Tsys * 64000), 1e-9);
  near(L.EcN0, L.EbN0 * 4 / 7, 1e-12);
  near(L.p, T.Q(Math.sqrt(2 * L.EcN0)), 0);
});

test("without bit errors the voice keeps its SNQR; at Pe = 1/(4(M² − 1)) it loses 3 dB (set 2, slide 50)", () => {
  const L = T.voiceLink({ S: 1e-9 });
  near(L.snrOut, L.snqr, 1e-6);
  near(T.dB(T.pcmOutput(8, 1 / (4 * (4 ** 8 - 1)), L.snqr)), T.dB(L.snqr) - 3.01, 0.01);
});

test("powerFor finds the power where the decoded error is 10⁻⁶, coded or not", () => {
  for (const code of [true, false]) {
    const P = T.powerFor(1e-6, { code });
    near(T.voiceLink({ code, S: 10 ** (P / 10) * 1e-3 }).Pe, 1e-6, 1e-8);
  }
});
