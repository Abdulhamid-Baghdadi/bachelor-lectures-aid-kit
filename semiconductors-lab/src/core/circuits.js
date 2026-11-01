// The circuits after Zimmermann (2010), Skriptum Schaltungstechnik, TU Wien: section, printed page (PDF page − 6) and
// equation number beside each, read in its text layer (an OCR, so read with care) on 1 Nov 2026. Volts, amperes, ohms,
// seconds. Pure: the only randomness is a seeded generator.
import { Q, K } from "./semiconductors.js";

// --- The common-emitter stage (section 1.1.1, pp. 1–2) ---------------------------------------------------------------

/** Small-signal gain with emitter feedback, A = −S RC / (1 + S RE), S = IC/UT (1.4); RE = 0 gives −S RC (1.1). */
export const ceGain = (IC, RC, RE, UT) => -(IC / UT) * RC / (1 + (IC / UT) * RE);

/** The large-signal transfer: the base drive ue = UT ln(IC/Is) + IC RE (emitter current ≈ collector current), solved
 *  for IC by bisection on ln IC; the output ua = U0 − IC RC, floored at UCE,sat ≈ 0. */
export function ceTransfer(ue, { Is, RC, RE, U0, UT }) {
  let lo = -60, hi = Math.log(10); // ln of IC [A]
  for (let k = 0; k < 200; k++) {
    const m = (lo + hi) / 2, I = Math.exp(m);
    if (UT * Math.log(I / Is) + I * RE > ue) hi = m; else lo = m;
  }
  const IC = Math.exp((lo + hi) / 2);
  return { IC, ua: Math.max(U0 - IC * RC, IC * RE) };
}

// --- The current source (section 1.2, pp. 4–7) -----------------------------------------------------------------------

/** Output resistance of a transistor current source with emitter feedback: ra = rCE (1 + β RE / (RE + rBE)), with
 *  rCE = UA/Ia (1.13), S = Ia/UT, rBE = β/S (1.18); its limits are (1.19): rCE(1 + S RE) and β rCE. */
export function sourceR(Ia, { UA, beta, RE, UT }) {
  const rCE = UA / Ia, rBE = beta * UT / Ia;
  return rCE * (1 + beta * RE / (RE + rBE));
}

/** Second route: the small-signal circuit solved node by node. Base at signal ground, a test voltage vt on the
 *  collector; unknown the emitter voltage ve. ib = −ve/rBE, ic = β ib + (vt − ve)/rCE, and ib + ic = ve/RE. */
export function sourceRNodal(Ia, { UA, beta, RE, UT }) {
  const rCE = UA / Ia, rBE = beta * UT / Ia, vt = 1;
  // ve (1/RE + (1 + β)/rBE + 1/rCE) = vt/rCE
  const ve = (vt / rCE) / (1 / RE + (1 + beta) / rBE + 1 / rCE);
  const ic = beta * (-ve / rBE) + (vt - ve) / rCE;
  return vt / ic;
}

// --- The push-pull output stage (section 2.2, pp. 16–25) -------------------------------------------------------------

/** Class B efficiency η = (π/4) Ûa/UB (2.19), at most 78.5 % (2.20). */
export const classBEfficiency = (ua, UB) => Math.PI / 4 * ua / UB;
/** Class B powers for a sine of amplitude Ûa into RL: PL = Ûa²/(2RL) (2.17), PS = 2 UB Ûa/(π RL) (2.18), and both
 *  transistors' loss PT = PS − PL (2.21). */
export function classBPowers(ua, UB, RL) {
  const PL = ua * ua / (2 * RL), PS = 2 * UB * ua / (Math.PI * RL);
  return { PL, PS, PT: PS - PL };
}

/** Second route: PS and PL by integrating the supply and load power over one period of the sine (N steps). */
export function classBPowersNumeric(ua, UB, RL, N = 20000) {
  let PS = 0, PL = 0;
  for (let k = 0; k < N; k++) {
    const u = ua * Math.sin(2 * Math.PI * (k + 0.5) / N), i = u / RL;
    PS += UB * Math.abs(i) / N; PL += u * i / N;
  }
  return { PL, PS, PT: PS - PL };
}

/** The complementary emitter follower's output for an input ue: the npn conducts Is e^((ue + Ubias/2 − ua)/UT), the pnp
 *  Is e^((ua − ue + Ubias/2)/UT), their difference flows into RL (Bauelemente's exponential law, HL (6.1.2)). Ubias = 0
 *  is class B, about 1.1 V class AB (section 2.2.3, p. 25). Clipped at ±UB. Solved by bisection. */
