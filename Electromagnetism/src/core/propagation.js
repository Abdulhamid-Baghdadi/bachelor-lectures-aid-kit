// The laws of the wave propagation lecture notes, Lasser (2012), Wellenausbreitung, TU Wien, 10th edition after
// Bonek's lectures; page and equation numbers are the printed ones. Notation as in those notes: σ for conductivity,
// δ for the complex permittivity, Γ for reflection factors, Θ for angles from the normal.
import { C, cMul, cSqrt } from "../../../kit/core/index.js";
import { MU0, EPS0, C0 } from "./fields.js";

const deg = Math.PI / 180;

/** Reflection at a smooth boundary between ideal dielectrics (pp. 45–46): Snell's law sin Θ1 / sin Θ2 = n2/n1 and the
 *  Fresnel formulas with n = n2/n1. Past the critical angle the root is imaginary and |Γ| = 1 for both cases. */
export function fresnel(n1, n2, theta1) {
  const n = n2 / n1, c = Math.cos(theta1), s2 = Math.sin(theta1) ** 2, root2 = n * n - s2;
  if (root2 < 0) return { total: true, theta2: null, rTE: null, rTM: null, RTE: 1, RTM: 1 };
  const root = Math.sqrt(root2);
  const rTM = (n * n * c - root) / (n * n * c + root), rTE = (c - root) / (c + root);
  return { total: false, theta2: Math.asin(Math.sin(theta1) / n), rTE, rTM, RTE: rTE * rTE, RTM: rTM * rTM };
}
/** tan Θ_B = n2/n1 (p. 46). */
export const brewsterAngle = (n1, n2) => Math.atan(n2 / n1);
/** Total reflection from sin Θ2 = 1 in Snell's law, only when n2 < n1. */
export const criticalAngle = (n1, n2) => n2 < n1 ? Math.asin(n2 / n1) : null;

/** Polarisation (pp. 33–35): e_x = E1 cos ωt, e_y = E2 cos(ωt + ψ) at a fixed place. The tip of E traces an ellipse;
 *  its half axes a and b are found by sampling one period. Ellipticity a/b, also as 20 log(a/b) dB. In the notes'
 *  axes (x right, y down, looking along the wave) ψ = −90° with E1 = E2 is right-hand circular. */
export function polarisation(E1, E2, psi, samples = 3600) {
  let a = 0, b = Infinity;
  for (let k = 0; k < samples; k++) {
    const t = 2 * Math.PI * k / samples, r = Math.hypot(E1 * Math.cos(t), E2 * Math.cos(t + psi));
    a = Math.max(a, r); b = Math.min(b, r);
  }
  // A line has b = 0 up to rounding: call it linear.
  if (b < 1e-9 * a) b = 0;
  const s = Math.sin(psi);
  const sense = b === 0 ? "linear" : s < 0 ? "right-hand" : "left-hand";
  return { a, b, ratio: b === 0 ? Infinity : a / b, dB: b === 0 ? Infinity : 20 * Math.log10(a / b), sense };
}

/** A plane wave in a lossy medium (p. 38): δ = ε − jσ/ω = ε(1 − js), s = tan θ = σ/(εω) (3.19), and from
 *  γ × (γ × E) = ω²μδE (3.26) with γ·E = 0, γ² = −ω²μδ, so γ = α + jβ = jω√(μδ). */
export function lossyWave(f, epsr, sigma, mur = 1) {
  const w = 2 * Math.PI * f, eps = EPS0 * epsr, mu = MU0 * mur, s = sigma / (eps * w);
  const g = cMul(C(0, w * Math.sqrt(mu * eps)), cSqrt(C(1, -s)));
  const alpha = Math.abs(g[0]), beta = Math.abs(g[1]);
  return { s, alpha, beta, lambda: 2 * Math.PI / beta, depth: 1 / alpha, dBperMetre: 20 * Math.log10(Math.E) * alpha, speed: w / beta };
}

/** Rectangular waveguide a × b (pp. 64–66): κ² = (mπ/a)² + (nπ/b)² = ω²εμ − k_z², so a mode carries power only above
 *  its cutoff f_G = (c/2)√((m/a)² + (n/b)²), where k_z is real. TE needs m + n ≥ 1, TM needs m, n ≥ 1. */
