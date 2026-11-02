// The drive of Abbildung 4.2 (Kugi 2015, pp. 94–97), the notes' running example, carried from its model to a
// digital controller: the four states (4.3) with the parameters (4.5), the transfer function (4.6a), the compensating
// controller of the worked design in section 5.3 (5.38)–(5.42), its prefilter (5.44), and, beyond the notes' example,
// the same controller turned into R(z) by the Tustin transformation (6.90).
import { bode, logspace, freq, polyMul, polyAdd, roots, charpoly, matVec, rk4Step, realise } from "./lti.js";
import { cAbs } from "../../../kit/core/index.js";
const rad = d => d * Math.PI / 180;
import { loopTustin } from "./loops.js";

/** The parameters (4.5): RA [Ω], LA [H], kA [N·m/A], θG and θL [N·m·s²], cT [N·m], dT [N·m·s], uZW [V]. */
export const DRIVE = { RA: 20, LA: 15e-3, kA: 0.9, thG: 3.5e-3, thL: 6.3e-3, cT: 0.02, dT: 0, uZW: 200 };

/** The state model (4.3) in x = (iA, ω1, φ1 − φ2, ω2), with the duty cycle uT,n as input through uA = uZW·uT,n (4.2),
 *  the load torque ML as disturbance and ω2 as output. */
export function driveModel({ RA, LA, kA, thG, thL, cT, dT, uZW } = DRIVE) {
  return {
    A: [[-RA / LA, -kA / LA, 0, 0], [kA / thG, -dT / thG, -cT / thG, dT / thG], [0, 1, 0, -1], [0, dT / thL, cT / thL, -dT / thL]],
    b: [uZW / LA, 0, 0, 0], e: [0, 0, 0, -1 / thL], c: [0, 0, 0, 1],
  };
}
/** G_uT,n,ω2(s) = uZW·kA(s dT + cT)/n(s) (4.4b), n(s) the characteristic polynomial of (4.3) scaled as in (4.4d). */
export function driveTransfer(p = DRIVE) {
  const scale = p.LA * p.thG * p.thL;
  return { num: [p.uZW * p.kA * p.dT, p.uZW * p.kA * p.cT].map(v => v / scale), den: charpoly(driveModel(p).A) };
}
/** The normalised form of (4.6a): the static gain, the real corners and the lightly damped pair (ω0, ξ). */
export function driveFactors(G) {
  const r = roots(G.den), real = r.filter(([, im]) => Math.abs(im) < 1e-9).map(([re]) => -re).sort((x, y) => x - y);
  const [re, im] = r.find(([, i]) => i > 1e-9), w0 = Math.hypot(re, im);
  return { V: G.num.at(-1) / G.den.at(-1), corners: real, w0, xi: -re / w0 };
}

/** The compensating controller (5.38) R(s) = VR(1 + 2ξ s/ω0 + s²/ω0²)/(s(1 + sTR)²): its numerator cancels the pair,
 *  the pole at s = 0 makes the loop of type 1, TR lowers the phase of L1 (5.39) at ωC to Φ − 180° (5.40), and VR puts
 *  |L(IωC)| = 1 (5.41). */
export function driveCompensator(G, wc, phi) {
  const { w0, xi } = driveFactors(G), pair = [1 / w0 ** 2, 2 * xi / w0, 1];
  const L1 = { num: polyMul(G.num, pair), den: polyMul(G.den, [1, 0]) };
  const argL1 = bode(L1, logspace(wc * 1e-3, wc, 400)).at(-1).phase;
  const drop = argL1 - (phi - 180);
  const TR = Math.tan(rad(drop / 2)) / wc;
  const VR = 1 / (cAbs(freq(L1, wc)) / (1 + (wc * TR) ** 2));
  return { argL1, drop, TR, VR, possible: drop >= 0 && drop < 180, R: { num: pair.map(v => v * VR), den: polyMul([1, 0], polyMul([TR, 1], [TR, 1])) } };
}
/** The prefilter (5.44) F(s) = 1/(1 + 2·0.9 s/5 + s²/5²) in front of the loop, to spare the actuator. */
export const DRIVE_PREFILTER = { num: [1], den: [1 / 25, 2 * 0.9 / 5, 1] };

