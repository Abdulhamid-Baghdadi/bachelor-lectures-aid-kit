// The power-engineering core against a second route: a sum over the phases, a numerical integral, an ODE integrated,
// a chain of π sections, or a number printed in Gawlik (2015) or Schrödl (2012), or in an exam's worked solution.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as P from "../../src/core/index.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);
const rel = (a, b, tol, what) => near(a / b, 1, tol, what);
const DEG = Math.PI / 180;

test("the rotation operator: 1 + a + a² = 0 (3-34), a³ = 1 (3-33), a − a² = j√3 (3-35)", () => {
  const sum = P.cAdd(P.cAdd(P.C(1), P.A), P.A2);
  near(P.cAbs(sum), 0, 1e-15, "1 + a + a²");
  near(P.cAbs(P.cMul(P.A, P.A2)), 1, 1e-15, "|a³|"); near(P.cMul(P.A, P.A2)[0], 1, 1e-15, "a³");
  const d = P.sub(P.A, P.A2); near(d[0], 0, 1e-15, "Re"); near(d[1], Math.sqrt(3), 1e-15, "Im");
});

test("star: line voltage √3 times the phase voltage and 30° ahead; 230 V gives 400 V (table 3-2)", () => {
  const U = P.phaseVoltages(230), L = P.lineVoltages(U);
  for (const l of L) near(P.cAbs(l), 230 * Math.sqrt(3), 1e-9, "|U_L|");
  near(P.arg(L[0]) - P.arg(U[0]), 30, 1e-9, "30°");
  near(230 * Math.sqrt(3), 400, 2, "the 0.4 kV network: nominal values, rounded");
});

test("delta against star: a delta load Z draws the same line currents as a star load Z/3, √3 times its branch current", () => {
  const Z = P.C(12, 9), d = P.balancedLoad(400, Z, "delta"), y = P.balancedLoad(400, P.scale(Z, 1 / 3), "star");
  for (let k = 0; k < 3; k++) near(P.cAbs(P.sub(d.lineI[k], y.lineI[k])), 0, 1e-9, `line ${k}`);
  rel(P.cAbs(d.lineI[0]), Math.sqrt(3) * P.cAbs(d.branchI[0]), 1e-12, "√3");
  rel(d.S[0], 3 * P.balancedLoad(400, Z, "star").S[0], 1e-12, "delta takes three times the power of star");
});

test("three-phase power: S = 3 U I* summed over the phases equals √3 U_n I_n (cos φ + j sin φ) (3-40 to 3-45)", () => {
  const Z = P.C(8, 6), r = P.balancedLoad(400, Z, "star"), IL = P.cAbs(r.lineI[0]), phi = Math.atan2(6, 8) / DEG;
  const p = P.powerFromLine(400, IL, phi);
  rel(r.S[0], p.P, 1e-12, "P"); rel(r.S[1], p.Q, 1e-12, "Q"); rel(Math.hypot(p.P, p.Q), p.S, 1e-12, "S² = P² + Q² (3-25)");
});

test("instantaneous power: one phase pulses at twice the frequency around U I cos φ; three balanced phases sum to a constant (3-44)", () => {
  const U = 230, I = 10, phi = 37, n = 3600;
  let mean = 0;
  for (let k = 0; k < n; k++) {
    const wt = 2 * Math.PI * k / n, p = P.instantaneous(U, [I, I, I], phi, wt);
    mean += p[0] / n;
    near(p[0] + p[1] + p[2], 3 * U * I * Math.cos(phi * DEG), 1e-9, `sum at ${k}`);
  }
  near(mean, U * I * Math.cos(phi * DEG), 1e-9, "mean of one phase (3-16, 3-17)");
  const unbalanced = [0, 1, 2].map(k => P.instantaneous(U, [I, I, 0.5 * I], phi, k).reduce((s, x) => s + x));
  assert.ok(Math.max(...unbalanced) - Math.min(...unbalanced) > 100, "an unbalanced set pulses");
});

test("per unit: x″d = 25 % on 80 MVA, 20 kV is 1.25 Ω (Gawlik p. 213); a change of base agrees with going through ohms", () => {
  near(P.ohmsFromPu(0.25, 20e3, 80e6), 1.25, 1e-12, "1.25 Ω");
  const z = 0.12, ohms = P.ohmsFromPu(z, 30e3, 31e6);
  rel(P.changeBase(z, 31e6, 30e3, 100e6, 30e3), ohms / P.baseImpedance(30e3, 100e6), 1e-12, "same base voltage");
  rel(P.changeBase(z, 31e6, 30e3, 100e6, 33e3), ohms / P.baseImpedance(33e3, 100e6), 1e-12, "other base voltage");
});

