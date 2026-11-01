// The typesetting helper, without a DOM. Right results by definition: Temml's MathML for a known input (an upright e
// is <mi mathvariant="normal">), and a parse error reported, not thrown.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { typeset, scrolls } from "../ui/math.js";

test("LaTeX becomes MathML with its source as annotation; display sets it as a block", () => {
  const inline = typeset(String.raw`\mathrm{e}^{\mathrm{j}\omega t}`);
  assert.equal(inline.error, "");
  assert.match(inline.markup, /^<math/);
  assert.match(inline.markup, /<mi mathvariant="normal">e<\/mi>/);
  assert.match(inline.markup, /<annotation encoding="application\/x-tex">/);
  assert.doesNotMatch(inline.markup, /display="block"/);
  assert.match(typeset("x", { display: true }).markup, /display="block"/);
});

test("a typo is reported with why, never thrown or hidden", () => {
  const unclosed = typeset(String.raw`\frac{a`);
  assert.equal(unclosed.markup, "");
  assert.match(unclosed.error, /end of input/);
  // Temml alone would show this as red text and report nothing.
  assert.match(typeset(String.raw`\foo x`).error, /^Unsupported function name: \\foo at position 1:$/);
  assert.equal(typeset("").error, "no LaTeX given");
  assert.equal(typeset(undefined).error, "no LaTeX given");
});

test("the notation of kit/MATH.md typesets: hat, upright d, sinc, units with a thin space", () => {
  for (const tex of [String.raw`\hat{B}`, String.raw`\int x(t)\,\mathrm{d}t`, String.raw`\operatorname{sinc}(x)`,
                     String.raw`f_\mathrm{s} = 8\,\mathrm{kHz}`, String.raw`\vec{E}`, String.raw`\mathbf{E}`])
    assert.equal(typeset(tex).error, "", tex);
});

// Every lab's LaTeX, wherever it has been written yet: a typo in any labs.json fails here, not only on the page.
test("every tex and lawTex in the labs' labs.json typesets", () => {
  const root = new URL("../../", import.meta.url);
  const labs = readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(new URL(`${d.name}/data/labs.json`, root))).map(d => d.name);
  assert.ok(labs.length >= 8, `found the labs: ${labs.join(", ")}`);
  for (const lab of labs) {
    const data = JSON.parse(readFileSync(new URL(`${lab}/data/labs.json`, root), "utf8"));
    for (const w of data.labs) for (const tex of [w.lawTex, ...(w.equations ?? []).map(e => e.tex)])
      if (tex !== undefined) assert.equal(typeset(tex, { display: true }).error, "", `${lab}, ${w.id}: ${tex}`);
  }
});

test("a display box is a Tab stop exactly while its equation is wider than it (WCAG 2.1.1)", () => {
  // Right results by definition: scrolling happens only when the content is wider than the box; one pixel is
  // rounding, not scrolling.
  assert.equal(scrolls(640, 320), true);
  assert.equal(scrolls(320, 320), false);
  assert.equal(scrolls(321, 320), false);
  assert.equal(scrolls(322, 320), true);
});
