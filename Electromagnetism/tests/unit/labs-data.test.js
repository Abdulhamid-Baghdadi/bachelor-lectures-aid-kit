// Every practice answer in data/labs.json, the course's own (its source named beside it), agrees with the answer the
// core works out from the question's data. A typo in the data or a wrong law fails here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { solve, isRight } from "../../src/core/index.js";
import { typeset } from "../../../kit/ui/math.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));

test("labs.json names its format and version", () => {
  assert.equal(data.format, "electrodynamics-lab labs");
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

// Every equation and main law carries its "where" list (brief: kit where-brief), each symbol with a meaning taken from
// the lecture notes and LaTeX that typesets. Right result by definition: a list entry without tex or means is incomplete.
test("every equation's symbols are listed, and every listed symbol typesets", () => {
  for (const lab of data.labs) {
    const eqs = (lab.equations ?? []).filter(e => e.tex);
    const lists = [...eqs.map(e => [e.tex, e.where]),
      ...(eqs.some(e => e.tex === lab.lawTex) || !lab.lawTex ? [] : [["main law", lab.lawWhere]])];
    for (const [where, list] of lists) {
      assert.ok(Array.isArray(list) && list.length, `${lab.id}: ${where} has a where list`);
      for (const s of list) {
        assert.ok(s.tex && s.means, `${lab.id}: an entry under ${where} has tex and means`);
        assert.equal(typeset(s.tex).error, "", `${lab.id}: ${s.tex} typesets`);
      }
    }
  }
});
