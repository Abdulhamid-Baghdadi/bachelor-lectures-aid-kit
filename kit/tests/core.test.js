// The kit core every lab shares. Right results by definition (the tolerance rule) or hand-checked (the SI prefixes).
import { test } from "node:test";
import assert from "node:assert/strict";
import { si, parseSi, isRight, C, cMul, cAbs } from "../core/index.js";

test("an answer within 2 % is right; one outside is not; tolerance 0 asks for the exact value", () => {
  assert.equal(isRight(101.9, 100), true);
  assert.equal(isRight(102.1, 100), false);
  assert.equal(isRight(-98.5, -100), true);
  assert.equal(isRight(3, 3, 0), true);
  assert.equal(isRight(3.0001, 3, 0), false);
});

test("SI prefixes: 4700 Ω reads 4.7 kΩ and back", () => {
  assert.equal(si(4700, "Ω"), "4.7 kΩ");
  assert.equal(parseSi("4.7k"), 4700);
});

test("complex numbers: |(3 + 4j)(1 + 0j)| = 5", () => {
  assert.equal(cAbs(cMul(C(3, 4), C(1, 0))), 5);
});
