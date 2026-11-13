// The moving background's pure parts. Right results by definition: the same seed gives the same numbers (the user's
// rule: deterministic); motion only when allowed, unpaused and visible (WCAG 2.2.2 and 2.3.3); toolpaths start with a
// rapid and stay in their box; the field of a lone positive charge points away from it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { rng, shouldMove, toolpath, field, fourBar, crankRotates } from "../ui/backdrop.js";

// The linkage scene. Right results by definition: every link keeps its length at every crank angle (loop closure),
// and Grashof's condition s + l ≤ p + q with the crank shortest decides whether the crank turns all the way round.
test("a four-bar keeps every link's length all the way round", () => {
  const L = { d: 1, a: 0.3, b: 1.1, c: 0.8, ex: 0.6, ey: 0.4 };
  for (let k = 0; k < 72; k++) {
    const q = fourBar(L, k * Math.PI / 36);
    assert.ok(q, `assembles at step ${k}`);
    const dist = (p, r) => Math.hypot(p[0] - r[0], p[1] - r[1]);
    assert.ok(Math.abs(dist(q.A, [0, 0]) - 0.3) < 1e-9 && Math.abs(dist(q.A, q.B) - 1.1) < 1e-9 && Math.abs(dist(q.B, [1, 0]) - 0.8) < 1e-9);
    assert.ok(Math.abs(dist(q.A, q.P) - Math.hypot(0.6, 0.4)) < 1e-9, "the coupler point rides rigidly on the coupler");
  }
});

test("Grashof: a short crank turns round, a long one does not", () => {
  assert.equal(crankRotates({ d: 1, a: 0.3, b: 1.1, c: 0.8 }), true);
  assert.equal(crankRotates({ d: 1, a: 0.9, b: 0.5, c: 0.4 }), false);
  assert.equal(fourBar({ d: 1, a: 0.3, b: 0.2, c: 0.2 }, 0), null, "links too short to meet: no assembly");
});

test("the same seed gives the same sequence, another seed another one", () => {
  const a = rng(7), b = rng(7), c = rng(8);
  const sa = Array.from({ length: 5 }, a), sb = Array.from({ length: 5 }, b), sc = Array.from({ length: 5 }, c);
  assert.deepEqual(sa, sb); assert.notDeepEqual(sa, sc);
  assert.ok(sa.every(v => v >= 0 && v < 1));
});

test("the scene moves only when motion is allowed, not paused and the page is visible", () => {
  assert.equal(shouldMove({ reduced: false, paused: false, hidden: false }), true);
  assert.equal(shouldMove({ reduced: true, paused: false, hidden: false }), false);
  assert.equal(shouldMove({ reduced: false, paused: true, hidden: false }), false);
  assert.equal(shouldMove({ reduced: false, paused: false, hidden: true }), false);
});

test("every toolpath starts with a rapid and keeps its cutting inside its box", () => {
  const rand = rng(3), box = [100, 80, 200, 150];
  for (let k = 0; k < 30; k++) {
    const pts = toolpath(rand, box);
    assert.equal(pts[0][2], "rapid");
    for (const [x, y, kind] of pts.slice(1)) if (kind !== "rapid") {
      assert.ok(x >= 99.9 && x <= 300.1 && y >= 79.9 && y <= 230.1, `${kind} at ${x}, ${y}`);
    }
  }
});

test("a lone positive charge pushes outwards", () => {
  const [ex, ey] = field([{ x: 0, y: 0, q: 1 }], 50, 0);
  assert.ok(ex > 0 && Math.abs(ey) < 1e-12);
});
