// The laws of semiconductors and their devices after Strasser (2015), Skriptum Halbleiterphysik, TU Wien: section and
// page beside each, equation numbers where they were read in the script on 1 Nov 2026. Units as the script uses them:
// densities in cm⁻³, lengths in cm, permittivities in F/cm, energies in eV, currents in A. Pure: no page, no clock.

// SI 2019 defining constants (exact). Checked against the script: kT/e at 300 K = 25.85 mV (section 3.4.3, p. 103),
// h = 6.6262·10⁻³⁴ J s (section 1.1.1, p. 7). ε0 and m0 are CODATA values; the script's εSi ≈ 10⁻¹² As/(V cm) (p. 184)
// is 11.9 ε0 to 5 %, and exercise sheet 1 gives m0 = 9.11·10⁻³¹ kg.
export const Q = 1.602176634e-19, K = 1.380649e-23, H = 6.62607015e-34, HBAR = H / (2 * Math.PI);
export const C0 = 299792458, M0 = 9.1093837015e-31, EPS0 = 8.8541878128e-14; // ε0 in F/cm

/** Silicon at 300 K from the script's table of semiconductor data (section 2.4, p. 73): band gap, effective densities
 *  of states, intrinsic density, mobilities, relative permittivity. */
export const SI = { Eg: 1.12, NC: 2.8e19, NV: 1.04e19, ni: 1.45e10, mun: 1500, mup: 450, epsr: 11.9 };
export const epsSi = SI.epsr * EPS0;

/** Thermal voltage UT = kT/e [V] (section 3.4.3, p. 103); numerically kT in eV. */
export const thermal = (T = 300) => K * T / Q;

// --- Bands: the Kronig–Penney model (section 2.2.3, pp. 54–58) ---------------------------------------------------

/** The left side of (2.2.13), P sin(αa)/(αa) + cos(αa); a band is allowed where it lies between −1 and 1. */
export const kpLhs = (P, x) => (x === 0 ? P + 1 : P * Math.sin(x) / x + Math.cos(x));

/** Second route: half the trace of one period's transfer matrix acting on (ψ, ψ′), free over a, then a thin barrier
 *  whose jump in ψ′ is 2P/a · ψ (the limit of (2.2.12) the script takes). In units a = 1. */
export function kpTransferHalfTrace(P, x) {
  const c = Math.cos(x), s = x === 0 ? 1 : Math.sin(x) / x; // s = sin(αa)/α with a = 1
  const free = [[c, s], [-x * Math.sin(x), c]], jump = [[1, 0], [2 * P, 1]];
  const m = mul(jump, free);
  return (m[0][0] + m[1][1]) / 2;
}
const mul = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
                       [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];

/** The allowed bands of (2.2.13) for αa in (0, xMax], as [{ lo, hi }] in αa; edges refined by bisection. */
export function kpBands(P, xMax = 4 * Math.PI, n = 4000) {
  const inside = x => Math.abs(kpLhs(P, x)) <= 1, bands = [];
  let start = inside(1e-9) ? 1e-9 : null, prev = 1e-9;
  for (let k = 1; k <= n; k++) {
    const x = xMax * k / n, now = inside(x);
    if (now && start === null) start = edge(prev, x, inside);
    if (!now && start !== null) { bands.push({ lo: start, hi: edge(prev, x, inside) }); start = null; }
    prev = x;
  }
  if (start !== null) bands.push({ lo: start, hi: xMax });
  return bands;
}
function edge(a, b, test) {
  const ta = test(a);
  for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (test(m) === ta) a = m; else b = m; }
  return (a + b) / 2;
}

/** Energy in units of the infinite well's ground level E1 = ħ²π²/(2ma²): E/E1 = (αa/π)² (from (2.2.10)). */
export const kpEnergy = x => (x / Math.PI) ** 2;

/** E(k) of the lowest bands: for each allowed αa, ka = arccos of (2.2.13), in the reduced zone 0 … π. */
export function kpDispersion(P, xMax = 4 * Math.PI, n = 1200) {
  const pts = [];
  for (let k = 1; k <= n; k++) {
    const x = xMax * k / n, v = kpLhs(P, x);
    if (Math.abs(v) <= 1) pts.push({ ka: Math.acos(v), E: kpEnergy(x), x });
  }
  return pts;
}

