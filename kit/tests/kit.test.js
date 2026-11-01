// The practice field's placeholder says what the question expects, by definition of its unit; no sample value, which
// would suggest a scale the answer may not have.
import { test } from "node:test";
import assert from "node:assert/strict";
import { answerHint } from "../ui/kit.js";

test("the answer hint names the unit, or asks for a plain number", () => {
  assert.equal(answerHint("Hz"), "Number in Hz");
  assert.equal(answerHint("V"), "Number in V");
  assert.equal(answerHint(""), "A number");
  assert.equal(answerHint("1"), "A number");
  assert.equal(answerHint(undefined), "A number");
});
