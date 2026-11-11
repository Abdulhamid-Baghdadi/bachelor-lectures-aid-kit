// Every practice answer in data/labs.json, the course's own (its source named beside it), agrees with the answer the
// core works out from the question's data. A typo in the data or a wrong law fails here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { solve, isRight } from "../../src/core/index.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));

test("labs.json names its format and version", () => {
  assert.equal(data.format, "vector-calculus-lab labs");
  assert.equal(data.version, 1);
});

test("every lab sits under exactly one chapter, and every chapter's labs exist", () => {
  const listed = data.lectures.flatMap(l => l.labs);
  assert.deepEqual([...listed].sort(), data.labs.map(l => l.id).sort());
  assert.equal(new Set(listed).size, listed.length);
  const families = new Set(data.families.map(f => f.id));
  for (const l of data.lectures) {
    assert.ok(l.number && l.pages && l.title && l.labs.length, `chapter ${l.number} is complete`);
    assert.ok(families.has(l.family), `chapter ${l.number}'s family ${l.family} is listed in families`);
  }
});

for (const lab of data.labs) {
  for (const q of lab.practice) {
    test(`${lab.id}: ${q.question}`, () => {
      assert.ok(q.source, "every question names its source");
      const worked = solve(q.compute);
      assert.ok(isRight(worked, q.answer, q.tolerance ?? 0.02), `the core works out ${worked}, labs.json says ${q.answer}`);
    });
  }
}

// Under every equation a list of what its symbols mean (asked for 11 Nov 2026): each entry names its symbol in LaTeX
// that typesets, and says what it means.
test("every equation and every main law has a symbol list whose entries typeset", async () => {
  const { typeset } = await import("../../../kit/ui/math.js");
  for (const lab of data.labs) {
    const lists = (lab.equations ?? []).map(e => [e.tex ?? e.eq, e.where]);
    if (lab.lawWhere) lists.push([lab.lawTex, lab.lawWhere]);
    else assert.ok((lab.equations ?? []).some(e => e.tex === lab.lawTex), `${lab.id}: the main law needs lawWhere or an equation that repeats it`);
    for (const [tex, where] of lists) {
      assert.ok(Array.isArray(where) && where.length, `${lab.id}: ${tex} has a "where" list`);
      for (const s of where) {
        assert.ok(s.tex && s.means, `${lab.id}: ${tex}: an entry has tex and means`);
        assert.equal(typeset(s.tex).error, "", `${lab.id}: ${s.tex} typesets`);
      }
    }
  }
});
