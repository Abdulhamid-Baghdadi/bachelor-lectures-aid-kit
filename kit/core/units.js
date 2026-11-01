// Values with SI prefixes, as students read them off a component or write them in an answer.

const PREFIXES = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];

/** 4700, "Ω" → "4.7 kΩ"; three significant figures, trailing zeros dropped. */
export function si(value, unit, digits = 3) {
  if (!Number.isFinite(value)) return value > 0 ? `∞ ${unit}` : `— ${unit}`;
  if (value === 0) return `0 ${unit}`;
  const [scale, prefix] = PREFIXES.find(([s]) => Math.abs(value) >= s * 0.9995) ?? PREFIXES.at(-1);
  return `${Number((value / scale).toPrecision(digits))} ${prefix}${unit}`.trimEnd();
}

/** "4k7", "4.7k", "10 µ", "220n" → a number; null when it cannot be read. */
export function parseSi(text) {
  const t = String(text).trim().replace(",", ".").replace(/\s+/g, "").replace(/^[−–]/, "-")
    .replace(/[ΩFVAWsu]$/i, m => m === "u" ? "µ" : "");
  const m = t.match(/^(-?)(\d*\.?\d+)([GMkmµunp]?)(\d*)$/);
  if (!m) return null;
  const scale = { G: 1e9, M: 1e6, k: 1e3, "": 1, m: 1e-3, µ: 1e-6, u: 1e-6, n: 1e-9, p: 1e-12 }[m[3]];
  // "4k7": the prefix stands where the decimal point would.
  const number = m[4] ? Number(`${m[2]}.${m[4]}`) : Number(m[2]);
  return (m[1] ? -1 : 1) * number * scale;
}

/** The E12 series, the resistor values one buys: the nearest standard value to r. */
const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
export function e12(r, direction = "nearest") {
  const decade = 10 ** Math.floor(Math.log10(r));
  const values = [...E12.map(v => v * decade), 10 * decade];
  if (direction === "up") return values.find(v => v >= r * (1 - 1e-9));
  return values.reduce((best, v) => Math.abs(Math.log(v / r)) < Math.abs(Math.log(best / r)) ? v : best);
}
