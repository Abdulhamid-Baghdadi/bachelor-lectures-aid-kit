// Source coding and channel coding, after Goiser (2016), sets 5 (source coding) and 6 (channel coding). Slide numbers
// are the printed ones.
import { log2 } from "./maths.js";

/** Information content of a symbol of probability p (set 5, slide 30): −ld p bit. */
export const information = p => -log2(p);

/** Entropy of a memoryless source (set 5, slide 32): H = −Σ p ld p bit/symbol; zero probabilities add nothing. */
export const entropy = ps => ps.reduce((s, p) => (p > 0 ? s - p * log2(p) : s), 0);

/** Huffman's algorithm as the slides run it (set 5, slide 50): sort by falling probability, merge the last two, sort the
 *  sum back in, until one is left; the upper of each merged pair gets "0", the lower "1". Ties: a merged sum goes above
 *  equal probabilities, and equal symbols keep their order, so the code is the same at every run. */
export function huffman(ps) {
  let nodes = ps.map((p, i) => ({ p, symbols: [i] }));
  const codes = ps.map(() => "");
  if (ps.length === 1) return ["0"];
  while (nodes.length > 1) {
    nodes.sort((a, b) => b.p - a.p || (b.merged ? 1 : 0) - (a.merged ? 1 : 0));
    const lower = nodes.pop(), upper = nodes.pop();
    for (const i of upper.symbols) codes[i] = "0" + codes[i];
    for (const i of lower.symbols) codes[i] = "1" + codes[i];
    nodes.push({ p: upper.p + lower.p, symbols: [...upper.symbols, ...lower.symbols], merged: true });
  }
  return codes;
}

/** Mean code length L = Σ p l and efficiency η = H/L (set 5, slide 40). */
export const meanLength = (ps, codes) => ps.reduce((s, p, i) => s + p * codes[i].length, 0);
export const efficiency = (ps, codes) => entropy(ps) / meanLength(ps, codes);

/** Whether no codeword is the beginning of another (set 5, slides 45–47). */
export const prefixFree = codes => codes.every((a, i) => codes.every((b, j) => i === j || !b.startsWith(a)));

/** Decodes a bit string with a prefix-free code, symbol by symbol. */
export function decode(bitString, codes) {
  const out = [];
  let word = "";
  for (const b of bitString) {
    word += b;
    const i = codes.indexOf(word);
    if (i >= 0) { out.push(i); word = ""; }
  }
  return out;
}

const choose = (n, m) => { let c = 1; for (let k = 1; k <= m; k++) c = c * (n - m + k) / k; return c; };

/** Probability of exactly m bit errors in n bits (set 6, slides 40 and 59): C(n, m) p^m (1 − p)^(n − m). */
export const errorsExactly = (n, m, p) => choose(n, m) * p ** m * (1 - p) ** (n - m);

/** Probability that a word of n bits has more than t errors, the residual word error of a t-correcting code
 *  (set 6, slide 60): 1 − Σ_{m ≤ t} P(m). */
export function wordError(n, t, p) {
  let ok = 0;
  for (let m = 0; m <= t; m++) ok += errorsExactly(n, m, p);
  return 1 - ok;
}

/** The repetition code of odd length n decoded by majority (set 6, slides 39–42): wrong once (n + 1)/2 bits are. */
export const repetitionError = (n, p) => wordError(n, (n - 1) / 2, p);

/** The same counted: seeded uniform draws flip each bit with probability p, majority decides. The second route. */
export function repetitionCounted(n, p, u, words) {
  let wrong = 0;
  for (let w = 0; w < words; w++) {
    let flips = 0;
    for (let k = 0; k < n; k++) if (u() < p) flips++;
    if (flips > (n - 1) / 2) wrong++;
  }
  return wrong / words;
}

/** The [7,4] Hamming code as printed (set 6, slides 85–92): c = [I1 I2 I3 I4 P1 P2 P3], P1 = I1⊕I3⊕I4,
 *  P2 = I1⊕I2⊕I4, P3 = I1⊕I2⊕I3; G = [I4 | P], H = [Pᵀ | I3]. */
export const G = [
  [1, 0, 0, 0, 1, 1, 1],
  [0, 1, 0, 0, 0, 1, 1],
  [0, 0, 1, 0, 1, 0, 1],
  [0, 0, 0, 1, 1, 1, 0],
];
export const H = [
  [1, 0, 1, 1, 1, 0, 0],
  [1, 1, 0, 1, 0, 1, 0],
  [1, 1, 1, 0, 0, 0, 1],
];

/** Encodes four data bits: cᵀ = dᵀ G, mod 2 (slide 88). */
export const encode = d => G[0].map((_, j) => d.reduce((s, bit, i) => s ^ (bit & G[i][j]), 0));

/** The encoder by its parity equations (slide 85): the second route to encode. */
export const encodeByParity = ([I1, I2, I3, I4]) => [I1, I2, I3, I4, I1 ^ I3 ^ I4, I1 ^ I2 ^ I4, I1 ^ I2 ^ I3];

/** The syndrome s = H r, mod 2 (slide 89); zero for a codeword. */
export const syndrome = r => H.map(row => row.reduce((s, h, j) => s ^ (h & r[j]), 0));

/** Decodes: the syndrome names the column of H, so the bit, that a single error flipped (slides 96–99). Returns the
 *  corrected word, the data bits and the position corrected (1 … 7, or 0 for none). */
export function decodeHamming(r) {
  const s = syndrome(r), key = s.join("");
  const pos = key === "000" ? 0 : H[0].findIndex((_, j) => H.map(row => row[j]).join("") === key) + 1;
  const c = r.slice();
  if (pos) c[pos - 1] ^= 1;
  return { s, pos, c, d: c.slice(0, 4) };
}

/** The smallest Hamming distance between distinct codewords, found by listing all 16 (slide 94). */
export function minimumDistance() {
  const words = Array.from({ length: 16 }, (_, m) => encode([3, 2, 1, 0].map(k => (m >> k) & 1)));
  let d = Infinity;
  for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) d = Math.min(d, words[i].reduce((s, b, k) => s + (b ^ words[j][k]), 0));
  return d;
}
