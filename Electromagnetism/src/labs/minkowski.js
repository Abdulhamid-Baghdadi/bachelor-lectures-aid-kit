// A Minkowski diagram, Einstein (1905) p. 902: the frame k moving at v draws its own axes into K's diagram, the ct' axis
// along the world line x = v t, the x' axis along t' = 0. Drag an event and read its coordinates in both frames; the
// line through it parallel to the x' axis is what k calls "now".
import { boost, interval, lorentzFactor, C0 } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { draggable } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

// One unit is one light-second: x in units of c0 · 1 s, ct likewise, so light runs at 45°.
const W = 420, H = 420, O = W / 2, U = 40, R = 4.8;
const px = x => O + x * U, py = ct => O - ct * U;

export default {
  id: "minkowski",
  art: () => a.picture("A space-time diagram: upright and level axes, a tilted pair of axes for a moving frame, and the light cone",
    a.line([[100, 140], [100, 10]], a.DIM, 2) + a.line([[30, 75], [170, 75]], a.DIM, 2) +
      a.line([[35, 140], [165, 10]], a.ACC, 2, "4 4") + a.line([[165, 140], [35, 10]], a.ACC, 2, "4 4") +
      a.arrow(100, 75, 130, 15, a.HOT, 3) + a.arrow(100, 75, 160, 45, a.HOT, 3) + a.circle(140, 30, 5, a.COOL, 3, a.COOL)),
  mount(root) {
    let beta = 0.5, ev = { ct: 3, x: 1.5 };
    const pic = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img",
      "aria-label": "Minkowski diagram: the resting frame's axes, the moving frame's tilted axes with its time ticks, the light cone and one event" });
    const rK = readout("Event in K (ct, x)"), rk = readout("Event in k (ct', x')"), rS = readout("Interval (ct)² − x², both frames"), rG = readout("Lorentz factor γ");
    const seg = (p, q, cls) => s("line", { x1: px(p[1]), y1: py(p[0]), x2: px(q[1]), y2: py(q[0]), class: cls });
    const update = () => {
      const v = beta * C0, g = lorentzFactor(v);
      // In light-seconds: an event of k at (ct', x') lies in K at ct = γ(ct' + β x'), x = γ(x' + β ct').
      const fromK = (ctp, xp) => [g * (ctp + beta * xp), g * (xp + beta * ctp)];
      const e = boost({ t: ev.ct, x: ev.x * C0 }, v), ctp = e.t, xp = e.x / C0;
      const parts = [
        ...[-4, -3, -2, -1, 1, 2, 3, 4].flatMap(n => [seg([n, -R], [n, R], "grid"), seg([-R, n], [R, n], "grid")]),
        seg([-R, 0], [R, 0], "axis"), seg([0, -R], [0, R], "axis"),
        seg([-R, -R], [R, R], "light"), seg([-R, R], [R, -R], "light"),
        seg(fromK(-R / g, 0), fromK(R / g, 0), "axis moving"), seg(fromK(0, -R / g), fromK(0, R / g), "axis moving"),
        // Ticks one second of k's own time apart on its ct' axis: further apart in K's diagram by γ.
        ...[1, 2, 3, 4].filter(n => g * n < R).map(n => { const p = fromK(n, 0); return s("circle", { cx: px(p[1]), cy: py(p[0]), r: 4, class: "probe" }); }),
        // k's line of "now" through the event, and K's.
        seg(fromK(ctp, -R * 2), fromK(ctp, R * 2), "marker series"), seg([ev.ct, -R], [ev.ct, R], "grid zero"),
        s("circle", { cx: px(ev.x), cy: py(ev.ct), r: 7, class: "charge" }),
        s("text", { x: O + 6, y: 16, class: "tick" }, "ct [light-seconds]"),
        s("text", { x: W - 6, y: O - 6, class: "tick", "text-anchor": "end" }, "x [light-seconds]"),
        s("text", { x: 6, y: H - 8, class: "tick" }, "dots: ticks of k's clock, 1 s apart in its own time"),
      ];
      pic.replaceChildren(...parts);
      rK.set(`ct = ${ev.ct.toFixed(2)}, x = ${ev.x.toFixed(2)} light-seconds`);
      rk.set(`ct' = ${ctp.toFixed(2)}, x' = ${xp.toFixed(2)} light-seconds`, "", ctp * ev.ct < 0 ? "the two frames disagree on whether it lies in the future" : "");
      const s2 = interval({ t: ev.ct, x: ev.x * C0 }) / C0 ** 2;
      rS.set(`${s2.toFixed(2)} (light-seconds)²`, "", s2 > 0 ? "time-like: some frame sees it here, at x' = 0" : s2 < 0 ? "space-like: some frame sees it now" : "on the light cone");
      rG.set(g.toFixed(3));
    };
    const sv = slider({ label: "Speed of k, v/c0", unit: "", min: -0.9, max: 0.9, value: beta, step: 0.05, format: v => v.toFixed(2), onInput: v => { beta = v; update(); } });
    const st = slider({ label: "Event time ct", unit: "light-seconds", min: -4, max: 4, value: ev.ct, step: 0.1, format: v => v.toFixed(1), onInput: v => { ev.ct = v; update(); } });
    const sx = slider({ label: "Event place x", unit: "light-seconds", min: -4, max: 4, value: ev.x, step: 0.1, format: v => v.toFixed(1), onInput: v => { ev.x = v; update(); } });
    draggable(pic, (x, y) => {
      ev = { ct: Math.round(Math.max(-4, Math.min(4, (O - y) / U)) * 10) / 10, x: Math.round(Math.max(-4, Math.min(4, (x - O) / U)) * 10) / 10 };
      st.set(ev.ct); sx.set(ev.x); update();
    });
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" }, sv, st, sx, rK.el, rk.el, rS.el, rG.el,
      h("p", { class: "hint" }, "Drag the event, or use the sliders. The dashed line through it is everything k calls simultaneous with it; the faint level line is K's. Speed k up and its axes close in on the light cone, and its clock ticks spread out: time dilation. The interval never changes."))));
    update();
  },
};
