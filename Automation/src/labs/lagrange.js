// Euler–Lagrange equations (Kugi et al. 2015, section 2.3, Example 2.20): a ball rolling on a beam that turns about
// its centre. The Lagrangian (2.212) gives the coupled equations (2.214), simulated here with rk4. A motor holds the
// beam near a set angle (a PD law of our own, not in the notes) so the ball's rolling can be watched.
import { ballBeamRun, ballBeamEnergy, si } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import { clock } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

const PAR = { mK: 0.1, rK: 0.02, thB: 0.05, g: 9.81 }, L = 0.5, TEND = 4, N = 800, S = 360;

export default {
  id: "lagrange",
  art: () => a.picture("A ball rolling on a tilted beam that turns about its centre",
    a.line([[25, 100], [175, 60]], a.INK, 4) + a.circle(100, 80, 5, a.INK, 3, a.INK) + a.line([[100, 85], [100, 130]], a.DIM, 2) +
      a.circle(145, 56, 10, a.ACC, 3) + a.arrow(132, 48, 108, 54, a.ACC, 2)),
  mount(root) {
    let ref = 0.05, r0 = 0.2, run, end;
    const pic = s("svg", { viewBox: "0 0 460 220", class: "schematic", role: "img", "aria-label": "A ball rolling along a beam that a motor holds at an angle" });
    const box = h("div", {});
    const rr = readout("Ball position r"), pr = readout("Beam angle φ1"), er = readout("Rest torque for this r, g mK r");
    const update = () => {
      const tau = ([p, w, r]) => PAR.mK * PAR.g * r * Math.cos(p) + 2 * (ref - p) - 0.6 * w;
      run = ballBeamRun(PAR, [0, 0, r0, 0], tau, TEND, N);
      end = run.x.findIndex(x => Math.abs(x[2]) > L);
      if (end < 0) end = N;
      box.replaceChildren(lineChart({ label: "Ball position along the beam against time", lines: [{ x: run.t.slice(0, end + 1), y: run.x.slice(0, end + 1).map(x => x[2]), name: "r" }],
        xLabel: "Time t [s]", yLabel: "Ball position r [m]", xMin: 0, xMax: TEND, yMin: -L, yMax: L, xFormat: v => v.toFixed(0) }));
      ck?.draw();
    };
    const draw = t => {
      const k = Math.min(end, Math.round(((t / TEND) % 1) * N)), [p, , r] = run.x[k];
      const C = [230, 120], u = [Math.cos(p), -Math.sin(p)], n = [-u[1], u[0]], rk = PAR.rK * S * 1.5;
      const at = d => [C[0] + u[0] * d * S, C[1] + u[1] * d * S];
      const ball = at(r).map((v, i) => v - n[i] * (rk + 3));
      pic.replaceChildren(s("line", { x1: C[0], y1: C[1], x2: C[0], y2: 210, class: "wire" }),
        s("line", { x1: at(-L)[0], y1: at(-L)[1], x2: at(L)[0], y2: at(L)[1], class: "wire", "stroke-width": 6 }),
        s("g", { class: "part" }, s("circle", { cx: C[0], cy: C[1], r: 6, class: "body" }), s("circle", { cx: ball[0], cy: ball[1], r: rk, class: "body" })),
        s("text", { x: 10, y: 20, class: "tick" }, k === end && end < N ? "the ball has run off the end" : `t = ${run.t[k].toFixed(1)} s`));
      rr.set(si(r, "m")); pr.set(`${(p * 180 / Math.PI).toFixed(1)}°`); er.set(si(PAR.g * PAR.mK * r, "N m"), "", "holds the beam level with the ball at rest");
    };
    let ck;
    update();
    ck = clock(draw);
    root.append(h("div", { class: "stage" }, h("div", {}, pic, box), h("div", { class: "controls" },
      slider({ label: "Set beam angle", unit: "rad", min: -0.15, max: 0.15, value: ref, step: 0.005, onInput: v => { ref = v; update(); } }),
      slider({ label: "Ball starts at r0", unit: "m", min: -0.4, max: 0.4, value: r0, step: 0.01, onInput: v => { r0 = v; update(); } }),
      ck.el, rr.el, pr.el, er.el,
      h("p", { class: "hint" }, "Tilt the beam and the ball accelerates downhill at about (5/7) g sin φ1: the rest of its weight goes into spinning the ball. With the beam level the ball would stay put anywhere, as the notes' rest positions say. Ball 0.1 kg, radius 2 cm; beam 1 m long."))));
  },
};
