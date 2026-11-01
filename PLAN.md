# Bachelor lectures aid kit: plan

Written 1 Nov 2026. Three interactive labs for TU Wien Bachelor lectures, each fusing two courses, in one folder.

## The three labs

| Lab | Fuses | Sources | State on 1 Nov 2026 |
|---|---|---|---|
| Electrodynamics | Elektrodynamik + Wellenausbreitung | Prechtl (2010); Lasser (2012) | 26 labs, published from Abdulhamid-Baghdadi/electrodynamics-lab; its session still running on the Desktop copy |
| Automation | Automatisierung + Modellbildung | Kugi (2015); Kugi et al. (2015) | 18 labs (modelling done, automation chapter 1 and Bode); chapters 2–8 being built by its session |
| Signals and systems | SS1 (continuous) + SS2 (discrete) | Prechtl (2010), *Signale und Systeme 1*; Doblinger (2015) | 11 labs; in this repository since 1 Nov 2026 |

## Who teaches what (no topic twice)

- Laplace and z-transform, Bode, Nyquist, state space, controllability, zero-order hold, Tustin for controllers:
  Automation.
- Maxwell, waves, lines, waveguides, antennas: Electrodynamics.
- Convolution, correlation, Fourier series and transform, sampling and aliasing, harmonics, digital filters, DFT and
  FFT, multirate: Signals and systems.
- Where two labs meet, each links to the other instead of repeating it (e.g. sampling: aliasing in Signals, the
  sampled control loop in Automation).

## Signals and systems: continuous beside discrete

One lab per idea, with a "Continuous | Discrete" switch where both exist, so the student sees the same idea twice:

1. Signals and the time axis: shift, reverse, scale; t against n.
2. Linearity and time invariance: test a system, see superposition or a shift hold or fail.
3. Convolution: the integral against the sum, flip and slide.
4. Random signals and correlation: noise, autocorrelation, finding an echo.
5. Fourier series: harmonics of a periodic wave against the DFS of a periodic sequence; the Gibbs overshoot.
6. Fourier transform: pulse and sinc against the DTFT and its periodic spectrum.
7. Sampling, the bridge: aliasing, and ideal reconstruction by sincs.
8. Harmonics and power (continuous only): RMS, THD, distortion power.
9. Filters: analog Butterworth prototype into a digital filter by the bilinear transform; FIR by the window method.
10. DFT and FFT: leakage, windows, zero-padding, the butterfly stages.
11. Multirate (discrete only): down- and upsampling, the anti-aliasing filter.

Practice questions from the courses' exercise collections (SS1 Aufgabensammlung 2009, SS2 `sus2ue.pdf`) with their
worked solutions; hand-worked ones say so.

## State on 1 Nov 2026, midday

Both earlier sessions have ended. `Electromagnetism` is at 687a9d1 (the Desktop copy is in the Recycle Bin);
`Automation` is at 83dca8a (33 labs). Two streams now run in parallel:

- **A, one repository**: join `Electromagnetism` and `Automation` into `bachelor-lectures-aid-kit` with their
  histories, the kit shared once, a start page. Does not touch `signals-systems-lab`.
- **B, Signals and systems**: build the 11 labs inside `signals-systems-lab` only. When both are done, A takes it in.

## Order of work, as first planned

1. **Now, in parallel, no shared files:**
   - Electrodynamics session: finish wave propagation in its folder.
   - Automation session: finish chapters 2–8 in its folder.
   - Signals session: build the 11 labs in `signals-systems-lab`.
2. **Then, one at a time, after each session has committed:** make this folder the only home. Each lab's git history
   comes with it; the Desktop copies are retired, so no two copies are kept in sync.
3. **Then, one session:** the common part (see the open decision), a start page linking the three labs, and one
   README with the pictures.
4. **Last:** full test suite of all three, check in the browser pane (light, dark, keyboard, phone width), then
   publish when you say so.

## Decided: one repository (1 Nov 2026)

`bachelor-lectures-aid-kit`, private until you say otherwise: `kit/` shared once (page, style, controls, charts,
architecture check), the three labs as folders, one Pages site with a start page. The old electrodynamics-lab address
points to the new one. Until step 2, each session keeps working in its own folder.
