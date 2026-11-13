// The moving background of the start pages and part overviews: a canvas behind the page, in the theme's own colours.
// Two scenes. "workshop": CNC toolpaths traced on a machine-table grid, a glowing tool tip, a few sparks where it cuts.
// "field": particles flowing along the field lines of a few slowly drifting charges. Every random choice comes from a
// seeded generator, so the same page draws the same scene on every visit (the user's rule: deterministic).
// Motion is decoration, so it gives way: none when the reader asks for reduced motion (a still frame instead, WCAG
// 2.3.3), a pause button (WCAG 2.2.2), no work while the tab is hidden, and at most 30 frames per second.

/** A seeded generator of numbers in [0, 1): mulberry32. The same seed gives the same sequence. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Whether the scene should move: only when motion is allowed, not paused, and the page is visible. */
export const shouldMove = ({ reduced, paused, hidden }) => !reduced && !paused && !hidden;

/** One toolpath in a box [x, y, w, h]: a rapid to the start, then a pocket spiral, a contour with round corners, or a
 *  ring of drilled holes. Points are [x, y, kind] with kind "rapid", "feed" or "drill". Pure. */
export function toolpath(rand, [x, y, w, h]) {
  const pts = [[x - 40, y - 40, "rapid"]];
  const kind = Math.floor(rand() * 3);
  if (kind === 0) {
    // Pocket: a rectangle spiralling inwards, the way a pocketing cycle clears steel.
    let [l, t, r, b] = [x, y, x + w, y + h];
    const step = 10 + rand() * 8;
    pts.push([l, t, "rapid"]);
    while (r - l > step * 2 && b - t > step * 2) {
      pts.push([r, t, "feed"], [r, b, "feed"], [l, b, "feed"], [l, t + step, "feed"]);
      l += step; t += step; r -= step; b -= step;
      pts.push([l, t, "feed"]);
    }
  } else if (kind === 1) {
    // Contour: round the outside of a part with rounded corners, as a finishing pass.
    const rad = Math.min(w, h) * (0.15 + rand() * 0.15), n = 6;
    const corner = (cx, cy, a0) => Array.from({ length: n + 1 }, (_, k) => {
      const a = a0 + (Math.PI / 2) * k / n; return [cx + rad * Math.cos(a), cy + rad * Math.sin(a), "feed"];
    });
    pts.push([x + rad, y, "rapid"], [x + w - rad, y, "feed"], ...corner(x + w - rad, y + rad, -Math.PI / 2),
      [x + w, y + h - rad, "feed"], ...corner(x + w - rad, y + h - rad, 0),
      [x + rad, y + h, "feed"], ...corner(x + rad, y + h - rad, Math.PI / 2),
      [x, y + rad, "feed"], ...corner(x + rad, y + rad, Math.PI));
  } else {
    // Holes on a bolt circle, each drilled where the tool stops.
    const n = 5 + Math.floor(rand() * 4), cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) * 0.4, a0 = rand() * Math.PI;
    for (let k = 0; k < n; k++) {
      const a = a0 + 2 * Math.PI * k / n;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), "rapid"], [cx + r * Math.cos(a), cy + r * Math.sin(a), "drill"]);
    }
  }
  return pts;
}

/** The electric field of point charges [{ x, y, q }] at (x, y), softened near each charge so it stays finite. Pure. */
export function field(charges, x, y) {
  let ex = 0, ey = 0;
  for (const c of charges) {
    const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy + 400, r3 = r2 * Math.sqrt(r2);
    ex += c.q * dx / r3; ey += c.q * dy / r3;
  }
  return [ex, ey];
}

const css = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();

/** Starts the scene on a fixed canvas behind the page; puts a pause button into `controls` (an element in the header).
 *  { scene: "workshop" | "field", seed, strength 0..1 } → { stop() }. */
