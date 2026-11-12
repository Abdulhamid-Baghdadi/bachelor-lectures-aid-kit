// Memory: the program stack and C's dynamic memory after Klima and Selberherr (2010), chapters 18 and 20, and how five
// languages give memory back, each rule quoted from that language's own documentation (bibliography.json).

/** The stack of calls for factorial(n), recursive as in § 18.2 (pp. 258–259): each call puts a frame with its own n
 *  on the stack; each return takes it off. It stops at N = 0 with 0! = 1, as (18.2) and the code on p. 258 do, so 5!
 *  stacks six levels, N = 5 down to 0 (Fig. 18.2, p. 260). Returns the stack after every push and pop. */
export function factorialFrames(n) {
  const events = [], stack = [];
  const fact = k => {
    stack.push(k); events.push({ stack: [...stack], what: `call factorial(${k})` });
    const result = k === 0 ? 1 : k * fact(k - 1);
    stack.pop(); events.push({ stack: [...stack], what: `factorial(${k}) returns ${result}` });
    return result;
  };
  fact(n);
  return events;
}

/** A small heap of `size` bytes run as C's malloc, realloc and free describe (ch. 20, pp. 303–310). Blocks are
 *  rounded up to a multiple of 8 bytes, as many systems do (p. 303), placed first-fit. Pure: each call returns a new
 *  state; nothing is changed in place. A state is { size, blocks: [{ at, length, freed }], vars: { name: address } }. */
export const ROUND = 8;
export const emptyHeap = (size = 64) => ({ size, blocks: [], vars: {}, log: [] });

const rounded = n => Math.ceil(n / ROUND) * ROUND;
const live = s => s.blocks.filter(b => !b.freed);
const findFree = (s, length, except = null) => {
  const taken = live(s).filter(b => b !== except).sort((x, y) => x.at - y.at);
  let at = 0;
  for (const b of taken) { if (b.at - at >= length) return at; at = b.at + b.length; }
  return s.size - at >= length ? at : -1;
};
const note = (s, text, tone = "") => ({ ...s, log: [...s.log, { text, tone }] });

/** p = malloc(n): the block's address, or 0 when no block of that length is free (§ 20.5.1). Reassigning a variable
 *  that held the only address of a live block leaks that block (§ 20.5.11). */
export function malloc(s, name, n) {
  const length = rounded(n), at = findFree(s, length);
  let t = leakCheck(s, name);
  if (at < 0) return note({ ...t, vars: { ...t.vars, [name]: 0 } }, `${name} = malloc(${n}) returns 0: no free block of ${length} bytes`, "warn");
  // Addresses start at 1 in this model so that 0 stays the null pointer.
  return note({ ...t, blocks: [...t.blocks, { at, length, freed: false }], vars: { ...t.vars, [name]: at + 1 } },
    `${name} = malloc(${n}): ${length} bytes at address ${at + 1}${length !== n ? `, rounded up from ${n}` : ""}`);
}

/** free(p): gives the block back. free(0) does nothing (p. 308); a second free of the same block (§ 20.5.3) or a free
 *  with an address inside a block (§ 20.5.2) is an error. */
export function free(s, name) {
  const addr = s.vars[name];
  if (!addr) return note(s, `free(${name}): ${name} is 0, nothing happens`);
  // A freed block's address may be handed out again: the live block there counts first.
  const block = s.blocks.find(b => b.at + 1 === addr && !b.freed) ?? s.blocks.find(b => b.at + 1 === addr);
  if (!block) {
    const inside = s.blocks.some(b => !b.freed && addr > b.at + 1 && addr <= b.at + b.length);
    return note(s, `free(${name}): ${inside ? "an address inside a block, not its start" : "no block starts here"}: undefined behaviour`, "danger");
  }
  if (block.freed) return note(s, `free(${name}): this block was freed before: undefined behaviour, the program may crash`, "danger");
  return note({ ...s, blocks: s.blocks.map(b => b === block ? { ...b, freed: true } : b) }, `free(${name}): ${block.length} bytes at ${addr} given back`);
}

/** p = 0 after free, the book's convention (p. 308), so a second free is harmless. */
export const setNull = (s, name) => note(leakCheck(s, name), `${name} = 0`);

/** *p = …: writing through p. Through 0 or into a freed block it is an error (§ 20.5.7). */
export function use(s, name) {
  const addr = s.vars[name], block = s.blocks.find(b => b.at + 1 === addr && !b.freed);
  if (!addr) return note(s, `*${name} = …: ${name} is 0: the program crashes`, "danger");
  if (!block || block.freed) return note(s, `*${name} = …: the block at ${addr} was freed: undefined behaviour`, "danger");
  return note(s, `*${name} = …: writes into the block at ${addr}`);
}

