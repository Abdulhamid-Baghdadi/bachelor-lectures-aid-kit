// The laws of the lecture notes, Prechtl (2010), Vorlesungen über Elektrodynamik, TU Wien, each next to the equation
// number it comes from. Notation as in the notes: γ for conductivity, ϱ for charge density, Ψ for electric flux.
// SI units throughout; geometry in metres.
import { C, cAdd, cMul, cDiv, cSqrt, cExp, cAbs, cCosh, cSinh } from "../../../kit/core/index.js";

/** μ0 as fixed by the 2010 ampere (p. 31), c0 by the metre, ε0 from μ0 ε0 c0² = 1 (2.25). */
export const MU0 = 4e-7 * Math.PI;
export const C0 = 299792458;
export const EPS0 = 1 / (MU0 * C0 * C0);
/** Characteristic impedance of free space, √(μ0/ε0) = μ0 c0 (5.50). */
export const Z0 = MU0 * C0;

const hypot = Math.hypot;

/** The potential of a point charge, ϕ = Q / (4π ε |r − r′|) (3.13). */
export const pointPotential = (Q, r, eps = EPS0) => Q / (4 * Math.PI * eps * r);

/** E = −∇ϕ (3.4) for point charges [{ q, x, y }] in the plane z = 0 that holds them: E and ϕ at (x, y). */
export function chargesField(charges, x, y, eps = EPS0) {
  let Ex = 0, Ey = 0, phi = 0;
  for (const c of charges) {
    const dx = x - c.x, dy = y - c.y, r = hypot(dx, dy);
    if (r === 0) return { Ex: NaN, Ey: NaN, phi: Math.sign(c.q) * Infinity };
    const k = c.q / (4 * Math.PI * eps);
    phi += k / r; Ex += k * dx / r ** 3; Ey += k * dy / r ** 3;
  }
  return { Ex, Ey, phi };
}

/** Ψ(∂V) = Q(V) (Tab. 2.1, row 4): the electric flux out of a sphere is the charge inside it, wherever it sits. */
export const enclosedCharge = (charges, cx, cy, R) =>
  charges.filter(c => hypot(c.x - cx, c.y - cy) < R).reduce((s, c) => s + c.q, 0);

/** The same flux by numerical integration of n·D over the sphere: the check that row 4 is not a definition. */
export function fluxThroughSphere(charges, cx, cy, R, n = 200, eps = EPS0) {
  // Over a sphere, a point charge's flux depends only on whether it is inside; integrate in 3D on a θ, φ grid.
  let total = 0;
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) * Math.PI / n;
    for (let j = 0; j < 2 * n; j++) {
      const ph = (j + 0.5) * Math.PI / n;
      const nx = Math.sin(th) * Math.cos(ph), ny = Math.sin(th) * Math.sin(ph), nz = Math.cos(th);
      const px = cx + R * nx, py = cy + R * ny, pz = R * nz;
      let Dn = 0;
      for (const c of charges) {
        const dx = px - c.x, dy = py - c.y, dz = pz, r = hypot(dx, dy, dz);
        Dn += c.q / (4 * Math.PI) * (dx * nx + dy * ny + dz * nz) / r ** 3;
      }
      total += Dn * R * R * Math.sin(th) * (Math.PI / n) ** 2;
    }
  }
  return total;
}

/** V(∂A) = I(A) on a circle round a long straight wire (Tab. 2.1, row 3, static): H = I / (2π r). */
export const wireH = (I, r) => I / (2 * Math.PI * r);

/** U(∂A) = −dΦ/dt (Tab. 2.1, row 1) for a loop of area A in B(t) = B̂ sin(ωt), B normal to the loop. */
export function induction(A, Bhat, f, t) {
  const w = 2 * Math.PI * f;
  return { Phi: A * Bhat * Math.sin(w * t), U: -A * Bhat * w * Math.cos(w * t) };
}

/** Φ(∂V) = 0 (Tab. 2.1, row 2): the flux of a magnetic dipole m (along y, at the origin) out of a sphere round
 *  (cx, cy) of radius R, by numerical integration. Zero whether or not the dipole is inside. */
export function dipoleBFlux(m, cx, cy, R, n = 120) {
  let total = 0;
  const k = MU0 * m / (4 * Math.PI);
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) * Math.PI / n;
    for (let j = 0; j < 2 * n; j++) {
      const ph = (j + 0.5) * Math.PI / n;
      const nx = Math.sin(th) * Math.cos(ph), ny = Math.sin(th) * Math.sin(ph), nz = Math.cos(th);
      const x = cx + R * nx, y = cy + R * ny, z = R * nz, r = hypot(x, y, z);
      // B of a point dipole along y, the far field of a current loop (the magnetic twin of (5.42)).
      const mr = y / r;
      const Bx = k * 3 * mr * x / r ** 4, By = k * (3 * mr * y / r - 1) / r ** 3, Bz = k * 3 * mr * z / r ** 4;
      total += (Bx * nx + By * ny + Bz * nz) * R * R * Math.sin(th) * (Math.PI / n) ** 2;
    }
  }
  return total;
}