export function pushPull(ue, { UB, RL, Ubias, Is = 1e-13, UT = 0.025 }) {
  const f = ua => Is * (Math.exp(Math.min((ue + Ubias / 2 - ua) / UT, 700)) - Math.exp(Math.min((ua - ue + Ubias / 2) / UT, 700))) - ua / RL;
  let lo = -UB, hi = UB;
  for (let k = 0; k < 100; k++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

// --- The op-amp in a feedback loop (section 4.1, pp. 69–77) ---------------------------------------------------------

/** The open loop gain of two poles, vg = vg0 / ((1 + jω/ω1)(1 + jω/ω2)) (4.1 with a second pole, p. 72), as [re, im]. */
export function openLoop(w, { vg0, w1, w2 }) {
  const a = [1, w / w1], b = [1, w / w2], d = [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], m = d[0] ** 2 + d[1] ** 2;
  return [vg0 * d[0] / m, -vg0 * d[1] / m];
}

/** The loop gain's crossover |β vg| = 1 and the phase margin there, 180° + arg(β vg) (p. 77). */
export function phaseMargin(prm, beta) {
  const mag = w => beta * Math.hypot(...openLoop(w, prm));
  if (mag(0) <= 1) return { wc: 0, margin: 180 };
  let lo = 0, hi = 1e15;
  for (let k = 0; k < 300; k++) { const m = Math.sqrt(Math.max(lo, 1e-9) * hi); if (mag(m) > 1) lo = m; else hi = m; }
  const wc = (lo + hi) / 2;
  return { wc, margin: 180 - (Math.atan(wc / prm.w1) + Math.atan(wc / prm.w2)) * 180 / Math.PI };
}

/** The closed loop's step response, vr = vg/(1 + β vg) (4.4): with two poles the denominator is the second-order
 *  s²/(ω1ω2) + s(1/ω1 + 1/ω2) + 1 + β vg0, solved in closed form (derived here). */
export function stepResponse(t, { vg0, w1, w2 }, beta) {
  const a = 1 / (w1 * w2), b = 1 / w1 + 1 / w2, c = 1 + beta * vg0, final = vg0 / c;
  if (t <= 0) return 0;
  const wn = Math.sqrt(c / a), zeta = b / (2 * Math.sqrt(a * c));
  if (zeta < 1) {
    const wd = wn * Math.sqrt(1 - zeta * zeta);
    return final * (1 - Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + zeta / Math.sqrt(1 - zeta * zeta) * Math.sin(wd * t)));
  }
  const r = Math.sqrt(zeta * zeta - 1), p1 = -wn * (zeta - r), p2 = -wn * (zeta + r);
  if (Math.abs(p1 - p2) < 1e-9 * wn) return final * (1 - (1 + wn * t) * Math.exp(-wn * t));
  return final * (1 + (p2 * Math.exp(p1 * t) - p1 * Math.exp(p2 * t)) / (p1 - p2));
}

/** Second route: the same loop stepped with RK4 as two first-order stages, x1′ = ω1(vg0 e − x1), x2′ = ω2(x1 − x2),
 *  e = 1 − β x2. */
export function stepNumeric(tEnd, { vg0, w1, w2 }, beta, n = 200000) {
  let x = [0, 0];
  const h = tEnd / n, f = ([x1, x2]) => [w1 * (vg0 * (1 - beta * x2) - x1), w2 * (x1 - x2)];
  for (let k = 0; k < n; k++) {
    const k1 = f(x), k2 = f([x[0] + h / 2 * k1[0], x[1] + h / 2 * k1[1]]), k3 = f([x[0] + h / 2 * k2[0], x[1] + h / 2 * k2[1]]),
          k4 = f([x[0] + h * k3[0], x[1] + h * k3[1]]);
    x = [x[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
  }
  return x[1];
}

// --- Slew rate (section 4.4, pp. 84–86) ------------------------------------------------------------------------------

/** The power bandwidth fp = SR / (2π Ûa) (p. 86), the highest frequency of an undistorted full sine. */
export const powerBandwidth = (SR, ua) => SR / (2 * Math.PI * ua);

/** A voltage follower of unity-gain bandwidth fT driven by a sine of amplitude A and frequency f, its output's rate of
 *  change clipped at ±SR: Euler steps over `periods` periods. Returns { t, ue, ua }. */
export function slewFollower({ A, f, SR, fT, periods = 3, n = 3000 }) {
  const dt = periods / f / n, t = [], ue = [], ua = [];
  let y = 0;
  for (let k = 0; k <= n; k++) {
    const tk = k * dt, x = A * Math.sin(2 * Math.PI * f * tk);
    t.push(tk); ue.push(x); ua.push(y);
    // Sub-steps short against the loop's time constant 1/(2π fT), so Euler stays stable.
    const m = Math.max(1, Math.ceil(dt * 2 * Math.PI * fT * 10)), h = dt / m;
    for (let j = 0; j < m; j++) {
      const xj = A * Math.sin(2 * Math.PI * f * (tk + j * h));
      y += h * Math.max(-SR, Math.min(SR, 2 * Math.PI * fT * (xj - y)));
    }
  }
  return { t, ue, ua };
}

// --- Noise (sections 6.2–6.3, pp. 128–134) ---------------------------------------------------------------------------

/** Thermal noise of a resistor, the RMS of v² = 4 kB T R Δf [V] (6.1). */
export const thermalNoise = (R, T, B) => Math.sqrt(4 * K * T * R * B);
/** Shot noise of a current I, the RMS of i² = 2 q I Δf [A] (6.11). */
export const shotNoise = (I, B) => Math.sqrt(2 * Q * I * B);

/** A seeded stream of standard normal samples (mulberry32, then Box–Muller): the same seed, the same noise. */
export function gaussian(seed, n) {
  let s = seed >>> 0;
  const u = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296; };
  const out = [];
  while (out.length < n) { const r = Math.sqrt(-2 * Math.log(u())), a = 2 * Math.PI * u(); out.push(r * Math.cos(a), r * Math.sin(a)); }
  return out.slice(0, n);
}