/** N coupled wells between hard walls, separated by N − 1 thin barriers of strength P: the levels, as αa, where the
 *  wave started at the left wall ends at zero on the right one. Each level of one well splits into N. */
export function coupledLevels(P, N, xMax = 4 * Math.PI, n = 6000) {
  const end = x => {
    let v = [0, 1];
    const s = Math.sin(x) / x, c = Math.cos(x), free = [[c, s], [-x * Math.sin(x), c]], jump = [[1, 0], [2 * P, 1]];
    for (let k = 0; k < N; k++) {
      v = [free[0][0] * v[0] + free[0][1] * v[1], free[1][0] * v[0] + free[1][1] * v[1]];
      if (k < N - 1) v = [v[0], jump[1][0] * v[0] + v[1]];
    }
    return v[0];
  };
  const levels = [];
  let px = 1e-6, pv = end(px);
  for (let k = 1; k <= n; k++) {
    const x = xMax * k / n, v = end(x);
    if (pv === 0 || Math.sign(v) !== Math.sign(pv)) {
      let a = px, b = x, fa = pv;
      for (let j = 0; j < 60; j++) { const m = (a + b) / 2, fm = end(m); if (Math.sign(fm) === Math.sign(fa)) { a = m; fa = fm; } else b = m; }
      levels.push((a + b) / 2);
    }
    px = x; pv = v;
  }
  return levels;
}

/** The infinite well's levels E_n = n²π²ħ²/(2 m a²) [eV] (section 2.2.3, p. 58, the limit P → ∞; section 1.3.4). */
export const wellLevel = (n, a, mRel) => (n * Math.PI * HBAR) ** 2 / (2 * mRel * M0 * a * a) / Q;

// --- Statistics (section 3.1.2, pp. 79–84; 3.1.3, pp. 84–85) -------------------------------------------------------

/** Fermi–Dirac occupation f(E) = 1 / (1 + exp((E − EF)/kT)) (section 3.1.2, p. 79); energies in eV. */
export const fermi = (E, EF, T) => 1 / (1 + Math.exp((E - EF) / thermal(T)));
/** The Maxwell–Boltzmann approximation exp(−(E − EF)/kT) (3.1.16). */
export const boltzmann = (E, EF, T) => Math.exp(-(E - EF) / thermal(T));

/** The intrinsic density against temperature: ni² = NC NV exp(−Eg/kT) (3.1.20) with NC, NV ∝ T^(3/2) (3.1.17),
 *  scaled to the table's ni at 300 K; Eg held at its 300 K value (the script notes it falls with T, p. 89). */
export const intrinsic = (T, m = SI) => m.ni * (T / 300) ** 1.5 * Math.exp(-m.Eg / (2 * K / Q) * (1 / T - 1 / 300));

/** Electron and hole densities with all dopants ionised: mass action n p = ni² and neutrality (3.1.23). */
export function carriers(ND, NA, ni) {
  const d = (ND - NA) / 2, r = Math.sqrt(d * d + ni * ni);
  // The larger of the two from the root, the smaller by mass action: no cancellation when one dominates.
  return d >= 0 ? { n: d + r, p: ni * ni / (d + r) } : { p: -d + r, n: ni * ni / (-d + r) };
}

/** Second route for (3.1.23): neutrality p − n + ND − NA = 0 by bisection on η = (EF − Ei)/kT, n = ni e^η (3.1.22). */
export function carriersByNeutrality(ND, NA, ni) {
  let a = -200, b = 200;
  const rho = eta => ni * Math.exp(-eta) - ni * Math.exp(eta) + ND - NA;
  for (let k = 0; k < 200; k++) { const m = (a + b) / 2; if (rho(m) > 0) a = m; else b = m; }
  const eta = (a + b) / 2;
  return { n: ni * Math.exp(eta), p: ni * Math.exp(-eta) };
}

