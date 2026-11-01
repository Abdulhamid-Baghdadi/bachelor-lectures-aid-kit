// The free-space link budget, Lasser (2012) p. 140: P_e = P_s G_s G_e (λ/(4πd))² (12.6), the basic transmission loss
// between isotropic antennas L_ISO = −20 log(λ/(4πd)) (12.10), and in dB P_e = P_s + G_s − L_ISO + G_e (12.9), drawn as
// a level plan.
import { link, dB, fromdB, si } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "friis",
  art: () => a.picture("A level plan: the signal level rising at each antenna and falling steeply across the path",
    a.line([[20, 40], [50, 40], [60, 25], [140, 110], [150, 95], [180, 95]], a.ACC, 3) + a.line([[20, 130], [180, 130]], a.DIM, 2)),
  mount(root) {
    let PsdBW = 0, Gs = 30, Ge = 30, f = 10e9, d = 50e3, noise = -120;
    const W = 460, H = 240;
    const pic = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img", "aria-label": "Level plan of the link in dBW: transmit power, plus the transmit gain, minus the path loss, plus the receive gain" });
    const rL = readout("Basic transmission loss L_ISO"), rP = readout("Received power P_e"), rM = readout("Margin over the receiver's minimum");
    const update = () => {
      const l = link(fromdB(PsdBW), fromdB(Gs), fromdB(Ge), f, d), Pe = dB(l.Pe);
      const steps = [["P_s", PsdBW], ["+ G_s", PsdBW + Gs], ["− L_ISO", PsdBW + Gs - l.Liso], ["+ G_e", Pe]];
      const top = Math.max(...steps.map(x => x[1]), noise) + 10, bot = Math.min(...steps.map(x => x[1]), noise) - 10;
      const y = v => 20 + (top - v) / (top - bot) * (H - 50), xs = [60, 160, 300, 400];
      pic.replaceChildren(s("line", { x1: 30, y1: y(noise), x2: W - 10, y2: y(noise), class: "marker series" }),
        s("text", { x: W - 12, y: y(noise) - 6, class: "tick", "text-anchor": "end" }, `receiver minimum ${noise} dBW`),
        s("polyline", { points: steps.map((st, k) => `${xs[k]},${y(st[1]).toFixed(1)}`).join(" "), class: "series", fill: "none" }),
        ...steps.flatMap((st, k) => [s("circle", { cx: xs[k], cy: y(st[1]), r: 5, class: "probe" }),
          s("text", { x: xs[k], y: y(st[1]) - 10, class: "tick", "text-anchor": "middle" }, `${st[0]}: ${st[1].toFixed(1)} dBW`)]),
        s("text", { x: 14, y: H - 8, class: "axis-label" }, "Level [dBW] at each stage of the link"));
      rL.set(`${l.Liso.toFixed(1)} dB`); rP.set(`${Pe.toFixed(1)} dBW = ${si(l.Pe, "W")}`);
      const m = Pe - noise;
      rM.set(`${m.toFixed(1)} dB`, m < 0 ? "danger" : m < 10 ? "warn" : "", m < 0 ? "the link fails" : m < 10 ? "little room for rain or fading" : "");
    };
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      slider({ label: "Transmit power P_s", unit: "dBW", min: -30, max: 30, value: PsdBW, step: 1, format: v => `${v} dBW`, onInput: v => { PsdBW = v; update(); } }),
      slider({ label: "Transmit antenna gain G_s", unit: "dBi", min: 0, max: 50, value: Gs, step: 1, format: v => `${v} dBi`, onInput: v => { Gs = v; update(); } }),
      slider({ label: "Receive antenna gain G_e", unit: "dBi", min: 0, max: 50, value: Ge, step: 1, format: v => `${v} dBi`, onInput: v => { Ge = v; update(); } }),
      slider({ label: "Frequency f", unit: "Hz", min: 1e8, max: 1e11, value: f, log: true, onInput: v => { f = v; update(); } }),
      slider({ label: "Distance d", unit: "m", min: 100, max: 1e6, value: d, log: true, onInput: v => { d = v; update(); } }),
      slider({ label: "Receiver minimum P_e,min", unit: "dBW", min: -160, max: -60, value: noise, step: 1, format: v => `${v} dBW`, onInput: v => { noise = v; update(); } }),
      rL.el, rP.el, rM.el,
      h("p", { class: "hint" }, "Double the distance: 6 dB more loss. Raise the frequency with fixed gains and the loss grows, yet with fixed antenna areas it falls (12.7): the larger gain of the same dish at a shorter wavelength wins. The notes' remark beside (12.6) explains why free space does not 'damp' low frequencies less."))));
    update();
  },
};