export function waveguideModes(a, b, f, epsr = 1, max = 3) {
  const c = C0 / Math.sqrt(epsr), modes = [];
  for (let m = 0; m <= max; m++) for (let n = 0; n <= max; n++) {
    if (m + n === 0) continue;
    const fc = c / 2 * Math.hypot(m / a, n / b);
    modes.push({ type: "TE", m, n, fc, carries: f > fc });
    if (m >= 1 && n >= 1) modes.push({ type: "TM", m, n, fc, carries: f > fc });
  }
  return modes.sort((x, y) => x.fc - y.fc || (x.type < y.type ? -1 : 1));
}
/** The fundamental mode TE10 (p. 66): λ_G = 2a, λ_H = λ/√(1 − (λ/2a)²), Z_W,TE = η/√(1 − (λ/λ_G)²). */
export function te10(a, f, epsr = 1) {
  const lam = C0 / Math.sqrt(epsr) / f, eta = Math.sqrt(MU0 / (EPS0 * epsr)), q = 1 - (lam / (2 * a)) ** 2;
  if (q <= 0) return { lambda: lam, cutoff: C0 / Math.sqrt(epsr) / (2 * a), carries: false };
  return { lambda: lam, cutoff: C0 / Math.sqrt(epsr) / (2 * a), carries: true, lambdaH: lam / Math.sqrt(q), Z: eta / Math.sqrt(q),
           phaseSpeed: C0 / Math.sqrt(epsr) / Math.sqrt(q), groupSpeed: C0 / Math.sqrt(epsr) * Math.sqrt(q) };
}

/** Microstrip (p. 96): ε_eff = 1 + q(ε_r − 1) with the filling factor q between 0.5 (narrow strips) and 1 (wide);
 *  Z_L = Z_L,0/√ε_eff and λ = λ0/√ε_eff, Z_L,0 the impedance of the same strip in air. */
export function microstrip(epsr, q, ZL0, f) {
  const eff = 1 + q * (epsr - 1);
  return { eff, Z: ZL0 / Math.sqrt(eff), lambda: C0 / f / Math.sqrt(eff) };
}

/** The first Fresnel zone (p. 107): points whose detour over the line of sight is λ/2. For a point d1 from the sender
 *  and d2 from the receiver, √(d1² + r²) + √(d2² + r²) − d = λ/2 gives, for r ≪ d1, d2, r = √(λ d1 d2 / d). */
export const fresnelRadius = (lambda, d1, d2) => Math.sqrt(lambda * d1 * d2 / (d1 + d2));
/** The detour for a point at height r over the line of sight, exactly. */
export const detour = (d1, d2, r) => Math.hypot(d1, r) + Math.hypot(d2, r) - d1 - d2;

/** The link budget in free space (p. 140): P_e = P_s G_s G_e (λ/(4πd))² (12.6), L_ISO = −20 log(λ/(4πd)) dB (12.10),
 *  in dB P_e = P_s + G_s + G_e − L_ISO (12.9). Gains as factors, powers in W. */
export function link(Ps, Gs, Ge, f, d) {
  const lambda = C0 / f, Liso = -20 * Math.log10(lambda / (4 * Math.PI * d));
  return { lambda, Liso, Pe: Ps * Gs * Ge * (lambda / (4 * Math.PI * d)) ** 2 };
}
export const dB = x => 10 * Math.log10(x);
export const fromdB = x => 10 ** (x / 10);

/** The monostatic radar equation (p. 143): P_e/P_s = σ G² (λ/4π)² / (4π d⁴) (12.17); the radar cross-section of a flat
 *  plate square to the wave σ = 4π A²/λ² (12.18) and of a large metal sphere σ = πr² (12.19). */
export const radar = (Ps, G, sigma, f, d) => Ps * sigma * G * G * (C0 / f / (4 * Math.PI)) ** 2 / (4 * Math.PI * d ** 4);
export const plateRCS = (A, lambda) => 4 * Math.PI * A * A / lambda ** 2;
export const sphereRCS = r => Math.PI * r * r;
/** Multipath, the two-path model (pp. 145–146): h(τ) = A1 δ(τ − τ1) + A2 δ(τ − τ2) (13.2), so
 *  |H(jω)| = √(A1² + A2² + 2A1A2 cos ωΔτ) (13.4). Its notches repeat every 1/Δτ in frequency, and the deepest is
 *  (A1 − A2)/(A1 + A2) of the peak. */
export const twoPath = (A1, A2, f, dtau) => Math.sqrt(A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos(2 * Math.PI * f * dtau));
export const fadeDepth = (A1, A2) => Math.abs(A1 - A2) / (A1 + A2);

/** Doppler shift Δf_D = −(v/λ) cos γ (13.12), γ between the motion and the wave's direction of travel. */
export const doppler = (f, v, gamma) => -f * v / C0 * Math.cos(gamma);
/** Two plane waves meeting at an angle φ make a standing pattern; across it the fades lie λ/(2 sin(φ/2)) apart, and a
 *  receiver moving at v through it fades at the difference of the two Doppler shifts (p. 151). */
