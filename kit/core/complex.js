// Complex numbers as [re, im] pairs, enough for phasors on a transmission line.

export const C = (re, im = 0) => [re, im];
export const cAdd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const cMul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export function cDiv(a, b) {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
}
export const cAbs = a => Math.hypot(a[0], a[1]);
/** The principal square root: real part ≥ 0, so γ = α + jβ has α ≥ 0 and waves decay forward. */
export function cSqrt(a) {
  const r = cAbs(a);
  const re = Math.sqrt((r + a[0]) / 2), im = Math.sqrt(Math.max(0, (r - a[0]) / 2));
  return [re, a[1] < 0 ? -im : im];
}
export const cExp = a => [Math.exp(a[0]) * Math.cos(a[1]), Math.exp(a[0]) * Math.sin(a[1])];
export const cCosh = a => [Math.cosh(a[0]) * Math.cos(a[1]), Math.sinh(a[0]) * Math.sin(a[1])];
export const cSinh = a => [Math.sinh(a[0]) * Math.cos(a[1]), Math.cosh(a[0]) * Math.sin(a[1])];