/** The Fermi level against the intrinsic level, EF − Ei = kT ln(n/ni) [eV] (3.1.22). */
export const fermiLevel = (n, ni, T) => thermal(T) * Math.log(n / ni);
/** The intrinsic level above mid-gap, ½ kT ln(NV/NC) [eV] (3.1.21). */
export const intrinsicOffset = (T, m = SI) => thermal(T) / 2 * Math.log(m.NV / m.NC);

// --- Transport (section 3.4, pp. 95–107) ----------------------------------------------------------------------------

/** Conductivity σ = e(n µn + p µp) [S/cm] (3.4.13). */
export const conductivity = (n, p, mun = SI.mun, mup = SI.mup) => Q * (n * mun + p * mup);
/** A bar's resistance R = ρ L / A (3.4.14), (3.4.15). */
export const resistance = (sigma, L, A) => L / (sigma * A);
/** Einstein relation D = UT µ [cm²/s] (section 3.4.3, p. 103). */
export const diffusivity = (mu, T = 300) => thermal(T) * mu;
/** Diffusion length L = √(D τ) [cm] (section 3.4.4, p. 104). */
export const diffusionLength = (D, tau) => Math.sqrt(D * tau);

/** The Shockley–Haynes pulse (3.4.43): N holes per cm² injected at x = 0, t = 0, drifting at µE, spreading with D,
 *  recombining with τ; the excess density p − p0 [cm⁻³] at x [cm] and t [s]. */
export const haynes = (x, t, { N, mu, E, D, tau }) =>
  t <= 0 ? 0 : N / Math.sqrt(4 * Math.PI * D * t) * Math.exp(-((x - mu * E * t) ** 2) / (4 * D * t)) * Math.exp(-t / tau);

/** Second route for (3.4.43): (3.4.42) stepped by finite differences (upwind drift, explicit diffusion) from a narrow
 *  Gaussian at t0 to t1; returns the excess density on the grid xs. */
export function haynesNumeric(xs, t0, t1, prm, steps = 4000) {
  const dx = xs[1] - xs[0], dt = (t1 - t0) / steps, v = prm.mu * prm.E;
  let p = xs.map(x => haynes(x, t0, prm));
  for (let s = 0; s < steps; s++) {
    const q = p.slice();
    for (let i = 1; i < p.length - 1; i++) {
      const drift = v >= 0 ? v * (p[i] - p[i - 1]) / dx : v * (p[i + 1] - p[i]) / dx;
      q[i] = p[i] + dt * (prm.D * (p[i + 1] - 2 * p[i] + p[i - 1]) / (dx * dx) - drift - p[i] / prm.tau);
    }
    p = q;
  }
  return p;
}

/** Excess carriers under light switched on at t = 0 and off at tOff: dΔp/dt = G − Δp/τ, from (3.4.29) with (3.4.34)
 *  in a uniform sample. */
export const transient = (t, G, tau, tOff) =>
  t < 0 ? 0 : t <= tOff ? G * tau * (1 - Math.exp(-t / tau)) : G * tau * (1 - Math.exp(-tOff / tau)) * Math.exp(-(t - tOff) / tau);

/** Second route for transient(): the rate equation stepped with Euler's method. */
export function transientNumeric(tEnd, G, tau, tOff, steps = 200000) {
  let dp = 0;
  const dt = tEnd / steps;
  for (let k = 0; k < steps; k++) { const t = k * dt; dp += dt * ((t < tOff ? G : 0) - dp / tau); }
  return dp;
}

/** Injected excess Δp(0) decaying into a sample of length W: (3.4.37), sinh((W − x)/L)/sinh(W/L); W → ∞ gives (3.4.35). */
// The ratio of sinh written with decaying exponentials only, so a long sample does not overflow.
export const injected = (x, d0, L, W = Infinity) =>
  Number.isFinite(W) ? d0 * Math.exp(-x / L) * -Math.expm1(-2 * (W - x) / L) / -Math.expm1(-2 * W / L) : d0 * Math.exp(-x / L);

