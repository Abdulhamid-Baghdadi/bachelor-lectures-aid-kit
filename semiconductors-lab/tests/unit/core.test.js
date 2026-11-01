// The semiconductor core against a second route: a transfer matrix against the Kronig–Penney equation, bisection on
// neutrality against the closed form, finite differences against the analytic profiles, a numerical derivative
// against a formula, or a value printed in Strasser (2015) itself.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as S from "../../src/core/semiconductors.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);
const rel = (a, b, tol, what) => near(a / b, 1, tol, what);

test("the constants reproduce the script's thermal voltage, 25.85 mV at 300 K (p. 103)", () => {
  near(S.thermal(300) * 1e3, 25.85, 0.005, "UT");
});

test("Kronig–Penney: the transfer matrix's half-trace is the left side of (2.2.13)", () => {
  for (const P of [0.5, 3 * Math.PI / 2, 10]) for (const x of [0.3, 1.7, 3.1, 4.4, 9]) near(S.kpTransferHalfTrace(P, x), S.kpLhs(P, x), 1e-12, `P ${P}, αa ${x}`);
});

test("Kronig–Penney limits (p. 57–58): P → 0 leaves no gap, P → ∞ shrinks each band onto the well's level n²", () => {
  const free = S.kpBands(1e-6, 3 * Math.PI - 0.01);
  near(free.reduce((s, b) => s + b.hi - b.lo, 0), 3 * Math.PI - 0.01 - Math.sqrt(2e-6), 1e-6, "free electron: the gaps close; the band starts at αa ≈ √(2P)");
  const tight = S.kpBands(500, 3.5 * Math.PI);
  tight.slice(0, 3).forEach((b, k) => { near(b.hi, (k + 1) * Math.PI, 1e-6, `top of band ${k + 1}`); assert.ok(b.hi - b.lo < 2 * (k + 1) * Math.PI / 500 * 1.1, `width ${b.hi - b.lo}`); });
  // Every band ends where sin(αa) = 0 (αa = nπ), whatever P: there cos(ka) = ±1.
  S.kpBands(3 * Math.PI / 2, 3.5 * Math.PI).slice(0, 3).forEach((b, k) => near(b.hi, (k + 1) * Math.PI, 1e-6, `band ${k + 1} top`));
});

test("N coupled wells: one well gives nπ, and N wells give N levels inside each Kronig–Penney band", () => {
  near(S.coupledLevels(5, 1, 3.5 * Math.PI)[0], Math.PI, 1e-6, "single well");
  const P = 3, N = 8, levels = S.coupledLevels(P, N, Math.PI + 0.01), band = S.kpBands(P, Math.PI + 0.01)[0];
  assert.equal(levels.length, N);
  for (const x of levels) assert.ok(x >= band.lo - 1e-6 && x <= band.hi + 1e-6, `level ${x} inside [${band.lo}, ${band.hi}]`);
});

test("Fermi–Dirac by definition: one half at EF, symmetric about it, and Boltzmann far above it (3.1.16)", () => {
  near(S.fermi(0.5, 0.5, 300), 0.5, 1e-15, "f(EF)");
  near(S.fermi(0.6, 0.5, 400) + S.fermi(0.4, 0.5, 400), 1, 1e-12, "symmetry");
  rel(S.fermi(0.4, 0, 300), S.boltzmann(0.4, 0, 300), 1e-6, "tail");
});

test("carrier densities: (3.1.23) against neutrality by bisection, and n p = ni²", () => {
  const ni = S.intrinsic(450);
  for (const [ND, NA] of [[1e15, 0], [1e13, 4e12], [0, 1e17], [3e13, 3e13]]) {
    const a = S.carriers(ND, NA, ni), b = S.carriersByNeutrality(ND, NA, ni);
    rel(a.n, b.n, 1e-9, `n at ${ND}, ${NA}`); rel(a.p, b.p, 1e-9, `p at ${ND}, ${NA}`); rel(a.n * a.p, ni * ni, 1e-9, "mass action");
  }
  rel(S.intrinsic(300), 1.45e10, 1e-12, "the table's ni at 300 K");
});

