// The measurement core against a second route: a seeded Monte Carlo, a sampled average, a circuit solved by its nodes,
// an equation integrated step by step, or a number printed in Schrüfer, Reindl and Zagar (2012).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "../../src/core/index.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);
const rel = (a, b, tol, what) => near(a / b, 1, tol, what);

test("repeated readings: Beispiel 1.3 (p. 40), mean 6.5 V, s = 0.15 V, u = 0.047 V", () => {
  const r = T.repeated([6.7, 6.4, 6.3, 6.6, 6.5, 6.7, 6.5, 6.3, 6.6, 6.4]);
  near(r.mean, 6.5, 1e-12, "mean"); near(r.s, 0.15, 0.002, "s"); near(r.u, 0.047, 0.0005, "u = s/√N");
});

test("the mean of N readings scatters by s/√N (eq. 1.53): 400 seeded series of 49, as in Bild 1.11", () => {
  const means = Array.from({ length: 400 }, (_, k) => T.mean(T.readings(100 + k, 49, 100, 2.1)));
  rel(T.std(means), 2.1 / 7, 0.08, "s of the means"); near(T.mean(means), 100, 0.05, "mean of the means");
});

test("Student's t (Table 1.6, p. 44): small N widens the interval, large N tends to 1, 2, 3", () => {
  assert.equal(T.studentT(5, 2), 2.98); assert.equal(T.studentT(2, 1), 1.84); assert.equal(T.studentT(Infinity, 3), 3); assert.equal(T.studentT(1e6, 3), 3.08, "past N = 100 the last finite row");
  assert.equal(T.studentT(7, 2), 2.73, "between rows: the smaller N, on the safe side");
  // A 95.5 % interval with t covers the truth about 95 % of the time for N = 5; without t far less often.
  let withT = 0, without = 0;
  for (let k = 0; k < 4000; k++) {
    const r = T.repeated(T.readings(5000 + k, 5, 0, 1), 2);
    if (Math.abs(r.mean) <= r.expanded) withT++;
    if (Math.abs(r.mean) <= 2 * r.u) without++;
  }
  near(withT / 4000, 0.955, 0.015, "coverage with t"); assert.ok(without / 4000 < 0.9, "coverage without t");
});

test("systematic errors: Beispiel 1.2 (p. 36), P = U²/R reads 0.9 % high, by eq. 1.43 and by eq. 1.37", () => {
  near(T.relativePowerLaw([2, -1], [-0.011, -0.031]), 0.009, 1e-12, "eq. 1.43");
  const f = ([U, R]) => U * U / R, x = [10, 50];
  near(T.systematic(f, x, [-0.011 * 10, -0.031 * 50]) / f(x), 0.009, 1e-6, "eq. 1.37 with the derivatives");
});

test("Gauss's law: Beispiel 1.4 (p. 43), s = 10.3 g; and every model against a seeded Monte Carlo", () => {
  near(T.gauss(T.MODELS.weight.f, [600, 80], [9, 5]), 10.3, 0.05, "Beispiel 1.4");
  for (const [key, s] of [["power", [0.05, 0.004, 0.02]], ["weight", [9, 5]], ["heating", [0.1, 0.5]]]) {
    const m = T.MODELS[key], x = m.inputs.map(i => i[2]);
    rel(T.monteCarlo(m.f, x, s, 11, 200000).s, T.gauss(m.f, x, s), 0.02, key);
    assert.ok(T.worstCase(m.f, x, s) >= T.gauss(m.f, x, s), `${key}: worst case at least Gauss`);
  }
});

test("range extension: Beispiel 2.1, Rp = 100 Ω, and eq. 2.35, Rv = 20 Ω (pp. 91–93); Beispiel 2.2's 499 : 1", () => {
  near(T.shunt(400, 0.2e-3, 1e-3), 100, 1e-9, "Rp"); near(T.seriesResistor(0.1, 1e-3, T.parallel(400, 100)), 20, 1e-9, "Rv");
  near((9 + 90 + 400) * 0.2e-3 / (0.9 + 0.1) + 0.2e-3, 0.1, 1e-12, "100 mA range");
});