/** I(∂V) = −dQ/dt (Tab. 2.1, row 5): a capacitor C charged through R from U0; the current into the plate is the
 *  rate its charge grows. */
export function charging(U0, R, Cap, t) {
  const tau = R * Cap;
  return { Q: Cap * U0 * (1 - Math.exp(-t / tau)), I: U0 / R * Math.exp(-t / tau), tau };
}

/** D = ε E, ε = ε0 εr, εr = 1 + χ (2.37, 2.38); P = ε0 χ E (2.36); J = γ E (2.34). */
export const material = ({ E, chi = 0, gamma = 0 }) => ({ D: EPS0 * (1 + chi) * E, P: EPS0 * chi * E, J: gamma * E, epsr: 1 + chi });

/** c = 1 / √(μ ε) (5.19). */
export const waveSpeed = (epsr = 1, mur = 1) => 1 / Math.sqrt(MU0 * mur * EPS0 * epsr);

/** S = E × H (2.107) at the surface of a straight resistive wire of radius a and length l carrying I at voltage U:
 *  E = U/l along it, H = I/(2πa) round it, so S points inward and S · 2πal = U I, the power the wire turns to heat
 *  (2.109). */
export function wirePoynting(U, I, a, l) {
  const E = U / l, H = I / (2 * Math.PI * a), S = E * H;
  return { E, H, S, P: S * 2 * Math.PI * a * l };
}

/** Force on a point charge from f = ϱE + J×B (2.100), ϱ → q δ, J → q v δ: F = q (E + v × B). E in the plane, B along
 *  z. Integrated with the Boris scheme, which keeps the speed exact in a pure magnetic field. Returns the path. */
export function lorentzPath({ q, m, Ex = 0, Ey = 0, Bz = 0, vx, vy, dt, steps }) {
  let x = 0, y = 0;
  const pts = [[x, y]];
  const h = q * dt / (2 * m);
  for (let k = 0; k < steps; k++) {
    let ux = vx + h * Ex, uy = vy + h * Ey;
    const t = h * Bz, s = 2 * t / (1 + t * t);
    const px = ux + uy * t, py = uy - ux * t;
    ux += py * s; uy -= px * s;
    vx = ux + h * Ex; vy = uy + h * Ey;
    x += vx * dt; y += vy * dt;
    pts.push([x, y]);
  }
  return pts;
}

/** The radius of the circle a charge runs in a magnetic field alone: q v B = m v² / r. */
export const gyroRadius = (q, m, v, B) => m * v / (Math.abs(q) * B);

/** ∇²ϕ = 0 (3.9) on a grid: cells with a number are electrodes held at that potential, null cells are free.
 *  Successive over-relaxation until the largest change is below tol; the edges are earthed (ϕ = 0). */
export function laplace(fixed, { tol = 1e-4, maxIter = 5000, omega = 1.9 } = {}) {
  const ny = fixed.length, nx = fixed[0].length;
  const phi = fixed.map(row => row.map(v => v ?? 0));
  let iter = 0, change = Infinity;
  while (change > tol && iter < maxIter) {
    change = 0;
    for (let i = 1; i < ny - 1; i++) for (let j = 1; j < nx - 1; j++) {
      if (fixed[i][j] !== null) continue;
      const next = (phi[i - 1][j] + phi[i + 1][j] + phi[i][j - 1] + phi[i][j + 1]) / 4;
      const d = omega * (next - phi[i][j]);
      phi[i][j] += d;
      change = Math.max(change, Math.abs(d));
    }
    iter++;
  }
  return { phi, iter };
}

/** The static field of an electric dipole p along z, ϕ = e_r·p / (4π ε0 r²) (5.42), at distance r and angle θ. */
export const dipolePotential = (p, r, theta) => p * Math.cos(theta) / (4 * Math.PI * EPS0 * r * r);
export function dipoleField(p, r, theta) {
  const k = p / (4 * Math.PI * EPS0 * r ** 3);
  return { Er: 2 * k * Math.cos(theta), Etheta: k * Math.sin(theta) };
}

/** Charge relaxation ∂tϱ + (γ/ε) ϱ = 0 (3.103, at rest): ϱ = ϱ0 e^(−t/T_R), T_R = ε/γ (3.105). */
export const relaxationTime = (epsr, gamma) => EPS0 * epsr / gamma;
export const relaxed = (rho0, t, TR) => rho0 * Math.exp(-t / TR);

