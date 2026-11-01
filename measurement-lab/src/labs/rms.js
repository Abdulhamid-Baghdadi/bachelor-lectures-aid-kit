// What a meter shows for a waveform that is not a sine (Schrüfer et al. 2012, section 2.1.3; the lab script's task
// 1.2.3): a moving-coil meter averages, a rectifier meter averages the magnitude and multiplies by the sine's form
// factor 1.11, a true-RMS meter squares and averages.
import { WAVES, distorted, meterReadings, FORM_SINE } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "rms",
  art: () => a.picture("A square wave and a sine under two meter dials that disagree",
    a.line([[12, 105], [12, 75], [52, 75], [52, 135], [92, 135], [92, 105]], a.INK, 3) +
      a.path("M108 105 C118 65 132 65 140 105 S162 145 172 105", a.COOL, 3) +
      a.path("M30 50 A28 28 0 0 1 86 50", a.DIM, 2) + a.line([[58, 50], [74, 26]], a.ACC, 3) +
      a.path("M114 50 A28 28 0 0 1 170 50", a.DIM, 2) + a.line([[142, 50], [158, 28]], a.ACC, 3)),
  mount(root) {
    let kind = "triangle", third = 0.3;
    const box = h("div", {}), rC = readout("Moving coil, linear mean"), rR = readout("Rectifier meter, 1.11 × rectified mean"),
      rT = readout("True RMS"), rE = readout("Rectifier meter's error"), rF = readout("Form and crest factor");
    const thirdCtl = slider({ label: "Third harmonic, share of the fundamental", unit: "%", min: 0, max: 60, value: 100 * third, step: 1,
      format: v => `${v} %`, onInput: v => { third = v / 100; update(); } });
    const update = () => {
      const f = kind === "distorted" ? distorted(third) : WAVES[kind].f, m = meterReadings(f), xs = Array.from({ length: 401 }, (_, k) => k / 400);
      thirdCtl.el.style.display = kind === "distorted" ? "" : "none"; // the kit's grid would override hidden
      const flat = y => xs.map(() => y);
      box.replaceChildren(lineChart({ label: "One period of the waveform with the values the three meters work from",
        lines: [{ x: xs, y: xs.map(f), name: "u(t)" }, { x: xs, y: flat(m.rectified), name: "rectified mean", cls: "second" },
                { x: xs, y: flat(m.rms), name: "RMS", cls: "third" }],
        xLabel: "Time t / period T [1]", yLabel: "Voltage u / peak û [1]", yMin: -1.1, yMax: 1.1, xFormat: v => v.toFixed(1) }));
      const pct = v => `${(100 * v).toFixed(1)} % of û`;
      rC.set(pct(m.movingCoil), "", "eq. 2.36: zero for any pure AC signal");
      rR.set(pct(m.rectifier), "", `${FORM_SINE.toFixed(4)} × ${pct(m.rectified)}`);
      rT.set(pct(m.trueRms), "", "eqs. 2.38–2.39");
      const e = m.rectifierError;
      rE.set(`${e >= 0 ? "+" : ""}${(100 * e).toFixed(1)} %`, Math.abs(e) > 0.01 ? "warn" : "", Math.abs(e) > 0.01 ? "reads wrong: the scale assumes a sine" : "right, as for a sine");
      rF.set(`${m.form.toFixed(3)} and ${m.crest.toFixed(3)}`, "", "RMS/rectified mean and peak/RMS; a sine has 1.11 and 1.41");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Waveform", [...Object.entries(WAVES).map(([k, w]) => [k, w.name]), ["distorted", "Sine with a third harmonic"]], kind, v => { kind = v; update(); }),
      thirdCtl.el, rC.el, rR.el, rT.el, rE.el, rF.el,
      h("p", { class: "hint" }, "A rectifier meter's scale is the rectified mean times 1.11, right only for a sine (p. 98–99): a square wave reads 11 % high, a triangle 3.8 % low. A narrow pulse has a high crest factor, which a true-RMS meter must also handle. The lab script compares an oscilloscope and two multimeters on sine, triangle and square at 1 kHz to 1 MHz (task 1.2.3). Harmonics and THD are in the Signals and Systems lab."))));
    update();
  },
};
