// The searching and sorting algorithms of Klima and Selberherr (2010), Programmieren in C, written to record every
// step, so a lab can replay them. Each follows the book's own description, cited by section and printed page.

/** A sorted, seeded set of distinct numbers to search and an unsorted one to sort. Deterministic: same n, same data. */
export function seeded(n, seed = 7) {
  let s = seed >>> 0;
  const next = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  return Array.from({ length: n }, () => Math.floor(next() * 99) + 1);
}

/** Sequential search (§ 13.7.1, p. 173): look at each element in turn. Returns the indices looked at and the hit. */
export function sequentialSearch(a, value) {
  const probes = [];
  for (let i = 0; i < a.length; i++) { probes.push(i); if (a[i] === value) return { probes, found: i }; }
  return { probes, found: -1 };
}

/** Binary search (§ 13.7.2, p. 174): l = 0, r = N − 1; m = (l + r)/2 rounded down; l = m + 1 or r = m − 1 while
 *  r ≥ l. Returns each step's l, m, r and the hit, −1 for "not found". */
export function binarySearch(a, value) {
  const steps = [];
  let l = 0, r = a.length - 1;
  while (r >= l) {
    const m = Math.floor((l + r) / 2);
    steps.push({ l, m, r });
    if (a[m] === value) return { steps, found: m };
    if (a[m] < value) l = m + 1; else r = m - 1;
  }
  return { steps, found: -1 };
}

/** Bubble sort (§ 13.6.2, p. 172): compare neighbours, swap when the left one is larger; stop when a pass makes no
 *  swap. Returns the array after every comparison, with the pair compared and whether it swapped. */
export function bubbleSort(input) {
  const a = [...input], frames = [];
  let swapped = true, compares = 0, swaps = 0;
  for (let pass = 0; swapped; pass++) {
    swapped = false;
    for (let i = 0; i < a.length - 1 - pass; i++) {
      compares++;
      const swap = a[i] > a[i + 1];
      if (swap) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; swapped = true; swaps++; }
      frames.push({ a: [...a], i, j: i + 1, swap, compares, swaps });
    }
  }
  return frames;
}

/** Quicksort (§ 18.3.2, pp. 261–263): the rightmost element is put in place by Positioniere, scanning from the left
 *  for a larger and from the right for a smaller element and swapping them; then both sides are sorted recursively.
 *  Returns the array after every swap or comparison, with the bounds and recursion depth. */
export function quickSort(input) {
  const a = [...input], frames = [];
  let compares = 0, swaps = 0;
  const frame = (l, r, i, j, depth, swap) => frames.push({ a: [...a], l, r, i, j, depth, swap, compares, swaps });
  const position = (l, r, depth) => {
    const pivot = a[r];
    let i = l, j = r - 1;
    for (;;) {
      while (i < r && (compares++, a[i] <= pivot)) i++;
      while (j > i && (compares++, a[j] >= pivot)) j--;
      if (i >= j) break;
      [a[i], a[j]] = [a[j], a[i]]; swaps++; frame(l, r, i, j, depth, true); i++; j--;
    }
    if (i !== r) { [a[i], a[r]] = [a[r], a[i]]; swaps++; }
    frame(l, r, i, r, depth, true);
    return i;
  };
  const sort = (l, r, depth) => {
    if (r > l) { const pos = position(l, r, depth); sort(l, pos - 1, depth + 1); sort(pos + 1, r, depth + 1); }
  };
  sort(0, a.length - 1, 0);
  frames.push({ a: [...a], l: 0, r: a.length - 1, i: -1, j: -1, depth: 0, swap: false, compares, swaps });
  return frames;
}

/** One pass of Positioniere on the whole array, for the book's worked example (p. 262). */
export function positionOnce(input) {
  const frames = quickSort(input);
  return frames.find(f => f.depth === 0 && f.j === input.length - 1).a;
}

/** A heap (§ 19.5, pp. 287–291): a complete binary tree kept in an array, each key at least as large as its
 *  children's; children of i at 2i + 1 and 2i + 2. Insert puts the new key last and repairs upwards (UpHeap). */
export function heapInsert(heap, key) {
  const h = [...heap, key], moves = [];
  let i = h.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (h[p] >= h[i]) break;
    [h[p], h[i]] = [h[i], h[p]]; moves.push([i, p]); i = p;
  }
  return { heap: h, moves };
}

/** Remove the largest key: move the last one to the root and repair downwards (DownHeap, p. 289). */
export function heapRemoveMax(heap) {
  if (!heap.length) return { heap: [], max: null, moves: [] };
  const h = [...heap], max = h[0], last = h.pop(), moves = [];
  if (h.length) {
    h[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let k = i;
      if (l < h.length && h[l] > h[k]) k = l;
      if (r < h.length && h[r] > h[k]) k = r;
      if (k === i) break;
      [h[i], h[k]] = [h[k], h[i]]; moves.push([i, k]); i = k;
    }
  }
  return { heap: h, max, moves };
}

/** True when every key is at least as large as its children's: the heap condition (p. 287). */
export const isHeap = h => h.every((v, i) => i === 0 || h[Math.floor((i - 1) / 2)] >= v);
