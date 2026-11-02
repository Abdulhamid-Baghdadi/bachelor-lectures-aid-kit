// The worked example of Modellbildung chapter 3: the heat sink for a voltage regulator, Beispiel 3.5 (Kugi et al.
// 2015, pp. 113–115). The thermal RC networks of Abbildung 3.24 with the paste's resistance from conduction (3.117),
// the steady state (3.122)–(3.127), the warm-up of the two thermal masses and the response to a fluctuating input
// voltage through G(s) (3.134).
import { simulate, freq } from "./lti.js";
import { cArg } from "./lti.js";
import { cAbs } from "../../../kit/core/index.js";

/** The data of Beispiel 3.5, SI units: voltages [V], current [A], resistances [K/W], masses [kg], c [J/(kg K)],
 *  temperatures [K], paste λ [W/(m K)], area [m²] and thickness [m]. */
export const SINK = { Ua: 5, Ia: 0.5, RSB: 5, RB: 60, mB: 0.002, cB: 385, TSmax: 403, Tinf: 323,
  mK: 0.02, cK: 903, RK: 7, lambda: 0.8, A: 150e-6, H: 30e-6 };

/** The paste as a thermal resistance, RP = H/(λA) (3.127), a plane wall of k = λ/H (3.117). */
export const sinkPaste = ({ lambda, A, H } = SINK) => H / (lambda * A);
/** The total resistance from junction to air: RSB + RB without the heat sink (3.125), RSB + RP + RK with (3.126). */
export const sinkTotal = (p = SINK, withSink = true) => withSink ? p.RSB + sinkPaste(p) + p.RK : p.RSB + p.RB;
/** The heating power P = (Ue − Ua)·Ia (3.122). */
export const sinkPower = (Ue, p = SINK) => (Ue - p.Ua) * p.Ia;
/** The highest input voltage at steady state, Ue,max = Ua + Pmax/Ia with Pmax = (TS,max − T∞)/Rges (3.123), (3.124). */
export const sinkUeMax = (p = SINK, withSink = true) => p.Ua + (p.TSmax - p.Tinf) / sinkTotal(p, withSink) / p.Ia;
/** The steady temperatures of the nodes of Abbildung 3.24 for a power P: junction TS, base plate TB, heat sink TK. */
export function sinkSteady(P, p = SINK, withSink = true) {
  if (!withSink) return { TB: p.Tinf + P * p.RB, TS: p.Tinf + P * (p.RB + p.RSB) };
  const TK = p.Tinf + P * p.RK, TB = TK + P * sinkPaste(p);
  return { TK, TB, TS: TB + P * p.RSB };
}

/** The warm-up after switching on the power P at t = 0, all at T∞: the network of Abbildung 3.24 as a state model in
 *  TB (and TK), CB = mB cB, CK = mK cK (3.128). The junction has no capacity of its own: TS = TB + RSB·P. */
export function sinkWarmUp(P, T, n, p = SINK, withSink = true) {
  const CB = p.mB * p.cB, CK = p.mK * p.cK, RP = sinkPaste(p), Pt = typeof P === "function" ? P : () => P;
  const f = withSink
    ? (t, [TB, TK]) => [(Pt(t) - (TB - TK) / RP) / CB, ((TB - TK) / RP - (TK - p.Tinf) / p.RK) / CK]
    : (t, [TB]) => [(Pt(t) - (TB - p.Tinf) / p.RB) / CB];
  // The thin paste makes the base plate fast (RP·CB ≈ 0.2 s) beside the heat sink's minutes: Runge–Kutta needs steps
  // well below the fastest time constant, so it runs on a finer grid than the n points asked for.
  const fastest = withSink ? Math.min(RP * CB, p.RK * CK) : p.RB * CB, sub = Math.max(1, Math.ceil(T / n / (fastest / 4)));
  const fine = simulate(f, withSink ? [p.Tinf, p.Tinf] : [p.Tinf], T, n * sub);
  const run = { t: fine.t.filter((_, k) => k % sub === 0), x: fine.x.filter((_, k) => k % sub === 0) };
  return { t: run.t, TB: run.x.map(x => x[0]), TK: withSink ? run.x.map(x => x[1]) : null, TS: run.x.map((x, k) => x[0] + p.RSB * Pt(run.t[k])) };
}

/** G(s) = RSB + (RP(1 + sRKCK) + RK)/((1 + sRPCB)(1 + sRKCK) + sRKCB) from P to TS (3.134), highest power first. */
export function sinkTransfer(p = SINK) {
  const CB = p.mB * p.cB, CK = p.mK * p.cK, RP = sinkPaste(p), { RSB, RK } = p;
  const den = [RP * CB * RK * CK, RP * CB + RK * CK + RK * CB, 1];
  const inner = [RP * RK * CK, RP + RK];
  return { num: [RSB * den[0], RSB * den[1] + inner[0], RSB * den[2] + inner[1]], den };
}
/** The junction under Ue(t) = Ūe + Ûe cos(2πft) (3.129): mean T̄S (3.131), amplitude T̂S = |G(I2πf)|·P̂ (3.132) and
 *  phase (3.133). */
export function sinkRipple(f, Umean, Uamp, p = SINK) {
  const g = freq(sinkTransfer(p), 2 * Math.PI * f), Pm = (Umean - p.Ua) * p.Ia, Pa = Uamp * p.Ia;
  return { mean: p.Tinf + Pm * sinkTotal(p), amp: cAbs(g) * Pa, phase: cArg(g) };
}
/** The lowest frequency that keeps T̄S + T̂S ≤ TS,max (3.135), by bisection on log f: |G| falls with f (low pass). */
export function sinkMinFrequency(Umean, Uamp, p = SINK) {
  const over = f => { const r = sinkRipple(f, Umean, Uamp, p); return r.mean + r.amp > p.TSmax; };
  if (sinkRipple(1e-9, Umean, Uamp, p).mean >= p.TSmax) return Infinity;
  if (!over(1e-9)) return 0;
  let lo = Math.log(1e-9), hi = Math.log(1e3);
  for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (over(Math.exp(m))) lo = m; else hi = m; }
  return Math.exp((lo + hi) / 2);
}

export const LAWS = {
  sinkPaste: () => sinkPaste(),
  sinkUeMax: ({ withSink }) => sinkUeMax(SINK, withSink),
  sinkMinFrequency: ({ Umean, Uamp }) => sinkMinFrequency(Umean, Uamp),
};
