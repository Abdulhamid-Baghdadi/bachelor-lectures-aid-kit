// Four controllers on one plant: the drive of Abbildung 4.2 (Kugi 2015, pp. 94–97). The PI controller by loop shaping
// (5.1), the compensating controller of the notes' own design (5.3), the state controller with a full Luenberger
// observer (8.1, 8.3.2) and the PI state controller (8.2) with the same observer. The notes design the first two in
// continuous time and the last two for the sampled plant; here all four run on the same continuous model (4.3), with the
// same reference step, load step and actuator range, so that their responses can be compared side by side.
import { polyMul, freq, matVec, rk4Step, zoh, inv, eye, matAdd } from "./lti.js";
import { loopPiShape, loopStateGain, loopObserverGain, loopPrefilter, loopPairZ } from "./loops.js";
import { DRIVE, driveModel, driveTransfer, driveFactors, driveCompensator, driveRun } from "./drive.js";
import { cAbs, cExp } from "../../../kit/core/index.js";

/** The PI controller of 5.1 for the drive: (5.14)–(5.17) at ωC and Φ. Below the resonance the integrator alone already
 *  leaves more phase than Φ asks for (the lift (5.16) is negative), so TI = 0 and R = VI/s with |L(IωC)| = 1. */
export function comparePI(G, wc, phi) {
  const d = loopPiShape(G, wc, phi);
  if (d.lift > 0) return { ...d, kind: d.possible ? "PI" : "none" };
  const L1 = { num: G.num, den: polyMul(G.den, [1, 0]) }, VI = 1 / cAbs(freq(L1, wc));
  return { ...d, TI: 0, VI, possible: true, kind: "I", R: { num: [VI], den: [1, 0] } };
}

/** The poles of the sampled loop: a pair at ω0 with damping ξ, a real pole at −3ω0, the fast electrical pole left where
 *  it is (s = −1321.66), and for the PI state controller a fifth at −2ω0; each s mapped to z = e^(sTa) (Satz 6.3). */
function poles(w0, xi, Ta, fast, integral) {
  const z = s => cExp([s * Ta, 0]);
  return [...loopPairZ(w0, xi, Ta), z(-3 * w0), z(-fast), ...(integral ? [z(-2 * w0)] : [])];
}

/** The state controller (8.4) with g from (8.39), or the PI state controller (8.51) with kP from (8.58) and kxᵀ =
 *  k1ᵀ + kP cᵀ (8.54a), for the drive sampled with Ta by the zero-order hold; and a full observer (8.66b) on ω2 whose
 *  poles are those of the controller, speed times faster. */
export function compareState({ p = DRIVE, w0, xi = 0.7, Ta, integral = false, speed = 5 }) {
  const P = driveModel(p), { Phi, Gamma } = zoh(P.A, P.b, Ta), c = P.c, n = 4, fastPole = driveFactors(driveTransfer(p)).corners[1];
  const obs = loopObserverGain(Phi, c, poles(speed * w0, xi, Ta, fastPole, false));
  if (!integral) {
    const k = loopStateGain(Phi, Gamma, poles(w0, xi, Ta, fastPole, false));
    return { kind: "state", Phi, Gamma, c, k, g: loopPrefilter(Phi, Gamma, c, 0, k), obs, Ta };
  }
  const PhiI = [...Phi.map(r => [...r, 0]), [...c.map(v => -v), 1]], GammaI = [...Gamma, 0];
  const k12 = loopStateGain(PhiI, GammaI, poles(w0, xi, Ta, fastPole, true));
  const kP = 1 / c.reduce((s, ci, i) => s + ci * matVec(inv(matAdd(eye(n), Phi, -1)), Gamma)[i], 0);
  return { kind: "PIstate", Phi, Gamma, c, k1: k12.slice(0, n), kI: k12[n], kP, kx: k12.slice(0, n).map((v, i) => v + kP * c[i]), obs, Ta };
}

