// The integral theorems of vector analysis after Fritzsche (2003), Mathematik 3 für Elektrotechnik und IT, chapters 9
// and 10, each next to its section and printed page. Every integral is a sum on a fixed grid, so the two sides of a
// theorem are computed independently and their agreement is shown, never assumed. Fields are F(x, y, z) → [F1, F2, F3].

/** The fields the labs offer, each with what it shows. All are defined in space; most do not depend on z. */
export const FIELDS = {
  rotation: { name: "Rotation, F = (−y, x, 0)", f: (x, y) => [-y, x, 0] },
  source: { name: "Source, F = (x, y, 0)", f: (x, y) => [x, y, 0] },
  gradient: { name: "Gradient of f = x² − y², F = (2x, −2y, 0)", f: (x, y) => [2 * x, -2 * y, 0], potential: (x, y) => x * x - y * y },
  shear: { name: "Shear flow, F = (y, 0, 0)", f: (x, y) => [y, 0, 0] },
  // Fritzsche's example of a field that is curl-free but no gradient field on the whole plane (ch. 9 § 2, pp. 21–24).
  vortex: { name: "Vortex, F = (−y, x, 0)/(x² + y²)", f: (x, y) => { const r2 = x * x + y * y; return [-y / r2, x / r2, 0]; }, singular: [0, 0] },
};

/** ∫α F • dx = ∫ F(α(t)) • α'(t) dt (ch. 9 § 2, p. 19): the midpoint rule on n steps, with α' from the path itself. */
export function lineIntegral(F, path, n = 2000) {
  let sum = 0;
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n, a = path(t0), b = path(t1), m = path((t0 + t1) / 2), v = F(m[0], m[1], m[2] ?? 0);
    sum += v[0] * (b[0] - a[0]) + v[1] * (b[1] - a[1]) + v[2] * ((b[2] ?? 0) - (a[2] ?? 0));
  }
  return sum;
}

/** Paths t ∈ [0, 1] → point: a straight segment, and the arc of a circle through angles a0 to a1. */
export const segment = (p, q) => t => [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]), 0];
export const arc = (cx, cy, R, a0, a1) => t => { const a = a0 + t * (a1 - a0); return [cx + R * Math.cos(a), cy + R * Math.sin(a), 0]; };
/** A circle run once counter-clockwise, so the disc lies to its left: the positive orientation of ∂G (p. 61). */
export const circle = (cx, cy, R) => arc(cx, cy, R, 0, 2 * Math.PI);

/** The z-component of rot F at a point, g_x − f_y, by central differences: the integrand of Green's theorem (p. 61). */
export function curlZ(F, x, y, h = 1e-5) {
  return (F(x + h, y, 0)[1] - F(x - h, y, 0)[1]) / (2 * h) - (F(x, y + h, 0)[0] - F(x, y - h, 0)[0]) / (2 * h);
}

/** div F = ∂F1/∂x + ∂F2/∂y + ∂F3/∂z (ch. 10 § 4, p. 85), by central differences. */
export function divergence(F, x, y, z = 0, h = 1e-5) {
  return (F(x + h, y, z)[0] - F(x - h, y, z)[0]) / (2 * h) + (F(x, y + h, z)[1] - F(x, y - h, z)[1]) / (2 * h) +
    (F(x, y, z + h)[2] - F(x, y, z - h)[2]) / (2 * h);
}

/** ∫G (g_x − f_y) dx dy over the disc of radius R: the area side of Green's theorem (p. 61), midpoints of a polar grid. */
export function curlOverDisc(F, cx, cy, R, n = 120) {
  let sum = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < 2 * n; j++) {
    const r = (i + 0.5) * R / n, a = (j + 0.5) * Math.PI / n;
    sum += curlZ(F, cx + r * Math.cos(a), cy + r * Math.sin(a)) * r * (R / n) * (Math.PI / n);
  }
  return sum;
}

/** ∫∂Ω F • dO over the sphere of radius R round (cx, cy, 0): the surface side of Gauss's theorem (p. 85). */
export function fluxThroughSphere(F, cx, cy, R, n = 80) {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) * Math.PI / n;
    for (let j = 0; j < 2 * n; j++) {
      const ph = (j + 0.5) * Math.PI / n, nx = Math.sin(th) * Math.cos(ph), ny = Math.sin(th) * Math.sin(ph), nz = Math.cos(th);
      const v = F(cx + R * nx, cy + R * ny, R * nz);
      sum += (v[0] * nx + v[1] * ny + v[2] * nz) * R * R * Math.sin(th) * (Math.PI / n) ** 2;
    }
  }
  return sum;
}

/** ∫Ω div F dV over the ball of radius R round (cx, cy, 0): the volume side of Gauss's theorem (p. 85). */
export function divergenceOverBall(F, cx, cy, R, n = 30) {
  let sum = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < 2 * n; k++) {
    const r = (i + 0.5) * R / n, th = (j + 0.5) * Math.PI / n, ph = (k + 0.5) * Math.PI / n;
    const x = cx + r * Math.sin(th) * Math.cos(ph), y = cy + r * Math.sin(th) * Math.sin(ph), z = r * Math.cos(th);
    sum += divergence(F, x, y, z) * r * r * Math.sin(th) * (R / n) * (Math.PI / n) ** 2;
  }
  return sum;
}
