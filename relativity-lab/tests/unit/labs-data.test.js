// Every practice answer in data/labs.json, the course's own (its source named beside it), agrees with the answer the
// core works out from the question's data. A typo in the data or a wrong law fails here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { solve, isRight } from "../../src/core/index.js";
import { typeset } from "../../../kit/ui/math.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));

test("labs.json names its format and version", () => {
  assert.equal(data.format, "relativity-lab labs");
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
// that typesets as the equation's does, says what it means, and every main law has a list of its own or its equation's.
test("every symbol list entry has tex and means, and its tex typesets", () => {
  const lists = data.labs.flatMap(l => [["law of " + l.id, l.lawWhere], ...(l.equations ?? []).map((e, i) => [`${l.id} equation ${i + 1}`, e.where])])
    .filter(([, list]) => list !== undefined);
  assert.ok(lists.length > 0, "some equations have symbol lists");
  for (const [where, list] of lists) {
    assert.ok(Array.isArray(list) && list.length, `${where}: a non-empty list`);
    for (const s of list) {
      assert.ok(typeof s.tex === "string" && s.tex.trim(), `${where}: an entry without tex`);
      assert.ok(typeof s.means === "string" && s.means.trim(), `${where}: ${s.tex} says nothing`);
      assert.equal(typeset(s.tex).error, "", `${where}: ${s.tex} does not typeset`);
    }
  }
  for (const l of data.labs.filter(l => l.lawTex)) {
    const list = l.lawWhere ?? (l.equations ?? []).find(e => e.tex === l.lawTex)?.where;
    assert.ok(list?.length, `${l.id}: the main law has a symbol list`);
  }
});
