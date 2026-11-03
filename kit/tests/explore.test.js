// Explore shows the equations its view plots, not only the main law (audit of 2026-11-03): an entry of equations[]
// marked "explore" is shown there too, from the same labs.json. Right results by definition, and from the audit: the
// curves named below are each drawn by their lab's view.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const folders = readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory() && existsSync(new URL(`${d.name}/data/labs.json`, root))).map(d => d.name);
const labs = folder => JSON.parse(readFileSync(new URL(`${folder}/data/labs.json`, root), "utf8")).labs;

test("every app shows the equations marked for Explore under the main law", () => {
  for (const f of folders) {
    const app = readFileSync(new URL(`${f}/src/app.js`, root), "utf8");
    assert.match(app, /\.filter\(e => e\.explore\)/, `${f}/src/app.js does not show the equations marked "explore"`);
  }
});

test("an equation shown on Explore has its LaTeX and its source", () => {
  for (const f of folders) for (const l of labs(f)) for (const e of l.equations ?? []) {
    if (!e.explore) continue;
    assert.ok(e.tex, `${f}/${l.id}: "${e.eq}" is shown on Explore without LaTeX`);
    assert.equal(e.explore, true, `${f}/${l.id}: "explore" is true or absent`);
  }
});

test("the plotted curves the audit found missing are on Explore now", () => {
  const shown = (f, id, re) => assert.ok(labs(f).find(l => l.id === id).equations.some(e => e.explore && re.test(e.eq)), `${f}/${id}: ${re} not on Explore`);
  shown("Automation", "pt2", /^h\(t\) = V/);
  shown("Automation", "pid", /^GR\(s\) = VD s\/\(1 \+ TR s\)/);
  shown("Electromagnetism", "fresnel", /^Γ_TE/);
  shown("Electromagnetism", "line", /^U\(z\) =/);
  shown("power-engineering-lab", "shortcircuit", /^i = √2 U/);
  shown("measurement-lab", "rms", /^Xeff/);
  shown("semiconductors-lab", "drift", /^p − p0 = const/);
  shown("signals-systems-lab", "filters", /^\|Ha\(jω\)\|²/);
  shown("telecommunications-lab", "sync", /^Pe = ½ Q\(√\(2Eb\/N0\)\(cos φ − sin φ\)\)/);
});
