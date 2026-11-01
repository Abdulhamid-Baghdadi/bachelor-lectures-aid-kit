// Special relativity after Einstein (1905), Zur Elektrodynamik bewegter Körper, Annalen der Physik 17, 891–921; pages
// are the journal's printed ones. Einstein writes V for the speed of light and β for the factor now called γ; here c0
// and γ. The frame k moves at v along the x axis of the resting frame K; positions in m, times in s, one dimension of
// space where the y and z axes do not change.
/** The speed of light and the field constants in SI, as Prechtl (2010) uses them: μ0 = 4π × 10⁻⁷ Vs/(Am),
 *  ε0 = 1/(μ0 c0²). */
export const C0 = 299792458;
export const MU0 = 4e-7 * Math.PI;
export const EPS0 = 1 / (MU0 * C0 * C0);

/** γ = 1/√(1 − (v/c)²), Einstein's β (p. 902). Only below the speed of light: "für Überlichtgeschwindigkeiten werden
 *  unsere Überlegungen sinnlos" (p. 903). */
export function lorentzFactor(v) {
  const b = v / C0;
  if (!(Math.abs(b) < 1)) throw new RangeError(`Speed ${v} m/s is not below the speed of light; pick |v| < ${C0} m/s.`);
  return 1 / Math.sqrt(1 - b * b);
}

/** An event (t, x) of K seen from k: τ = γ(t − v x/c²), ξ = γ(x − v t) (p. 902). */
export function boost({ t, x }, v) {
  const g = lorentzFactor(v);
  return { t: g * (t - v * x / (C0 * C0)), x: g * (x - v * t) };
}

/** (c t)² − x², the same in every frame: Einstein shows it for the light sphere x² + y² + z² = V² t² (p. 901); for
 *  any event it follows from the transformation (derived). */
export const interval = ({ t, x }) => (C0 * t) ** 2 - x * x;

/** A clock resting in k reads τ = t √(1 − (v/c)²) when t passes in K (p. 904). */
export const clockTime = (t, v) => t / lorentzFactor(v);

/** A rod of rest length L along the motion measures L √(1 − (v/c)²) in K (p. 903). */
export const rodLength = (L, v) => L / lorentzFactor(v);

/** Two speeds along the same line: U = (v + w)/(1 + v w/c²) (p. 906). */
export const addVelocities = (v, w) => (v + w) / (1 + v * w / (C0 * C0));

/** The fields seen from k, moving at v along x (p. 909). Einstein's Gaussian units, X Y Z for E and L M N for the
 *  magnetic force, carried into SI with B = N/c (derived): E'x = Ex, E'y = γ(Ey − vBz), E'z = γ(Ez + vBy),
 *  B'x = Bx, B'y = γ(By + vEz/c²), B'z = γ(Bz − vEy/c²). E in V/m, B in T. */
export function boostFields({ E, B }, v) {
  const g = lorentzFactor(v), k = v / (C0 * C0);
  return {
    E: [E[0], g * (E[1] - v * B[2]), g * (E[2] + v * B[1])],
    B: [B[0], g * (B[1] + k * E[2]), g * (B[2] - k * E[1])],
  };
}

/** The fields at (x, y) of a charge q passing the origin at v along x, at that moment. Worked as the reader would:
 *  the charge rests in k, where its field is Coulomb's, Prechtl (2010) (3.13), at ξ = γx (p. 902 at t = 0); then
 *  back to K with the field transformation for −v (derived). */
export function movingCharge(q, v, x, y) {
  const g = lorentzFactor(v), xi = g * x, r3 = Math.hypot(xi, y) ** 3, k = q / (4 * Math.PI * EPS0 * r3);
  return boostFields({ E: [k * xi, k * y, 0], B: [0, 0, 0] }, -v);
}