test("loading: a voltmeter reads the divider, an ammeter adds its resistance; both tend to the truth", () => {
  near(T.voltmeterReading(10, 1e5, 1e5), 5, 1e-12, "RV = Ri halves the reading (p. 91, c)");
  near(T.loadingError(T.voltmeterReading(10, 1e3, 1e7), 10), -1e-4, 1e-7, "about −Ri/RV");
  near(T.ammeterReading(1, 1000, 1e-6), 1e-3, 1e-12, "ideal ammeter");
});

test("resistance from U and I: eqs. 3.1 and 3.2 correct the raw quotient exactly; the errors meet at √(RA·RV)", () => {
  for (const Rx of [10, 1e3, 1e5]) {
    near(T.currentCorrect(Rx, 2, 1e6).corrected, Rx, 1e-9 * Rx, "3.1"); near(T.voltageCorrect(Rx, 2, 1e6).corrected, Rx, 1e-6 * Rx, "3.2");
  }
  const Rc = T.crossover(2, 1e6);
  rel(T.currentCorrect(Rc, 2, 1e6).raw / Rc - 1, 1 - T.voltageCorrect(Rc, 2, 1e6).raw / Rc, 0.01, "equal errors");
});

test("mean, rectified mean, RMS: eqs. 2.41–2.44 for the sine, sampled; triangle and square by definition", () => {
  const s = T.averages(T.WAVES.sine.f);
  near(s.rectified, 2 / Math.PI, 1e-6, "0.637 û"); near(s.rms, Math.SQRT1_2, 1e-6, "0.707 û");
  near(s.crest, 1.41, 0.005, "crest factor"); near(s.form, 1.11, 0.001, "form factor"); near(T.FORM_SINE, s.form, 1e-6, "π/(2√2)");
  const t = T.averages(T.WAVES.triangle.f), q = T.averages(T.WAVES.square.f);
  near(t.rms, 1 / Math.sqrt(3), 1e-6, "triangle RMS"); near(t.rectified, 0.5, 1e-6, "triangle mean");
  near(q.form, 1, 1e-9, "square: form factor 1");
  near(T.meterReadings(T.WAVES.sine.f).rectifierError, 0, 1e-6, "a rectifier meter is right only for a sine");
  near(T.meterReadings(T.WAVES.square.f).rectifierError, T.FORM_SINE - 1, 1e-6, "square: 11 % high");
  near(T.meterReadings(T.WAVES.halfwave.f).movingCoil, 1 / Math.PI, 1e-6, "half-wave: the moving coil reads û/π");
});

test("probe: compensated when RT·CT = RE·CE* (eq. 2.100); the step answer of eqs. 2.101–2.102 against RK4", () => {
  const p = { RT: 9e6, RE: 1e6, CE: 100e-12 };
  const ok = { ...p, CT: T.compensatingCT(p) };
  near(ok.CT, 100e-12 / 9, 1e-18, "CT"); for (const w of [1e2, 1e5, 1e8]) near(T.probeRatio(ok, w), 10, 1e-9, `10 : 1 at ω = ${w}`);
  for (const CT of [6e-12, ok.CT, 16e-12]) {
    const q = { ...p, CT }, times = [2e-6, 2e-5, 1e-4, 4e-4];
    T.probeStepNumeric(q, times).forEach((u, k) => near(u, T.probeStep(q, times[k]), 2e-4, `CT ${CT}, t ${times[k]}`));
    near(T.probeStep(q, 1), 0.1, 1e-9, "end: RE/(RT + RE)");
  }
  near(T.probeStep({ ...p, CT: 8e-12 }, 0), 8 / 108, 1e-12, "edge: CT/(CT + CE*)");
});

test("bridge: eq. 3.12 balances when R2·R3 = R1·R4; quarter, half and full bridges as in Bild 3.9", () => {
  near(T.diagonal(10, [1000, T.balance(1000, 2000, 4700), 2000, 4700]), 0, 1e-12, "balance");
  near(T.deflection("quarter", 5, 120, 0.01).exact, 5 * 0.01 / (4 + 2 * 0.01), 1e-12, "eq. 3.18");
  for (const x of [0.001, 0.05, 0.2]) {
    near(T.deflection("half", 1, 350, x).exact, x / 2, 1e-12, "half bridge f: exactly linear");
    near(T.deflection("full", 1, 350, x).exact, x, 1e-12, "full bridge h: exactly linear, four times the quarter");
  }
  const q = T.deflection("quarter", 1, 350, 0.1);
  near(q.exact / q.linear, 1 / 1.05, 1e-12, "the quarter bridge bends: 4/(4 + 2x) of the straight line");
});

