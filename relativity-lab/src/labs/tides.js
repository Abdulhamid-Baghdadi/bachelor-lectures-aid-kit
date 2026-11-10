// Tides, after the Newtonian limit of Einstein (1916) pp. 817–818: a ring of balls let go around a falling centre.
// Riding with the centre removes the field there, but not its change across the ring: the ring stretches along the
// radius and squeezes across it. This is what no falling frame undoes, the curvature the free-fall lab leaves out.
import { fallingRing, tidalLinear } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const W = 460, H = 330, CX = 300, CY = 165, RING = 70, N = 24;

export default {
  id: "tides",
  art: () => a.picture("A ring of balls falling towards a planet, stretched into an egg along the line to the planet",
    a.circle(40, 75, 26, a.HOT, 3) + a.circle(140, 75, 30, a.DIM, 2, "none") +
      a.path("M95 75 C95 55 185 55 185 75 C185 95 95 95 95 75", a.ACC, 3) + a.arrow(140, 75, 104, 75, a.INK, 2) + a.arrow(140, 75, 176, 75, a.INK, 2)),
  mount(root) {
    let M = 6e24, R0 = 7000e3, t = 0, playing = false;
    const pic = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img",
      "aria-label": "A ring of balls seen from its falling centre: the dashed circle where they started, the ring now, and the planet off to the left" });
    const rS = readout("Along the radius"), rQ = readout("Across the radius"), rT = readout("Stretching per metre, 2KM/R³");
    const update = () => {
      const d = 1000, { reference, offsets } = fallingRing(M, R0, d, N, t);
      const R = Math.hypot(...reference), sc = RING / d;
      const along = (offsets[0][0] - offsets[N / 2][0]) / (2 * d), across = (offsets[N / 4][1] - offsets[3 * N / 4][1]) / (2 * d);
      const ring = offsets.map(([x, y]) => `${(CX + x * sc).toFixed(1)},${(CY - y * sc).toFixed(1)}`);
      pic.replaceChildren(
        s("circle", { cx: 50, cy: CY, r: 26, class: "charge" }),
        s("text", { x: 8, y: CY + 48, class: "tick" }, `planet, ${(R / 1e3).toFixed(0)} km away`),
        s("line", { x1: 70, y1: CY, x2: W - 10, y2: CY, class: "grid" }),
        s("circle", { cx: CX, cy: CY, r: RING, fill: "none", class: "light" }),
        s("path", { d: `M${ring.join(" L")} Z`, fill: "none", class: "axis moving" }),
        ...offsets.map(([x, y]) => s("circle", { cx: CX + x * sc, cy: CY - y * sc, r: 4, class: "probe" })),
        s("circle", { cx: CX, cy: CY, r: 3, class: "probe" }),
        s("text", { x: W - 8, y: 18, class: "tick", "text-anchor": "end" }, `seen from the falling centre, t = ${t.toFixed(0)} s`),
        s("text", { x: W - 8, y: H - 8, class: "tick", "text-anchor": "end" }, "dashed: the ring when let go"));
      rS.set(`+${(along * 100 - 100).toFixed(1)} %`, "", "stretched: the near side falls faster");
      rQ.set(`${(across * 100 - 100).toFixed(1)} %`, "", "squeezed: all fall towards one centre");
      rT.set(`${(tidalLinear(M, R0, [1, 0])[0] * 1e6).toFixed(3)} µm/s² per m`, "", "at the start; across: half, inward");
    };
    const T_MAX = 800;
    const st = slider({ label: "Time falling t", unit: "s", min: 0, max: T_MAX, value: t, step: 10, format: x => `${x} s`, onInput: x => { t = x; update(); } });
    const play = h("button", { type: "button" }, "Play");
    play.addEventListener("click", () => {
      playing = !playing; play.textContent = playing ? "Pause" : "Play";
      let last = null;
      const step = now => {
        if (!playing || !pic.isConnected) { playing = false; play.textContent = "Play"; return; }
        if (last !== null) t = (t + (now - last) / 1000 * 160) % T_MAX;
        last = now; st.set(Math.round(t / 10) * 10); update(); requestAnimationFrame(step);
      };
      if (playing) requestAnimationFrame(step);
    });
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" }, st, play,
      slider({ label: "Mass M", unit: "kg", min: 1e24, max: 1e25, value: M, step: 1e23, format: x => `${(x / 1e24).toFixed(1)} × 10²⁴ kg`, onInput: x => { M = x; update(); } }),
      slider({ label: "Starting distance R0", unit: "km", min: 6500, max: 20000, value: R0 / 1e3, step: 100, format: x => `${x} km`, onInput: x => { R0 = x * 1e3; update(); } }),
      rS.el, rQ.el, rT.el,
      h("p", { class: "hint" }, "The centre feels no field: it falls with the ring. Yet the ring turns into an egg pointing at the planet, because the field differs from ball to ball. A uniform field (the free-fall lab) has no such change, so one falling frame undoes it; a real mass cannot be undone everywhere at once. The ring is drawn 1 km across; the change grows as 1/R³."))));
    update();
  },
};