test("Shockley–Haynes: the Gaussian (3.4.43) against (3.4.42) stepped by finite differences", () => {
  const prm = { N: 1e10, mu: 450, E: 10, D: S.diffusivity(450), tau: 50e-6 };
  const xs = Array.from({ length: 801 }, (_, k) => -0.05 + k * 0.25 / 800);
  const num = S.haynesNumeric(xs, 5e-6, 25e-6, prm, 20000);
  const peak = Math.max(...xs.map(x => S.haynes(x, 25e-6, prm)));
  xs.forEach((x, k) => near(num[k] / peak, S.haynes(x, 25e-6, prm) / peak, 0.03, `x = ${x}`));
});

test("generation and recombination: the transient against Euler, and the injected profiles against finite differences", () => {
  for (const t of [0.5e-6, 2e-6, 4e-6]) rel(S.transientNumeric(t, 1e21, 1e-6, 3e-6), S.transient(t, 1e21, 1e-6, 3e-6), 1e-3, `t = ${t}`);
  const L = 0.01;
  for (const W of [0.005, 0.03]) {
    const num = S.injectedNumeric(1e14, L, W, 2_000);
    [0.25, 0.5, 0.75].forEach(f => near(num[Math.round(f * 2000)] / 1e14, S.injected(f * W, 1e14, L, W) / 1e14, 1e-5, `W ${W} at ${f}`));
  }
  near(S.injected(0.2, 1, L, 1e3) , S.injected(0.2, 1, L), 1e-12, "long sample is (3.4.35)");
});

test("the band-gap wavelength: Si 1.12 eV is 1107 nm, as the script's table prints (p. 73)", () => {
  near(S.wavelength(1.12) * 1e9, 1107, 1, "λg");
});

test("absorption (4.2.8): √ law with no injection, gain exactly below ħω = EFc − EFv", () => {
  const prm = { Eg: 1.42, mn: 0.067, mp: 0.5, T: 4 };
  rel(S.absorption(1.52, { ...prm, split: -0.3 }), Math.sqrt(0.1), 1e-9, "no injection");
  const inj = { ...prm, T: 300, split: 0.05 };
  assert.ok(S.absorption(1.5, inj) < 0, "gain below 1.52 eV");
  assert.ok(S.absorption(1.54, inj) > 0, "loss above 1.52 eV");
  near(S.absorption(1.52, inj), 0, 1e-12, "transparent at EFc − EFv");
});

test("the junction: the area under the field is UD − U (5.2.5), e NA dp = e ND dn (5.2.2), and Emax as (5.2.4)", () => {
  const j = S.junction(1e17, 1e15, -3);
  rel(1e17 * j.dp, 1e15 * j.dn, 1e-12, "charge balance");
  const n = 20000, x0 = -j.dp, h = (j.dn + j.dp) / n;
  let area = 0;
  for (let k = 0; k < n; k++) area -= j.field(x0 + (k + 0.5) * h) * h;
  rel(area, j.UD + 3, 1e-6, "∫E dx");
  rel(Math.abs(j.field(0)), j.Emax, 1e-9, "peak field");
  rel(Math.abs(j.field(0)), S.Q * 1e15 * j.dn / S.epsSi, 1e-9, "Emax = e ND dn / ε");
  rel(j.potential(j.dn), j.UD + 3, 1e-9, "potential step");
});

test("junction capacitance (5.2.15): the closed form against dQ/dU numerically and against ε/d", () => {
  for (const U of [-10, -1, 0.2]) {
    const dU = 1e-5, num = (S.junctionCharge(1e19, 1e16, U - dU) - S.junctionCharge(1e19, 1e16, U + dU)) / (2 * dU);
    rel(S.junctionCap(1e19, 1e16, U), num, 1e-6, `dQ/dU at ${U} V`);
    rel(S.junctionCap(1e19, 1e16, U), S.epsSi / S.junction(1e19, 1e16, U).d, 1e-9, `ε/d at ${U} V`);
  }
});

