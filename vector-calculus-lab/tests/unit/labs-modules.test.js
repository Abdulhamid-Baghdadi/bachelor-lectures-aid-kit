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

// The p and q dots of the line-integral lab once landed in the corner: plane.js's scaled() is an SVG points string,
// so the dots must take their coordinates from px(). By definition of the drawing: the origin is the centre.
import { px, scaled } from "../../src/labs/plane.js";
test("plane: px gives numbers, the origin at the centre; scaled is the points string", () => {
  assert.deepEqual(px([0, 0]), [230, 150]); assert.deepEqual(px([1, 1]), [330, 50]);
  assert.equal(scaled([1, 1]), "330.0,50.0");
  assert.doesNotMatch(readFileSync(new URL("../../src/labs/paths.js", import.meta.url), "utf8"), /scaled\(p\)\[/);
});

// A readout that rounds to zero once said −0.000 (the curl over a disc in the vortex): by definition it reads 0.000.
import { fixed3 } from "../../src/labs/plane.js";
test("readouts: −0.0001 reads 0.000, 2π reads 6.283", () => {
  assert.equal(fixed3(-1e-4), "0.000"); assert.equal(fixed3(-0), "0.000"); assert.equal(fixed3(2 * Math.PI), "6.283");
});
