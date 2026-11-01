// Active power and the wattmeter (Schrüfer et al. 2012, section 2.1.4): the electrodynamic movement multiplies the
// currents of its two coils and its pointer settles on the mean, U·I·cos φ; its own current and voltage paths take
// power too, so where the voltage path is connected decides which power it shows.

/** Active, reactive and apparent power from RMS values and the phase angle (eqs. 2.56–2.58). */
export const powers = (U, I, phi) => ({ P: U * I * Math.cos(phi), Q: U * I * Math.sin(phi), S: U * I, pf: Math.cos(phi) });

/** The mean of u(t)·i(t) over one period, sampled: the second route to U·I·cos φ (eqs. 2.60–2.65). */
export function meanProduct(U, I, phi, n = 4000) {
  let s = 0;
  for (let k = 0; k < n; k++) {
    const wt = 2 * Math.PI * (k + 0.5) / n;
    s += Math.SQRT2 * U * Math.sin(wt + phi) * Math.SQRT2 * I * Math.sin(wt);
  }
  return s / n;
}

/** Instantaneous power over one period of the voltage, for the chart. */
export const instantaneous = (U, I, phi, x) => 2 * U * I * Math.sin(2 * Math.PI * x + phi) * Math.sin(2 * Math.PI * x);

// Complex numbers as [re, im], enough for one load and two meter paths.
const mul = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c];
const div = ([a, b], [c, d]) => { const n = c * c + d * d; return [(a * c + b * d) / n, (b * c - a * d) / n]; };
const add = ([a, b], [c, d]) => [a + c, b + d];
const re = (u, i) => u[0] * i[0] + u[1] * i[1]; // Re(u · conj(i))

/** A source Uq (RMS, phase 0) feeds a load Z = R + jX through the wattmeter's current path RI; its voltage path RU
 *  sits either at the load (Bild 2.26 a: it reads the load's voltage and the source's current) or at the source
 *  (Bild 2.26 b: the source's voltage and the load's current). Returns the true load power, the reading, and their
 *  difference, the meter's own consumption P_M of eq. 2.51. */
export function wattmeter({ Uq, R, X, RI, RU }, at) {
  const Z = [R, X], UqC = [Uq, 0];
  if (at === "load") {
    const Zp = div(mul(Z, [RU, 0]), add(Z, [RU, 0])); // load ‖ voltage path
    const Iq = div(UqC, add(Zp, [RI, 0])), UV = mul(Iq, Zp), IV = div(UV, Z);
    const true_ = re(UV, IV), reading = re(UV, Iq);
    return { trueP: true_, reading, error: reading - true_, expected: (UV[0] ** 2 + UV[1] ** 2) / RU };
  }
  const IV = div(UqC, add(Z, [RI, 0])), UV = mul(IV, Z);
  const true_ = re(UV, IV), reading = re(UqC, IV);
  return { trueP: true_, reading, error: reading - true_, expected: (IV[0] ** 2 + IV[1] ** 2) * RI };
}
