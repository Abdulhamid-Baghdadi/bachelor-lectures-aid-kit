// Every equation and law of this lab is written in LaTeX beside its plain text (kit/MATH.md), so the page typesets all
// of it. Right result by definition: no equation without tex. Whether each typesets: kit/tests/math.test.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));

test("every law and equation has its LaTeX", () => {
  for (const w of data.labs) {
    assert.ok(w.lawTex, `${w.id} has no lawTex`);
    for (const e of w.equations) assert.ok(e.tex, `${w.id}: no tex for ${e.eq}`);
  }
});
