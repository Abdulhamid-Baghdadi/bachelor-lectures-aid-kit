// The seismic (absolute) vibration sensor (Schrüfer et al. 2012, section 7.4): a mass on a spring and damper inside a
// housing that shakes with the object; the pick-up reads the mass's motion xa relative to the housing.
//   c·xa + w·xa' + m·xa'' = −m·xe''   (eq. 7.108)

/** The undamped natural frequency ω0 = √(c/m) and the damping ratio D = w/(2√(c·m)), from the standard form
 *  xa + 2DT·xa' + T²·xa'' = −T²·xe'' with T = 1/ω0 (eq. 7.112). */
export const natural = (c, m) => Math.sqrt(c / m);
export const damping = (w, c, m) => w / (2 * Math.sqrt(c * m));

/** The amplitude response |xa/xe| at Ω = ω/ω0 (eq. 7.114): 1 far above ω0, where the sensor measures displacement,
 *  and Ω² far below, where it measures acceleration. */
export const gain = (W, D) => W * W / Math.sqrt((1 - W * W) ** 2 + 4 * D * D * W * W);

/** The phase of xa against xe in radians, of eq. 7.113's Ω²/(1 − Ω² + j2DΩ): 0 far below ω0, −π/2 at it, −π far
 *  above, where the mass stays put while the housing moves under it. */
export const phase = (W, D) => -Math.atan2(2 * D * W, 1 - W * W);

/** The second route: eq. 7.108 integrated by Runge–Kutta for a housing shaken as xe = sin(ωt), with ω0 = 1, until the
 *  start has died away; returns the amplitude of xa over the last periods. */
export function gainBySimulation(W, D, periods = 60) {
  const T = 2 * Math.PI / W, h = Math.min(T, 2 * Math.PI) / 400, end = periods * T;
  // State [xa, va]; xa'' = −xe'' − 2D·va − xa with xe'' = −W²·sin(Wt).
  const acc = (t, x, v) => W * W * Math.sin(W * t) - 2 * D * v - x;
  let t = 0, x = 0, v = 0, peak = 0;
  while (t < end) {
    const a1 = acc(t, x, v), k1 = [v, a1];
    const a2 = acc(t + h / 2, x + h / 2 * k1[0], v + h / 2 * k1[1]), k2 = [v + h / 2 * k1[1], a2];
    const a3 = acc(t + h / 2, x + h / 2 * k2[0], v + h / 2 * k2[1]), k3 = [v + h / 2 * k2[1], a3];
    const a4 = acc(t + h, x + h * k3[0], v + h * k3[1]), k4 = [v + h * k3[1], a4];
    x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    v += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    t += h;
    if (t > end - 5 * T) peak = Math.max(peak, Math.abs(x));
  }
  return peak;
}

/** The motions of housing and mass over time at steady state, for the chart (xe = sin ωt). */
export const motion = (W, D, t) => ({ xe: Math.sin(W * t), xa: gain(W, D) * Math.sin(W * t + phase(W, D)) });