export function startBackdrop({ scene = "workshop", seed = 12, strength = 1, controls } = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = "backdrop";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false;
  try { paused = localStorage.getItem("motion") === "off"; } catch { /* storage refused: motion on */ }

  let W = 0, H = 0, colours = {};
  const readColours = () => {
    const root = document.documentElement;
    colours = { bg: css(root, "--bg"), ink: css(root, "--ink"), accent: css(root, "--accent"), muted: css(root, "--muted"),
      spark: css(root, "--second") || css(root, "--warn"), pos: css(root, "--pos") || css(root, "--danger"), neg: css(root, "--neg") || css(root, "--accent") };
  };
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    reset();
  };

  // The scenes keep their own state; reset() lays them out again for a new size.
  const rand = rng(seed);
  let jobs = [], sparks = [], particles = [], charges = [], t = 0;
  const reset = () => {
    t = 0; sparks = [];
    if (scene === "workshop") {
      const count = Math.max(2, Math.min(5, Math.round(W * H / 260000)));
      jobs = Array.from({ length: count }, (_, k) => newJob(k / count));
    } else {
      charges = Array.from({ length: 4 }, (_, k) => ({ q: k % 2 ? -1 : 1, ax: 0.15 + rand() * 0.7, ay: 0.15 + rand() * 0.7, ph: rand() * 6.28, x: 0, y: 0 }));
      particles = Array.from({ length: Math.round(Math.min(260, W * H / 5000)) }, () => newParticle());
    }
  };
  // A new job somewhere in its share of the width (slot 0..1), so the jobs spread over the page.
  const newJob = slot => {
    const w = Math.min(W * 0.4, 140 + rand() * 180), h = Math.min(H * 0.4, 100 + rand() * 140);
    const x = 30 + (slot + rand() * 0.25) * Math.max(0, W - w - 60), y = 60 + rand() * Math.max(20, H - h - 120);
    return { pts: toolpath(rand, [Math.min(x, W - w - 20), y, w, h]), at: 0, trail: [], fade: 1 };
  };
  const newParticle = () => ({ x: rand() * W, y: rand() * H, trail: [], age: 0, life: 120 + rand() * 160 });

  const stepWorkshop = () => {
    for (let i = 0; i < jobs.length; i++) {
      const j = jobs[i];
      if (j.at >= j.pts.length - 1) { j.fade -= 0.01; if (j.fade <= 0) jobs[i] = newJob(rand()); continue; }
      const [x0, y0] = j.pts[Math.floor(j.at)], [x1, y1, kind] = j.pts[Math.floor(j.at) + 1];
      const len = Math.hypot(x1 - x0, y1 - y0) || 1, speed = kind === "rapid" ? 9 : 2.2;
      j.at = Math.min(j.pts.length - 1, j.at + speed / len);
      const f = j.at - Math.floor(j.at), x = x0 + (x1 - x0) * (f || 1), y = y0 + (y1 - y0) * (f || 1);
      j.trail.push([x, y, kind]);
      if (kind === "feed" && rand() < 0.35) sparks.push({ x, y, vx: (rand() - 0.5) * 2.4, vy: -rand() * 2, life: 18 + rand() * 14 });
      if (kind === "drill" && f === 0) j.trail.push([x, y, "hole"]);
    }
    sparks = sparks.filter(s => (s.life -= 1) > 0).map(s => ({ ...s, x: s.x + s.vx, y: s.y + s.vy, vy: s.vy + 0.12 }));
  };
  const drawWorkshop = () => {
    for (const j of jobs) {
      ctx.globalAlpha = 0.55 * strength * j.fade;
      for (let k = 1; k < j.trail.length; k++) {
        const [xa, ya] = j.trail[k - 1], [xb, yb, kind] = j.trail[k];
        if (kind === "hole") { ctx.strokeStyle = colours.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(xb, yb, 7, 0, 6.283); ctx.stroke(); continue; }
        ctx.strokeStyle = kind === "rapid" ? colours.muted : colours.accent;
        ctx.lineWidth = kind === "rapid" ? 1 : 2.2;
        ctx.setLineDash(kind === "rapid" ? [4, 6] : []);
        ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke();
      }
      ctx.setLineDash([]);
      const tip = j.trail.at(-1);
      if (tip && j.fade === 1) {
        ctx.globalAlpha = 0.9 * strength;
        const g = ctx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 16);
        g.addColorStop(0, colours.accent); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tip[0], tip[1], 16, 0, 6.283); ctx.fill();
      }
    }
    ctx.fillStyle = colours.spark;
    for (const s of sparks) { ctx.globalAlpha = strength * Math.min(1, s.life / 14); ctx.fillRect(s.x, s.y, 2, 2); }
    ctx.globalAlpha = 1;
  };

  const stepField = () => {
    t += 1;
    for (const c of charges) {
      c.x = W * (c.ax + 0.08 * Math.sin(t * 0.004 + c.ph)); c.y = H * (c.ay + 0.08 * Math.cos(t * 0.003 + c.ph * 1.3));
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i], [ex, ey] = field(charges, p.x, p.y), m = Math.hypot(ex, ey) || 1;
      p.x += 2 * ex / m; p.y += 2 * ey / m; p.age += 1;
      p.trail.push([p.x, p.y]); if (p.trail.length > 22) p.trail.shift();
      const near = charges.some(c => c.q < 0 && Math.hypot(p.x - c.x, p.y - c.y) < 14);
      if (near || p.age > p.life || p.x < -20 || p.y < -20 || p.x > W + 20 || p.y > H + 20) particles[i] = newParticle();
    }
  };
  const drawField = () => {
    ctx.lineWidth = 1.4; ctx.strokeStyle = colours.accent;
    for (const p of particles) {
      if (p.trail.length < 2) continue;
      ctx.globalAlpha = 0.45 * strength * Math.min(1, p.age / 30, (p.life - p.age) / 30);
      ctx.beginPath(); ctx.moveTo(p.trail[0][0], p.trail[0][1]);
      for (const [x, y] of p.trail) ctx.lineTo(x, y);
      ctx.stroke();
    }
    for (const c of charges) {
      ctx.globalAlpha = 0.5 * strength;
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 34);
      g.addColorStop(0, c.q > 0 ? colours.pos : colours.neg); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, 34, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const step = scene === "workshop" ? stepWorkshop : stepField, draw = scene === "workshop" ? drawWorkshop : drawField;
  const frame = () => { ctx.clearRect(0, 0, W, H); draw(); };
  // A still picture for reduced motion or pause: run the scene ahead without drawing, then draw once.
  const still = () => { for (let k = 0; k < 260; k++) step(); frame(); };

  let timer = 0, last = 0, shown = true;
  const loop = now => {
    timer = requestAnimationFrame(loop);
    if (now - last < 33) return;             // at most 30 frames per second: decoration should cost little
    last = now; step(); frame();
  };
  const update = () => {
    cancelAnimationFrame(timer); timer = 0;
    const moving = shouldMove({ reduced: reducedQuery.matches, paused, hidden: document.hidden || !shown });
    if (moving) timer = requestAnimationFrame(loop); else frame();
    if (button) {
      button.hidden = reducedQuery.matches || !shown;
      button.textContent = paused ? "Play background" : "Pause background";
      button.setAttribute("aria-pressed", String(paused));
    }
  };

  let button = null;
  if (controls) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "motion-toggle";
    button.addEventListener("click", () => {
      paused = !paused;
      try { localStorage.setItem("motion", paused ? "off" : "on"); } catch { /* the choice lasts this visit */ }
      update();
    });
    controls.prepend(button);
  }

  // The page opens with work already under way, not on an empty table (a complete first view).
  readColours(); resize(); still();
  addEventListener("resize", () => { resize(); still(); update(); });
  document.addEventListener("visibilitychange", update);
  reducedQuery.addEventListener("change", update);
  // A theme change, by the button or by the system, recolours the scene.
  new MutationObserver(() => { readColours(); frame(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { readColours(); frame(); });
  update();
  return {
    stop() { cancelAnimationFrame(timer); canvas.remove(); button?.remove(); },
    /** Shows or hides the scene, e.g. hidden while a lab is open, so nothing moves behind its equations. */
    show(on) { shown = on; canvas.hidden = !on; update(); },
  };
}