test("loaded bridge: the source of eqs. 3.22–3.23 against the bridge solved by its nodes", () => {
  for (const RM of [100, 1e3, 1e6]) {
    const R = [1000, 1100, 1000, 1000];
    near(T.loaded(10, R, RM).UM, T.loadedByNodes(10, R, RM), 1e-12, `RM ${RM}`);
  }
});

test("strain gauge: Beispiel 3.2 (p. 239), ε = 5·10⁻⁴, Ud = 1.25 mV in a 5 V quarter bridge", () => {
  const eps = T.strainFromForce(1e5, 1e-3, 2e11);
  near(eps, 5e-4, 1e-15, "ε"); near(T.deflection("quarter", 5, 1, 2 * eps).linear, 1.25e-3, 1e-15, "Ud");
});

test("power: U·I·cos φ (eq. 2.66) against the mean of u(t)·i(t); the wattmeter's error is its own path's power", () => {
  for (const phi of [0, 0.5, Math.PI / 2, 2]) near(T.meanProduct(230, 2, phi), T.powers(230, 2, phi).P, 1e-9, `φ ${phi}`);
  for (const at of ["load", "source"]) {
    const w = T.wattmeter({ Uq: 10, R: 20, X: 15, RI: 0.5, RU: 2000 }, at);
    near(w.error, w.expected, 1e-12, at); assert.ok(w.error > 0, `${at}: reads high`);
  }
  // Light load: the current path's loss is small, so voltage path at the source is better; heavy load the other way.
  const light = { Uq: 230, R: 1000, X: 0, RI: 0.1, RU: 10000 }, heavy = { Uq: 230, R: 1, X: 0, RI: 0.1, RU: 10000 };
  assert.ok(T.wattmeter(light, "source").error < T.wattmeter(light, "load").error);
  assert.ok(T.wattmeter(heavy, "load").error < T.wattmeter(heavy, "source").error);
});

test("counter: Table 5.8 (p. 299), 100.3143 kHz on a 4-digit counter for gates of 10 ms to 10 s", () => {
  const rows = [[0.01, "1003", 100300], [0.1, "0031", 100310], [1, "0314", 100314], [10, "3143", 100314.3]];
  for (const [T_, shown, f] of rows) {
    const c = T.countFrequency(100314.3, T_);
    assert.equal(T.display(c.N, 4), shown, `gate ${T_} s`); near(c.f, f, 1e-6, "result"); near(c.resolution, 1 / T_, 0, "±1 count");
  }
});

test("counter: the ±1 count over seeded gate phases, frequency mode against period mode, and their crossover", () => {
  const u = T.uniform(3), f0 = 1e7, T_ = 1;
  for (const fx of [50, 3162.3, 1e6]) {
    let worstF = 0, worstP = 0;
    for (let k = 0; k < 400; k++) {
      worstF = Math.max(worstF, Math.abs(T.countFrequency(fx, T_, u() / fx).f - fx));
      worstP = Math.max(worstP, Math.abs(T.countPeriod(fx, f0, u() / f0).f - fx));
    }
    assert.ok(worstF <= 1 / T_ + 1e-9, "frequency mode within one count"); assert.ok(worstP <= 1.01 * fx * fx / f0, "period mode within one count");
  }
  near(T.crossoverFrequency(f0, T_), 3162.3, 0.1, "√(f0/T)");
  near(T.countPeriod(50, f0).f, 50, 1e-12, "a whole number of clock periods");
});

test("flash converter: Table 6.1 (p. 308), thresholds at odd sixteenths, outputs in eighths", () => {
  const f = T.flash(0, 1, 3);
  assert.deepEqual(f.thresholds.map(u => u * 16), [1, 3, 5, 7, 9, 11, 13]);
  for (const [ux, k] of [[0.05, 0], [0.1, 1], [0.32, 3], [0.5, 4], [0.9, 7]]) assert.equal(T.flash(ux, 1, 3).k, k, `ux ${ux}`);
  for (let ux = 0; ux < 1; ux += 0.0137) near(T.flash(ux, 1, 3).value, Math.min(7, Math.round(ux * 8)) / 8, 1e-12, "nearest eighth");
});