/** Second route: D p″ = p/τ by finite differences with Δp(0) = d0 and Δp(W) = 0, solved by the Thomas algorithm. */
export function injectedNumeric(d0, L, W, n = 2000) {
  const h = W / n, a = 1, b = -(2 + h * h / (L * L)), N = n - 1;
  const c = Array(N).fill(0), d = Array(N).fill(0);
  // Rows: p[i−1] + b p[i] + p[i+1] = 0, with p[0] = d0 and p[n] = 0 moved to the right side.
  let cp = a / b, dp = -d0 / b;
  c[0] = cp; d[0] = dp;
  for (let i = 1; i < N; i++) { const m = b - a * c[i - 1]; c[i] = a / m; d[i] = (0 - a * d[i - 1]) / m; }
  const p = Array(N);
  p[N - 1] = d[N - 1];
  for (let i = N - 2; i >= 0; i--) p[i] = d[i] - c[i] * p[i + 1];
  return [d0, ...p, 0];
}

// --- Optics (section 4.2.1, pp. 113–117) ----------------------------------------------------------------------------

/** The photon wavelength for an energy, λ = hc/E [m]; at the band gap, the longest wavelength absorbed. */
export const wavelength = Ev => H * C0 / (Ev * Q);

/** Direct absorption with quasi-Fermi levels (4.2.8): α/σ ∝ √(ħω − Eg) (4.2.4) times fv(E1) − fc(E2), with E1, E2
 *  from (4.2.3). Energies in eV from the valence band edge; split = EFc − EC = EV − EFv (taken equal here). Returns a
 *  relative absorption: negative is gain. */
export function absorption(hw, { Eg, mn, mp, T, split }) {
  if (hw <= Eg) return 0;
  const mr = 1 / (1 / mn + 1 / mp), excess = hw - Eg;
  const E1 = -mr / mp * excess, E2 = Eg + mr / mn * excess; // (4.2.3), EV = 0
  const fv = fermi(E1, -split, T), fc = fermi(E2, Eg + split, T);
  return Math.sqrt(excess) * (fv - fc);
}
/** The share of the photon's excess energy the electron takes, E2 − EC = (mr/mn)(ħω − Eg) (4.2.3). */
export const electronShare = (hw, Eg, mn, mp) => 1 / (1 / mn + 1 / mp) / mn * (hw - Eg);

// --- The pn junction (sections 5.2, 5.3, pp. 128–141) ---------------------------------------------------------------

/** Diffusion voltage UD = UT ln(NA ND / ni²) (5.3.19). */
export const builtIn = (NA, ND, T = 300, ni = intrinsic(T)) => thermal(T) * Math.log(NA * ND / (ni * ni));

/** The abrupt junction in the depletion approximation at bias U (negative is reverse) (5.2.7)–(5.2.13): widths [cm],
 *  peak field [V/cm], and the profiles ρ(x) [C/cm³], E(x) [V/cm], φ(x) [V] with φ(−dp) = 0. */
export function junction(NA, ND, U, { T = 300, eps = epsSi } = {}) {
  const UD = builtIn(NA, ND, T), N0 = 1 / (1 / NA + 1 / ND), V = Math.max(UD - U, 0);
  const d = Math.sqrt(2 * eps * V / (Q * N0)), dn = d * NA / (NA + ND), dp = d * ND / (NA + ND);
  const Emax = Math.sqrt(2 * Q * N0 * V / eps);
  const rho = x => (x < -dp || x > dn ? 0 : x < 0 ? -Q * NA : Q * ND);
  const field = x => (x <= -dp || x >= dn ? 0 : x < 0 ? -Q * NA * (x + dp) / eps : -Q * ND * (dn - x) / eps);
  const potential = x => {
    if (x <= -dp) return 0;
    if (x <= 0) return Q * NA * (x + dp) ** 2 / (2 * eps);
    const left = Q * NA * dp * dp / (2 * eps);
    if (x >= dn) return V;
    return left + Q * ND * (dn * dn - (dn - x) ** 2) / (2 * eps);
  };
  return { UD, N0, d, dn, dp, Emax, rho, field, potential };
}

