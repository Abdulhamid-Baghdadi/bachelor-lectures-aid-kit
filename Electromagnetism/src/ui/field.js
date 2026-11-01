// Drawing fields: a colour map of a scalar on a grid, arrows for a vector field, a polar plot, and the clock that
// drives an animation with a pause button. Knows no law: the lab hands it numbers.
import { h, s } from "./kit.js";

/** A diverging colour for v in [−1, 1]: blue for negative, red for positive, the panel colour at zero. Sign is also
 *  shown by the contour lines and labels the lab draws, so colour is never the only signal. */
export const diverging = v => {
  const t = Math.max(-1, Math.min(1, v));
  return t >= 0 ? `color-mix(in srgb, var(--pos) ${Math.round(t * 85)}%, var(--panel))`
                : `color-mix(in srgb, var(--neg) ${Math.round(-t * 85)}%, var(--panel))`;
};

/** A grid of cells coloured by value(x, y) / scale, x and y in the drawing's own units (0..W, 0..H). */
export function heatmap(W, H, nx, ny, value, scale, colour = diverging) {
  const g = s("g", { class: "heat" });
  const dx = W / nx, dy = H / ny;
  for (let i = 0; i < ny; i++) for (let j = 0; j < nx; j++) {
    const v = value((j + 0.5) * dx, (i + 0.5) * dy) / scale;
    g.append(s("rect", { x: (j * dx).toFixed(1), y: (i * dy).toFixed(1), width: (dx + 0.6).toFixed(1), height: (dy + 0.6).toFixed(1), fill: colour(v) }));
  }
  return g;
}

/** An arrow from (x, y) of length len along angle a (radians, SVG y down). */
export function arrow(x, y, a, len, cls = "vec") {
  const x2 = x + len * Math.cos(a), y2 = y + len * Math.sin(a), hd = Math.min(6, len * 0.45);
  const p = d => `${(x2 - hd * Math.cos(a + d)).toFixed(1)},${(y2 - hd * Math.sin(a + d)).toFixed(1)}`;
  return s("g", { class: cls }, s("line", { x1: x.toFixed(1), y1: y.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1) }),
    s("polygon", { points: `${p(-0.5)} ${x2.toFixed(1)},${y2.toFixed(1)} ${p(0.5)}` }));
}

/** Arrows on a grid for a vector field vec(x, y) → [vx, vy] (y up): direction exact, length on a log scale so weak
 *  and strong regions both show. */
export function arrows(W, H, nx, ny, vec, cls = "vec") {
  const g = s("g", {});
  const cell = Math.min(W / nx, H / ny);
  const all = [];
  for (let i = 0; i < ny; i++) for (let j = 0; j < nx; j++) {
    const x = (j + 0.5) * W / nx, y = (i + 0.5) * H / ny, [vx, vy] = vec(x, y), m = Math.hypot(vx, vy);
    if (Number.isFinite(m) && m > 0) all.push({ x, y, a: Math.atan2(-vy, vx), m });
  }
  const max = Math.max(...all.map(v => v.m));
  for (const v of all) {
    const k = Math.max(0, 1 + Math.log10(v.m / max) / 3);
    if (k > 0.05) g.append(arrow(v.x, v.y, v.a, cell * 0.85 * k, cls));
  }
  return g;
}

/** Lets the reader drag on a drawing: pointer down anywhere, then move; onDrag gets the point in the drawing's own
 *  units. Mouse, pen and touch alike. The sliders stay as the keyboard's way to the same values. */
export function draggable(svg, onDrag) {
  const at = e => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    onDrag(p.x, p.y);
  };
  svg.classList.add("draggable");
  svg.addEventListener("pointerdown", e => { svg.setPointerCapture(e.pointerId); at(e); e.preventDefault(); });
  svg.addEventListener("pointermove", e => { if (svg.hasPointerCapture(e.pointerId)) at(e); });
}

/** A polar plot of r(θ) in [0, 1], θ from the vertical axis (the dipole axis), both halves. */
export function polar(size, r, label) {
  const c = size / 2, R = size / 2 - 24;
  const pts = [];
  for (let k = 0; k <= 360; k++) {
    const th = k * Math.PI / 180, v = r(th) * R;
    pts.push(`${(c + v * Math.sin(th)).toFixed(1)},${(c - v * Math.cos(th)).toFixed(1)}`);
  }
  return s("svg", { viewBox: `0 0 ${size} ${size}`, class: "chart", role: "img", "aria-label": label },
    ...[0.25, 0.5, 0.75, 1].map(f => s("circle", { cx: c, cy: c, r: f * R, class: "grid", fill: "none" })),
    s("line", { x1: c, y1: 10, x2: c, y2: size - 10, class: "axis" }),
    s("line", { x1: 10, y1: c, x2: size - 10, y2: c, class: "grid" }),
    s("polygon", { points: pts.join(" "), class: "lobe" }),
    s("text", { x: c + 6, y: 18, class: "tick" }, "θ = 0 (dipole axis)"),
    s("text", { x: size - 12, y: c - 6, class: "tick", "text-anchor": "end" }, "θ = 90°"));
}

/** A clock for an animation: calls tick(t) with t in seconds of animation time; a button pauses and plays. Starts
 *  paused when the reader asked for reduced motion (WCAG 2.3.3), and stops when the lab leaves the page. */
export function clock(tick, { label = "Play" } = {}) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let running = !still, t = 0, last = null;
  const button = h("button", { type: "button", class: "press", "aria-pressed": String(running) }, running ? "Pause" : label);
  const frame = now => {
    if (!button.isConnected && last !== null) { last = null; return requestAnimationFrame(wait); }
    if (running && last !== null) t += Math.min(0.1, (now - last) / 1000);
    last = now;
    tick(t);
    requestAnimationFrame(frame);
  };
  // Off the page, poll slowly instead of drawing every frame.
  const wait = () => button.isConnected ? requestAnimationFrame(frame) : setTimeout(() => requestAnimationFrame(wait), 400);
  button.addEventListener("click", () => {
    running = !running;
    button.setAttribute("aria-pressed", String(running));
    button.textContent = running ? "Pause" : label;
  });
  // Draw once now: a tab in the background, or a browser that holds back animation frames, still shows the lab.
  tick(t);
  requestAnimationFrame(frame);
  return { el: button, draw: () => tick(t) };
}
