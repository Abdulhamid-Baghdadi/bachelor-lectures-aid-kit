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

// Every lab's header links back to the start page, which says where the material comes from and that it may be out of
// date (by definition: the user's request of 1 Nov 2026).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
const ROOT = join(import.meta.dirname, "..", "..");

test("every lab links back to the start page, and the start page carries the disclaimer", () => {
  const labs = readdirSync(ROOT).filter(d => existsSync(join(ROOT, d, "index.html")));
  assert.ok(labs.length >= 8, `found ${labs.length} labs`);
  for (const d of labs) assert.match(readFileSync(join(ROOT, d, "index.html"), "utf8"), /<a href="\.\.\/">← Aid kit home<\/a>/, d);
  const home = readFileSync(join(ROOT, "index.html"), "utf8");
  assert.match(home, /2014 to 2019/); assert.match(home, /may have changed/);
});
