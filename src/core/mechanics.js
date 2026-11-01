// Mechanical systems after Kugi et al. (2015), chapter 2: a point's kinematics, momentum, energy, friction, the
// spring-mass-damper, angular momentum and the Euler–Lagrange equations of the ball on the beam. Pure: no page, no
// clock, no randomness.
import { rk4Step } from "./lti.js";

/** Example 2.1: a motor accelerates a mass with amax for t0…t1, coasts to t2, then brakes with amin so that it stops
 *  at xsoll. amin from (2.11), t3 from (2.10); t0 = 0, v0 = x0 = 0 as in the notes. */
export function mechProfile(amax, t1, t2, xsoll) {
  const amin = -(amax ** 2) * t1 ** 2 / (amax * t1 * (t1 - 2 * t2) + 2 * xsoll);
  const t3 = t2 - amax * t1 / amin;
  return { amin, t3 };
}
/** a, v, x at time t of that profile, piecewise as (2.5)–(2.7). */
export function mechProfileAt(amax, t1, t2, amin, t) {
  const v1 = amax * t1, x1 = amax * t1 ** 2 / 2;
  if (t <= 0) return { a: 0, v: 0, x: 0 };
  if (t <= t1) return { a: amax, v: amax * t, x: amax * t ** 2 / 2 };
  if (t <= t2) return { a: 0, v: v1, x: x1 + v1 * (t - t1) };
  const x2 = x1 + v1 * (t2 - t1);
  return { a: amin, v: v1 + amin * (t - t2), x: x2 + v1 * (t - t2) + amin * (t - t2) ** 2 / 2 };
}

/** Two masses meet on a line. Internal forces cancel (2.69)–(2.71), so the total momentum is kept; e is the
 *  coefficient of restitution (1 elastic, 0 plastic), the usual closure for a short impact. */
export function mechCollide(m1, v1, m2, v2, e) {
  const vs = (m1 * v1 + m2 * v2) / (m1 + m2);
  return { u1: vs - e * m2 * (v1 - v2) / (m1 + m2), u2: vs + e * m1 * (v1 - v2) / (m1 + m2), vs };
}
/** Kinetic energy of a point mass, (2.81). */
export const mechKinetic = (m, v) => m * v * v / 2;
/** Potential energy of a linear spring, (2.92). */
export const mechSpringEnergy = (c, s, s0 = 0) => c * (s - s0) ** 2 / 2;

/** The friction force on a sliding mass, as a characteristic: Coulomb (2.100) plus viscous (2.106). */
export const mechFriction = (v, muC, muV, m, g = 9.81) => muC * m * g * Math.sign(v) + muV * v;
/** A block pushed with fe from speed v0 on a rough floor, with the switch between sliding and sticking of
 *  (2.102)/(2.103); muH is the static coefficient (2.99). Returns times, speeds and positions. */
export function mechSlide({ m, v0, fe = 0, muH, muC, muV = 0, g = 9.81, T, n = 600 }) {
  const h = T / n, t = [0], v = [v0], x = [0];
  let V = v0, X = 0;
  for (let k = 0; k < n; k++) {
    const stuck = V === 0 && Math.abs(fe) <= muH * m * g;
    if (!stuck) {
      // Sliding by (2.101); if the speed would cross zero within the step, the block stops there (the sign changes).
      const dir = V !== 0 ? Math.sign(V) : Math.sign(fe);
      const acc = (fe - muC * m * g * dir - muV * V) / m;
      let Vn = V + h * acc;
      if (V !== 0 && Math.sign(Vn) !== Math.sign(V)) Vn = 0;
      X += h * (V + Vn) / 2; V = Vn;
    }
    t.push((k + 1) * h); v.push(V); x.push(X);
  }
  return { t, v, x };
}

/** The single spring-mass-damper m q̈ + d q̇ + c q = f, a one-mass case of (2.121): natural frequency, damping ratio
 *  and the steady amplitude for f = F sin(ωt). */