/** Biot–Savart, B = μI/(4π) ∮ s′ × e_R / R² ds′ (3.144), summed over a circular loop of radius a (plane z = 0) cut
 *  into n straight chords, each taken as one element at its midpoint, at the point (0, 0, z) on the axis. */
export function loopAxisBNumeric(I, a, z, n = 360, mu = MU0) {
  const ds = 2 * a * Math.sin(Math.PI / n), d = a * Math.cos(Math.PI / n);
  let Bz = 0;
  for (let k = 0; k < n; k++) {
    const ph = (k + 0.5) * 2 * Math.PI / n;
    // s′ = (−sin φ, cos φ, 0) at the chord's midpoint d(cos φ, sin φ, 0); R from there to the point.
    const Rx = -d * Math.cos(ph), Ry = -d * Math.sin(ph), R = hypot(d, z);
    const cz = (-Math.sin(ph)) * Ry - Math.cos(ph) * Rx; // z component of s′ × R
    Bz += mu * I / (4 * Math.PI) * cz / R ** 3 * ds;
  }
  return Bz;
}
/** The same integral in closed form: B = μ I a² / (2 (a² + z²)^(3/2)). */
export const loopAxisB = (I, a, z, mu = MU0) => mu * I * a * a / (2 * (a * a + z * z) ** 1.5);

/** Skin depth δ = √(2/(μωγ)) (4.27), the depth that sets the loss P″ = Ĥ0²/(2γδ) (4.31). */
export const skinDepth = (f, gamma, mur = 1) => Math.sqrt(2 / (MU0 * mur * 2 * Math.PI * f * gamma));
/** B(x, t) = B̂0 e^(−x/δ) cos(ωt − x/δ) (4.28). */
export const skinB = (B0, x, t, f, delta) => B0 * Math.exp(-x / delta) * Math.cos(2 * Math.PI * f * t - x / delta);

/** A plane wave in a lossless medium: Z = √(μ/ε) (5.70), H = E/Z (5.71), S = E²/Z (5.72), c = 1/√(με) (5.69). */
export function planeWave(E, epsr = 1, mur = 1) {
  const Z = Math.sqrt(MU0 * mur / (EPS0 * epsr));
  return { Z, H: E / Z, S: E * E / Z, c: waveSpeed(epsr, mur) };
}

/** The Hertz dipole of length l fed with effective current I: P = R_S I², R_S = (2π/3)(l/λ)² Z0 (5.52, 5.53).
 *  Its far field goes as sin θ, so the radiated power per solid angle as sin²θ (from (5.41)). */
export const radiationResistance = (l, lambda) => 2 * Math.PI / 3 * (l / lambda) ** 2 * Z0;
export const dipolePattern = theta => Math.sin(theta) ** 2;

/** A two-wire line with per-length R′, L′, G′, C′ at frequency f, length l, load Z_A (complex [re, im]):
 *  Z′ = R′ + jωL′, Y′ = G′ + jωC′ (5.114), γ = √(Y′Z′) (5.116), Z_W = √(Z′/Y′) (5.117), and the voltage along the
 *  line from (5.121), U(z) = (Z_A cosh γ(l−z) + Z_W sinh γ(l−z)) / (Z_A cosh γl + Z_W sinh γl) · U(0). */
export function line({ R = 0, L, G = 0, Cp, f, l, ZA }) {
  const w = 2 * Math.PI * f;
  const Zp = C(R, w * L), Yp = C(G, w * Cp);
  const gamma = cSqrt(cMul(Yp, Zp)), ZW = cSqrt(cDiv(Zp, Yp));
  const za = C(...ZA);
  const shape = z => {
    const g = cMul(gamma, C(l - z, 0));
    return cAdd(cMul(za, cCosh(g)), cMul(ZW, cSinh(g)));
  };
  const at0 = shape(0);
  const U = z => cAbs(cDiv(shape(z), at0));
  // The reflection factor at the load, (Z_A − Z_W)/(Z_A + Z_W), the ratio of the waves in (5.120).
  const reflection = cDiv(cAdd(za, cMul(ZW, C(-1, 0))), cAdd(za, ZW));
  return { gamma, ZW, U, reflection, attenuation: gamma[0], beta: gamma[1], lambda: 2 * Math.PI / gamma[1],
           decay: z => cAbs(cExp(cMul(gamma, C(-z, 0)))) };
}

/** Z_W = √(L′/C′) (5.110) and L′C′ = με = 1/c² (5.106) of a lossless line. */
export const losslessLine = (L, Cp) => ({ ZW: Math.sqrt(L / Cp), c: 1 / Math.sqrt(L * Cp) });