test("successive approximation: Bild 6.6 c (p. 311), 6.5 V on BCD weights gives 0110 0101; binary is the floor", () => {
  assert.deepEqual(T.sar(6.5, [8, 4, 2, 1, 0.8, 0.4, 0.2, 0.1]).bits, [0, 1, 1, 0, 0, 1, 0, 1]);
  for (const ux of [0, 1.234, 6.3, 9.99]) {
    const code = T.sar(ux, T.binaryWeights(10, 8)).bits.reduce((s, b) => 2 * s + b, 0);
    assert.equal(code, Math.floor(ux / 10 * 256), `ux ${ux}`);
  }
});

test("dual slope: Nx = Na·ux/U0 (eq. 6.16), whatever R·C and the clock; the integrator returns to zero", () => {
  for (const [RC, f] of [[1e-3, 1e5], [5e-2, 1e6]]) {
    assert.equal(T.dualSlope(1.234, 2, 1000, f, RC).Nx, 617);
    const d = T.dualSlope(1.234, 2, 1000, f, RC);
    near(T.dualSlopeTrace(1.234, 2, 1000, f, RC, d.t1 + d.tx), 0, 1e-9, "back to zero at tx");
    near(T.dualSlopeTrace(1.234, 2, 1000, f, RC, d.t1), d.peak, 1e-12, "eq. 6.11");
  }
});

test("quantisation: Δu/√12 measured on a ramp; 6.02n + 1.76 dB (eq. 6.44) against a quantised sine; ENOB inverts it", () => {
  const lsb = 0.01;
  let sq = 0; const n = 100000;
  for (let k = 0; k < n; k++) { const x = k * 0.0001234567; sq += (T.quantise(x, lsb) - x) ** 2; }
  rel(Math.sqrt(sq / n), T.quantisationNoise(lsb), 0.01, "Δu/√12");
  for (const bits of [8, 10, 12, 14]) near(T.snrMeasured(bits), T.snrSine(bits), 0.3, `${bits} bit`);
  near(T.snrSine(12), 6.02 * 12 + 1.76, 0.01, "6.02n + 1.76"); near(T.snrDC(8), 6.02 * 8 + 10.79, 0.01, "6.02n + 10.79");
  near(T.enob(T.snrSine(10)), 10, 0.01, "ENOB");
});

test("seismic sensor: eq. 7.114 against eq. 7.108 integrated; D = 1 gives Ω²/(1 + Ω²) (eq. 7.115)", () => {
  for (const D of [0.1, 0.7, 1]) for (const W of [0.3, 1, 3]) rel(T.gainBySimulation(W, D), T.gain(W, D), 0.01, `D ${D}, Ω ${W}`);
  for (const W of [0.2, 1, 5]) near(T.gain(W, 1), W * W / (1 + W * W), 1e-12, "D = 1");
  near(T.gain(100, 0.7), 1, 1e-3, "displacement sensor far above ω0"); rel(T.gain(0.01, 0.7), 1e-4, 1e-3, "Ω² far below");
  near(T.phase(1, 0.5), -Math.PI / 2, 1e-12, "−90° at resonance");
  near(T.natural(1000, 0.1), 100, 1e-12, "ω0 = √(c/m)"); near(T.damping(2, 1000, 0.1), 0.1, 1e-12, "D");
});

test("propagation chart: fixed axes, ±4 s(y) at 10 % and the normal peak at 1 % (weighing, worked by hand)", () => {
  // g₂ = g₃ − g₁ at 600 g and 80 g: s = √(60² + 8²) = 60.53 g at 10 %, 6.053 g at 1 %.
  const a = T.spreadAxes(T.MODELS.weight, 10, 1);
  near(a.xMin, 520 - 4 * 60.531, 0.01, "left edge"); near(a.xMax, 520 + 4 * 60.531, 0.01, "right edge");
  near(a.yMax, 1 / (6.0531 * Math.sqrt(2 * Math.PI)), 1e-5, "top");
});