/** The drive with a sampled state controller and observer, run like driveRun: reference r at t = 0, load ML at tML,
 *  the duty cycle held between samples and clipped to [−1, 1] when limit is set. The observer sees ω2 only and knows
 *  nothing of the load, so it changes the error a load leaves; measured = true feeds back the true state instead, the
 *  case (8.50) is written for. */
export function compareStateRun({ p = DRIVE, D, limit = false, r = 1, ML = 0, tML = Infinity, T, n, measured = false }) {
  const P = driveModel(p), clip = u => (limit ? Math.max(-1, Math.min(1, u)) : u), h = T / n;
  const out = { t: [], w: [], u: [] };
  let x = [0, 0, 0, 0], xh = [0, 0, 0, 0], xI = 0, u = 0, next = 0;
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  for (let k = 0; k <= n; k++) {
    const t = k * h;
    if (t >= next - 1e-12) {
      const y = x[3], used = measured ? x : xh;
      u = clip(D.kind === "state" ? dot(D.k, used) + D.g * r : dot(D.kx, used) + D.kI * xI + D.kP * (r - y));
      if (D.kind === "PIstate") xI += r - y;
      const yh = dot(D.c, xh);
      xh = matVec(D.Phi, xh).map((v, j) => v + D.Gamma[j] * u + D.obs[j] * (yh - y));
      next += D.Ta;
    }
    out.t.push(t); out.w.push(x[3]); out.u.push(u);
    const m = t >= tML ? ML : 0;
    x = rk4Step((_, z) => matVec(P.A, z).map((v, i) => v + P.b[i] * u + P.e[i] * m), t, x, h);
  }
  return out;
}

/** The four designs at their default settings: PI at ωC (Φ = 65°), the compensator at the notes' ωC = 3 rad/s,
 *  Φ = 65°, the state controllers with the pair at ω0, ξ = 0.7, sampled with Ta. */
export function compareDesigns({ wcPI = 0.2, w0 = 3, Ta = 0.02, p = DRIVE } = {}) {
  const G = driveTransfer(p);
  return { G, pi: comparePI(G, wcPI, 65), comp: driveCompensator(G, 3, 65), state: compareState({ p, w0, Ta }), pistate: compareState({ p, w0, Ta, integral: true }) };
}

/** One run of each design for the same test, on the same time grid. */
export function compareRuns(D, { r = 100, ML = 0, tML = Infinity, limit = false, T, n }) {
  const opts = { r, ML, tML, limit, T, n };
  return {
    pi: driveRun({ R: D.pi.R, ...opts }), comp: driveRun({ R: D.comp.R, ...opts }),
    state: compareStateRun({ D: D.state, ...opts }), pistate: compareStateRun({ D: D.pistate, ...opts }),
  };
}

/** The figures of merit of one response to the reference step r (up to tEnd): overshoot ü in %, the time to settle
 *  within ±2 % of r, the largest |uT,n|; and, if a load step came at tML, the deepest dip below r after it and the
 *  error left at the end. */
export function compareMetrics(run, r, tML = Infinity) {
  const head = run.t.map((t, i) => [t, i]).filter(([t]) => t < tML).map(([, i]) => i);
  const w = head.map(i => run.w[i] / r), t = head.map(i => run.t[i]);
  const out = w.findLastIndex(v => Math.abs(v - 1) > 0.02);
  const after = run.t.map((tt, i) => [tt, i]).filter(([tt]) => tt >= tML).map(([, i]) => run.w[i] / r);
  return {
    overshoot: Math.max(0, (Math.max(...w) - 1) * 100),
    settle: out < 0 ? 0 : out === w.length - 1 ? Infinity : t[out + 1],
    peakU: Math.max(...run.u.map(Math.abs)),
    dip: after.length ? (1 - Math.min(...after)) * 100 : NaN,
    endError: after.length ? (1 - after.at(-1)) * 100 : (1 - w.at(-1)) * 100,
  };
}

export const LAWS = {
  compareKP: ({ Ta }) => compareState({ w0: 3, Ta, integral: true }).kP,
};