export function smdParams(m, d, c) {
  const w0 = Math.sqrt(c / m);
  return { w0, zeta: d / (2 * Math.sqrt(c * m)) };
}
export const smdAmplitude = (m, d, c, F, w) => F / Math.hypot(c - m * w * w, d * w);
/** q(t) from q0, q̇0 under f = F sin(ωt), by rk4. Also returns E = T + V by (2.122), (2.123). */
export function smdResponse({ m, d, c, F = 0, w = 0, q0 = 0, v0 = 0, T, n = 800 }) {
  const f = (t, [q, v]) => [v, (F * Math.sin(w * t) - d * v - c * q) / m];
  const h = T / n, t = [0], q = [q0], v = [v0];
  let x = [q0, v0];
  for (let k = 0; k < n; k++) { x = rk4Step(f, k * h, x, h); t.push((k + 1) * h); q.push(x[0]); v.push(x[1]); }
  return { t, q, v, E: q.map((qq, k) => mechKinetic(m, v[k]) + mechSpringEnergy(c, qq)) };
}

/** A point mass on a frictionless table, pulled to the origin by a spring of rate c and free length s0: a central
 *  motion (Example 2.13), so l = m (x ẏ − y ẋ) (2.131) stays constant and so does dA/dt = l/(2m) (2.136). */
export function mechCentral({ m, c, s0 = 0, x0, y0, vx0, vy0, T, n = 1000 }) {
  const f = (t, [x, y, vx, vy]) => {
    const r = Math.hypot(x, y), k = r > 0 ? -c * (r - s0) / (m * r) : 0;
    return [vx, vy, k * x, k * y];
  };
  const h = T / n, out = [[x0, y0, vx0, vy0]];
  for (let k = 0; k < n; k++) out.push(rk4Step(f, k * h, out[k], h));
  return { t: out.map((_, k) => k * h), s: out, l: out.map(([x, y, vx, vy]) => m * (x * vy - y * vx)) };
}

/** Example 2.20, ball on a beam: state [φ1, φ̇1, r, ṙ], torque τ on the beam. The two equations (2.214) are linear
 *  in the accelerations; they are solved here as a 2 × 2 system. Θ_K = 2/5 mK rK² by (2.207). */
export function ballBeamRhs({ mK, rK, thB, g = 9.81 }, tau) {
  const thK = 0.4 * mK * rK ** 2;
  return ([p, w, r, v]) => {
    const a11 = mK + thK / rK ** 2, a12 = -(thK / rK + mK * rK);
    const a22 = thK + thB + mK * (r * r + rK * rK);
    const b1 = mK * r * w * w - mK * g * Math.sin(p);
    const b2 = tau([p, w, r, v]) - 2 * mK * r * v * w - mK * g * (r * Math.cos(p) - rK * Math.sin(p));
    const D = a11 * a22 - a12 * a12;
    const rdd = (b1 * a22 - a12 * b2) / D, pdd = (a11 * b2 - a12 * b1) / D;
    return [w, pdd, v, rdd];
  };
}
/** Its energy T + V from (2.206), (2.209), (2.210), (2.211): constant when τ = 0. */
export function ballBeamEnergy({ mK, rK, thB, g = 9.81 }, [p, w, r, v]) {
  const thK = 0.4 * mK * rK ** 2;
  return mK / 2 * (r * r * w * w + (v - rK * w) ** 2) + thK / 2 * (w - v / rK) ** 2 + thB / 2 * w * w +
    mK * g * (r * Math.sin(p) + rK * Math.cos(p)) - mK * g * rK;
}
export function ballBeamRun(par, x0, tau, T, n) {
  const f = ballBeamRhs(par, tau), h = T / n, x = [x0];
  for (let k = 0; k < n; k++) x.push(rk4Step((t, s) => f(s), k * h, x[k], h));
  return { t: x.map((_, k) => k * h), x };
}

// The practice questions' laws, each named for its lab.
export const LAWS = {
  mechAmin: ({ amax, t1, t2, xsoll }) => mechProfile(amax, t1, t2, xsoll).amin,
  mechCollision: ({ m1, v1, m2, v2, e, ask }) => {
    const { u1, u2 } = mechCollide(m1, v1, m2, v2, e);
    return ask === "lost" ? mechKinetic(m1, v1) + mechKinetic(m2, v2) - mechKinetic(m1, u1) - mechKinetic(m2, u2) : u1;
  },
  mechSpringSpeed: ({ m, c, ds }) => Math.sqrt(2 * mechSpringEnergy(c, ds) / m),
  mechSlideDistance: ({ v0, muC, g }) => v0 * v0 / (2 * muC * g),
  mechNatural: ({ m, c, d, ask }) => (ask === "zeta" ? smdParams(m, d, c).zeta : smdParams(m, d, c).w0),
  mechArealVelocity: ({ m, l }) => l / (2 * m),
  mechBeamRestTorque: ({ mK, rR, g }) => g * mK * rR,
};