export const fadeSpacing = (lambda, phi) => lambda / (2 * Math.sin(phi / 2));
/** The field of two plane waves at a point (x, y): one along +x, the other turned by φ; amplitudes A1, A2. */
export function twoWaveField(A1, A2, lambda, phi, x, y) {
  const k = 2 * Math.PI / lambda, p = k * (x * Math.cos(phi) + y * Math.sin(phi)) - k * x;
  return Math.hypot(A1 + A2 * Math.cos(p), A2 * Math.sin(p));
}

// --- The worked example: planning a radio link (chapters 10, 12, 13) ---

/** The Fresnel integrals C(v) = ∫₀^v cos(πt²/2) dt and S(v) = ∫₀^v sin(πt²/2) dt (10.3), by Simpson's rule on steps
 *  of at most 1/400: the integrand turns once per Δt ≈ 1/v, so this keeps every turn finely sampled up to |v| ≈ 20. */
export function fresnelCS(v) {
  const n = 2 * Math.max(50, Math.ceil(Math.abs(v) * 200)), h = v / n;
  let c = 0, s = 0;
  for (let k = 0; k <= n; k++) {
    const t = k * h, w = k === 0 || k === n ? 1 : k % 2 ? 4 : 2, a = Math.PI * t * t / 2;
    c += w * Math.cos(a); s += w * Math.sin(a);
  }
  return { C: c * h / 3, S: s * h / 3 };
}
/** The argument v = h √((2/λ)(1/ds + 1/de)) (10.4) of a screen edge h from the line of sight, ds from the sender and de
 *  from the receiver. */
export const knifeV = (h, lambda, ds, de) => h * Math.sqrt(2 / lambda * (1 / ds + 1 / de));
/** The field behind a screen over the free-space field, E/E0 = 1/2 − e^(−jπ/4)(C(v) + jS(v))/√2 (10.2), as a complex
 *  number. As printed, v → −∞ gives E = E0 (the path wide open) and v → +∞ the full shadow; Abb. 10.1 draws the
 *  open side on the right, so read its axis as −v. */
export function knifeEdge(v) {
  const { C: c, S: s } = fresnelCS(v), r = Math.SQRT1_2;
  // e^(−jπ/4) (C + jS) = (C + S)/√2 + j(S − C)/√2
  return C(0.5 - r * (c + s) * r, -r * (s - c) * r);
}
/** The extra loss of an obstacle in dB for a clearance hc (metres, positive when the top is below the line of sight),
 *  −20 log|E/E0| from (10.2) with v = −hc·√(…) (10.4): 6.02 dB when the top just touches the line, about 0 when the
 *  first Fresnel zone is clear, negative where the field is slightly stronger than in free space. */
export function obstacleLoss(hc, lambda, ds, de) {
  const e = knifeEdge(-knifeV(hc, lambda, ds, de));
  return -20 * Math.log10(Math.hypot(e[0], e[1]));
}
/** Thermal noise referred to the receiver's input, Pn = kB·290 K·B·F (12.13), in dBm: −174 dBm/Hz + B|dBHz + F|dB
 *  (12.14) up to the rounding of kB·290 K = −173.98 dBm/Hz. */
export const noiseDbm = (B, FdB) => 10 * Math.log10(1.38065e-23 * 290 * B * 1e3) + FdB;
/** The level plan of 12.3 (Abb. 12.2): the transmit power needed for SNRmin at the receiver, in dBm, with the
 *  free-space loss L_ISO (12.10), the gains and line losses (12.9), the noise (12.14), and any further losses in dB
 *  (an obstacle, a fade margin) added to the path. kT = −174 dBm/Hz as the notes round it, unless exact is set. */
export function levelPlan({ f, d, Gs, Ge, Lvs, Lve, F, B, SNR, extra = 0, exact = false }) {
  const lambda = C0 / f, Liso = -20 * Math.log10(lambda / (4 * Math.PI * d));
  const Pn = exact ? noiseDbm(B, F) : -174 + 10 * Math.log10(B) + F, PeMin = Pn + SNR;
  const L = Lvs - Gs + Liso + extra - Ge + Lve;
  return { lambda, Liso, Pn, PeMin, L, Ps: PeMin + L };
}
/** The fade margin for a second path of relative amplitude ρ = A2/A1 < 1: the deepest notch of (13.4),
 *  |H| = A1 − A2, lies 20 log(1/(1 − ρ)) dB below the direct path alone. */
export const fadeMargin = rho => -20 * Math.log10(1 - rho);

export { deg };
