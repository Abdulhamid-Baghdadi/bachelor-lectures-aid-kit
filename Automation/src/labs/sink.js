// The worked example of Modellbildung chapter 3: Beispiel 3.5 (Kugi et al. 2015, pp. 113–115), a voltage regulator
// cooled through a base plate, a layer of paste and a heat sink. Three steps on one network (Abbildung 3.24): the
// steady state (3.122)–(3.127), the warm-up of the two thermal masses (3.128), and the junction under a fluctuating
// input voltage through G(s) (3.129)–(3.135).
import { SINK, sinkPaste, sinkTotal, sinkPower, sinkUeMax, sinkSteady, sinkWarmUp, sinkRipple, sinkMinFrequency } from "../core/index.js";
import { h, s, slider, readout, choice, tabs } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const C = K => `${(K - 273.15).toFixed(1)} °C`;

/** The network of Abbildung 3.24 as a ladder: nodes with their temperatures, resistances between them. */
function network(withSink, T, p) {
  const nodes = withSink ? [["TS", T.TS], ["TB", T.TB], ["TK", T.TK], ["T∞", p.Tinf]] : [["TS", T.TS], ["TB", T.TB], ["T∞", p.Tinf]];
  const res = withSink ? [`RSB = ${p.RSB}`, `RP = ${sinkPaste(p).toFixed(2)}`, `RK = ${p.RK}`] : [`RSB = ${p.RSB}`, `RB = ${p.RB}`];
  const gap = 400 / (nodes.length - 1), x = i => 30 + i * gap, hot = v => (v > p.TSmax + 1e-9 ? "net-hot" : "net-label");
  return s("svg", { viewBox: "0 0 460 150", class: "schematic", role: "img",
    "aria-label": `Thermal network ${withSink ? "with" : "without"} the heat sink: ${nodes.map(([n, v]) => `${n} ${C(v)}`).join(", ")}` },
    s("line", { x1: x(0), y1: 60, x2: x(nodes.length - 1), y2: 60, class: "net-wire" }),
    ...res.flatMap((r, i) => [s("rect", { x: x(i) + gap / 2 - 30, y: 50, width: 60, height: 20, class: "net-r" }),
      s("text", { x: x(i) + gap / 2, y: 40, class: "net-note", "text-anchor": "middle" }, `${r} K/W`)]),
    ...nodes.flatMap(([n, v], i) => [s("circle", { cx: x(i), cy: 60, r: 6, class: "net-node" }),
      s("text", { x: x(i), y: 95, class: hot(v), "text-anchor": "middle" }, n),
      s("text", { x: x(i), y: 115, class: hot(v), "text-anchor": "middle" }, C(v))]),
    s("text", { x: x(0), y: 140, class: "net-note", "text-anchor": "start" }, "P enters at the junction; CB at TB and CK at TK, both to the thermal mass"));
}