test("the diode: the solver against the explicit U(I), 60 mV a decade (p. 137), and dJs/dT / Js ≈ 0.15 /K (5.3.16)", () => {
  const prm = { Is: 1e-14, n: 1.5, Rs: 2 };
  for (const U of [0.3, 0.7, 1.2]) near(S.diodeVoltage(S.diodeCurrent(U, prm), prm), U, 1e-9, `U = ${U}`);
  const decade = S.thermal(300) * Math.log(10);
  near(decade * 1e3, 60, 1, "mV per decade");
  near(Math.log10(S.diodeCurrent(0.65, { Is: 1e-14 }) / S.diodeCurrent(0.65 - decade, { Is: 1e-14 })), 1, 1e-3, "one decade");
  const d = { NA: 1e17, ND: 1e16, tau: 1e-6, area: 1e-4 };
  const slope = (Math.log(S.saturation({ ...d, T: 300.01 })) - Math.log(S.saturation({ ...d, T: 299.99 }))) / 0.02;
  // Js ∝ ni² ∝ T³ exp(−UG/UT): the script's UG/(UT T) plus 3/T from the densities of states; D and L add their own T.
  near(slope, 1.12 / (S.thermal(300) * 300) + 3 / 300, 2e-3, "relative temperature coefficient");
  near(1.12 / (S.thermal(300) * 300), 0.15, 0.01, "the script's 0.15 /K");
});

test("breakdown (5.3.22): 300 kV/cm in silicon doped 10¹⁶ cm⁻³ gives about 29 V", () => {
  near(S.breakdown(1e16), S.epsSi * 9e10 / (2 * S.Q * 1e16), 1e-12, "formula");
  near(S.breakdown(1e16), 29.6, 0.1, "value");
});

test("the npn output characteristic (6.1.4): zero at UCE = 0, Is e^(UBE/UT) in the active region, gm = IC/UT", () => {
  const prm = { Is: 1e-15 };
  near(S.collector(0.7, 0, prm), 0, 1e-20, "UCE = 0");
  rel(S.collector(0.7, 3, prm), 1e-15 * Math.exp(0.7 / S.thermal()), 1e-12, "active");
  const d = 1e-6, gm = (S.collector(0.7 + d, 3, prm) - S.collector(0.7 - d, 3, prm)) / (2 * d);
  rel(gm, S.collector(0.7, 3, prm) / S.thermal(), 1e-6, "gm");
});

test("the n-MOS (6.2.22): continuous at the pinch-off, flat beyond, and gm = √(2β ID) (p. 188)", () => {
  const prm = { beta: 2e-3, Ut: 1 };
  near(S.drain(3, 2 - 1e-12, prm), S.drain(3, 2 + 1e-12, prm), 1e-12, "UDS = UGS − Ut");
  near(S.drain(3, 5, prm), S.drain(3, 9, prm), 0, "current source");
  const d = 1e-6, gm = (S.drain(3 + d, 5, prm) - S.drain(3 - d, 5, prm)) / (2 * d);
  rel(gm, Math.sqrt(2 * 2e-3 * S.drain(3, 5, prm)), 1e-6, "gm");
  assert.equal(S.drain(0.9, 5, prm), 0);
});

test("the threshold's body term reproduces the script's example: −QB/Cox = 0.84 V √(2ΦF + USB) (p. 184)", () => {
  // The script's numbers: NA = 10¹⁶ cm⁻³, dox = 50 nm, εSi ≈ 10⁻¹² As/(V cm), εox ≈ εSi/3, so Cox = 6.7·10⁻⁸ F/cm².
  const t = S.threshold({ NA: 1e16, dox: 50e-7, phiMS: 0, eps: 1e-12, epsOx: 1e-12 / 3 });
  rel(t.Cox, 6.7e-8, 0.01, "Cox");
  near(t.body / Math.sqrt(2 * t.phiF), 0.84, 0.01, "body factor");
});
