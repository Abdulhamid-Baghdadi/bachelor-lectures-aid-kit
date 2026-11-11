// The worked example: the drive of Abbildung 4.2 (Kugi 2015, pp. 94–97) taken through the course in four steps that
// share one design. The plant (4.3), (4.6a); the open loop and the compensating controller of section 5.3 (5.38)–
// (5.42); the closed loop with the prefilter (5.44) and the actuator's range (4.1); and the same controller as R(z) by
// the Tustin transformation (6.90), a step the notes' example does not take.
import { DRIVE_PREFILTER, driveModel, driveTransfer, driveFactors, driveCompensator, driveLoopPoles, driveRun,
  simulate, matVec, series, bode, logspace, loopMargins, loopWarp, loopTangentRise, stepInfo } from "../core/index.js";
import { h, slider, readout, choice, tabs } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const G = driveTransfer(), FACT = driveFactors(G), P = driveModel();
const ms = v => `${(v * 1000).toFixed(v < 0.01 ? 1 : 0)} ms`;

export default {
  id: "drive",
  art: () => a.picture("A motor driving a load through a twisting shaft, with a feedback arrow from the load back to a controller box",
    a.rect(10, 55, 40, 30, a.ACC, 3) + a.text(30, 75, "R", 15) + a.arrow(50, 70, 72, 70, a.INK, 2) + a.circle(95, 70, 22) +
      a.text(95, 76, "M", 16) + a.path("M 117 70 q 8 -8 16 0 t 16 0", a.INK, 2) + a.rect(150, 55, 34, 30, a.INK, 3) +
      a.path("M 167 85 L 167 120 L 30 120 L 30 89", a.HOT, 2) + a.arrow(30, 100, 30, 88, a.HOT, 2)),
  mount(root) {
    const st = { wc: 3, phi: 65, uT: 0.5, ML: 0, pre: "on", lim: "off", ref: "100", load: "off", Ta: 0.02 };
    const design = () => driveCompensator(G, st.wc, st.phi);

    // Step 1: the plant alone.
    const c1 = h("div", { class: "plot" }), rG = readout("Transfer function (4.6a)"), rRes = readout("Lightly damped pair");
    const plant = () => {
      const m = st.ML, run = simulate((t, x) => matVec(P.A, x).map((v, i) => v + P.b[i] * st.uT + P.e[i] * m), [0, 0, 0, 0], 20, 20000);
      const t = run.t.filter((_, k) => k % 20 === 0), x = run.x.filter((_, k) => k % 20 === 0);
      c1.replaceChildren(lineChart({ lines: [{ x: t, y: x.map(v => v[3]), name: "load ω2" }, { x: t, y: x.map(v => v[1]), name: "motor ω1", cls: "second" }],
        xMin: 0, xMax: 20, yMin: -50, yMax: 250, xLabel: "Time t [s]", yLabel: "Speed ω [rad/s]",
        label: "Motor and load speed after the duty cycle is switched on, with no controller" }));
      rG.set(`${FACT.V.toFixed(2)} / ((1 + s/${FACT.corners[0].toFixed(2)})(1 + s/${FACT.corners[1].toFixed(2)})(1 + 2·${FACT.xi.toFixed(3)}·s/${FACT.w0.toFixed(2)} + s²/${FACT.w0.toFixed(2)}²))`);
      rRes.set(`ω0 = ${FACT.w0.toFixed(2)} rad/s, ξ = ${FACT.xi.toFixed(3)}`, "", "the shaft's stiffness cT against both inertias: it rings for many seconds");
    };
    const s1 = h("div", { class: "stage" }, c1, h("div", { class: "controls" },
      slider({ label: "Normalised duty cycle uT,n", unit: "", min: -1, max: 1, value: st.uT, step: 0.05, format: v => v.toFixed(2), onInput: v => { st.uT = v; plant(); } }),
      slider({ label: "Load torque ML", unit: "N·m", min: 0, max: 0.5, value: st.ML, step: 0.01, onInput: v => { st.ML = v; plant(); } }),
      rG.el, rRes.el,
      h("p", { class: "hint" }, "The drive of Abbildung 4.2: a dc-dc converter, a DC motor, a twisting shaft and a load, with the parameters (4.5). The duty cycle sets uA = uZW·uT,n (4.1). Without a controller the load speed swings around its end value: the pole pair at 1.82 rad/s is barely damped.")));

    // Step 2: open loop and controller.
    const c2m = h("div", { class: "plot" }), c2p = h("div", { class: "plot" });
    const rArg = readout("arg L1(IωC) (5.39)"), rR = readout("Controller (5.42)"), rM = readout("Margins of L = R·G");
    const shape = () => {
      const d = design(), ws = logspace(0.1, 1e4, 400), lw = ws.map(Math.log10);
      const L = series(d.R, G), BL = bode(L, ws), BG = bode(G, ws);
      c2m.replaceChildren(lineChart({ lines: [{ x: lw, y: BG.map(p => p.db), name: "|G|", cls: "faint" }, { x: lw, y: BL.map(p => p.db), name: "|L| = |R G|" }],
        marks: [{ x: Math.log10(st.wc), y: 0, shape: "dot" }], yMin: -120, yMax: 80, xFormat: v => `10^${v.toFixed(0)}`,
        xLabel: "Frequency log₁₀ ω [rad/s]", yLabel: "Magnitude [dB]", label: "Bode magnitude of the plant and of the open loop" }));
      c2p.replaceChildren(lineChart({ lines: [{ x: lw, y: BG.map(p => p.phase), name: "arg G", cls: "faint" }, { x: lw, y: BL.map(p => p.phase), name: "arg L" }],
        marks: [{ x: Math.log10(st.wc), y: st.phi - 180, shape: "dot" }], yMin: -450, yMax: 0, xFormat: v => `10^${v.toFixed(0)}`,
        xLabel: "Frequency log₁₀ ω [rad/s]", yLabel: "Phase [°]", label: "Bode phase of the plant and of the open loop" }));
      rArg.set(`${d.argL1.toFixed(1)}°`, "", `so (1 + sTR)² must lower it by ${d.drop.toFixed(1)}° to Φ − 180° = ${(st.phi - 180).toFixed(0)}°`);
      if (!d.possible) rR.set("—", "danger", `arg L1 is already below Φ − 180°: lower Φ or ωC`);
      else rR.set(`VR = ${d.VR.toFixed(4)}, TR = ${d.TR.toFixed(4)} s`, "", "R = VR(1 + 2ξs/ω0 + s²/ω0²)/(s(1 + sTR)²): the zeros cancel the pair");
      const m = loopMargins(L, 1e-2, 1e4, 4000), stable = driveLoopPoles(d.R, G).every(([re]) => re < 0);
      rM.set(`ωC = ${m.wc.toFixed(2)} rad/s, Φ = ${m.phaseMargin.toFixed(1)}°`, stable ? "" : "danger", stable ? "all poles of the closed loop in the left half plane" : "the closed loop is unstable");
    };
    const s2 = h("div", { class: "stage" }, c2m, c2p, h("div", { class: "controls" },
      slider({ label: "Crossover frequency ωC", unit: "rad/s", min: 0.5, max: 20, value: st.wc, log: true, format: v => `${v.toFixed(2)} rad/s`, onInput: v => { st.wc = v; all(); } }),
      slider({ label: "Phase margin Φ", unit: "°", min: 30, max: 85, value: st.phi, step: 1, format: v => `${v.toFixed(0)}°`, onInput: v => { st.phi = v; all(); } }),
      rArg.el, rR.el, rM.el,
      h("p", { class: "hint" }, "The notes' targets (5.3, B): tr = 0.5 s and ü = 5 % give ωC = 3 rad/s and Φ = 65°. They print arg L1(3I) = −104.5° and so TR = 0.0306 s; worked from (5.39) the angle is −90° − arctan(3/11.17) − arctan(3/1321.66) = −105.2°, which gives TR = 0.0287 s. VR = 0.0141 either way. These values carry into the next two steps.")));

    // Step 3: the closed loop.
    const c3w = h("div", { class: "plot" }), c3u = h("div", { class: "plot" });
    const rOs = readout("Overshoot and rise time"), rU = readout("Largest |uT,n|");
    const loop = () => {
      const d = design(); if (!d.possible) return;
      const r = Number(st.ref), loadOn = st.load === "on", T = loadOn ? 30 : 3, n = T * 1000;
      const run = driveRun({ R: d.R, F: st.pre === "on" ? DRIVE_PREFILTER : null, limit: st.lim === "on", r, ML: loadOn ? 0.05 : 0, tML: 3, T: loadOn ? 30 : 3, n });
      const k = run.t.map((_, i) => i).filter(i => i % (loadOn ? 30 : 5) === 0), t = k.map(i => run.t[i]);
      c3w.replaceChildren(lineChart({ lines: [{ x: t, y: k.map(i => run.w[i] / r), name: "ω2 / r" }], xMin: 0, xMax: T, yMin: 0, yMax: 1.6,
        xLabel: "Time t [s]", yLabel: "Load speed ω2 / r [1]", label: "Load speed of the closed loop over the reference" }));
      c3u.replaceChildren(lineChart({ lines: [{ x: t, y: k.map(i => run.u[i]), name: "uT,n" }, { x: [0, T], y: [1, 1], cls: "faint" }, { x: [0, T], y: [-1, -1], cls: "faint" }],
        xMin: 0, xMax: T, yMin: -2, yMax: 6, xLabel: "Time t [s]", yLabel: "Duty cycle uT,n [1]", label: "The duty cycle the controller asks for, with the actuator's range ±1" }));
      const head = run.t.findIndex(v => v > 3), w = (head > 0 ? run.w.slice(0, head) : run.w).map(v => v / r), tt = run.t.slice(0, w.length);
      rOs.set(`ü = ${stepInfo(tt, w).overshoot.toFixed(1)} %, tr = ${loopTangentRise(tt, w).toFixed(2)} s`, "", st.pre === "on" ? "the prefilter slows the loop on purpose; the targets (5.3, A) ü = 5 %, tr = 0.5 s are for the loop without it" : "targets (5.3, A): ü = 5 %, tr = 0.5 s");
      const peak = Math.max(...run.u.map(Math.abs));
      rU.set(peak.toFixed(2), peak > 1 + 1e-9 ? "warn" : "", peak > 1 + 1e-9 ? "beyond the actuator's range −1 ≤ uT,n ≤ 1 (4.1)" : "within −1 ≤ uT,n ≤ 1");
    };
    const s3 = h("div", { class: "stage" }, c3w, c3u, h("div", { class: "controls" },
      choice("Reference r", [["1", "r = 1 rad/s"], ["100", "r = 100 rad/s, as in (5.3, F)"]], st.ref, v => { st.ref = v; loop(); }),
      choice("Prefilter F(s) (5.44)", [["on", "with"], ["off", "without"]], st.pre, v => { st.pre = v; loop(); }),
      choice("Actuator limit (Abbildung 4.11)", [["off", "ideal, unlimited"], ["on", "clipped to ±1"]], st.lim, v => { st.lim = v; loop(); }),
      choice("Load torque", [["off", "none"], ["on", "ML = 0.05 N·m at t = 3 s"]], st.load, v => { st.load = v; loop(); }),
      rOs.el, rU.el,
      h("p", { class: "hint" }, "Without the prefilter the step to 100 rad/s asks for a duty cycle of about 5.5, far past ±1 (Abbildung 5.8, right). The prefilter softens the reference and keeps it inside. Switch on the load: the integrator brings ω2 back, but the shaft rings for some 20 s, because the controller cancelled the pair for the reference only. That is why the notes suggest a notch filter (5.45) when the model is uncertain (p. 133).")));

    // Step 4: the controller as R(z).
    const c4 = h("div", { class: "plot" }), rW = readout("Crossover after warping (6.89)"), rGap = readout("Largest gap to the continuous loop");
    const digital = () => {
      const d = design(); if (!d.possible) return;
      const F = DRIVE_PREFILTER, cont = driveRun({ R: d.R, F, T: 3, n: 3000 }), dig = driveRun({ R: d.R, F, Ta: st.Ta, T: 3, n: 3000 });
      const k = cont.t.map((_, i) => i).filter(i => i % 5 === 0);
      c4.replaceChildren(lineChart({ lines: [{ x: k.map(i => cont.t[i]), y: k.map(i => cont.w[i]), name: "R(s)", cls: "faint" }, { x: k.map(i => dig.t[i]), y: k.map(i => dig.w[i]), name: `R(z), Ta = ${ms(st.Ta)}` }],
        xMin: 0, xMax: 3, yMin: 0, yMax: 1.6, xLabel: "Time t [s]", yLabel: "Load speed ω2 [rad/s]", label: "Step response with the continuous and the sampled controller" }));
      const W = loopWarp(st.wc, st.Ta);
      rW.set(`${W.toFixed(2)} rad/s for ωC = ${st.wc.toFixed(2)} rad/s`, "", "Tustin keeps the response at Ω = (2/Ta)tan(ωTa/2), not at ω");
      const gap = Math.max(...dig.w.map((w, i) => Math.abs(w - cont.w[i])));
      rGap.set(gap.toFixed(3), gap > 0.1 ? "warn" : "", gap > 0.1 ? "the samples are too far apart for this loop" : "close to the continuous design");
    };
    const s4 = h("div", { class: "stage" }, c4, h("div", { class: "controls" },
      slider({ label: "Sample time Ta", unit: "s", min: 0.001, max: 0.4, value: st.Ta, log: true, format: ms, onInput: v => { st.Ta = v; digital(); } }),
      rW.el, rGap.el,
      h("p", { class: "hint" }, "Beyond the notes' example: the controller (5.42) and the prefilter become R(z) and F(z) by putting q = (2/Ta)(z − 1)/(z + 1) (6.90) in place of s, run every Ta and held in between, on the continuous drive. A few milliseconds change nothing; near Ta = 0.1 s the loop starts to ring. Compare the warped crossover with ωC: it drifts as ωTa grows.")));

    const all = () => { shape(); loop(); digital(); };
    root.append(tabs("Steps of the worked example", [["1 · Plant", s1], ["2 · Controller", s2], ["3 · Closed loop", s3], ["4 · Digital", s4]]));
    plant(); all();
  },
};
