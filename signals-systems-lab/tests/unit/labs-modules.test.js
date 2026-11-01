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

// Agreed with the user on 1 Nov 2026: a lab that shows both courses names them on a switch above its chart, SS1 for
// continuous time first, so the continuous half is not missed.
test("labs with both times put the SS1 | SS2 switch above the chart", () => {
  for (const id of ["timeaxis", "lti", "convolution", "series", "transform"]) {
    const src = readFileSync(new URL(`../../src/labs/${id}.js`, import.meta.url), "utf8");
    assert.match(src, /class: "course-switch" \}, choice\("Course", \[\["ct", "SS1, continuous[^"]*"\], \["dt", "SS2, discrete/, id);
    assert.ok(src.indexOf("course-switch") < src.indexOf('class: "stage"'), `${id}: switch before the chart`);
  }
});