test("transformer: Z_T = 3.48 Ω and R_T = 0.13 Ω for 31 MVA, 30 kV, u_k = 12 %, P_k = 0.14 MW (p. 215); u_σ by (4-82)", () => {
  near(P.shortCircuitImpedance(0.12, 30e3, 31e6), 3.48, 0.005, "Z_T");
  near(0.14e6 * 30e3 ** 2 / 31e6 ** 2, 0.13, 0.002, "R_T");
  near(P.uSigma(0.06, 0.007), 0.0596, 0.0001, "1 MVA, table 4-9");
  near(P.circulatingRatio(5), 0.966, 0.0005, "Yy0 against Yd5, p. 111");
  near(P.circulatingRatio(0), 0, 1e-15, "equal vector groups");
});

test("transformer and load flow: the quadratic's root against fixed-point iteration on the phasors", () => {
  for (const [r, x, Pl, Q] of [[0.007, 0.0596, 0.8, 0.6], [0.01, 0.1, 1, -0.3], [0, 0.3, 0.9, 0.2]]) {
    near(P.receivingVoltage(1, r, x, Pl, Q), P.receivingVoltageIterated(1, r, x, Pl, Q), 1e-9, `${r}, ${x}, ${Pl}, ${Q}`);
  }
  // Resistive load over a reactance: the most is U1²/(2X) at U2 = U1/√2 (6-11, 6-13).
  const X = 0.4, Pmax = 1 / (2 * X);
  near(P.receivingVoltage(1, 0, X, Pmax, 0), 1 / Math.SQRT2, 1e-6, "nose at U1/√2");
  assert.ok(Number.isNaN(P.receivingVoltage(1, 0, X, Pmax * 1.01, 0)), "no operating point beyond it");
  near(P.receivingVoltage(1, 0, X, 0.9 * Pmax, 0) ** 2 + P.receivingVoltageLow(1, 0, X, 0.9 * Pmax, 0) ** 2, 1, 1e-12, "the two roots' squares sum to U1² − 2QX");
});

test("power over a reactance: P = U1 U2 sin δ / X (6-4) and Q (6-5) against U1 = U2 + jX I", () => {
  const U1 = 1.05, U2 = 0.98, X = 0.3, d = 0.4;
  const I = P.cDiv(P.sub(P.polar(U1, d / DEG), P.C(U2)), P.C(0, X)), S = P.cMul(P.C(U2), P.conj(I));
  near(S[0], P.transferP(U1, U2, X, d), 1e-12, "P"); near(S[1], P.transferQ(U1, U2, X, d), 1e-12, "Q");
});

const LINE = { R: 0.03, L: 0.8e-3, G: 0.02e-6, Cap: 14e-9 }; // the 380 kV line of Gawlik, p. 90

test("line: Z_w = 239.5 − j13.7 Ω, γ = (0.065 + j1.05)·10⁻³ /km, P_nat = 602 MW (p. 90–92)", () => {
  const { Zw, gamma } = P.lineConstants(LINE);
  near(Zw[0], 239.5, 0.1, "Re Z_w"); near(Zw[1], -13.7, 0.1, "Im Z_w");
  near(gamma[0] * 1e3, 0.065, 0.0005, "α"); near(gamma[1] * 1e3, 1.05, 0.005, "β");
  near(P.naturalLoad(380e3, Zw) / 1e6, 602, 1, "P_nat");
});

test("Ferranti: the open 800 km line ends at 567 kV (p. 91); 200 km +2.3 %, 500 km +16 % (p. 87)", () => {
  // The notes round γ to three figures; with it unrounded the end voltage is 569 kV, within 0.4 %. They print the
  // ratio as 152 %, but 567/380 is 149 %.
  rel(P.cAbs(P.lineSolve(LINE, 800, 380e3, Infinity).U2), 567e3, 0.005, "800 km");
  near(P.cAbs(P.lineSolve(LINE, 200, 1, Infinity).U2), 1.023, 0.001, "200 km");
  near(P.cAbs(P.lineSolve(LINE, 500, 1, Infinity).U2), 1.16, 0.005, "500 km");
});

