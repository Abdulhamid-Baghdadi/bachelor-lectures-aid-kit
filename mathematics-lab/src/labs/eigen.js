// Eigenvectors of a symmetric matrix, Taschner p. 410: the matrix [[a, b], [b, c]] maps the unit circle onto an
// ellipse; along the eigenvectors, at φ0 with tan 2φ0 = 2b/(a − c) and at right angles to it, it only stretches,
// by the eigenvalues λ = Q(φ0) and μ = Q(φ0 + 90°).
import { symmetricEigen } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { board, vector, scaled, fixed } from "./plane.js";

export default {
  id: "eigen",
  art: () => a.picture("A circle stretched into a tilted ellipse, two arrows along its axes",
    a.circle(100, 75, 35, a.DIM, 2) + a.path("M40 115 C40 60 150 20 160 35 C170 50 60 130 40 115", a.ACC, 3) +
      a.arrow(100, 75, 150, 45, a.INK, 3) + a.arrow(100, 75, 115, 100, a.COOL, 3)),
  mount(root) {
    let A = 1.2, B = 0.5, C = 0.6, phi = 100;
    const box = h("div", {}), rE = readout("Eigenvalues λ and μ"), rP = readout("Angle φ0 of the first eigenvector"), rV = readout("Image of the test vector");
    const update = () => {
      const { phi0, lambda, mu } = symmetricEigen(A, B, C), M = ([x, y]) => [A * x + B * y, B * x + C * y];
      const circle = Array.from({ length: 121 }, (_, k) => [Math.cos(k * Math.PI / 60), Math.sin(k * Math.PI / 60)]);
      const u = [Math.cos(phi0), Math.sin(phi0)], w = [-Math.sin(phi0), Math.cos(phi0)], t = [Math.cos(phi * Math.PI / 180), Math.sin(phi * Math.PI / 180)], Mt = M(t);
      box.replaceChildren(board([
        s("polyline", { points: circle.map(scaled).join(" "), class: "curve faint" }),
        s("polyline", { points: circle.map(M).map(scaled).join(" "), class: "curve" }),
        vector(M(u), "one", "λu"), vector(M(w), "two", "μw"), vector(t, "faint", "v"), vector(Mt, "three", "Av")],
        "The unit circle, its image under the matrix, and the eigenvectors"));
      rE.set(`${fixed(lambda)} and ${fixed(mu)}`, "", lambda * mu < 0 ? "opposite signs: the image is turned inside out along one axis" : "");
      rP.set(`${fixed(phi0 * 180 / Math.PI, 1)}°`, "", "tan 2φ0 = 2b/(a − c)");
      const cos = (t[0] * Mt[0] + t[1] * Mt[1]) / Math.hypot(...Mt);
      rV.set(Math.abs(Math.abs(cos) - 1) < 1e-3 ? "along v: an eigenvector" : `turned by ${fixed(Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI, 1)}°`);
    };
    const k = (label, get, set, min = -1.5, max = 1.5) => slider({ label, unit: "", min, max, value: get(), step: 0.05, format: v => v.toFixed(2), onInput: v => { set(v); update(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      k("a", () => A, v => { A = v; }), k("b", () => B, v => { B = v; }), k("c", () => C, v => { C = v; }),
      slider({ label: "Test vector v at", unit: "°", min: 0, max: 180, value: phi, step: 1, format: v => `${v}°`, onInput: v => { phi = v; update(); } }),
      rE.el, rP.el, rV.el,
      h("p", { class: "hint" }, "The matrix [[a, b], [b, c]] turns the faint unit circle into the ellipse. Swing the test vector v: in general Av points elsewhere, but along the two eigenvectors it only stretches. They meet at right angles and lie along the ellipse's axes; the half-axes are |λ| and |μ|."))));
    update();
  },
};
