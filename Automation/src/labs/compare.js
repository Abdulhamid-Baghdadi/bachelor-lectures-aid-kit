// Four controllers on the drive of Abbildung 4.2 (Kugi 2015), side by side: the PI controller (5.1), the compensating
// controller of the worked design (5.3), the state controller with a Luenberger observer (8.1, 8.3.2) and the PI state
// controller (8.2) with the same observer. One reference step, one load step, one actuator range for all; the table
// says which one meets the targets.
import { compareDesigns, compareRuns, compareMetrics } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const R0 = 100, T = 40, TML = 20, ML = 0.05, N = 40000, EVERY = 40;
const ROWS = [
  ["pi", "PI controller (5.1)", "c-pi"],
  ["comp", "Compensating controller (5.3)", "c-comp"],
  ["state", "State controller + observer (8.1, 8.3.2)", "c-state"],
  ["pistate", "PI state controller + observer (8.2)", "c-pistate"],
];
const swatch = cls => s("svg", { viewBox: "0 0 30 10", width: 30, height: 10, "aria-hidden": "true" }, s("line", { x1: 0, y1: 5, x2: 30, y2: 5, class: `series ${cls}` }));
const sec = v => (Number.isFinite(v) ? `${v.toFixed(1)} s` : "not settled");

export default {
  id: "compare",
  art: () => a.picture("Four step responses on one chart: one slow, one overshooting, two that settle quickly",
    a.path("M 15 130 L 185 130 M 15 130 L 15 20", a.INK, 2) + a.path("M 15 130 C 60 130 120 60 185 55", a.INK, 2) +
      a.path("M 15 130 C 25 20 40 20 55 75 S 80 60 185 55", a.HOT, 2) + a.path("M 15 130 C 35 40 55 50 185 55", a.ACC, 3)),
  mount(root) {
    const st = { wcPI: 0.2, w0: 3, lim: "on", load: "on" };
    const cw = h("div", { class: "plot" }), cu = h("div", { class: "plot" }), table = h("div", { class: "compare-table" });
    const rWin = readout("Best on these targets"), rPI = readout("PI controller"), rState = readout("State controllers");

    const update = () => {
      const D = compareDesigns({ wcPI: st.wcPI, w0: st.w0 }), loadOn = st.load === "on";
      const runs = compareRuns(D, { r: R0, ML: loadOn ? ML : 0, tML: loadOn ? TML : Infinity, limit: st.lim === "on", T, n: N });
      const k = runs.pi.t.map((_, i) => i).filter(i => i % EVERY === 0), t = k.map(i => runs.pi.t[i]);
      cw.replaceChildren(lineChart({ lines: [...ROWS.map(([id, , cls]) => ({ x: t, y: k.map(i => runs[id].w[i] / R0), cls })),
        { x: [0, T], y: [1.02, 1.02], cls: "faint" }, { x: [0, T], y: [0.98, 0.98], cls: "faint" }],
        xMin: 0, xMax: T, yMin: 0, yMax: 1.5, xLabel: "Time t [s]", yLabel: "Load speed ω2 / r [1]",
        label: `Load speed of the drive under the four controllers, for a reference step r = ${R0} rad/s${loadOn ? ` and a load step at ${TML} s` : ""}, with the ±2 % band` }));
      cu.replaceChildren(lineChart({ lines: [...ROWS.map(([id, , cls]) => ({ x: t, y: k.map(i => runs[id].u[i]), cls })),
        { x: [0, T], y: [1, 1], cls: "faint" }, { x: [0, T], y: [-1, -1], cls: "faint" }],
        xMin: 0, xMax: T, yMin: -1.5, yMax: 6, xLabel: "Time t [s]", yLabel: "Duty cycle uT,n [1]",
        label: "The duty cycle each controller asks for, with the actuator's range ±1" }));

      const M = Object.fromEntries(ROWS.map(([id]) => [id, compareMetrics(runs[id], R0, loadOn ? TML : Infinity)]));
      const ok = m => m.overshoot <= 5 + 1e-9 && m.settle <= 2.5 && m.peakU <= 1 + 1e-9 && (!loadOn || Math.abs(m.endError) < 0.1);
      table.replaceChildren(h("table", { class: "method compare" },
        h("caption", {}, `Targets: ü ≤ 5 % (5.3, A), within ±2 % by 2.5 s, |uT,n| ≤ 1 (4.1)${loadOn ? ", no error left after the load" : ""}`),
        h("thead", {}, h("tr", {}, ...["Controller", "Overshoot ü", "Settled (±2 %)", "Largest |uT,n|", ...(loadOn ? ["Dip under load", "Error at the end"] : []), "Meets all"].map(v => h("th", { scope: "col" }, v)))),
        h("tbody", {}, ...ROWS.map(([id, name, cls]) => { const m = M[id]; return h("tr", {},
          h("th", { scope: "row", style: "text-align:left" }, swatch(cls), " ", name),
          h("td", {}, `${m.overshoot.toFixed(1)} %`), h("td", {}, sec(m.settle)), h("td", { class: m.peakU > 1 + 1e-9 ? "warn" : "" }, m.peakU.toFixed(2)),
          ...(loadOn ? [h("td", {}, `${m.dip.toFixed(2)} %`), h("td", {}, `${m.endError.toFixed(2)} %`)] : []),
          h("td", {}, ok(m) ? "yes" : "no")); }))));

      const winners = ROWS.filter(([id]) => ok(M[id])).map(([, name]) => name);
      rWin.set(winners.length ? winners.join("; ") : "none of the four", winners.length ? "" : "warn", "the targets of the caption, on this test");
      rPI.set(`${D.pi.kind === "I" ? "R = VI/s" : D.pi.kind === "PI" ? "R = VI(1 + sTI)/s" : "no design"}, VI = ${D.pi.VI.toExponential(3)}`, "",
        "loop shaping must keep ωC below the shaft's resonance at 1.82 rad/s: at ωC = 3 rad/s the phase of G/s is already −270°, so no PI zero can lift it to Φ = 65°");
      rState.set(`kP = ${D.pistate.kP.toFixed(4)} = 1/V (8.58)`, "", "poles: a pair at ω0 with ξ = 0.7, one at −3ω0 (and −2ω0 for the integrator), the armature's own at −1321.66; Ta = 20 ms; the observer 5 times faster");
    };

    root.append(h("div", { class: "stage" }, h("div", {}, cw, cu), h("div", { class: "controls" },
      choice("Test", [["on", `reference step, then a load step ML = ${ML} N·m at ${TML} s`], ["off", "reference step only"]], st.load, v => { st.load = v; update(); }),
      choice("Actuator", [["on", "limited to −1 ≤ uT,n ≤ 1 (4.1)"], ["off", "unlimited"]], st.lim, v => { st.lim = v; update(); }),
      slider({ label: "PI crossover ωC", unit: "rad/s", min: 0.05, max: 0.6, value: st.wcPI, step: 0.01, format: v => `${v.toFixed(2)} rad/s`, onInput: v => { st.wcPI = v; update(); } }),
      slider({ label: "State controller pair ω0", unit: "rad/s", min: 1, max: 8, value: st.w0, step: 0.1, format: v => `${v.toFixed(1)} rad/s`, onInput: v => { st.w0 = v; update(); } }),
      rWin.el, rPI.el, rState.el,
      h("p", { class: "hint" }, "All four see only the load speed ω2. The PI controller is slow because it must cross over below the resonance; push ωC up and the resonance eats the gain margin, until near 0.5 rad/s the loop rings for the whole run. The compensating controller cancels the resonance and is fast, but at ωC = 3 rad/s it asks for a duty cycle of 5.5: with the limit on, its integrator winds up and the speed overshoots by about 45 %. The state controller places every pole and stays inside the range, but a load is a disturbance its prefilter g knows nothing of, so an error remains: (8.50) gives it for the true state, and the observer, blind to the load too, changes its size but not its sign. The PI state controller adds the integrator of (8.51) and removes it."),
      h("p", { class: "hint" }, "The notes design the state controllers on a two-mass oscillator (Beispiel 8.1), not on this drive; the pole choice here is this lab's, not the notes'."))), table);
    update();
  },
};