export default {
  id: "sink",
  art: () => a.picture("A chip on a finned heat sink with heat flowing out to the air",
    a.rect(70, 70, 60, 20, a.ACC, 3) + [0, 1, 2, 3, 4].map(k => a.rect(55 + k * 20, 92, 10, 40, a.INK, 2)).join("") +
      a.arrow(100, 60, 100, 25, a.HOT, 2) + a.arrow(40, 110, 15, 110, a.HOT, 2) + a.arrow(160, 110, 185, 110, a.HOT, 2)),
  mount(root) {
    const st = { Ue: 15, sink: "on", H: 30, Ue2: 15, f: 1e-3 };
    const p = () => ({ ...SINK, H: st.H * 1e-6 });

    // Step 1: steady state.
    const net = h("div", {}), rP = readout("Heating power P = (Ue − Ua)·Ia (3.122)"), rMax = readout("Highest input voltage Ue,max (3.124)"), rRP = readout("Paste RP = H/(λA) (3.127)");
    const steady = () => {
      const q = p(), on = st.sink === "on", P = sinkPower(st.Ue, q), T = sinkSteady(P, q, on);
      net.replaceChildren(network(on, T, q));
      rP.set(`${P.toFixed(2)} W`, T.TS > q.TSmax ? "warn" : "", T.TS > q.TSmax ? `the junction reaches ${C(T.TS)}, above TS,max = ${C(q.TSmax)}` : `junction at ${C(T.TS)}`);
      rMax.set(`${sinkUeMax(q, on).toFixed(3)} V`, "", on ? "the notes: 18.061 V with the heat sink" : "the notes: 7.462 V without");
      rRP.set(`${sinkPaste(q).toFixed(3)} K/W`, "", `a plane wall of k = λ/H (3.117); total Rges = ${sinkTotal(q, on).toFixed(2)} K/W`);
    };
    const s1 = h("div", { class: "stage" }, net, h("div", { class: "controls" },
      choice("Cooling", [["on", "with heat sink (Abbildung 3.24b)"], ["off", "without (Abbildung 3.24a)"]], st.sink, v => { st.sink = v; all(); }),
      slider({ label: "Input voltage Ue", unit: "V", min: 6, max: 20, value: st.Ue, step: 0.1, format: v => `${v.toFixed(1)} V`, onInput: v => { st.Ue = v; all(); } }),
      slider({ label: "Paste thickness H", unit: "µm", min: 5, max: 500, value: st.H, log: true, format: v => `${v.toFixed(0)} µm`, onInput: v => { st.H = v; all(); } }),
      rP.el, rMax.el, rRP.el,
      h("p", { class: "hint" }, "The regulator burns what it takes off the voltage: P = (Ue − 5 V)·0.5 A. At steady state the capacities carry nothing, so the heat flows through the resistances in series, like a current through resistors, and each node sits a drop of R·P above the next. The paste is a thin wall: thicker paste, higher RP, lower Ue,max.")));

    // Step 2: warm-up.
    const c2 = h("div", { class: "plot" }), rTau = readout("Time constants"), rEnd = readout("Junction at the end");
    const warm = () => {
      const q = p(), on = st.sink === "on", P = sinkPower(st.Ue, q), T = 1500, run = sinkWarmUp(P, T, 3000, q, on);
      const k = run.t.map((_, i) => i).filter(i => i % 6 === 0), t = k.map(i => run.t[i]), y = arr => k.map(i => arr[i] - 273.15);
      c2.replaceChildren(lineChart({ lines: [{ x: t, y: y(run.TS), name: "junction TS" }, { x: t, y: y(run.TB), name: "base plate TB", cls: "second" },
        ...(on ? [{ x: t, y: y(run.TK), name: "heat sink TK", cls: "faint" }] : []), { x: [0, T], y: [q.TSmax - 273.15, q.TSmax - 273.15], cls: "faint second" }],
        xMin: 0, xMax: T, yMin: 40, yMax: 200, xLabel: "Time t [s]", yLabel: "Temperature [°C]", label: "Temperatures after the regulator is switched on, with the limit TS,max" }));
      const CB = q.mB * q.cB, CK = q.mK * q.cK;
      rTau.set(on ? `RP·CB = ${(sinkPaste(q) * CB).toFixed(2)} s, RK·CK = ${(q.RK * CK).toFixed(0)} s` : `RB·CB = ${(q.RB * CB).toFixed(0)} s`, "", `CB = mB cB = ${CB.toFixed(2)} J/K, CK = mK cK = ${CK.toFixed(1)} J/K (3.128)`);
      const end = run.TS.at(-1);
      rEnd.set(C(end), end > q.TSmax ? "warn" : "", end > q.TSmax ? "too hot at steady state" : "within the limit");
    };
    const s2 = h("div", { class: "stage" }, c2, h("div", { class: "controls" }, rTau.el, rEnd.el,
      h("p", { class: "hint" }, "The same network, now with its capacities: switched on from 50 °C, the light base plate follows the power within seconds, while the aluminium heat sink takes minutes. The junction itself stores nothing, so it jumps by RSB·P at once. Change Ue and the cooling in step 1."),
      h("p", { class: "hint" }, "The notes ask only for the steady state and the sine; the warm-up is the network of Abbildung 3.24 run in time.")));

    // Step 3: fluctuating input.
    const c3 = h("div", { class: "plot" }), rAmp = readout("Junction swing T̄S ± T̂S (3.131), (3.132)"), rMin = readout("Lowest safe frequency fmin (3.135)");
    const ripple = () => {
      const q = p(), period = 1 / st.f, T = Math.max(3 * period, 1500), n = 3000;
      const Pt = t => (13 + 7 * Math.cos(2 * Math.PI * st.f * t) - q.Ua) * q.Ia, run = sinkWarmUp(Pt, T, n, q, true), r = sinkRipple(st.f, 13, 7, q);
      const k = run.t.map((_, i) => i).filter(i => i % 6 === 0);
      c3.replaceChildren(lineChart({ lines: [{ x: k.map(i => run.t[i] / 60), y: k.map(i => run.TS[i] - 273.15), name: "junction TS" },
        { x: [0, T / 60], y: [q.TSmax - 273.15, q.TSmax - 273.15], name: "TS,max", cls: "faint second" }],
        xMin: 0, xMax: T / 60, yMin: 40, yMax: 160, xLabel: "Time t [min]", yLabel: "Temperature [°C]", label: "Junction temperature while the input swings between 6 V and 20 V" }));
      const top = r.mean + r.amp;
      rAmp.set(`${C(r.mean)} ± ${r.amp.toFixed(1)} K`, top > q.TSmax ? "warn" : "", top > q.TSmax ? `peaks at ${C(top)}, above TS,max` : `peaks at ${C(top)}`);
      const fm = sinkMinFrequency(13, 7, q);
      rMin.set(Number.isFinite(fm) ? `${(fm * 1000).toFixed(3)} mHz = ${(fm * 3600).toFixed(3)} per hour` : "none", "", "the notes: 1.429 mHz = 5.146 per hour");
    };
    const s3 = h("div", { class: "stage" }, c3, h("div", { class: "controls" },
      slider({ label: "Frequency f of the input swing", unit: "Hz", min: 1e-4, max: 0.05, value: st.f, log: true, format: v => `${(v * 1000).toFixed(2)} mHz`, onInput: v => { st.f = v; ripple(); } }),
      rAmp.el, rMin.el,
      h("p", { class: "hint" }, "Ue(t) = 13 V + 7 V·cos(2πft), with the heat sink. The network is a low pass, G(s) of (3.134): a slow swing passes in full and the junction overheats at each peak; a fast one is smoothed by the heat sink's mass. The amplitude is |G(I2πf)|·P̂ with P̂ = Ûe·Ia = 3.5 W.")));

    const all = () => { steady(); warm(); ripple(); };
    root.append(tabs("Steps of the worked example", [["1 · Steady state", s1], ["2 · Warm-up", s2], ["3 · Fluctuating input", s3]]));
    all();
  },
};
