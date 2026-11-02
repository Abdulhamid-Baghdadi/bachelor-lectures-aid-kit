// The worked example: a 25 W class-B amplifier into 8 Ω, from its supply to its heat sink, after Schneider & Zimmermann
// (2005), Beispiel 1 (B1/1–B1/6), with the laws of Zimmermann (2010), section 2.2: the supply from the load power
// (2.17), one transistor's loss and its worst amplitude (2.21)–(2.24), the thermal chain to the air (2.25), and the
// class-AB bias through two diodes, whose current runs away when the transistors heat up (Bild 2.10, p. 30).
import { classBSupply, classBLossOne, classBPowers, classBEfficiency, heatSinkChain, junctionTemp, abBiasWarm, emitterLoss } from "../core/index.js";
import { h, slider, readout, tabs } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const RL = 8, TJ = 150, RTHJC = 1.92, RTHMOUNT = 0.5;
const W = v => `${v.toFixed(2)} W`, C = v => `${v.toFixed(1)} °C`;

export default {
  id: "amplifier",
  art: () => a.picture("Two output transistors on a finned heat sink, a loudspeaker beside them",
    a.rect(40, 40, 30, 40, a.ACC, 3) + a.rect(80, 40, 30, 40, a.ACC, 3) + [0, 1, 2, 3, 4, 5].map(k => a.rect(30 + k * 15, 85, 8, 45, a.INK, 2)).join("") +
      a.path("M150 60 L165 60 L180 45 L180 105 L165 90 L150 90 Z", a.INK, 3)),
  mount(root) {
    const st = { PL: 25, rest: 2, Tamb: 50, sink: 6.5, dTD: 0, dTT: 0 };
    const UB = () => Math.round(classBSupply(st.PL, RL, st.rest) * 10) / 10;
    const P = () => UB() ** 2 / (Math.PI ** 2 * RL);

    // Step 1: supply and the transistors' loss.
    const c1 = h("div", { class: "plot" }), rU = readout("Amplitude and supply (2.17), B1/1"), rP = readout("Worst loss per transistor (2.24)"), rE = readout("Efficiency at full output (2.19)");
    const supply = () => {
      const ub = UB(), ua = Math.sqrt(2 * st.PL * RL), xs = Array.from({ length: 101 }, (_, k) => k * ub / 100);
      c1.replaceChildren(lineChart({ lines: [{ x: xs, y: xs.map(u => classBLossOne(u, ub, RL)), name: "loss of one transistor" },
        { x: xs, y: xs.map(u => classBPowers(u, ub, RL).PL), name: "load power PL", cls: "second" }],
        marks: [{ x: 2 * ub / Math.PI, y: P(), shape: "dot" }, { x: ua, y: st.PL, shape: "o" }], xMin: 0, xMax: ub, yMin: 0, yMax: Math.max(30, st.PL * 1.2),
        xLabel: "Amplitude Ûa [V]", yLabel: "Power [W]", label: "One transistor's loss and the load power against the output amplitude" }));
      rU.set(`Ûa = ${ua.toFixed(1)} V, UB = ${ub.toFixed(1)} V`, "", `Ûa = √(2 PL RL), plus UCE,Rest = ${st.rest} V; the notes: 20 V and 22 V`);
      rP.set(W(P()), "", `UB²/(π²RL) ≈ 0.1 UB²/RL at Ûa = 2UB/π = ${(2 * ub / Math.PI).toFixed(1)} V, not at full output; the notes: 6 W`);
      rE.set(`${(classBEfficiency(ua, ub) * 100).toFixed(1)} %`, "", "(π/4)·Ûa/UB; the rest voltage keeps it under 78.5 %");
    };
    const s1 = h("div", { class: "stage" }, c1, h("div", { class: "controls" },
      slider({ label: "Load power PL", unit: "W", min: 5, max: 60, value: st.PL, step: 1, format: v => `${v.toFixed(0)} W`, onInput: v => { st.PL = v; all(); } }),
      slider({ label: "Rest voltage UCE,Rest", unit: "V", min: 1, max: 4, value: st.rest, step: 0.1, format: v => `${v.toFixed(1)} V`, onInput: v => { st.rest = v; all(); } }),
      rU.el, rP.el, rE.el,
      h("p", { class: "hint" }, "Each transistor of the class-B stage carries one half wave. Its loss PvT = (1/RL)(UB Ûa/π − Ûa²/4) (B1/3) is greatest at Ûa = 0.637 UB, not at full drive: the heat sink must be sized for that amplitude. RL = 8 Ω.")));

    // Step 2: the heat sink.
    const c2 = h("div", { class: "plot" }), rG = readout("Case ϑG = Tj,max − P·RthJC"), rK = readout("Heat sink ϑKB, through the mica"), rS = readout("Largest sink resistance Rth,KB-U"), rJ = readout("Junction with the chosen sink");
    const sink = () => {
      const q = { P: P(), Tj: TJ, RthJC: RTHJC, RthMount: RTHMOUNT, Tamb: st.Tamb }, ch = heatSinkChain(q), Tj = junctionTemp(q, st.sink);
      const xs = [0, 1, 2, 3], ys = [Tj, Tj - q.P * RTHJC, Tj - q.P * (RTHJC + RTHMOUNT), st.Tamb];
      c2.replaceChildren(lineChart({ lines: [{ x: xs, y: ys, name: "with the chosen sink" }, { x: xs, y: [TJ, ch.case, ch.sink, st.Tamb], name: "at the limit", cls: "second" }],
        xMin: 0, xMax: 3, yMin: 0, yMax: 200, xFormat: v => ["junction", "case", "sink", "air"][Math.round(v)] ?? "", xLabel: "From the junction to the air", yLabel: "Temperature [°C]",
        label: "Temperatures along the thermal chain: junction, case, heat sink, air" }));
      rG.set(C(ch.case), "", `${TJ} °C − ${W(q.P)} · ${RTHJC} K/W; the notes, with P rounded to 6 W: 138.48 °C`);
      rK.set(C(ch.sink), "", `RthG-KB = ${RTHMOUNT} K/W for mica and paste; the notes, with 6 W: 135.5 °C`);
      rS.set(`${ch.RthSink.toFixed(2)} K/W`, "", `(ϑKB − ϑU)/(2P), both transistors on one sink; the notes, with 6 W: 7.125 K/W`);
      rJ.set(C(Tj), Tj > TJ ? "danger" : "", Tj > TJ ? `above Tj,max = ${TJ} °C: take a larger sink` : "within Tj,max");
    };
    const s2 = h("div", { class: "stage" }, c2, h("div", { class: "controls" },
      slider({ label: "Air temperature ϑU", unit: "°C", min: 20, max: 70, value: st.Tamb, step: 1, format: v => `${v.toFixed(0)} °C`, onInput: v => { st.Tamb = v; sink(); } }),
      slider({ label: "Chosen heat sink Rth,KB-U", unit: "K/W", min: 1, max: 15, value: st.sink, step: 0.1, format: v => `${v.toFixed(1)} K/W`, onInput: v => { st.sink = v; sink(); } }),
      rG.el, rK.el, rS.el, rJ.el,
      h("p", { class: "hint" }, "Heat flows like current and temperature drops like voltage: ΔT = P·Rth, PT = (Tj − Tk)/(RthB + RthK) (2.25). The BD243/BD244 have RthJC = 1.92 K/W and Tj,max = 150 °C (their data sheets, quoted in B1/4); each puts its loss through its own mica washer, the sink carries both. The notes pick an SK 31 profile, at least 44.5 mm long."),
      h("p", { class: "hint" }, "The loss is the worst case of step 1, for a sine; music rarely holds that amplitude (B1/3).")));

    // Step 3: the AB bias and temperature.
    const rV = readout("Voltages, −2 mV/K per junction"), rI = readout("Quiescent current IC0 = (UB0 − 2UBE)/(R1 + R2)"), rQ = readout("Loss at rest, both transistors"), rL = readout("Load power kept, (RL/(RL + R1))²");
    const bias = () => {
      const b = abBiasWarm(st.dTD, st.dTT), I = b.IC0;
      rV.set(`UB0 = ${b.UB0.toFixed(2)} V, 2UBE = ${b.twoUBE.toFixed(2)} V`, "", "Strasser (2015), p. 166: UBE falls by 1.7…2.4 mV/K at constant IC, about 2 mV/K");
      rI.set(`${(I * 1000).toFixed(0)} mA`, I > 0.1 ? "warn" : I < 0 ? "danger" : "", I < 0 ? "the diodes give less than the bases need: class B, crossover distortion" : "with R1 + R2 = 1 Ω; the notes: 50 mA cold, 200 mA hot");
      rQ.set(W(Math.max(0, 2 * UB() * I)), "", "2·UB·IC0, on top of the signal's loss in step 1");
      rL.set(`${(emitterLoss(RL, 0.5) * 100).toFixed(1)} %`, "", "R1 = R2 = 0.5 Ω in series with the 8 Ω load in each half wave (p. 30)");
    };
    const s3 = h("div", { class: "stage" }, h("div", { class: "controls" },
      slider({ label: "Diodes warmer than 20 °C by ΔTD", unit: "K", min: 0, max: 120, value: st.dTD, step: 1, format: v => `${v.toFixed(0)} K`, onInput: v => { st.dTD = v; bias(); } }),
      slider({ label: "Transistor junctions warmer by ΔTT", unit: "K", min: 0, max: 120, value: st.dTT, step: 0.5, format: v => `${v.toFixed(1)} K`, onInput: v => { st.dTT = v; bias(); } }),
      rV.el, rI.el, rQ.el, rL.el),
      h("div", { class: "controls" },
        h("p", { class: "hint" }, "Two diodes between the bases set the class-AB bias (Bild 2.10). Cold, at 20 °C, UB0 = 1.4 V and 2UBE = 1.35 V leave 50 mV over R1 + R2 = 1 Ω: IC0 = 50 mA. Warm, the diodes drop to 1.2 V but the much hotter transistors to 2UBE = 1.0 V: the 200 mV left drive IC0 = 200 mA (p. 30). A forward voltage falls as its junction warms; the transistors sit hotter than the diodes, so the bias grows with the heat it makes."),
        h("p", { class: "hint" }, "The notes' warm case follows from −2 mV/K with the diodes 50 K and the transistors 87.5 K warmer; that pairing is this lab's reading of their numbers. Warm both alike and the bias stays put: that is why the diodes sit on the heat sink. A larger IC0 heats the transistors further; when that feeds itself the stage runs away thermally (p. 166).")));

    const all = () => { supply(); sink(); bias(); };
    root.append(tabs("Steps of the worked example", [["1 · Supply and loss", s1], ["2 · Heat sink", s2], ["3 · Bias", s3]]));
    all();
  },
};