test("line with 700 MW of resistive load: U2 = 322.5 kV at −50°, S1 = 562.3 + j40.7 MVA (p. 93); π sections agree", () => {
  const Z2 = 380e3 ** 2 / 700e6, r = P.lineSolve(LINE, 800, 380e3, Z2);
  rel(P.cAbs(r.U2), 322.5e3, 0.002, "|U2|"); near(P.arg(r.U2), -50, 0.2, "angle");
  const S1 = P.cMul(P.C(380e3), P.conj(r.I1));
  rel(S1[0], 562.3e6, 0.002, "P1"); rel(S1[1], 40.7e6, 0.01, "Q1");
  for (const [l, z] of [[800, Z2], [800, Infinity], [300, 300]]) {
    rel(P.lineByPiSections(LINE, l, 380e3, z).U2, P.cAbs(P.lineSolve(LINE, l, 380e3, z).U2), 1e-5, `π sections, ${l} km`);
  }
});

test("short circuit: (6-29) against the ODE (6-20) integrated by Runge–Kutta", () => {
  for (const [t, a, rx] of [[0.004, 0, 0.1], [0.013, 0.3, 0.2], [0.035, 1.2, 1], [0.02, 2.5, 0.05]]) {
    near(P.shortCircuitCurrent(t, a, rx), P.shortCircuitIntegrated(t, a, rx), 1e-8, `t ${t}, α ${a}, R/X ${rx}`);
  }
  // No DC part when switched at α − φ = 0; the most when α − φ = 90° (p. 208).
  const phi = Math.atan2(1, 0.1);
  near(P.dcPart(0, phi, 0.1), 0, 1e-15, "none"); near(Math.abs(P.dcPart(0, phi + Math.PI / 2, 0.1)), 1, 1e-15, "full");
});

test("peak factor κ: 2.0, 1.73, 1.043 for R/X = 0, 0.1, 1.0 (table 6-3); the searched peak lies close above it", () => {
  near(P.kappa(0), 2, 0, "lossless"); near(P.kappa(0.1), 1.73, 0.005, "overhead line"); near(P.kappa(1), 1.043, 0.0005, "cable");
  for (const rx of [0.05, 0.1, 0.3]) { const s = P.peakSearched(rx); assert.ok(s >= P.kappa(rx) - 1e-3 && s < P.kappa(rx) + 0.03, `R/X ${rx}: ${s}`); }
});

test("short-circuit example: I″k3 = 1.038 kA at 30 kV, R/X = 0.28, κ ≈ 1.4 (p. 215–216)", () => {
  const q = { c: 1.1, Un: 30e3, SkQ: 5e9, RXQ: 0.1, uk: 0.12, ST: 31e6, Pk: 0.14e6, Rl: 0.12, Xl: 0.35, len: 40 };
  near(P.solve({ law: "exampleIk3", ...q }), 1038, 1, "I″k3");
  near(P.solve({ law: "exampleRX", ...q }), 0.28, 0.001, "R/X");
  near(P.kappa(0.28), 1.4, 0.02, "κ");
  near(P.networkImpedance(1.1, 30e3, 5e9), 0.198, 0.0005, "Z_Q");
});

test("equal areas: the closed form for A1 and A2 against Simpson's rule; at the critical angle they are equal", () => {
  const sys = { Pm: 0.8, Ppre: 1.6, Pfault: 0.3, Ppost: 1.2 };
  for (const dc of [0.7, 1.0, 1.4]) {
    const a = P.equalArea(sys, dc), b = P.areasIntegrated(sys, dc);
    near(a.A1, b.A1, 1e-10, `A1 at ${dc}`); near(a.A2, b.A2, 1e-10, `A2 at ${dc}`);
  }
  const cr = P.criticalAngle(sys), at = P.equalArea(sys, cr);
  near(at.A1, at.A2, 1e-12, "A1 = A2");
  assert.ok(P.equalArea(sys, cr - 0.01).stable && !P.equalArea(sys, cr + 0.01).stable, "stable before, not after");
  assert.ok(Number.isNaN(P.criticalAngle({ ...sys, Ppost: 0.7 })), "turbine above the post-fault peak: no stable point");
});

test("space vector: a balanced set has constant length Î and turns with ωt (M.9); swapping two phases turns it back", () => {
  for (const wt of [0, 0.4, 2, 5]) {
    const i = P.spaceVector(...P.phaseCurrents(wt, [1, 1, 1]));
    near(P.cAbs(i), 1, 1e-12, "|i|"); near(Math.atan2(i[1], i[0]), Math.atan2(Math.sin(wt), Math.cos(wt)), 1e-12, "angle");
    const r = P.spaceVector(...P.phaseCurrents(wt, [1, 1, 1], true));
    near(Math.atan2(r[1], r[0]), Math.atan2(-Math.sin(wt), Math.cos(wt)), 1e-12, "reversed");
  }
  // Schrödl's example (p. 152): i_u = ½, i_v = −1, i_w = ½ of the peak gives i_s = 1·e^(j300°).
  const s = P.spaceVector(0.5, -1, 0.5); near(P.cAbs(s), 1, 1e-12, "|i_s|"); near(P.arg(s), -60, 1e-9, "300°");
  const lengths = [0, 1, 2, 3].map(wt => P.cAbs(P.spaceVector(...P.phaseCurrents(wt, [1, 1, 0.5]))));
  assert.ok(Math.max(...lengths) - Math.min(...lengths) > 0.1, "an unbalanced set does not keep its length: an ellipse");
});

