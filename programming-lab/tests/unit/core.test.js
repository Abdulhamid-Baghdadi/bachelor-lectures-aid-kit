// The algorithms and memory models against the book's worked examples (Klima and Selberherr 2010) and, where it
// gives none, against values worked by hand or against the language documentation quoted in src/core/memory.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../../src/core/index.js";

test("quicksort: one pass of Positioniere turns 6 4 7 9 1 5 2 8 3 into 2 1 3 9 4 5 6 8 7 (p. 262)", () => {
  assert.deepEqual(C.positionOnce([6, 4, 7, 9, 1, 5, 2, 8, 3]), [2, 1, 3, 9, 4, 5, 6, 8, 7]);
});

test("bubble sort: the first pass over 6 4 8 3 2 gives 4 6 3 2 8 (p. 172); both sorts sort", () => {
  assert.deepEqual(C.bubbleSort([6, 4, 8, 3, 2])[3].a, [4, 6, 3, 2, 8]);
  for (const n of [1, 2, 9, 30]) {
    const a = C.seeded(n, 9), want = [...a].sort((x, y) => x - y);
    assert.deepEqual(C.quickSort(a).at(-1).a, want, `quicksort, n = ${n}`);
    assert.deepEqual((C.bubbleSort(a).at(-1)?.a) ?? a, want, `bubble sort, n = ${n}`);
  }
});

test("binary search follows § 13.7.2: l = m + 1 or r = m − 1, −1 when not found; never more than ⌊log₂ N⌋ + 1 looks", () => {
  assert.deepEqual(C.binarySearch([1, 3, 5, 7, 9, 11, 13], 11), { steps: [{ l: 0, m: 3, r: 6 }, { l: 4, m: 5, r: 6 }], found: 5 });
  assert.equal(C.binarySearch([1, 3, 5], 4).found, -1);
  const a = Array.from({ length: 1000 }, (_, i) => 2 * i);
  for (const v of [0, 998, 1998, 7]) assert.ok(C.binarySearch(a, v).steps.length <= 10);
  assert.equal(C.sequentialSearch([4, 8, 15], 15).probes.length, 3);
});

test("heap (§ 19.5): every insert and removal keeps the heap condition; removals come out largest first", () => {
  let h = [];
  for (const k of C.seeded(25, 4)) { h = C.heapInsert(h, k).heap; assert.ok(C.isHeap(h)); }
  const out = [];
  while (h.length) { const r = C.heapRemoveMax(h); h = r.heap; out.push(r.max); assert.ok(C.isHeap(h)); }
  assert.deepEqual(out, [...out].sort((x, y) => y - x));
});

test("stack (§ 18.2): factorial(5) stacks five frames and ends with an empty stack", () => {
  const e = C.factorialFrames(5);
  assert.equal(Math.max(...e.map(x => x.stack.length)), 5);
  assert.deepEqual(e.at(-1).stack, []);
  assert.match(e.at(-1).what, /returns 120/);
});

test("malloc model (ch. 20): rounding to 8 (p. 303), free(0) does nothing and double free is an error (p. 308)", () => {
  let s = C.malloc(C.emptyHeap(64), "p", 10);
  assert.equal(s.blocks[0].length, 16);
  s = C.free(s, "p"); s = C.free(s, "p");
  assert.equal(s.log.at(-1).tone, "danger");
  s = C.setNull(s, "p"); s = C.free(s, "p");
  assert.match(s.log.at(-1).text, /nothing happens/);
});

test("malloc model: overwriting the last pointer leaks (§ 20.5.11); a freed address handed out again is not a double free", () => {
  let s = C.malloc(C.emptyHeap(64), "p", 8);
  s = C.malloc(s, "p", 8);
  assert.equal(C.leaks(s).length, 1);
  let t = C.malloc(C.emptyHeap(64), "p", 8); t = C.free(t, "p"); t = C.malloc(t, "p", 8); t = C.free(t, "p");
  assert.notEqual(t.log.at(-1).tone, "danger", t.log.at(-1).text);
});

test("malloc model: realloc moves a block when the bytes after it are taken, and other pointers go stale (p. 308)", () => {
  let s = C.malloc(C.emptyHeap(64), "p", 8);
  s = { ...s, vars: { ...s.vars, q: s.vars.p } };
  s = C.malloc(s, "r", 8);
  s = C.realloc(s, "p", 24);
  assert.notEqual(s.vars.p, s.vars.q);
  s = C.use(s, "q");
  assert.equal(s.log.at(-1).tone, "danger");
});

test("languages: the rules as their sources state them", () => {
  assert.equal(C.fate("c", "drop").when, "never");          // free is the only way back: Klima and Selberherr, § 20.4
  assert.equal(C.fate("cpp", "scope").when, "now");         // cppreference: disposed of when the unique_ptr is destroyed
  assert.equal(C.fate("java", "drop").when, "later");       // JVMS § 2.5.3: reclaimed by a garbage collector
  assert.equal(C.fate("python", "drop").when, "now");       // Language Reference § 3.1: most objects as soon as unreachable
  assert.equal(C.fate("python", "cycle").when, "later");    // § 3.1: delayed detection of cyclically linked garbage
  assert.equal(C.fate("js", "cycle").when, "later");        // MDN: with mark-and-sweep, cycles are no longer a problem
});