/** Junction capacitance per area Cs/A = √(ε e N0 / (2(UD − U))) [F/cm²] (5.2.15). */
export const junctionCap = (NA, ND, U, { T = 300, eps = epsSi } = {}) =>
  Math.sqrt(eps * Q * (1 / (1 / NA + 1 / ND)) / (2 * (builtIn(NA, ND, T) - U)));

/** Second route: the charge on one side per area, e ND dn [C/cm²], whose derivative against −U is the capacitance. */
export const junctionCharge = (NA, ND, U, opts) => Q * ND * junction(NA, ND, U, opts).dn;

/** The breakdown voltage UB* ≈ ε Emax² / (2 e N0) (5.3.22) for a critical field (the script takes 300 kV/cm for Si). */
export const breakdown = (N0, Ecrit = 3e5, eps = epsSi) => eps * Ecrit * Ecrit / (2 * Q * N0);

/** The saturation current Is = e ni² A (Dp/(Lp ND) + Dn/(Ln NA)) (5.3.12), with D by Einstein and L = √(Dτ). */
export function saturation({ NA, ND, tau, area, T = 300, m = SI }) {
  const ni = intrinsic(T, m), Dn = diffusivity(m.mun, T), Dp = diffusivity(m.mup, T);
  return Q * ni * ni * area * (Dp / (diffusionLength(Dp, tau) * ND) + Dn / (diffusionLength(Dn, tau) * NA));
}

/** The diode's current at terminal voltage U: I = Is (exp(Ud/(n UT)) − 1) (5.3.11) with an ideality factor n (the
 *  Bauelemente collection's n = 2; the script's ideal diode has n = 1) and a series resistance Rs, U = Ud + I Rs. Solved
 *  by bisection; the current grows with U, so there is one root. */
export function diodeCurrent(U, { Is, n = 1, Rs = 0, T = 300 }) {
  const nUT = n * thermal(T);
  if (Rs === 0) return Is * Math.expm1(U / nUT);
  let lo = -Is, hi = Math.max(U / Rs, 0) + Is;
  for (let k = 0; k < 200; k++) {
    const I = (lo + hi) / 2, f = nUT * Math.log1p(I / Is) + I * Rs - U;
    if (f > 0) hi = I; else lo = I;
  }
  return (lo + hi) / 2;
}
/** Second route: the voltage that drives current I, explicit. */
export const diodeVoltage = (I, { Is, n = 1, Rs = 0, T = 300 }) => n * thermal(T) * Math.log1p(I / Is) + I * Rs;

// --- Transistors (chapter 6, pp. 159–188) ---------------------------------------------------------------------------

/** The npn transistor's collector current IC = Is (exp(UBE/UT) − exp(UBC/UT)) (6.1.4), drawn against UCE with
 *  UBC = UBE − UCE. */
export const collector = (UBE, UCE, { Is, T = 300 }) =>
  Is * (Math.exp(UBE / thermal(T)) - Math.exp((UBE - UCE) / thermal(T)));

/** The n-MOS drain current (6.2.22): ohmic below UDS = UGS − Ut, current source above, zero below threshold. */
export function drain(UGS, UDS, { beta, Ut }) {
  const ov = UGS - Ut;
  if (ov <= 0) return 0;
  return UDS < ov ? beta * (ov * UDS - UDS * UDS / 2) : beta / 2 * ov * ov;
}

/** The threshold voltage Ut = ΦMS − Qf/Cox − QB/Cox + 2ΦF (section 6.2.3, p. 183) with QB = −√(2 εSi e NA (2ΦF + USB))
 *  (p. 184) and ΦF = UT ln(NA/ni) (section 6.2.2, p. 174). NA [cm⁻³], dox [cm], volts. */
export function threshold({ NA, dox, phiMS, USB = 0, Qf = 0, T = 300, epsOx = 3.9 * EPS0, eps = epsSi }) {
  const phiF = thermal(T) * Math.log(NA / intrinsic(T)), Cox = epsOx / dox;
  const QB = -Math.sqrt(2 * eps * Q * NA * (2 * phiF + USB));
  return { Ut: phiMS - Qf / Cox - QB / Cox + 2 * phiF, phiF, Cox, body: -QB / Cox };
}
