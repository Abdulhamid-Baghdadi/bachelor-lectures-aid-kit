// Fading in space, Lasser (2012) chapter 13: two plane waves meeting at an angle φ build a standing pattern of
// field-strength hills and holes; the holes lie λ/(2 sin(φ/2)) apart and are (A1 − A2)/(A1 + A2) deep. A car driving
// through the pattern fades at the difference of the two Doppler shifts (13.12, p. 151). Drag to steer the car.
import { twoWaveField, fadeSpacing, fadeDepth, doppler, C0, si } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { heatmap, arrow, clock, draggable } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

const W = 460, H = 300, deg = Math.PI / 180;

export default {
  id: "fading",
  art: () => a.picture("Two wave fronts crossing, with stripes of strong and weak field and a car driving across them",
    [0, 1, 2, 3, 4, 5].map(k => a.line([[20 + k * 30, 20], [50 + k * 30, 130]], a.DIM, 2)).join("") +
      [0, 1, 2, 3, 4, 5].map(k => a.line([[50 + k * 30, 20], [20 + k * 30, 130]], a.COOL, 2)).join("") +
      a.rect(80, 64, 40, 22, a.ACC, 3) + a.arrow(122, 75, 160, 75, a.ACC, 3)),
  mount(root) {
    let f = 900e6, phi = 45, ddB = 2, v = 60 / 3.6, heading = 90;
    const pic = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic field", role: "img", "aria-label": "Field strength of two crossing waves, stripes of hills and holes, and a car's path through them" });
    const rS = readout("Distance between fades λ_S = λ / (2 sin(φ/2))"), rD = readout("Depth of the fades"), rR = readout("Fades per second along this heading"), rF = readout("Doppler shifts of the two waves");
    let cx = W / 2, cy = H / 2;
    const draw = t => {
      const lam = C0 / f, A2 = 10 ** (-ddB / 20), ph = phi * deg, hd = heading * deg;
      const span = 6 * lam / W; // the drawing shows six wavelengths across
      // The two Doppler shifts, from the angle between the car's heading and each wave's direction of travel.
      const fd1 = doppler(f, v, hd), fd2 = doppler(f, v, hd - ph), rate = Math.abs(fd1 - fd2);
      const tt = t % 4, px = cx + Math.cos(hd) * (tt - 2) * 40, py = cy - Math.sin(hd) * (tt - 2) * 40;
      pic.replaceChildren(
        heatmap(W, H, 92, 60, (x, y) => twoWaveField(1, A2, lam, ph, x * span, (H - y) * span) / (1 + A2) * 2 - 1, 1),
        arrow(20, H - 20, 0, 50, "vec"), s("text", { x: 74, y: H - 16, class: "tick" }, "wave 1"),
        arrow(20, H - 20, -ph, 50, "vec"), s("text", { x: 20 + 56 * Math.cos(ph), y: H - 24 - 56 * Math.sin(ph), class: "tick" }, "wave 2"),
        s("line", { x1: cx - Math.cos(hd) * 120, y1: cy + Math.sin(hd) * 120, x2: cx + Math.cos(hd) * 120, y2: cy - Math.sin(hd) * 120, class: "radius" }),
        s("circle", { cx: px, cy: py, r: 8, class: "probe" }));
      rS.set(si(fadeSpacing(lam, ph), "m"));
      const depth = fadeDepth(1, A2);
      rD.set(`${(20 * Math.log10(depth)).toFixed(1)} dB`, "", "the weakest field against the strongest");
      rR.set(`${rate.toFixed(1)} /s`, "", `${Math.abs(fd1).toFixed(1)} Hz and ${Math.abs(fd2).toFixed(1)} Hz apart`);
      // A shift that rounds to zero is shown as 0, not −0.0.
      const hz = x => `${Math.abs(x) < 0.05 ? "0" : x.toFixed(1)} Hz`;
      rF.set(`${hz(fd1)}, ${hz(fd2)}`);
    };
    const c = clock(draw);
    const sh = slider({ label: "Car heading, from wave 1's direction", unit: "°", min: 0, max: 180, value: heading, step: 1, format: x => `${x} °`, onInput: x => { heading = x; c.draw(); } });
    // Drag: the car heads from the centre towards the pointer.
    draggable(pic, (x, y) => { let g = Math.atan2(cy - y, x - cx) / deg; if (g < 0) g += 180; heading = Math.round(g); sh.set(heading); c.draw(); });
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      slider({ label: "Frequency f", unit: "Hz", min: 1e8, max: 6e9, value: f, log: true, onInput: x => { f = x; c.draw(); } }),
      slider({ label: "Angle between the waves φ", unit: "°", min: 5, max: 180, value: phi, step: 1, format: x => `${x} °`, onInput: x => { phi = x; c.draw(); } }),
      slider({ label: "Wave 2 weaker by", unit: "dB", min: 0, max: 20, value: ddB, step: 0.5, format: x => `${x} dB`, onInput: x => { ddB = x; c.draw(); } }),
      slider({ label: "Speed v", unit: "km/h", min: 0, max: 200, value: 60, step: 5, format: x => `${Math.round(x)} km/h`, onInput: x => { v = x / 3.6; c.draw(); } }),
      sh, c.el, rS.el, rD.el, rR.el, rF.el,
      h("p", { class: "hint" }, "Drag on the drawing to steer the car. Drive along the stripes and the field stays steady: no fading. Drive across them and you fade fastest. Equal waves (0 dB) give holes of zero field; 2 dB apart they are 18.8 dB deep. The picture shows six wavelengths across."))));
  },
};
