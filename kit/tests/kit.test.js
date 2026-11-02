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

// The tabs follow the WAI-ARIA Authoring Practices tabs pattern (W3C): arrows wrap, Home and End jump to the ends.
import { tabKey } from "../ui/kit.js";
test("tab keys move as the WAI-ARIA tabs pattern says", () => {
  assert.equal(tabKey("ArrowRight", 0, 3), 1); assert.equal(tabKey("ArrowRight", 2, 3), 0);
  assert.equal(tabKey("ArrowLeft", 0, 3), 2); assert.equal(tabKey("Home", 2, 3), 0); assert.equal(tabKey("End", 0, 3), 2);
  assert.equal(tabKey("a", 1, 3), null);
});

// Agreed with the user on 2 Nov 2026 after a trial on one lab: every lab opens in tabs (Explore, Equations, Practise),
// previous and next are plain text links, and the header is the title alone, its sources in the footer.
test("every lab uses the tabbed layout, plain steps and a quiet header", () => {
  for (const d of readdirSync(ROOT).filter(d => existsSync(join(ROOT, d, "src", "app.js")))) {
    const app = readFileSync(join(ROOT, d, "src", "app.js"), "utf8"), page = readFileSync(join(ROOT, d, "index.html"), "utf8");
    assert.match(app, /\["Explore", /, d); assert.match(app, /\["Equations", /, d); assert.match(app, /\["Practise", /, d);
    assert.match(app, /class: "steps plain"/, d);
    const header = page.slice(page.indexOf("<header"), page.indexOf("</header>")), footer = page.slice(page.indexOf("<footer"));
    assert.doesNotMatch(header, /After /, `${d}: sources belong in the footer`);
    assert.match(footer, /After /, `${d}: footer names the sources`);
  }
});
