// A practice question's answer, worked from its data with the core, so the answer in labs.json is checked, never
// trusted.
import * as A from "./algorithms.js";
import * as M from "./memory.js";
import * as S from "./structures.js";

const LAWS = {
  binaryLooks: q => A.binarySearch(q.a, q.value).steps.length,
  pivotIndex: q => A.positionOnce(q.a).indexOf(q.a.at(-1)),
  bubbleFirstPassLast: q => A.bubbleSort(q.a)[q.a.length - 2].a.at(-1),
  heapRootAfter: q => q.keys.reduce((h, k) => A.heapInsert(h, k).heap, [])[0],
  maxFrames: q => Math.max(...M.factorialFrames(q.n).map(e => e.stack.length)),
  roundedBytes: q => Math.ceil(q.n / M.ROUND) * M.ROUND,
  listPlaceOf: q => { const r = S.listInsert(S.listFrom(q.text), q.element, q.position); return S.listOrder(r.list).indexOf(r.node) + 1; },
  bstSearchLooks: q => S.bstSearch(S.bstFrom([...q.keys]), q.key).path.length,
  completeHeight: q => S.completeHeight(q.n),
  hashUnsuccessful: q => S.hashCosts(q.words.reduce((t, w) => S.hashInsert(t, w).table, S.emptyHash(q.n))).unsuccessful,
  hashSuccessful: q => S.hashCosts(q.words.reduce((t, w) => S.hashInsert(t, w).table, S.emptyHash(q.n))).successful,
  pointerAddress: q => q.base + q.k * q.size,
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