/** The poles of the closed loop: the roots of nR nG + zR zG. */
export const driveLoopPoles = (R, G) => roots(polyAdd(polyMul(R.den, G.den), polyMul(R.num, G.num)));

/** A transfer function as a difference equation y_k = (Σ b_i e_{k−i} − Σ_{i≥1} a_i y_{k−i})/a_0, both in z, highest
 *  power first and of the same length, as loopTustin gives them. */
function filterZ({ num, den }) {
  const e = new Array(den.length).fill(0), y = new Array(den.length).fill(0);
  return v => {
    e.unshift(v); e.pop();
    const out = (num.reduce((s, b, i) => s + b * e[i], 0) - den.slice(1).reduce((s, a, i) => s + a * y[i], 0)) / den[0];
    y.unshift(out); y.pop();
    return out;
  };
}

/** The drive in its loop for a reference step r at t = 0 and a load step ML at tML: ω2(t) and the duty cycle uT,n(t)
 *  on n + 1 times from 0 to T. With Ta the controller (and prefilter) run as R(z), F(z) by Tustin (6.90), sampled every
 *  Ta and held; without, as R(s), F(s). limit clips uT,n to [−1, 1], the actuator's range (4.1), Abbildung 4.11. */
export function driveRun({ p = DRIVE, R, F = null, Ta = 0, limit = false, r = 1, ML = 0, tML = Infinity, T, n }) {
  const P = driveModel(p), clip = u => (limit ? Math.max(-1, Math.min(1, u)) : u);
  const out = { t: [], w: [], u: [] }, h = T / n;
  let x = [0, 0, 0, 0];
  if (Ta > 0) {
    const Rz = filterZ(loopTustin(R, Ta)), Fz = F ? filterZ(loopTustin(F, Ta)) : v => v;
    let u = 0, next = 0;
    for (let k = 0; k <= n; k++) {
      const t = k * h;
      if (t >= next - 1e-12) { u = clip(Rz(Fz(r) - x[3])); next += Ta; }
      out.t.push(t); out.w.push(x[3]); out.u.push(u);
      const m = t >= tML ? ML : 0;
      x = rk4Step((_, z) => matVec(P.A, z).map((v, i) => v + P.b[i] * u + P.e[i] * m), t, x, h);
    }
    return out;
  }
  const Rc = realise(R), Fc = F ? realise(F) : null, nR = Rc.A.length, nF = Fc ? Fc.A.length : 0;
  const parts = z => {
    const xp = z.slice(0, 4), xr = z.slice(4, 4 + nR), xf = z.slice(4 + nR);
    const ref = Fc ? Fc.c.reduce((s, c, i) => s + c * xf[i], 0) + Fc.d * r : r, e = ref - xp[3];
    return { xp, xr, xf, e, u: clip(Rc.c.reduce((s, c, i) => s + c * xr[i], 0) + Rc.d * e) };
  };
  const f = (t, z) => {
    const { xp, xr, xf, e, u } = parts(z), m = t >= tML ? ML : 0;
    return [...matVec(P.A, xp).map((v, i) => v + P.b[i] * u + P.e[i] * m), ...matVec(Rc.A, xr).map((v, i) => v + Rc.b[i] * e),
      ...(Fc ? matVec(Fc.A, xf).map((v, i) => v + Fc.b[i] * r) : [])];
  };
  let z = new Array(4 + nR + nF).fill(0);
  for (let k = 0; k <= n; k++) {
    const t = k * h;
    out.t.push(t); out.w.push(z[3]); out.u.push(parts(z).u);
    z = rk4Step(f, t, z, h);
  }
  return out;
}

const factor = (key, i) => q => { const d = driveFactors(driveTransfer(q.p)); return i === undefined ? d[key] : d[key][i]; };
export const LAWS = {
  driveGain: factor("V"),
  driveCorner: q => factor("corners", q.i)(q),
  drivePairW0: factor("w0"),
  drivePairXi: factor("xi"),
  driveTR: ({ wc, phi }) => driveCompensator(driveTransfer(), wc, phi).TR,
  driveVR: ({ wc, phi }) => driveCompensator(driveTransfer(), wc, phi).VR,
};
