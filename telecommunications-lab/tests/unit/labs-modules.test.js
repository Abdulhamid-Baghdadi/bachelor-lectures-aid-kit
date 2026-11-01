// Every lab module has its words in data/labs.json and every entry there has a module, so no lab is silently dropped
// (the page only logs the mismatch). Imports the lab list without a DOM: modules touch the page only in mount().
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { labs } from "../../src/labs/index.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));

test("lab modules and labs.json name the same labs", () => {
  assert.deepEqual(labs.map(l => l.id).sort(), data.labs.map(l => l.id).sort());
});

test("every lab draws its card picture with a label", () => {
  for (const lab of labs) assert.match(lab.art(), /^<svg [^>]*aria-label="[^"]{15,}"/, lab.id);
});
