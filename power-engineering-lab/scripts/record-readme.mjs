// Records the README's animation from the program itself: headless Edge (or Chrome) over its DevTools port, the
// clearing angle of the equal-area lab moved later step by step, one screenshot per step, then ffmpeg assembles a GIF that plays once and
// stops within 5 s (WCAG 2.2.2). Needs nothing but Node, a Chromium browser and ffmpeg.
//
//   python -m http.server 8774 --bind 127.0.0.1 --directory .. (in another terminal)
//   node scripts/record-readme.mjs
//
// Writes docs/stability-light.gif and docs/stability-dark.gif, and the stills docs/light.png (the overview, light)
// and docs/dark.png (the long-line lab, dark), 1280 × 1000.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const URL_ = process.env.LAB_URL ?? "http://127.0.0.1:8774/power-engineering-lab/#stability";
const BROWSERS = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe",
                  "/usr/bin/chromium", "/usr/bin/google-chrome"];
const FPS = 10;

// The main task: clear the fault later and later, and watch A1 outgrow A2. Slider values are the clearing angle in °.
const STEPS = [];
for (let k = 0; k <= 38; k++) STEPS.push({ t: 35 + k });
const HOLD = 8; // frames the last picture stays, so the end can be read; total under 5 s

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = fail; });
  let id = 0;
  const waiting = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
  };
  const send = (method, params = {}) => new Promise((ok, fail) => {
    const n = ++id;
    waiting.set(n, m => (m.error ? fail(new Error(`${method}: ${m.error.message}`)) : ok(m.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  return { send, close: () => ws.close() };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function record(theme, browser, PORT) {
  const profile = mkdtempSync(join(tmpdir(), "powerlab-rec-"));
  const proc = spawn(browser, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--hide-scrollbars",
    `--blink-settings=preferredColorScheme=${theme === "dark" ? 0 : 1}`, "--window-size=1100,1300", "--no-first-run", "--no-default-browser-check", URL_], { stdio: "ignore" });
  try {
    let target;
    for (let k = 0; k < 50 && !target; k++) {
      await sleep(200);
      try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(t => t.type === "page" && t.url.startsWith(URL_.split("#")[0])); } catch { /* not up yet */ }
    }
    if (!target) throw new Error(`The browser did not open its DevTools port ${PORT}: is another instance using it?`);
    const page = await cdp(target.webSocketDebuggerUrl);
    await page.send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 1300, deviceScaleFactor: 1, mobile: false });
    await page.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }, { name: "prefers-reduced-motion", value: "reduce" }] });
    // Reload so the emulated colour scheme applies from the first paint.
    await page.send("Page.reload", { ignoreCache: true });
    let ready = 0;
    for (let k = 0; k < 150 && ready < 1; k++) {
      await sleep(200);
      ready = (await page.send("Runtime.evaluate", { expression: "document.querySelectorAll('.panel input[type=range]').length", returnByValue: true })).result.value;
    }
    if (ready < 1) throw new Error(`The equal-area lab did not load at ${URL_} (the browser shows ${target.url}): start the server first (see the top of this file).`);
    // Crop to the lab's chart and controls.
    const box = (await page.send("Runtime.evaluate", { returnByValue: true, expression:
      "(() => { const r = document.querySelector('.panel .stage').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()" })).result.value;
    const frames = mkdtempSync(join(tmpdir(), "powerlab-frames-"));
    const all = [...STEPS, ...Array(HOLD).fill(STEPS.at(-1))];
    for (const [k, step] of all.entries()) {
      await page.send("Runtime.evaluate", { expression: `(() => {
        const [t] = document.querySelectorAll('.panel input[type=range]');
        t.value = ${step.t}; t.dispatchEvent(new Event('input'));
      })()` });
      const shot = await page.send("Page.captureScreenshot", { format: "png",
        clip: { x: box[0] - 8, y: box[1] - 8, width: box[2] + 16, height: box[3] + 16, scale: 0.75 } });
      writeFileSync(join(frames, `f${String(k).padStart(3, "0")}.png`), Buffer.from(shot.data, "base64"));
    }
    // The still for this theme: the overview in light, the long-line lab in dark, from the top of the page.
    await page.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
    // A fresh load, so no card keeps the focus and the page starts at its top.
    await page.send("Runtime.evaluate", { expression: `location.replace(location.pathname + '${theme === "light" ? "" : "#line"}')` });
    await sleep(2000);
    const still = await page.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(ROOT, "docs", `${theme}.png`), Buffer.from(still.data, "base64"));
    page.close();
    return frames;
  } finally {
    // Edge leaves helper processes that keep the port and the profile: end the whole tree.
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(proc.pid), "/t", "/f"], { stdio: "ignore" });
    else proc.kill();
    // Edge's helper processes hold the profile a moment after it exits.
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); }
    catch { console.warn(`Could not remove the browser's temporary profile ${profile}; delete it by hand.`); }
  }
}

const browser = BROWSERS.find(existsSync);
if (!browser) { console.error("No Chromium browser found: install Edge or Chrome, or add its path to BROWSERS."); process.exit(1); }
mkdirSync(join(ROOT, "docs"), { recursive: true });
for (const [k, theme] of ["light", "dark"].entries()) {
  const frames = await record(theme, browser, 9343 + k);
  const out = join(ROOT, "docs", `stability-${theme}.gif`);
  // A palette made from the frames keeps the GIF small and sharp; -loop -1 plays it once.
  const run = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(frames, "f%03d.png"),
    "-filter_complex", "[0]split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none",
    "-loop", "-1", out], { stdio: "inherit" });
  rmSync(frames, { recursive: true, force: true });
  if (run.status !== 0) { console.error("ffmpeg failed: is it installed and on the PATH?"); process.exit(1); }
  console.log(`Wrote ${out} (${STEPS.length + HOLD} frames, ${((STEPS.length + HOLD) / FPS).toFixed(1)} s, plays once).`);
}
