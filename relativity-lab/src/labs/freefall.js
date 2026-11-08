// Free fall, Einstein (1916) pp. 772–773 and 817: in a frame falling with the ball there is no field and the thrown
// ball moves in a straight line; seen from the ground the same line, and every grid line with it, bends into a
// parabola. The frame slider blends the two pictures: height x = xFall − m g t²/2, m from 0 (falling) to 1 (ground).
import { groundHeight, apexHeight, flightTime, clockGain } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const W = 460, H = 330, L = 50, R = 450, T = 30, B = 296, N = 80;

export default {
  id: "freefall",
  art: () => a.picture("A thrown ball's path: straight in the falling frame, an arch over the flat ground in the ground frame",
    a.line([[20, 130], [90, 40]], a.ACC, 3) + a.line([[20, 130], [45, 120], [70, 95], [90, 60]], a.DIM, 2) +
      a.path("M110 130 Q145 10 180 130", a.ACC, 3) + a.line([[105, 130], [185, 130]], a.HOT, 3)),
  mount(root) {
    let m = 1, v = 10, g = 9.81, playing = false;
    const pic = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img",
      "aria-label": "Height against time of a thrown ball, with the grid of the falling frame and the ground, between the falling and the ground frame" });
    const rA = readout("Highest point"), rT = readout("Time in the air"), rC = readout("Clock at the top gains, per day");
    const update = () => {
      const tf = flightTime(v, g), top = apexHeight(v, g), lo = -0.6 * top, hi = 1.6 * top;
      const px = t => L + (t / tf) * (R - L), py = x => B - (x - lo) / (hi - lo) * (B - T);
      // A path, not a polyline: the kit draws every schematic polyline as a wire.
      const path = (f, cls) => s("path", { class: cls, fill: "none",
        d: Array.from({ length: N + 1 }, (_, i) => { const t = i / N * tf; return `${i ? "L" : "M"}${px(t).toFixed(1)},${py(groundHeight(f(t), t, m * g)).toFixed(1)}`; }).join(" ") });
      const levels = Array.from({ length: 24 }, (_, k) => lo + k * top / 2);
      pic.replaceChildren(
        s("clipPath", { id: "ff-clip" }, s("rect", { x: L, y: T, width: R - L, height: B - T })),
        s("g", { "clip-path": "url(#ff-clip)" },
          ...Array.from({ length: 9 }, (_, k) => s("line", { x1: px(k / 8 * tf), y1: T, x2: px(k / 8 * tf), y2: B, class: "grid" })),
          ...levels.map(x0 => path(() => x0, "grid")),
          // The ground, x = 0 in the ground frame, rises as g t²/2 seen from the falling frame.
          path(t => g * t * t / 2, "light"),
          path(t => v * t, "axis moving")),
        s("rect", { x: L, y: T, width: R - L, height: B - T, fill: "none", class: "axis" }),
        s("text", { x: L, y: H - 8, class: "axis-label" }, `Time t [s], 0 to ${tf.toFixed(2)} s`),
        s("text", { x: 4, y: T + 10, class: "tick" }, "height"),
        s("text", { x: R, y: T - 10, class: "tick", "text-anchor": "end" },
          m < 0.02 ? "falling frame: a straight line" : m > 0.98 ? "ground frame: an arch" : "between the two frames"));
      rA.set(`${top.toFixed(2)} m`, "", "v²/(2g)");
      rT.set(`${tf.toFixed(2)} s`, "", "2v/g");
      rC.set(`${(clockGain(top, g) * 86400 * 1e12).toFixed(3)} ps`, "", "than a clock on the ground: g44 at work, eq. (72)");
    };
    const sm = slider({ label: "Frame, falling (0) to ground (1)", unit: "", min: 0, max: 1, value: m, step: 0.01, format: x => x.toFixed(2), onInput: x => { m = x; update(); } });
    const play = h("button", { type: "button" }, "Play");
    play.addEventListener("click", () => {
      playing = !playing; play.textContent = playing ? "Pause" : "Play";
      let t0 = null;
      const step = now => {
        if (!playing || !pic.isConnected) { playing = false; play.textContent = "Play"; return; }
        t0 ??= now - Math.acos(1 - 2 * m) / Math.PI * 4000;
        m = (1 - Math.cos(Math.PI * ((now - t0) / 4000))) / 2;
        sm.set(Math.round(m * 100) / 100); update(); requestAnimationFrame(step);
      };
      if (playing) requestAnimationFrame(step);
    });
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" }, sm, play,
      slider({ label: "Throw speed v", unit: "m/s", min: 1, max: 30, value: v, step: 1, format: x => `${x} m/s`, onInput: x => { v = x; update(); } }),
      slider({ label: "Field strength g", unit: "m/s²", min: 1, max: 25, value: g, step: 0.01, format: x => `${x.toFixed(2)} m/s²`, onInput: x => { g = x; update(); } }),
      rA.el, rT.el, rC.el,
      h("p", { class: "hint" }, "At 0 you ride with the ball: no field, the grid is square and the ball goes straight, while the ground (dashed) curves up towards you. Slide to 1: every grid line bends the same way and the line becomes the familiar arch. Only g44, the rate of clocks, enters the motion (p. 817). One frame undoes a uniform field; around a real planet no single frame undoes it everywhere."))));
    update();
  },
};