test("the three windings' fields sum to a wave of 3/2 the amplitude of one that travels with ωt (M.7)", () => {
  for (const wt of [0, 1, 2.5]) for (const g of [0, 0.7, 3]) near(P.gapField(g, P.phaseCurrents(wt, [1, 1, 1])), 1.5 * Math.cos(g - wt), 1e-12, `${wt}, ${g}`);
  // Phase values back from a space vector (the exam of 24.6.2013): ψ_M = e^(−j15°), m = 1 gives i_s = e^(j75°).
  const ph = P.phaseValues(P.polar(1, 75));
  near(ph[0], 0.259, 0.0005, "i1"); near(ph[1], 0.707, 0.0005, "i2"); near(ph[2], -0.966, 0.0005, "i3");
});

test("synchronous speed and slip: 375 rpm at 50 Hz needs 8 pole pairs (p. 118); 1475 rpm, 4 poles: s = 0.0167 (p. 120)", () => {
  near(P.syncSpeed(50, 8), 375, 0, "375"); near(P.slip(P.syncSpeed(50, 2), 1475), 0.0167, 0.00005, "s");
});

test("DC machine: the exam of 24.7.2013 (R_A = 50 mΩ, M_N = 477.46 N·m, half field 238.73 N·m) and power balance", () => {
  const k = 15, RA = 0.05;
  near(P.solve({ law: "dcArmatureResistance", kPhi: k, n0: 2000, nN: 1960, IN: 200 }), RA, 1e-12, "R_A");
  near(P.dcTorque(k, 1, 200), 477.46, 0.005, "M_N"); near(P.dcTorque(k, 0.5, 200), 238.73, 0.005, "half field");
  near(P.dcSpeed(300, RA, k, 0.5, 0), 2400, 1e-9, "no-load speed at 300 V, half field");
  rel(P.dcSlope(RA, k, 0.5), 4 * P.dcSlope(RA, k, 1), 1e-12, "half the flux, four times the slope (G.80, G.81 in torque)");
  for (const [U, phi, M] of [[300, 1, 200], [500, 0.6, 100]]) {
    const n = P.dcSpeed(U, RA, k, phi, M) / 60, J = P.dcCurrent(k, phi, M);
    rel(U * J, RA * J * J + M * 2 * Math.PI * n, 1e-12, `U J = R J² + M Ω at ${U} V`);
  }
  // At standstill every field gives the same current U_A/R_A (G.83).
  for (const phi of [1, 0.5, 0.33]) { const M = P.dcTorque(k, phi, 300 / RA); near(P.dcSpeed(300, RA, k, phi, M), 0, 1e-9, `φ ${phi}`); }
});

test("PMSM: the torque −Im(i_s* ψ_s) (P.4) equals i_q |ψ_M| (P.8) whatever i_d and l_s; at no load u_s = jω ψ_M", () => {
  for (const [id, iq, ls] of [[0, 1, 0.3], [-0.4, 0.7, 0.5], [0.2, -0.5, 0.1]]) {
    const r = P.pmsm({ id, iq, w: 1, rs: 0.02, ls });
    near(r.torqueP4, r.torqueP8, 1e-15, `${id}, ${iq}, ${ls}`);
  }
  const r = P.pmsm({ id: 0, iq: 0, w: 0.8, rs: 0.02, ls: 0.3 });
  near(r.us[0], 0, 1e-15, "u_d (P.18 with i_d = 0)"); near(r.us[1], 0.8, 1e-15, "u_q = ω ψ_M (P.19)");
  const fw = P.pmsm({ id: -0.5, iq: 0.5, w: 1.2, rs: 0, ls: 0.4 }), plain = P.pmsm({ id: 0, iq: 0.5, w: 1.2, rs: 0, ls: 0.4 });
  assert.ok(P.cAbs(fw.us) < P.cAbs(plain.us), "a negative i_d lowers the voltage: field weakening");
});
