// The worked example of the wave propagation notes: planning a radio link, Lasser (2012). The level plan of 12.3 for
// its own 2.4 GHz WLAN link (p. 141, Ps = 5 dBm), then what the free-space plan leaves out: an obstacle near the line
// of sight, by diffraction at a screen (10.2)–(10.4) and the first Fresnel zone (10.5), and a second path that cuts
// notches into the channel (13.4). Each step adds its loss to the plan, and the last gives the power the link needs.
import { levelPlan, obstacleLoss, fresnelRadius, fadeMargin, twoPath, C0 } from "../core/index.js";
import { h, slider, readout, tabs } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

// The notes' link (p. 141).
const LINK = { f: 2.4e9, Gs: 15, Ge: 14, Lvs: 2, Lve: 2, F: 7, B: 2e6 };
const dBm = v => `${v.toFixed(1)} dBm`, dB = v => `${v.toFixed(1)} dB`;

export default {
  id: "radiolink",
  art: () => a.picture("Two masts with a radio link between them, a hill reaching up towards the line of sight, and a reflected path off the ground",
    a.line([[20, 120], [20, 40]], a.INK, 3) + a.line([[180, 120], [180, 40]], a.INK, 3) + a.line([[20, 40], [180, 40]], a.ACC, 3) +
      a.path("M20 40 C60 10 140 10 180 40 C140 70 60 70 20 40", a.DIM, 2) + a.path("M70 130 C90 70 110 70 130 130", a.HOT, 3) +
      a.line([[20, 40], [100, 130], [180, 40]], a.DIM, 2, "4 4")),
  mount(root) {
    const st = { d: 5, SNR: 20, clear: 1, rho: 0.5 };
    const plan = (extra = 0) => levelPlan({ ...LINK, d: st.d * 1e3, SNR: st.SNR, extra });
    const lambda = C0 / LINK.f, r = () => fresnelRadius(lambda, st.d * 500, st.d * 500);
    const obstacle = () => obstacleLoss(st.clear * r(), lambda, st.d * 500, st.d * 500);

    // Step 1: the level plan in free space.
    const c1 = h("div", { class: "plot" }), rL = readout("Free-space loss L_ISO (12.10)"), rN = readout("Noise Pn (12.14)"), rPs = readout("Transmit power Ps needed");
    const levels = () => {
      const p = plan(), steps = [["Ps", p.Ps], ["after the cable", p.Ps - LINK.Lvs], ["radiated", p.Ps - LINK.Lvs + LINK.Gs],
        ["at the antenna", p.Ps - LINK.Lvs + LINK.Gs - p.Liso], ["received", p.Ps - LINK.Lvs + LINK.Gs - p.Liso + LINK.Ge],
        ["Pe at the receiver", p.PeMin]];
      const x = steps.flatMap((_, i) => [i, i + 1]), y = steps.flatMap(([, v]) => [v, v]);
      c1.replaceChildren(lineChart({ lines: [{ x, y, name: "signal level" }, { x: [0, steps.length], y: [p.Pn, p.Pn], name: "noise Pn", cls: "second" }],
        xMin: 0, xMax: steps.length, yMin: -120, yMax: 40, xFormat: v => (v === 0 ? "sender" : "receiver"),
        xLabel: "Along the link: cable, antenna, path, antenna, cable", yLabel: "Level [dBm]",
        label: `Level plan of the link: from ${dBm(p.Ps)} at the sender down to ${dBm(p.PeMin)} at the receiver, ${st.SNR} dB above the noise` }));
      rL.set(dB(p.Liso), "", `λ = ${(p.lambda * 100).toFixed(2)} cm over d = ${st.d.toFixed(1)} km; the notes: 114 dB at 5 km`);
      rN.set(dBm(p.Pn), "", `−174 dBm/Hz + ${(10 * Math.log10(LINK.B)).toFixed(0)} dBHz + ${LINK.F} dB; so Pe,min = ${dBm(p.PeMin)} for ${st.SNR} dB SNR`);
      rPs.set(dBm(p.Ps), "", `${(10 ** (p.Ps / 10)).toFixed(1)} mW; the notes: 5 dBm ≈ 3 mW at 5 km and 20 dB`);
    };
    const s1 = h("div", { class: "stage" }, c1, h("div", { class: "controls" },
      slider({ label: "Distance d", unit: "km", min: 0.5, max: 30, value: st.d, step: 0.1, format: v => `${v.toFixed(1)} km`, onInput: v => { st.d = v; all(); } }),
      slider({ label: "Required SNR", unit: "dB", min: 5, max: 35, value: st.SNR, step: 1, format: v => `${v.toFixed(0)} dB`, onInput: v => { st.SNR = v; all(); } }),
      rL.el, rN.el, rPs.el,
      h("p", { class: "hint" }, "The notes' WLAN link at 2.4 GHz (12.3, p. 141): antennas of 15 dBi and 14 dBi, 2 dB of cable at each end, a receiver of noise figure 7 dB and bandwidth 2 MHz. In decibels the plan is a sum: Ps = Pe,min + Lv,s − Gs + L_ISO − Ge + Lv,e. Double the distance and L_ISO grows by 6 dB.")));

    // Step 2: an obstacle near the line of sight.
    const c2 = h("div", { class: "plot" }), rR = readout("First Fresnel zone at mid-path (10.5)"), rO = readout("Extra loss of the obstacle (10.2)");
    const hill = () => {
      const R = r(), xs = Array.from({ length: 201 }, (_, i) => -2 + i * 0.02);
      c2.replaceChildren(lineChart({ lines: [{ x: xs, y: xs.map(q => obstacleLoss(q * R, lambda, st.d * 500, st.d * 500)), name: "extra loss" }],
        marks: [{ x: st.clear, y: obstacle(), shape: "dot" }], xMin: -2, xMax: 2, yMin: -4, yMax: 30, xFormat: v => v.toFixed(0),
        xLabel: "Clearance of the top below the line of sight, in units of r [1]", yLabel: "Extra loss [dB]",
        label: "Extra loss of a sharp obstacle at mid-path against its clearance, from the knife-edge formula" }));
      rR.set(`r = ${R.toFixed(2)} m`, "", `√(dλ/4) at d = ${st.d.toFixed(1)} km; the hill's top is ${(st.clear * R).toFixed(1)} m ${st.clear >= 0 ? "below" : "above"} the line`);
      const L = obstacle();
      rO.set(dB(L), L > 3 ? "warn" : "", st.clear === 0 ? "touching the line of sight: half the field, 6 dB (p. 108)" : L < 0 ? "a little stronger than free space: the outer, destructive half of the zone is blocked" : "");
    };
    const s2 = h("div", { class: "stage" }, c2, h("div", { class: "controls" },
      slider({ label: "Clearance of the hill, in Fresnel radii", unit: "", min: -2, max: 2, value: st.clear, step: 0.05, format: v => `${v.toFixed(2)} r`, onInput: v => { st.clear = v; all(); } }),
      rR.el, rO.el,
      h("p", { class: "hint" }, "Free space holds only while the first Fresnel ellipsoid, the points with a detour of at most λ/2, stays clear (10.3). A sharp hill at mid-path diffracts the wave: E/E0 = 1/2 − e^(−jπ/4)(C(v) + jS(v))/√2 with v from (10.4). The notes' formula gives the open path for v → −∞; their Abb. 10.1 draws it on the right, so here v = −clearance·√(2/λ·(1/ds + 1/de))."),
      h("p", { class: "hint" }, "Radio links are built so that at least the whole first zone is clear (p. 108).")));

    // Step 3: a second path, and the power the link needs.
    const c3 = h("div", { class: "plot" }), rF = readout("Fade margin for the deepest notch (13.4)"), rT = readout("Transmit power with every loss");
    const fade = () => {
      const fs = Array.from({ length: 401 }, (_, i) => i / 200);
      c3.replaceChildren(lineChart({ lines: [{ x: fs, y: fs.map(x => 20 * Math.log10(twoPath(1, st.rho, x, 1))), name: "|H| / A1" },
        { x: [0, 2], y: [-fadeMargin(st.rho), -fadeMargin(st.rho)], cls: "faint" }],
        xMin: 0, xMax: 2, yMin: -30, yMax: 8, xLabel: "Frequency offset times delay f·Δτ [1]", yLabel: "Channel gain [dB]",
        label: "The two-path channel over two notch periods, relative to the direct path" }));
      const m = fadeMargin(st.rho), base = plan(), full = plan(obstacle() + m);
      rF.set(dB(m), m > 10 ? "warn" : "", `20 log(1/(1 − ρ)) with ρ = A2/A1 = ${st.rho.toFixed(2)}`);
      rT.set(dBm(full.Ps), full.Ps > 20 ? "warn" : "", `free space ${dBm(base.Ps)} + obstacle ${dB(obstacle())} + fade ${dB(m)} = ${(10 ** (full.Ps / 10)).toFixed(1)} mW`);
    };
    const s3 = h("div", { class: "stage" }, c3, h("div", { class: "controls" },
      slider({ label: "Second path's amplitude ρ = A2/A1", unit: "", min: 0, max: 0.95, value: st.rho, step: 0.01, format: v => v.toFixed(2), onInput: v => { st.rho = v; fade(); } }),
      rF.el, rT.el,
      h("p", { class: "hint" }, "A reflection off the ground arrives Δτ later: h(τ) = A1δ(τ − τ1) + A2δ(τ − τ2) (13.2) and |H| = √(A1² + A2² + 2A1A2 cos ωΔτ) (13.4). Where the two paths cancel, the level drops by 20 log(1/(1 − ρ)); the plan needs that much in reserve. Change the distance and the hill in the earlier steps: the total follows."),
      h("p", { class: "hint" }, "The notes' example stops at free space; adding the obstacle and the fade margin to the plan is this lab's step.")));

    const all = () => { levels(); hill(); fade(); };
    root.append(tabs("Steps of the worked example", [["1 · Level plan", s1], ["2 · Obstacle", s2], ["3 · Multipath", s3]]));
    all();
  },
};