/** p = realloc(p, n): grows the block in place when the bytes after it are free, otherwise moves it; any other pointer
 *  into the old block is then invalid (pp. 307–308). */
export function realloc(s, name, n) {
  const addr = s.vars[name], block = s.blocks.find(b => b.at + 1 === addr && !b.freed);
  if (!block) return malloc(s, name, n);
  const length = rounded(n), clearAfter = findFree({ ...s, blocks: live(s).filter(b => b !== block) }, length) === block.at;
  if (clearAfter) return note({ ...s, blocks: s.blocks.map(b => b === block ? { ...b, length } : b) }, `${name} = realloc(${name}, ${n}): grown in place to ${length} bytes`);
  const at = findFree(s, length);
  if (at < 0) return note(s, `${name} = realloc(${name}, ${n}) returns 0: the old block stays valid`, "warn");
  return note({ ...s, blocks: [...s.blocks.map(b => b === block ? { ...b, freed: true } : b), { at, length, freed: false }], vars: { ...s.vars, [name]: at + 1 } },
    `${name} = realloc(${name}, ${n}): moved from ${addr} to ${at + 1}; other pointers to ${addr} are now invalid`, "warn");
}

/** Blocks still allocated that no variable points to: memory leaked (§ 20.5.11). */
export const leaks = s => live(s).filter(b => !Object.values(s.vars).includes(b.at + 1));

function leakCheck(s, name) {
  const old = s.vars[name], block = old && s.blocks.find(b => b.at + 1 === old && !b.freed);
  const others = Object.entries(s.vars).some(([k, v]) => k !== name && v === old);
  const t = { ...s, vars: { ...s.vars, [name]: 0 } };
  return block && !others ? note(t, `the block at ${old} has lost its last pointer: a memory leak`, "warn") : t;
}

/** How five languages give back an object's memory, each rule from that language's documentation. */
export const LANGUAGES = {
  c: { name: "C", rule: "manual: the programmer calls free; nothing is given back by itself", source: "Klima and Selberherr (2010), § 20.4, p. 308; cppreference, free" },
  cpp: { name: "C++", rule: "ownership: a unique_ptr destroys its object when it is destroyed itself or reset", source: "cppreference, std::unique_ptr" },
  java: { name: "Java", rule: "tracing: a garbage collector reclaims objects; they are never explicitly deallocated", source: "JVM Specification SE 21, § 2.5.3" },
  python: { name: "Python (CPython)", rule: "reference counting, collecting most objects as soon as they become unreachable; a cycle detector for the rest", source: "Python Language Reference, § 3.1" },
  js: { name: "JavaScript", rule: "mark-and-sweep from the roots: unreachable objects are freed, cycles included", source: "MDN, Memory management" },
};

/** The scenarios the comparison offers, in the order a student meets them. */
export const SCENARIOS = {
  drop: "The last reference to an object is dropped",
  scope: "The function holding the only reference returns",
  cycle: "Two objects refer to each other; the outside references are dropped",
};

/** When each language gives the object back in each scenario: "now", "later" (at a collection the program does not
 *  control), "never" (leaked unless the programmer acts) or "n/a" (the scenario cannot be written that way). */
export function fate(lang, scenario) {
  const table = {
    c: { drop: ["never", "only free gives it back; without it the block leaks"], scope: ["never", "the pointer was on the stack and is gone; the block on the heap leaks (§ 20.5.13)"], cycle: ["never", "nothing is freed by itself, cycle or not"] },
    cpp: { drop: ["now", "reset() or reassigning the unique_ptr destroys the object at once"], scope: ["now", "the unique_ptr is destroyed at the end of its scope, and the object with it"], cycle: ["n/a", "a unique_ptr has a single owner; a cycle of owners is not covered by the sources used here"] },
    java: { drop: ["later", "unreachable, it is reclaimed when the collector runs"], scope: ["later", "the frame's local variable is gone; the object waits for the collector"], cycle: ["later", "a tracing collector finds both unreachable and reclaims them"] },
    python: { drop: ["now", "its reference count reaches 0 and CPython frees it at once"], scope: ["now", "the local name goes, the count reaches 0, the object goes"], cycle: ["later", "each still counts the other: only the cycle detector frees them, when it runs"] },
    js: { drop: ["later", "unreachable from the roots, it is freed at the next mark-and-sweep"], scope: ["later", "unreachable once the function returns; freed at the next collection"], cycle: ["later", "mark-and-sweep does not see the cycle as reachable: both are freed"] },
  };
  const [when, why] = table[lang][scenario];
  return { when, why };
}
